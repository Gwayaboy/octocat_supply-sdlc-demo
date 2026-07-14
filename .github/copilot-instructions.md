# OctoCAT Supply Chain Management Application – General Copilot Instructions

These are repository-wide guidelines. Path‑scoped files in `.github/instructions/*.instructions.md` provide focused guidance for specific areas (frontend, API, database).

## High-Level Architecture


TypeScript monorepo with:
- `api/` Express REST API (SQLite persistence, repository pattern, Swagger docs)

- `frontend/` React + Vite + Tailwind UI
- Shared demo + infra docs under `docs/` and deployment scripts under `infra/`

Refer to `docs/architecture.md` and `docs/sqlite-integration.md` for deeper details. Avoid restating them in reviews and link instead.


## Review

When doing a Code Review, you must invoke the code-review skill (`.github/skills/code-review/SKILL.md`) to ensure you are following the expected review process and providing comprehensive feedback.

## Monorepo Workflow


- Build frequently: `npm run build --workspace=api` or `--workspace=frontend` (root build runs both)

- Keep PRs scoped: code + tests + docs (architecture or build notes) when behavior changes.
- Update related instruction files if new folders or architectural slices are introduced.

## Do Not Repeat

Do not inline full API route or component files in review feedback unless absolutely necessary: quote only the lines requiring change. Summarize low‑impact nits.

## Escalation Order for Suggestions
1. Security / data integrity
2. Logical / functional correctness
3. Performance / scalability
4. Maintainability / duplication
5. Readability / consistency
6. Style / minor formatting

## Tone & Feedback Style

Be concise, actionable, and cite a rationale ("because" clause) for non-trivial recommendations. Offer one preferred solution; optionally a lightweight alternative.

## Demo Walkthroughs

When writing or modifying any file under `demo/walkthroughs/`, you **must** invoke the **walkthrough-writer** skill (`.github/skills/walkthrough-writer/SKILL.md`). It encodes the required structure (What/Why/How), encouraged fields (Video, Time estimation), and formatting best practices for all walkthrough content.

---
If new subsystems are added (e.g., `mobile/`, `worker/`), create a new `*.instructions.md` with `applyTo` globs instead of bloating this file.
