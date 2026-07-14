# MS Build 2026 — Demo Walkthroughs

> [!IMPORTANT]
> **Temporary file.** This walkthrough consolidates Build 2026 demos and will be split into permanent files later.

> [!IMPORTANT]
> This walkthrough does not include a general GitHub Copilot App Walkthrough, as this already exists in [GitHub Copilot App](./github-app.md). The Copilot App related features in this walkthrough reuse some of these demos or sprinkle the new features (Voice, Rubber Duck) into it, so it is recommended to go through that one first for a more comprehensive understanding of the app capabilities and UI.

## Demo: GitHub Copilot App Canvas - Issue Analyzer for Cart Page

- **Features:** GitHub Copilot App, Copilot canvases, Copilot Voice
- **What to show:** Canvas Feature in the GitHub Copilot App with the "Issue Readiness Analyzer" workflow
- **Why:** Showcases how canvases can be used to create a guided UI to collaborate and more easily work with agents in the GitHub Copilot App
- **Estimated time:** 6-10 minutes
- **How:**
  1. Open a new Session in the GitHub Copilot App and type (or use Voice! to dictate) the following prompt:

      ```prompt
      Open the issue-readiness-analyzer canvas
      ```

  2. Explain how this canvas is designed to help product managers and developers analyze the readiness of an issue before starting to work on it, by going through a guided workflow with the agent.

  3. Find Issue #1 for the cart page feature and click `Analyze` - it will automatically send a prompt in the current session and, once it's done, update the canvas back with the result - which is either "Brainstorm" if the issue has no details, "Plan" if it is ready for creating a specification with acceptance criteria, or "Implement" if it is ready for development.

  4. For Issue #1, it should come out as "Plan". Click on it, and the agent will invoke another prompt and start a sub-session to plan the issue. You can note that it also automatically used a reasoning-model as per the recommendation in the canvas.

  5. (optional) As the agent is working on the plan, you can open the sub-session and show the different steps it is doing to create a comprehensive plan for the cart page issue. You can also come back to the main session and analyze another issue - e.g. the one for Unit Tests, to showcase parallelized work.

  6. Explain how this is just one example of how canvases can be used to create guided workflows or visualizations for different use cases, and how they can be customized to fit the needs of different teams and processes.

## Demo: Rubber Duck Review

- **Features:** GitHub Copilot App, Rubber Duck review
- **What to show:** Rubber Duck Review feature in the GitHub Copilot App
- **Why:** Demonstrates how our multi-model choice allows using different models to improve the quality of outputs
- **Estimated Time:** 3-5 minutes
- **How:**
  1. Reuse the Cart Page plan from the previous demo and type `/rubber-duck`
  2. Speak this prompt:

     ```prompt
     Can you review this cart page plan and point out any missing edge cases, unclear requirements, or integration risks I should address before starting implementation?
     ```

  3. While it's working, explain how rubber duck uses a subagent with a different model to provide complementary perspectives on the plan.

  4. Once Rubber Duck provides feedback, put it all back into the issue:

     ```prompt
     Implement the Rubber Duck Feedback and put the finalized plan back into the issue body, under a new "Finalized Plan" heading. Make sure to keep the original plan for reference.
     ```

## Demo: Copilot CLI Cloud

- **Features:** Copilot CLI, Cloud Sandboxes, Copilot Voice
- **What to show:** `--cloud` session startup and issue selection.
- **Why:** Demonstrates cloud execution with issue-context handoff.
- **Estimated Time:** 4-6 minutes
- **How:**
  1. Start cloud mode - explain that for the implementation, you prefer having a sandbox as it might take a while and you can do other things or even shut your laptop without losing progress:

     ```bash
     copilot --cloud
     ```
  
  2. Explain the new TUI architecture, how one can now immediately see issues and PRs in the terminal. Go to issues and select the cart-page one from the previous demo

  3. Prompt Copilot to start implementing this feature. Alternatively, use the Voice feature:

     ```prompt
     Start implementing the cart page feature as described in this issue.
     ```

  4. Click the Remote Session Link to open the live session in the browser and explain how we can see the session details in there now

  5. Go back to the CLI and end it gracefully `Ctrl+D` - explain how this won't end the session, given it runs in a sandbox in the cloud

  6. (optional) Give it a steer in the Cloud Session, e.g. add `Also add some tests` and explain how you can still interact with the session even after closing the CLI, which is great for long-running sessions.

## Demo: Agentic CCR with Skills

- **Features:** Copilot Code Review, Code review skills
- **What to show:** CCR run on the cart PR with richer contextual findings.
- **Why:** Demonstrates combined static + contextual review signal.
- **Estimated Time:** 6-10 minutes
- **How:**
  1. Open the `Feature: Add ToS Download` or the Cart-Page PR created by a previous demo. If that is not finished yet, there is a pre-created branch `feature-cart-page` that can be used to trigger the demo.
  2. Select Copilot as reviewer.
  3. While it's running, switch to the `Agent` Tab of the Repository, then select `Code Review`. Explain how all Code Review Sessions now appear in this tab, given they are agentic, so you can easily keep track of them, their status, findings, etc.
  4. Find the CCR Session for your cart PR and open it.
  5. On the top, it should've invoked the `code-review` skill. Explain how this is a new capability and allows us to encode institutional review knowledge without having to put it into the static instructions (as before).
  6. (optional) Show the [Code Review Skill](../../../.github/skills/code-review/SKILL.md) and explain how it instructs the agent to find the issue body, extract the relevant acceptance criteria, and use them as part of the review process, which is a key reason why the findings are much better than before.
  7. Walk through the rest of the session logs and showcase the different invocations

## Demo: Enable Medium Tier Reviews

- **Features:** Copilot Code Review
- **What to show:** Repository setting switched from Standard to Medium CCR tier.
- **Why:** Medium tier produces deeper findings for complex PRs.
- **Estimated Time:** 2-5 minutes
- **How:**
  1. Open repository settings for Copilot Code Review.
  2. Change review quality to Medium
  3. Explain how this will trigger a more in-depth review, with more contextual understanding and better prioritization of findings, ideal for complex PRs like the cart page one.
  4. (optional) Re-Trigger the CCR on the cart PR to show the difference in findings. If time doesn't allow, just explain that this is what would happen and show an example of a Medium tier review from another PR.

## Demo: Agentic Auto-merge in GitHub Copilot App

- **Features:** GitHub Copilot App, Agent merge
- **What to show:** Auto-merge enabled on the cart PR, with conditions based on CCR findings.
- **Estimated Time:** 2-4 minutes
- **Why:** Demonstrates how you can use an agent to automatically incorporate feedback from review-comments, security scans and CI/CD results without having to manually intervene.
- **How:**
  1. Use the `Create Session from...` Button and select the `Feature: Add ToS Download` (optionally, you can use the Cart PR if it's ready)
  2. On the top right, click on the `Review Required` Button and in the panel that opens, enable `Agent merge`
  3. While the agent starts, explain how it will start fixing all feedback from Human Comments, CCR, CI/CD checks, and security scans, and will only finish once all feedback has been addressed, without the developer having to do anything manually.
  4. This might take a while - if you want to show the end of it, prep this in another demo repository or do it before the demo session itself. Alternatively, switch to another demo and come back to this after 5 - 10 Minutes.

## Demo: Create new Agent Automation for Unit Test Coverage Review

- **Features:** Copilot agent automations
- **What to show:** A new agent automation that checks PRs for sufficient unit test coverage and comments the findings directly on the PR.
- **Why:** Demonstrates how teams can automate repetitive code quality checks — freeing reviewers to focus on logic and architecture rather than test completeness.
- **Estimated Time:** 6-10 minutes
- **How:**
  1. Go to the Repo on github.com -> `Agents` -> `Automations` and click on `Create new`
  2. Type the name `Unit Test Review`
  3. As `Trigger`, select `Pull Request Opened` & `Pull Request synchronized`
  4. Use the following prompt:

     ```prompt
      Analyze the given pull request and determine whether it has sufficient unit test coverage based on the code changes. If it does, comment into the PR that "This PR has sufficient unit test coverage." If it doesn't, comment "This PR is missing unit tests for the following files: <list of files>". Use the diff and file changes to make this analysis.
     ```

  5. Click on `Suggest Tools` (The required ones to pop up must be `Read PR` and `Review Comment`)

  6. Save the automation
  7. Open a new Tab for Pull requests, navigate into one of the existing PRs (`Feature: Add ToS Download` or the Cart Page PR you've created), and copy its URL
  8. Back in the Agent Automations Page, click the `Play` Icon of the Unit Test Review Automation and, as `Event URL`, put in the URL of the previously selected PR.
  9. Reload the Page, then navigate into the running session. Explain how this is now using a Copilot Cloud Agent with the necessary context and permissions to execute the automation.
  10. Once the agent finishes, check the PR comments to see the result of the automation.

## Demo: Create suggested Agent Automation for Issue Triage

- **Features:** Copilot agent automations
- **What to show:** Suggested automation in the repository for auto-triaging new bug issues.
- **Why:** Showcases how to use the new suggested automations feature to easily create AI automations based on common use cases and best practices.
- **Estimated Time:** 2-4 minutes
- **How:**
  1. Go to the Repo on github.com -> `Agents` -> `Automations` and click on `Create new`
  2. In the suggested automations, click the one for `Triage incoming issues`
  3. Explain briefly what the automation does, then create it
  4. Select one of the existing issues and copy its URL. Use it to execute a test-run of the agent clicking on the `Play` icon and putting the Issue-URL as `Event URL`
  5. Reload the Page, then navigate into the running session. Explain how this is now using a Copilot Cloud Agent with the necessary context and permissions to execute the automation.
  6. Once the agent finishes, check the Issue comments to see the result of the automation.
