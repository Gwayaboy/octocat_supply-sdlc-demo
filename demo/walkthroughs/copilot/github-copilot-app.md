# GitHub Copilot App Demo Walkthroughs

---

## What is the GitHub Copilot App?

The GitHub Copilot App (Technical Preview) is a native macOS/Windows application that brings the full development lifecycle of GitHub into a unified desktop interface. Unlike VS Code or the Copilot CLI, which are often very repository-centric, the GitHub Copilot App takes a more **session-based, agentic approach** to software development -- becoming a "Mission Control" for your local (and soon cloud) development.

> [!TIP]
> If you don't have the GitHub Copilot App installed yet, head over to the [github/github-app](https://github.com/github/github-app) repository for download links, release notes, and platform-specific installation instructions.

**Key value propositions to highlight:**

- **Multi-repo, multi-session**: The left sidebar shows multiple repositories and sessions in one view -- you can work across projects simultaneously, supercharging agentic composition
- **Session-based, not branch-based**: Each session creates its own git worktree, so multiple agents can work in parallel without conflicting. No more switching branches.
- **No IDE required**: Purpose-built for agentic workflows. You don't need a full IDE -- though you can always open a session in VS Code, Finder, or any other IDE/terminal from within the app
- **Built-in browser**: A localhost-only browser for quickly testing web apps without leaving the app
- **Built-in terminal**: A fully functional terminal scoped to the session's worktree
- **PR & diff review**: Review PRs inline -- looks just like github.com, but in a desktop app
- **Work on a PR/Issue with an Agent**: Open any PR or Issue directly and kick off an agent session to address it -- no manual branch setup needed
- **Copilot Chat**: Full Copilot capabilities including general-purpose chat (research, email summaries, web search) beyond just coding
- **Automated workflows**: Schedule recurring agent tasks (e.g., compliance checks, weekly summaries)

> [!WARNING]
> **Early Alpha**: The GitHub Copilot App is heavily work in progress. Features may change, bugs may appear, and some things shown in demo videos may already be outdated. Pre-warn your audience that there may be rough edges -- the overall concept is the key message.

---

## Preparation

Before demoing the GitHub Copilot App, ensure the following:

1. **Copilot CLI setup**: The GitHub Copilot App uses the Copilot CLI under the hood. If you have the GitHub Remote MCP Server set up in your Copilot CLI config, you'll have a much better experience and can showcase more features.
2. **Experimental flags**: Go to Settings > Experimental Flags and enable:
   - **Browser tabs** -- for the built-in localhost browser
   - **Research command** -- to use `/research` in demos
   - **Agent tools / Fleet mode** -- required for the fleet mode demo (Path 2)

   > [!NOTE]
   > These flags may move out of experimental over time. Check occasionally for new features.

3. **Zoom level**: The default 100% is hard to read in demos. Use `Cmd +` (macOS) or `Ctrl +` (Windows) to zoom to at least 110-125%. For live presentations, consider 150%.
4. **Pre-run sessions**: Consider kicking off a session before the demo so you have a completed one to show (agent demos take a few minutes).

---

## Path 1 — Simple Intro (Cart Page)

**Duration:** ~15-20 minutes (including interface tour; agent runs ~3-4 minutes in background)

**Video:** [GitHub Copilot App 01 - Intro and Cart Page](https://microsofteur.sharepoint.com/:v:/s/octodemo/IQDIxkB7mGBOQp8DbmwzoyiuARufUsSplOsUWiN9BBFCGP0?e=cLtCFg&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D)

> [!NOTE]
> There is already an existing issue and reference PR in the repo for the cart page feature. This enables **time-jump scenarios** -- you can kick off the agent live and then switch to a pre-completed session to show results immediately.

### Introducing the GitHub Copilot App

- **Features:** GitHub Copilot App, Copilot Coding Agent

- **What to show:** The GitHub Copilot App interface, its session-based approach, and key navigation areas
- **Why:** Establish what the GitHub Copilot App is and how it differs from traditional IDEs before diving into agentic features

**How:**

1. **Add the demo repository**: Use the split button to click "Add GitHub repository", search for `demo_octocat_supply`, and add it. The repo will be cloned and you'll land on the session screen.
2. **Kick off the cart page session immediately** (before touring the interface -- this gives the agent time to work while you talk):

    ```prompt
    I want to add a Cart Page to the frontend application. The page should:
    - Display all items currently in the cart with their quantities and prices
    - Allow updating quantities and removing items
    - Show a subtotal, shipping fee ($25, free for orders over $150), and total
    - Add a cart icon to the NavBar that shows the number of items and navigates to the cart page when clicked

    Use the existing product and cart patterns in the codebase.
    ```

3. **Highlight the chat interface** while the agent starts working:
   - Show the agent mode options (interactive, plan, autopilot) and model/reasoning effort selection.
   - Point out how you can watch live what the agent is doing -- files being read, commands being run.
   - Click on files the agent is reading to view their contents in the side panel.
4. **Open the side panel** (top right button) to show:
   - **Changes view**: Live view of files the agent is modifying
   - **Terminal**: Built-in terminal scoped to this session's worktree
   - **File tree**: Browse the repository files
5. **Explain the worktree model**: Open a session in Finder (right-click > "Reveal in Finder") to show that each session lives in its own worktree under a `.copilot` folder -- this is why agents can work in parallel without branch conflicts.
6. **Open in VS Code**: Show the button (top right) that opens the current session's worktree in VS Code, demonstrating you can always "step out" to a full IDE if needed. You can also open in Finder or any other installed IDE/terminal.

> [!TIP]
> **Recommended flow**: Kick off the agent first, then tour the interface while it runs. This avoids dead air and showcases multi-tasking naturally.

### Explore the Interface (While the Agent Runs)

- **Features:** GitHub Copilot App

- **What to show:** The Home screen, Skills & Extensions, PRs, Issues, Chat, and Workflows tabs -- the full breadth of the GitHub Copilot App beyond coding.
- **Why:** Show that the GitHub Copilot App is a "Mission Control" for development -- not just a chat window, but a unified hub for PRs, issues, workflows, and multi-session management.

**How:**

While the cart page agent is working, use the time to tour other parts of the app:

1. **Home screen**: Show how you can start new sessions, select repos, choose models. Highlight the **Skills & Extensions** panel:
   - Available skills from the repository (e.g., `api-endpoint`)
   - MCP servers (built-in GitHub MCP + workspace-level servers from Copilot CLI config)
   - Installed extensions and plugins
   - Custom agents defined in the repository
2. **"Needs Your Attention"**: A section that highlights sessions and PRs requiring your action -- great for managing multiple concurrent workstreams.
3. **Pull Requests tab**: Select your demo repo to see all open PRs. Highlight that it looks just like github.com -- same interface, just in a desktop app. You can start sessions from PRs, review diffs, see CI/CD status.
4. **Issues tab**: Show the issue list. Demonstrate starting a session directly from an issue (e.g., "Improve test coverage for API") -- this creates a new session scoped to that issue.

    > [!TIP]
    > Kick off a second session from an issue here. This gives you a backup in case the cart page agent is too slow, and demonstrates multi-session management.

5. **Chat**: Show the general-purpose chat (not repo-scoped). Explain this is great for research, web searches, summarizing discussions, or even email triage with WorkIQ MCP -- it's like having an AI HQ beyond just coding.
6. **Workflows**: Briefly mention that workflows allow automating agent sessions on a schedule or manually -- you'll cover this in the [Automated Workflow demo](#automated-workflow-compliance-check).

### Implement the Cart Page with a Coding Agent

- **Features:** GitHub Copilot App, Copilot Coding Agent

- **What to show:** The completed agent results -- plan review, running the app, PR review with Copilot Code Review, and agent merge.
- **Why:** Demonstrate the full lifecycle from agent output to production-ready PR.

**How:**

1. **Return to the cart page session** (it should be finished or nearly done by now).
2. **Review the plan**: The agent created a plan before implementing. Open the side panel to view the plan with its to-do list and approach summary.
3. **Run the app**: Open the built-in terminal and run `make dev` to start the application:
   - If `node_modules` is missing, run `make install` first (the agent's worktree may need dependencies installed).
   - Use the **built-in browser** (localhost only) if available, or open in your system browser.
4. **Create and review the PR**: Let the agent create a pull request from the session, then explore it:
   - Highlight the **PR description quality** -- the agent writes meaningful descriptions, not just "Added files".
   - Show **CI/CD status checks** running on the PR.
   - Show **Copilot Code Review** feedback inline -- point out specific suggestions and comments.
   - Highlight the **"Fix unresolved comments"** button -- one click to have the agent address Copilot Code Review feedback automatically.
5. **(Optional) Enable Agent Merge**: Click "Agent Merge" on the PR to demonstrate:
   - The agent will automatically scan for CI/CD failures, Copilot Code Review comments, CodeQL findings, and human review comments.
   - It will continuously drive the PR toward merge-readiness by fixing issues as they come in.
   - It won't auto-merge -- it waits for a human reviewer to approve (the author can't self-approve).
   - **Narrative**: "We're not taking the human out of the loop. We're removing the toil so the human review is genuinely valuable -- not just rubber-stamping formatting fixes."

> [!TIP]
> **Time-jump option:** If time is limited, kick off the agent live during the intro, then switch to a pre-completed session or the existing reference PR to show the finished result immediately.

**Key Takeaway:** The GitHub Copilot App isn't just an editor -- it's a Mission Control for agentic development. From a single prompt, the agent planned, implemented, and created a reviewable PR with automated code review. Agent Merge takes it further by automatically driving the PR toward production-readiness. No IDE needed, no branch juggling.

---

## Path 2 — End-to-End (Order Tracking)

**Duration:** ~10-15 minutes (including agent run time for planning + fleet)

**Video:** [GitHub Copilot App 02 - Fleet](https://microsofteur.sharepoint.com/:v:/s/octodemo/IQAFa7g-Ugo4SqOxJCJgMHbcAbutRbqbVcru-eVRbQHD9_Q?e=KgDrtF&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D)

> [!NOTE]
> This path showcases the GitHub Copilot App's ability to research a feature, break it into workstreams, create issues, and spin up multiple coding agents working in parallel. It's a complete end-to-end scenario from idea to implementation.

> [!TIP]
> **Color-code your demo repo**: Right-click on the repo in the left sidebar and assign a color (e.g., red). This helps you quickly find your demo repo when you have multiple projects open.

### Research & Plan the Feature

- **Features:** GitHub Copilot App, Copilot Plan mode

- **What to show:** Using Plan mode to research the codebase, decompose a feature, and generate issues -- all from a single prompt.
- **Why:** Demonstrate the planning and decomposition workflow -- going from a vague idea to structured, parallelizable workstreams.

**How:**

1. Open a new Copilot session in the GitHub Copilot App.
2. Switch to **Plan** mode (or use the `/research` command).
3. Enter the following prompt:

    ```prompt
      I want to plan an order tracking page for this appliocation. The goal is for users to know where there order stands in a nice overview. There is a design image in the repo that roughly showcases how that looks like.

      We probably need frontend, API and Database changes for this. Plan the work into different wor kitems that can be parallelized as much as possible. Each Item should also create an issue for it's work so we can track it.
    ```

4. **While the agent researches (~1-2 minutes)**, highlight:
   - It finds and displays images from the repo (design mockups) -- a unique advantage of the app over CLI.
   - You can see the terminal commands and outputs live in the side panel.
   - The agent states when it has a "thorough understanding" of the codebase before creating the plan.
5. **When the plan appears**, open the side panel to showcase:
   - Planning is a **first-class citizen** in the app -- not just a markdown file, but a structured, interactive view with to-do items.
   - To-do items get live spinners during implementation and green checkmarks when done -- it's a "living and breathing document."
   - The plan can be viewed both in the side panel and the central pane.
6. Review the plan briefly -- typically 3 work items (e.g., database migration, API endpoints, frontend components). Note which items can run in parallel vs. which have dependencies.

    > [!NOTE]
    > **Issue creation timing**: Creating GitHub Issues as part of the planning adds ~1-2 minutes. If time is tight, you can remove the issue creation from the prompt and skip to fleet mode directly. However, showing the created issues is a nice demo moment.

7. Navigate to the **Issues** tab to show the generated issues:
   - Highlight how each issue is self-contained with enough context for an agent to pick it up independently.
   - Show that you can use the GitHub MCP as part of the app for issue management.

**Key Takeaway:** The GitHub Copilot App can act as a technical lead -- researching the codebase, decomposing a feature into workstreams, and creating structured issues ready for parallel execution.

### Multi-Agent Parallel Execution

- **Features:** GitHub Copilot App, Copilot Coding Agent

- **What to show:** Using Fleet mode to spin up multiple coding agent sessions that work on different workstreams simultaneously.
- **Why:** Demonstrate the scalability of agentic workflows -- multiple agents tackling different parts of a feature in parallel, all visible in one place.

**How:**

1. After the plan is ready, the app presents options: **"Approve and implement with Autopilot"** or **"Approve and implement with Fleet"**. Choose **Fleet**.
   - Explain: Autopilot = one session does everything sequentially. Fleet = multiple sessions work in parallel, one per work item.
2. Watch the **multiple sessions** appear in the left sidebar:
   - Each session is working in its own isolated worktree on a separate branch.
   - Switch between sessions to show each agent's progress.
3. **(Optional) Rename the orchestrator session**: Right-click the original planning session and rename it (e.g., prefix with "main") to keep track of which session is the orchestrator.
4. **While agents run (~3-4 minutes each)**, highlight:
   - The plan in the side panel updates live -- spinners for in-progress items, checkmarks for completed ones.
   - You can see elapsed time per agent.
   - Each agent works independently -- no conflicts during development thanks to worktrees.
5. Point out the efficiency: what might take a developer hours of context-switching is happening concurrently in the background.

> [!WARNING]
> **Fleet mode can be flaky**: In the current alpha, sessions sometimes fail to spin up. If this happens: explain it's early alpha, talk through what would normally happen (sessions appear in the left sidebar), and show the plan's to-do tracking as the backup view. Having a pre-completed run ready is strongly recommended.

> [!TIP]
> **Avoid redundancy**: If you already showed PR review in depth during Path 1 (Cart Page), keep the PR review brief here. Just show that multiple PRs were created, each scoped to its work item.

### Review the Results

- **Features:** GitHub Copilot App, Copilot Code Review

- **What to show:** Reviewing the PRs generated by the parallel agents.
- **Why:** Demonstrate the final step -- quality review of multi-agent output.

**How:**

1. Once agents complete, show the **multiple PRs** that were created -- one per workstream.
2. Walk through each PR briefly:
   - Show the diff and how each agent stayed scoped to its issue.
   - Highlight **Copilot Code Review** feedback on each PR.
   - Show that the changes are complementary and don't conflict.
3. **(Optional)** Merge the PRs and run `make dev` to show the integrated order tracking feature.

**Key Takeaway:** The GitHub Copilot App enables a workflow where you go from a single idea to multiple parallel coding agents, each producing a focused, reviewable PR. This is the power of agentic development at scale -- decompose, parallelize, review.

---

## Automated Workflow: Compliance Check

- **Features:** GitHub Copilot App, Copilot agent automations, Custom agents

- **What to show:** Setting up a scheduled automated workflow in the GitHub Copilot App that uses a Copilot Space to perform recurring compliance checks on the repository.
- **Why:** Demonstrate how the GitHub Copilot App goes beyond coding and developer personas. Workflows are personal, locally-executed automations that can serve product managers, compliance officers, designers -- anyone in the SDLC.

**Video:** [GitHub Copilot App 03 - Workflows Demo](https://microsofteur.sharepoint.com/:v:/s/octodemo/IQACKlZpN9IFRrJ-g6t5V0q7ARtLa9azUYTORlCGp9Yu1aU?e=T5Bsre&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D)

> [!NOTE]
> This demo builds on the `OD OctoCAT Supply Compliance Docs` Copilot Space. See [spaces.md](./spaces.md) for more details on this space and its contents.

**How:**

1. **Navigate to Workflows** in the GitHub Copilot App.
2. **Create a new workflow:**
   - **Name:** `OctoCAT Supply Compliance Review`
   - **Project:** Select your demo repository
   - **Mode:** Autopilot (so it runs without intervention)
   - **Model:** Choose your preferred model (e.g., Claude Opus for best results -- "we're going to burn through tokens")
   - **Prompt:**

     ```prompt
     Get the contents of the Copilot Space "OD OctoCAT Supply Compliance Docs".

     Using those compliance requirements as your reference, perform a thorough compliance assessment of this repository. Check:
     - Are all required legal pages (Privacy Policy, Terms of Service, Cookie Banner) implemented?
     - Does the application meet data handling and storage requirements?
     - Are there any gaps between what compliance requires and what is currently implemented?

     Generate a detailed report as a GitHub Issue with:
     - A summary of the compliance status (pass/fail per category)
     - Specific gaps found, with references to both the compliance docs and the codebase
     - Recommended next steps, prioritized by severity

     Title the issue "[Compliance] Repository Assessment - <today's date>"
     ```

3. **Create the workflow and trigger it** manually.
4. **While it runs (~1-2 minutes)**, explain the key narrative:
   - The workflow uses the GitHub MCP to access the Copilot Space, download the compliance docs, and understand the organizational standards.
   - **Workflows vs. Agentic Workflows**: Workflows in the GitHub Copilot App are **personal, locally-executed automations** -- they run on your machine using your local Copilot CLI. This means they use your local authentication (no secrets to expose in a shared repo). Agentic Workflows (GitHub Actions) are project-level automations that run in the cloud.
   - **Show the Copilot Space**: Navigate to github.com/copilot/spaces > Organizations > Octodemo > "OD OctoCAT Supply Compliance Docs". Explain: "Imagine this is the central space for all things privacy, compliance, and security -- the organization's guidelines and standards."
   - This could run on a schedule (e.g., every Friday) to continuously validate compliance.
   - Other use cases: weekly activity snippet reports, documentation freshness checks, dependency audits.
5. **Show the results** (use a pre-completed run if the live one isn't done):
   - Navigate to Workflows, select a previous run to show the output.
   - Open the generated **GitHub Issue** with the compliance assessment report.
   - Walk through the findings -- highlight how it references specific compliance documents from the Space and maps them to actual code in the repo.
   - Show the overall status: the demo repo typically shows gaps (not fully compliant), making it a realistic scenario.
6. **(Optional) Close the loop**: From the compliance report, prompt the agent to derive a plan to address the findings and create issues for each gap. This demonstrates going from assessment to remediation using the same tool.

> [!TIP]
> **Pre-run recommended**: Kick off the workflow before your demo so you have a completed run to show. The live trigger is great for showing the setup flow, but you can switch to a pre-completed run for the results.

> [!TIP]
> **Beyond developers**: Use this section to highlight how the GitHub Copilot App serves the entire SDLC -- not just developers. A compliance officer doesn't need an IDE. A product manager doesn't need to know git. Workflows make the GitHub Copilot App accessible to anyone who needs to interact with a repository.

**Key Takeaway:** The GitHub Copilot App isn't just for coding. Automated workflows allow anyone -- developers, compliance officers, product managers -- to set up recurring, AI-powered processes that combine organizational knowledge (Copilot Spaces) with repository context. Workflows are personal and local, making them secure and easy to configure compared to project-level CI/CD automations.
