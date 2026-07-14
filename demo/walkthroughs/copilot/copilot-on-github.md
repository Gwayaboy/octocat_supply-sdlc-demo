# Copilot on GitHub.com

## Demo: Using Copilot on GitHub.com to Plan an Epic from a Design Mockup

- **Features:** Copilot Chat on GitHub.com, /create-issue, Copilot Vision, GitHub Issues (epics & sub-issues), GitHub Projects
- **What to show:** A Product Manager uploads an Excalidraw-style dashboard mockup to GitHub Copilot Chat on github.com and uses a single `/create-issue` prompt to generate a full epic with 17 structured sub-issues — no IDE, no dev setup required.
- **Why:** Demonstrates how Copilot on GitHub.com can dramatically accelerate the planning phase. A PM with a rough sketch can go from "idea on a napkin" to a fully decomposed, labeled, and assignable backlog in under a minute. This is a powerful story for non-engineering stakeholders who want to see AI-assisted planning in action.

### Storyline

> _"I'm a PM at OctoCAT Supply. Our stakeholders keep asking 'how are we doing?' but the app only shows product catalogs — no big-picture view. I sketched this dashboard mockup in Excalidraw, tagged what's must-have vs nice-to-have, and added implementation notes for engineering. Now I upload this to GitHub and ask Copilot to plan the work."_

### The Mockup

The design mockup is an Excalidraw-style sketch located at [`docs/design/dashboard-v1.png`](../../../docs/design/dashboard-v1.png). It contains four numbered sections, each annotated with priority labels and implementation notes:

| #   | Section                | Priority     | Description                                                                                                    |
| --- | ---------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| 1   | **KPI Summary Cards**  | Must have    | Four cards: Total Orders, Revenue, Products (active in catalog), Avg Value — each with month-over-month change |
| 2   | **Order Volume Trend** | Must have    | Line chart showing order volume over the last 6 months (Oct–Mar)                                               |
| 3   | **Revenue by Month**   | Nice to have | Bar chart showing monthly revenue (Oct–Mar)                                                                    |
| 4   | **Top Products Table** | Must have    | Table with Product Name, Units Sold, Revenue, and Trend columns (top 5 products)                               |

The bottom of the mockup includes engineering notes:
- New `/dashboard` route, needs nav link added
- Backend: new API endpoints for aggregated data (orders + order_details + products tables)
- Each section needs frontend component + API endpoint + tests
- Responsive: cards 4→2→1, charts 2→1, table horizontal scroll on mobile

### Prerequisites

- Access to a GitHub repository with Copilot enabled
- The dashboard mockup image ([`docs/design/dashboard-v1.png`](../../../docs/design/dashboard-v1.png)) downloaded or accessible on your machine

### How to Demo

1. **Set the Scene**: Explain the PM persona and the business need — stakeholders want a high-level dashboard but the app currently only has product catalogs.

2. **Open GitHub Copilot Chat** on github.com (click the Copilot icon in the top-right of any repository page).

3. **Attach the Image**: Use the plus icon or drag-and-drop to attach [`docs/design/dashboard-v1.png`](../../../docs/design/dashboard-v1.png) to the chat. Briefly show the mockup so the audience can see what Copilot is about to receive.

4. **Enter the Prompt**:

   ```
   /create-issue This is a new dashboard epic, which must be broken down into features for each numbered section. Also break down each feature into tasks based on my notes. Then create all sub-issues per epic, feature, and task!
   ```

5. **Walk Through the Mockup While Copilot Works**: Issue creation takes a moment — use this time to open the mockup full-screen and walk through it in detail:
   - The **numbered sections** (1–4) and how Copilot will use them to structure features
   - The **must-have** vs **nice-to-have** labels (red/green tags)
   - The **engineering notes** at the bottom (API routes, responsive breakpoints, test requirements)
   
   If you ran this ahead of time, you can skip the wait and switch directly to the browser tab with the finished issues.

6. **Show the Results**: Once Copilot finishes (or switch to your pre-created tab), review the generated issues. Point out:
   - **1 Epic** for the overall Supply Chain Dashboard
   - **4 Features** (one per numbered section)
   - **~12 Tasks** derived from the engineering notes (frontend components, API endpoints, tests, etc.)
   - Totaling **~17 issues**, all properly linked in an epic → feature → task hierarchy
   - How Copilot correctly identified the four numbered sections from the mockup
   - How the priority (must-have / nice-to-have) are reflected
   - How the engineering notes influenced the task breakdown

7. **Approve and Create**: Confirm the draft to have Copilot create all issues in the repository.

8. **(Optional) Show on the Project Board**: If issues were auto-added to the project board, switch to the board view to show how the ~17 new issues appear in the backlog, ready for sprint planning.

> [!TIP]
> **Run before the demo:** Creating ~17 issues takes a few minutes. Consider running through steps 2–7 before your live demo so the issues are already in place. During the demo you can then walk through the mockup, show the prompt, and jump straight to the created issues and project board.

> [!TIP]
> **Assigning to Copilot Coding Agent:** After issues are created, you can assign individual sub-issues to Copilot Coding Agent for implementation — connecting this demo directly into the [Copilot Coding Agent](./copilot-coding-agent.md) demo.

### Key Talking Points

- **No IDE required**: This entire workflow happens on github.com — perfect for PMs, designers, and stakeholders who don't use an IDE.
- **Vision + Planning**: Copilot uses vision to read the mockup, understand annotations and numbered sections, and translate them into structured work items.
- **From sketch to backlog in seconds**: What would normally take a PM 30–60 minutes of manual issue creation happens in a single prompt.
- **Draft-first workflow**: The `/create-issue` command starts with a draft, giving the PM a chance to review before committing.
- **Bridges PM ↔ Engineering**: The mockup's engineering notes (API routes, responsive breakpoints) flow directly into the generated issues, reducing back-and-forth.

### Expected Output (~17 Issues)

The exact breakdown depends on how Copilot interprets the mockup's engineering notes, but expect a hierarchy like:

| Type               | Title (approximate)                    |
| ------------------ | -------------------------------------- |
| Epic               | Supply Chain Dashboard                 |
| ↳ Feature          | KPI Summary Cards                      |
| &nbsp;&nbsp;↳ Task | Frontend: KPI Summary Cards component  |
| &nbsp;&nbsp;↳ Task | API: KPI summary endpoint              |
| &nbsp;&nbsp;↳ Task | Tests: KPI Summary Cards               |
| ↳ Feature          | Order Volume Trend                     |
| &nbsp;&nbsp;↳ Task | Frontend: Order Volume Trend chart     |
| &nbsp;&nbsp;↳ Task | API: Order volume trend endpoint       |
| &nbsp;&nbsp;↳ Task | Tests: Order Volume Trend              |
| ↳ Feature          | Revenue by Month                       |
| &nbsp;&nbsp;↳ Task | Frontend: Revenue by Month chart       |
| &nbsp;&nbsp;↳ Task | API: Revenue by month endpoint         |
| &nbsp;&nbsp;↳ Task | Tests: Revenue by Month                |
| ↳ Feature          | Top Products Table                     |
| &nbsp;&nbsp;↳ Task | Frontend: Top Products Table component |
| &nbsp;&nbsp;↳ Task | API: Top products endpoint             |
| &nbsp;&nbsp;↳ Task | Tests: Top Products Table              |

> [!NOTE]
> **Non-deterministic output**: Copilot's exact issue titles, descriptions, and task breakdown may vary between runs. The structure above is representative — expect approximately 17 issues with the epic → feature → task hierarchy. The exact wording and number of tasks per feature will differ based on how Copilot interprets the engineering notes.
