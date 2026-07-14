import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";

const execFileAsync = promisify(execFile);
const servers = new Map();
const eventClients = new Map();
const readinessResults = new Map();
const pendingAnalyses = [];
const extensionDir = dirname(fileURLToPath(import.meta.url));
let repoSlug;
let session;

const ISSUE_READINESS_PROMPT_TEMPLATE = `
Analyze the following GitHub issue for implementation readiness.

Classify readiness into exactly one stage:
1. Brainstorm/Research
2. Plan
3. Implement

Stage definitions:
- Brainstorm/Research: Requirements are unclear or incomplete and need human clarification plus codebase exploration.
- Plan: There is a rough feature description but no concrete implementation specification or acceptance criteria.
- Implement: Requirements and acceptance criteria are sufficiently complete to start implementation.

Return:
1. Stage: one of the 3 stages above
2. Readiness score: integer from 0 to 100
3. Why: concise rationale grounded in issue details
4. Missing pieces: bullet list of gaps
5. Next actions: bullet list of concrete steps to move to the next stage
6. Model recommendation: reasoning model for Brainstorm/Research or Plan; mid-tier model for Implement

Use high reasoning effort in your analysis.

After writing the user-facing analysis, update the Issue readiness analyzer canvas by invoking its
record_readiness_result action on instance INSTANCE_ID_PLACEHOLDER with:
{
  "issueNumber": ISSUE_NUMBER_PLACEHOLDER,
  "stage": "Brainstorm/Research | Plan | Implement",
  "score": 0-100,
  "why": "...",
  "missingPieces": ["..."],
  "nextActions": ["..."]
}
`;

async function runGhJson(args) {
    const fullArgs = [...args, "--repo", await getRepoSlug()];
    const { stdout } = await execFileAsync("gh", fullArgs, {
        cwd: extensionDir,
        timeout: 20000,
        maxBuffer: 8 * 1024 * 1024,
    });
    return JSON.parse(stdout);
}

function findRepoRoot(startDir) {
    let current = startDir;
    for (let i = 0; i < 10; i += 1) {
        if (existsSync(join(current, ".git")) || existsSync(join(current, ".github"))) {
            return current;
        }
        const parent = dirname(current);
        if (parent === current) {
            break;
        }
        current = parent;
    }
    return undefined;
}

async function getRepoSlug() {
    if (repoSlug) {
        return repoSlug;
    }
    const envRepo = process.env.GITHUB_REPOSITORY;
    if (envRepo && envRepo.includes("/")) {
        repoSlug = envRepo;
        return repoSlug;
    }
    const repoRoot = findRepoRoot(extensionDir);
    if (!repoRoot) {
        throw new CanvasError(
            "repo_not_found",
            "Could not determine repository root. Open this extension from a project workspace.",
        );
    }
    try {
        const { stdout } = await execFileAsync(
            "gh",
            ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"],
            {
                cwd: repoRoot,
                timeout: 10000,
                maxBuffer: 1024 * 1024,
            },
        );
        const resolved = stdout.trim();
        if (!resolved || !resolved.includes("/")) {
            throw new Error("Invalid repository slug returned by gh.");
        }
        repoSlug = resolved;
        return repoSlug;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new CanvasError("repo_not_found", `Failed to resolve repository: ${message}`);
    }
}

function normalizeStage(stage) {
    const value = String(stage || "").toLowerCase();
    if (value.includes("brainstorm") || value.includes("research")) {
        return "Brainstorm/Research";
    }
    if (value.includes("implement")) {
        return "Implement";
    }
    if (value.includes("plan")) {
        return "Plan";
    }
    throw new CanvasError("invalid_stage", "Stage must be Brainstorm/Research, Plan, or Implement.");
}

function modelRecommendationForStage(stage) {
    const normalized = normalizeStage(stage);
    if (normalized === "Implement") {
        return {
            model: "claude-sonnet-4.6",
            reasoningEffort: "medium",
            label: "Mid-tier implementation model: claude-sonnet-4.6 with medium reasoning.",
        };
    }
    return {
        model: "gpt-5.5",
        reasoningEffort: "high",
        label: "Reasoning model: gpt-5.5 with high reasoning, or claude-opus-4.8 with high reasoning.",
    };
}

function actionLabelForStage(stage) {
    const normalized = normalizeStage(stage);
    if (normalized === "Brainstorm/Research") {
        return "Start research session";
    }
    if (normalized === "Plan") {
        return "Start planning session";
    }
    return "Start implementation session";
}

function resultsFilePath() {
    if (!session?.workspacePath) {
        return undefined;
    }
    return join(session.workspacePath, "files", "issue-readiness-results.json");
}

async function loadStoredResults() {
    const filePath = resultsFilePath();
    if (!filePath) {
        return;
    }
    try {
        const raw = await readFile(filePath, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.results)) {
            for (const result of parsed.results) {
                if (Number.isInteger(result.issueNumber)) {
                    readinessResults.set(result.issueNumber, result);
                }
            }
        }
    } catch (error) {
        if (error?.code !== "ENOENT") {
            await session.log(`Failed to load issue readiness results: ${error.message}`, { level: "warning" });
        }
    }
}

async function persistResults() {
    const filePath = resultsFilePath();
    if (!filePath) {
        return;
    }
    await mkdir(dirname(filePath), { recursive: true });
    const payload = { results: Array.from(readinessResults.values()) };
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

function serializeResults() {
    return Object.fromEntries(
        Array.from(readinessResults.entries()).map(([issueNumber, result]) => [String(issueNumber), result]),
    );
}

function sendEvent(res, event, payload) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcast(event, payload) {
    for (const clients of eventClients.values()) {
        for (const client of clients) {
            sendEvent(client, event, payload);
        }
    }
}

async function saveReadinessResult(input, source = "agent") {
    const issueNumber = Number(input.issueNumber);
    if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
        throw new CanvasError("invalid_issue_number", "Issue number must be a positive integer.");
    }
    const stage = normalizeStage(input.stage);
    const score = Number(input.score);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
        throw new CanvasError("invalid_score", "Score must be an integer from 0 to 100.");
    }
    const recommendation = modelRecommendationForStage(stage);
    const result = {
        issueNumber,
        title: input.title || undefined,
        url: input.url || undefined,
        stage,
        score,
        why: String(input.why || "").trim(),
        missingPieces: Array.isArray(input.missingPieces) ? input.missingPieces.map(String) : [],
        nextActions: Array.isArray(input.nextActions) ? input.nextActions.map(String) : [],
        modelRecommendation: recommendation.label,
        recommendedModel: recommendation.model,
        recommendedReasoningEffort: recommendation.reasoningEffort,
        actionLabel: actionLabelForStage(stage),
        source,
        updatedAt: new Date().toISOString(),
    };
    readinessResults.set(issueNumber, result);
    await persistResults();
    broadcast("results", { results: serializeResults() });
    return result;
}

function parseListSection(content, heading, nextHeading) {
    const start = content.search(new RegExp(`${heading}:?`, "i"));
    if (start === -1) {
        return [];
    }
    const rest = content.slice(start).replace(new RegExp(`^.*${heading}:?`, "i"), "");
    const end = nextHeading ? rest.search(new RegExp(`${nextHeading}:?`, "i")) : -1;
    const section = end === -1 ? rest : rest.slice(0, end);
    return section
        .split("\n")
        .map((line) => line.replace(/^\s*(?:[-*]|\d+\.)\s*/, "").trim())
        .filter(Boolean);
}

function parseReadinessFromText(content, issueNumber) {
    const stageMatch = content.match(/Stage:\s*(?:\*\*)?\s*(Brainstorm\/Research|Plan|Implement)/i);
    const scoreMatch = content.match(/Readiness score:\s*(?:\*\*)?\s*(\d{1,3})/i);
    if (!stageMatch || !scoreMatch) {
        return undefined;
    }
    const whyMatch = content.match(/Why:\s*(?:\*\*)?\s*([\s\S]*?)(?:\n\s*(?:\d+\.\s*)?(?:Missing pieces|Next actions):|$)/i);
    return {
        issueNumber,
        stage: stageMatch[1],
        score: Number(scoreMatch[1]),
        why: whyMatch ? whyMatch[1].trim() : "",
        missingPieces: parseListSection(content, "Missing pieces", "Next actions"),
        nextActions: parseListSection(content, "Next actions"),
    };
}

function buildReadinessPrompt(issue, instanceId) {
    const labels = issue.labels?.map((label) => label.name).join(", ") || "none";
    const assignees = issue.assignees?.map((assignee) => assignee.login).join(", ") || "none";
    const body = issue.body?.trim() || "(no description)";
    const template = ISSUE_READINESS_PROMPT_TEMPLATE
        .replaceAll("INSTANCE_ID_PLACEHOLDER", instanceId)
        .replaceAll("ISSUE_NUMBER_PLACEHOLDER", String(issue.number));
    return `${template}

Issue:
- Number: #${issue.number}
- Title: ${issue.title}
- URL: ${issue.url}
- State: ${issue.state}
- Labels: ${labels}
- Assignees: ${assignees}

Description:
${body}`;
}

async function listIssues() {
    const issues = await runGhJson([
        "issue",
        "list",
        "--state",
        "all",
        "--limit",
        "200",
        "--json",
        "number,title,state,labels,assignees,updatedAt,url",
    ]);
    return issues;
}

async function getIssue(number) {
    const parsedNumber = Number(number);
    if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
        throw new CanvasError("invalid_issue_number", "Issue number must be a positive integer.");
    }
    const issue = await runGhJson([
        "issue",
        "view",
        String(parsedNumber),
        "--json",
        "number,title,state,labels,assignees,body,url",
    ]);
    return issue;
}

async function switchToAnalysisModel() {
    try {
        await session.setModel("gpt-5.5", { reasoningEffort: "high" });
    } catch (modelError) {
        const modelErrorMessage = modelError instanceof Error ? modelError.message : String(modelError);
        await session.log(
            `Could not switch to gpt-5.5/high reasoning. Continuing with current model. ${modelErrorMessage}`,
            { level: "warning" },
        );
    }
}

function buildStartSessionPrompt(issue, result) {
    const stage = normalizeStage(result.stage);
    const recommendation = modelRecommendationForStage(stage);
    const shared = `Create a new agent session for GitHub issue #${issue.number}: ${issue.title}

Issue URL: ${issue.url}
Readiness stage: ${stage}
Readiness score: ${result.score}/100
Model recommendation: ${recommendation.label}

Use the create_session tool for the current project. Leave base_branch unset.`;

    if (stage === "Brainstorm/Research") {
        return `${shared}

Use model ${recommendation.model} with reasoning_effort ${recommendation.reasoningEffort}. Use kickoff_mode "plan".
The new session should research the codebase and issue context, identify likely implementation areas, and produce a concise list of human clarification questions plus technical pointers. It must not implement code yet.`;
    }

    if (stage === "Plan") {
        return `${shared}

Use model ${recommendation.model} with reasoning_effort ${recommendation.reasoningEffort}. Use kickoff_mode "plan".
The new session should turn the issue into an implementation-ready plan: exact files/areas to inspect or change, acceptance criteria, tests to add or run, and open questions. It must not implement code yet.`;
    }

    return `${shared}

Use model ${recommendation.model} with reasoning_effort ${recommendation.reasoningEffort}. Use kickoff_mode "autopilot".
The new session should implement the issue end-to-end, update relevant tests/docs, validate the change, and report back with the outcome.`;
}

function json(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
            if (body.length > 1024 * 1024) {
                reject(new Error("Request body too large."));
            }
        });
        req.on("end", () => {
            if (!body) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error("Invalid JSON request body."));
            }
        });
        req.on("error", (error) => reject(error));
    });
}

function renderHtml(instanceId) {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Issue readiness analyzer</title>
  <style>
    body {
      margin: 0;
      padding: 16px;
      background:
        radial-gradient(circle at top left, rgba(84, 174, 255, 0.18), transparent 34%),
        linear-gradient(180deg, rgba(246, 248, 250, 0.96), var(--background-color-default, #ffffff) 180px);
      color: var(--text-color-default, #1f2328);
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: var(--text-body-medium, 14px);
      line-height: var(--leading-body-medium, 20px);
    }
    h1 {
      margin: 0;
      font-size: var(--text-title-large, 26px);
      line-height: var(--leading-title-large, 32px);
      font-weight: var(--font-weight-semibold, 600);
    }
    .hero {
      border: 1px solid rgba(84, 174, 255, 0.28);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 14px;
      background:
        linear-gradient(135deg, rgba(9, 105, 218, 0.12), rgba(46, 160, 67, 0.08)),
        var(--background-color-default, #ffffff);
      box-shadow: 0 12px 30px rgba(31, 35, 40, 0.08);
    }
    .subtitle {
      margin: 4px 0 0;
      color: var(--text-color-muted, #656d76);
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    button {
      border: 1px solid var(--border-color-default, #d1d9e0);
      background: var(--background-color-default, #fff);
      color: var(--text-color-default, #1f2328);
      border-radius: 999px;
      padding: 7px 12px;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
    }
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(31, 35, 40, 0.12);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .button-brainstorm {
      border-color: rgba(207, 34, 46, 0.35);
      background: linear-gradient(180deg, #ffebe9, #ffd8d3);
      color: #a40e26;
    }
    .button-plan {
      border-color: rgba(154, 103, 0, 0.35);
      background: linear-gradient(180deg, #fff8c5, #ffec99);
      color: #7d4e00;
    }
    .button-implement {
      border-color: rgba(26, 127, 55, 0.35);
      background: linear-gradient(180deg, #dafbe1, #aceebb);
      color: #116329;
    }
    .button-analyze {
      border-color: rgba(9, 105, 218, 0.35);
      background: linear-gradient(180deg, rgba(221, 244, 255, 0.95), rgba(179, 223, 255, 0.7));
      color: #0969da;
    }
    .status {
      color: var(--text-color-muted, #656d76);
      min-height: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      overflow: hidden;
      border: 1px solid var(--border-color-default, #d1d9e0);
      border-radius: 12px;
      background: var(--background-color-default, #ffffff);
      box-shadow: 0 8px 24px rgba(31, 35, 40, 0.06);
    }
    th, td {
      border-bottom: 1px solid var(--border-color-default, #d1d9e0);
      text-align: left;
      vertical-align: top;
      padding: 10px 8px;
    }
    th {
      color: var(--text-color-muted, #656d76);
      font-weight: var(--font-weight-semibold, 600);
      background: rgba(246, 248, 250, 0.88);
    }
    tbody tr:hover {
      background: rgba(84, 174, 255, 0.06);
    }
    .issue-title {
      display: block;
      color: inherit;
      text-decoration: none;
      font-weight: 600;
    }
    .labels {
      color: var(--text-color-muted, #656d76);
      font-size: 12px;
    }
    .readiness {
      display: grid;
      gap: 4px;
    }
    .badge {
      display: inline-block;
      width: fit-content;
      border: 1px solid var(--border-color-default, #d1d9e0);
      border-radius: 999px;
      padding: 2px 9px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-brainstorm {
      border-color: rgba(207, 34, 46, 0.25);
      background: #ffebe9;
      color: #a40e26;
    }
    .badge-plan {
      border-color: rgba(154, 103, 0, 0.25);
      background: #fff8c5;
      color: #7d4e00;
    }
    .badge-implement {
      border-color: rgba(26, 127, 55, 0.25);
      background: #dafbe1;
      color: #116329;
    }
    .score {
      color: var(--text-color-muted, #656d76);
      font-size: 12px;
    }
    .model {
      color: var(--text-color-muted, #656d76);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <section class="hero">
    <h1>Issue readiness analyzer</h1>
    <p class="subtitle">Review issues, score implementation readiness, and launch the right next agent session.</p>
  </section>
  <div class="toolbar">
    <button id="refresh" type="button">Refresh issues</button>
    <span class="status" id="status">Loading issues…</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 42%;">Issue</th>
        <th style="width: 10%;">State</th>
        <th style="width: 14%;">Updated</th>
        <th style="width: 16%;">Readiness</th>
        <th style="width: 18%;">Action</th>
      </tr>
    </thead>
    <tbody id="issues-body"></tbody>
  </table>

  <script>
    const instanceId = ${JSON.stringify(instanceId)};
    const statusEl = document.getElementById("status");
    const refreshButton = document.getElementById("refresh");
    const issuesBody = document.getElementById("issues-body");
    let readinessResults = {};
    let currentIssues = [];

    function setStatus(message) {
      statusEl.textContent = message;
    }

    function labelText(labels) {
      if (!labels || labels.length === 0) return "No labels";
      return labels.map((label) => label.name).join(", ");
    }

    function stageClass(stage) {
      if (stage === "Brainstorm/Research") return "brainstorm";
      if (stage === "Plan") return "plan";
      return "implement";
    }

    function stageLabel(stage) {
      return stage === "Implement" ? "Ready for Implementation" : stage;
    }

    async function loadResults() {
      const response = await fetch("/api/results");
      if (!response.ok) return;
      const payload = await response.json();
      readinessResults = payload.results || {};
    }

    function connectEvents() {
      const events = new EventSource("/api/events");
      events.addEventListener("results", (event) => {
        const payload = JSON.parse(event.data);
        readinessResults = payload.results || {};
        renderIssues(currentIssues);
      });
    }

    async function loadIssues() {
      setStatus("Loading issues…");
      refreshButton.disabled = true;
      try {
        const response = await fetch("/api/issues");
        if (!response.ok) {
          throw new Error("Failed to fetch issues.");
        }
        const payload = await response.json();
        await loadResults();
        currentIssues = payload.issues || [];
        renderIssues(currentIssues);
        setStatus(\`Loaded \${currentIssues.length} issues.\`);
      } catch (error) {
        setStatus(error.message || "Failed to load issues.");
        issuesBody.innerHTML = "";
      } finally {
        refreshButton.disabled = false;
      }
    }

    function renderIssues(issues) {
      if (!issues.length) {
        issuesBody.innerHTML = '<tr><td colspan="5">No issues found.</td></tr>';
        return;
      }

      issuesBody.innerHTML = "";
      for (const issue of issues) {
        const tr = document.createElement("tr");
        const issueCell = document.createElement("td");
        const issueLink = document.createElement("a");
        issueLink.className = "issue-title";
        issueLink.href = issue.url;
        issueLink.target = "_blank";
        issueLink.rel = "noopener noreferrer";
        issueLink.textContent = \`#\${issue.number}: \${issue.title}\`;
        issueCell.appendChild(issueLink);

        const labels = document.createElement("div");
        labels.className = "labels";
        labels.textContent = labelText(issue.labels);
        issueCell.appendChild(labels);
        tr.appendChild(issueCell);

        const stateCell = document.createElement("td");
        stateCell.textContent = issue.state;
        tr.appendChild(stateCell);

        const updatedCell = document.createElement("td");
        updatedCell.textContent = new Date(issue.updatedAt).toLocaleString();
        tr.appendChild(updatedCell);

        const readinessCell = document.createElement("td");
        const result = readinessResults[String(issue.number)];
        if (result) {
          const wrapper = document.createElement("div");
          wrapper.className = "readiness";
          const badge = document.createElement("span");
          const readinessClass = stageClass(result.stage);
          badge.className = \`badge badge-\${readinessClass}\`;
          badge.textContent = stageLabel(result.stage);
          wrapper.appendChild(badge);
          const score = document.createElement("div");
          score.className = "score";
          score.textContent = \`\${result.score}/100 ready\`;
          wrapper.appendChild(score);
          const model = document.createElement("div");
          model.className = "model";
          model.textContent = result.modelRecommendation || "";
          wrapper.appendChild(model);
          readinessCell.appendChild(wrapper);
        } else {
          readinessCell.textContent = "Not analyzed";
        }
        tr.appendChild(readinessCell);

        const actionCell = document.createElement("td");
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-issue-number", String(issue.number));
        if (result) {
          button.setAttribute("data-action", "start-session");
          button.className = \`button-\${stageClass(result.stage)}\`;
          button.textContent = result.actionLabel || "Start recommended session";
        } else {
          button.setAttribute("data-action", "analyze");
          button.className = "button-analyze";
          button.textContent = "Analyze readiness";
        }
        actionCell.appendChild(button);
        tr.appendChild(actionCell);

        issuesBody.appendChild(tr);
      }

      for (const button of issuesBody.querySelectorAll("button[data-issue-number]")) {
        button.addEventListener("click", async () => {
          const issueNumber = Number(button.getAttribute("data-issue-number"));
          const action = button.getAttribute("data-action");
          button.disabled = true;
          setStatus(action === "start-session"
            ? \`Queueing recommended session prompt for issue #\${issueNumber}…\`
            : \`Queueing readiness analysis for issue #\${issueNumber}…\`);
          try {
            const response = await fetch(action === "start-session" ? "/api/start-session" : "/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ issueNumber, instanceId }),
            });
            const payload = await response.json();
            if (!response.ok) {
              throw new Error(payload.error || "Failed to queue analysis.");
            }
            setStatus(payload.message || \`Queued issue #\${issueNumber} for analysis.\`);
          } catch (error) {
            setStatus(error.message || "Failed to queue analysis.");
          } finally {
            button.disabled = false;
          }
        });
      }
    }

    refreshButton.addEventListener("click", loadIssues);
    connectEvents();
    loadIssues();
  </script>
</body>
</html>`;
}

async function startServer(instanceId) {
    const server = createServer(async (req, res) => {
        const url = new URL(req.url || "/", "http://127.0.0.1");
        res.setHeader("Cache-Control", "no-store");

        if (req.method === "GET" && url.pathname === "/") {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(renderHtml(instanceId));
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/issues") {
            try {
                const issues = await listIssues();
                json(res, 200, { issues });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load issues.";
                json(res, 500, { error: message });
            }
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/results") {
            json(res, 200, { results: serializeResults() });
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/events") {
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-store",
                Connection: "keep-alive",
            });
            let clients = eventClients.get(instanceId);
            if (!clients) {
                clients = new Set();
                eventClients.set(instanceId, clients);
            }
            clients.add(res);
            sendEvent(res, "results", { results: serializeResults() });
            req.on("close", () => {
                clients.delete(res);
                if (clients.size === 0) {
                    eventClients.delete(instanceId);
                }
            });
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/analyze") {
            try {
                const body = await readJsonBody(req);
                const issueNumber = body.issueNumber;
                const issue = await getIssue(issueNumber);
                const targetInstanceId = body.instanceId || instanceId;
                const prompt = buildReadinessPrompt(issue, targetInstanceId);

                await switchToAnalysisModel();
                pendingAnalyses.push({ issueNumber: issue.number, issue, instanceId: targetInstanceId });
                await session.send({
                    prompt,
                    displayPrompt: `Analyze issue #${issue.number} for implementation readiness`,
                    mode: "immediate",
                    agentMode: "plan",
                });

                json(res, 200, {
                    ok: true,
                    message: `Queued issue #${issue.number} for readiness analysis in chat.`,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to queue analysis.";
                json(res, 500, { error: message });
            }
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/start-session") {
            try {
                const body = await readJsonBody(req);
                const issue = await getIssue(body.issueNumber);
                const result = readinessResults.get(issue.number);
                if (!result) {
                    throw new CanvasError("missing_readiness_result", "Analyze readiness before starting a session.");
                }
                const prompt = buildStartSessionPrompt(issue, result);
                await session.send({
                    prompt,
                    displayPrompt: `${result.actionLabel} for issue #${issue.number}`,
                    mode: "immediate",
                    agentMode: "plan",
                });
                json(res, 200, {
                    ok: true,
                    message: `Queued ${result.actionLabel.toLowerCase()} prompt in chat for issue #${issue.number}.`,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to queue session prompt.";
                json(res, 500, { error: message });
            }
            return;
        }

        json(res, 404, { error: "Not found." });
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return { server, url: `http://127.0.0.1:${port}/` };
}

session = await joinSession({
    canvases: [
        createCanvas({
            id: "issue-readiness-analyzer",
            displayName: "Issue readiness analyzer",
            description: "Lists repository issues and triggers implementation-readiness analysis in chat.",
            actions: [
                {
                    name: "list_issues",
                    description: "Return all issues for the current repository.",
                    handler: async () => {
                        const issues = await listIssues();
                        return { issues };
                    },
                },
                {
                    name: "analyze_issue_readiness",
                    description: "Queue readiness analysis for a GitHub issue in chat.",
                    inputSchema: {
                        type: "object",
                        required: ["issueNumber"],
                        additionalProperties: false,
                        properties: {
                            issueNumber: { type: "integer", minimum: 1 },
                        },
                    },
                    handler: async (ctx) => {
                        const issue = await getIssue(ctx.input.issueNumber);
                        const prompt = buildReadinessPrompt(issue, ctx.instanceId);
                        await switchToAnalysisModel();
                        pendingAnalyses.push({ issueNumber: issue.number, issue, instanceId: ctx.instanceId });
                        await session.send({
                            prompt,
                            displayPrompt: `Analyze issue #${issue.number} for implementation readiness`,
                            mode: "immediate",
                            agentMode: "plan",
                        });
                        return {
                            ok: true,
                            issueNumber: issue.number,
                            message: `Queued issue #${issue.number} for readiness analysis.`,
                        };
                    },
                },
                {
                    name: "record_readiness_result",
                    description: "Record an issue readiness analysis result and update the canvas.",
                    inputSchema: {
                        type: "object",
                        required: ["issueNumber", "stage", "score", "why", "missingPieces", "nextActions"],
                        additionalProperties: false,
                        properties: {
                            issueNumber: { type: "integer", minimum: 1 },
                            title: { type: "string" },
                            url: { type: "string" },
                            stage: { type: "string", enum: ["Brainstorm/Research", "Plan", "Implement"] },
                            score: { type: "integer", minimum: 0, maximum: 100 },
                            why: { type: "string" },
                            missingPieces: { type: "array", items: { type: "string" } },
                            nextActions: { type: "array", items: { type: "string" } },
                        },
                    },
                    handler: async (ctx) => {
                        const result = await saveReadinessResult(ctx.input, "record_action");
                        return { ok: true, result };
                    },
                },
                {
                    name: "start_recommended_session",
                    description: "Queue a prompt that asks the agent to create a new session for the recommended next step.",
                    inputSchema: {
                        type: "object",
                        required: ["issueNumber"],
                        additionalProperties: false,
                        properties: {
                            issueNumber: { type: "integer", minimum: 1 },
                        },
                    },
                    handler: async (ctx) => {
                        const issue = await getIssue(ctx.input.issueNumber);
                        const result = readinessResults.get(issue.number);
                        if (!result) {
                            throw new CanvasError("missing_readiness_result", "Analyze readiness before starting a session.");
                        }
                        const prompt = buildStartSessionPrompt(issue, result);
                        await session.send({
                            prompt,
                            displayPrompt: `${result.actionLabel} for issue #${issue.number}`,
                            mode: "immediate",
                            agentMode: "plan",
                        });
                        return {
                            ok: true,
                            issueNumber: issue.number,
                            message: `Queued ${result.actionLabel.toLowerCase()} prompt.`,
                        };
                    },
                },
            ],
            open: async (ctx) => {
                let entry = servers.get(ctx.instanceId);
                if (!entry) {
                    entry = await startServer(ctx.instanceId);
                    servers.set(ctx.instanceId, entry);
                }
                return {
                    title: "Issue readiness analyzer",
                    status: "Ready",
                    url: entry.url,
                };
            },
            onClose: async (ctx) => {
                const entry = servers.get(ctx.instanceId);
                if (entry) {
                    servers.delete(ctx.instanceId);
                    await new Promise((resolve) => entry.server.close(() => resolve()));
                }
                eventClients.delete(ctx.instanceId);
            },
        }),
    ],
});

await loadStoredResults();

session.on("assistant.message", async (event) => {
    const pending = pendingAnalyses[0];
    if (!pending) {
        return;
    }
    try {
        const parsed = parseReadinessFromText(event.data.content || "", pending.issueNumber);
        if (!parsed) {
            return;
        }
        pendingAnalyses.shift();
        await saveReadinessResult(
            {
                ...parsed,
                title: pending.issue.title,
                url: pending.issue.url,
            },
            "assistant_message",
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await session.log(`Failed to record readiness analysis result: ${message}`, { level: "warning" });
    }
});
