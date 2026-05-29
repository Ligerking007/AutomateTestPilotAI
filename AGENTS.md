# AGENTS.md

This file gives coding agents the project-specific rules for working in **Automate Test Pilot AI**.

## Project Purpose

Automate Test Pilot AI is a TypeScript + Playwright automation framework that demonstrates:

- AI-generated test cases from markdown requirements
- AI-generated Playwright specs from structured JSON test cases
- AI failure analysis from Playwright JSON reports and artifacts
- Manual test case editing through static GitHub Pages UI
- Local command execution through a local-only Command Center
- Multi-target project testing for UAT/local web projects

Keep the project portfolio-ready, readable, and safe for public GitHub.

## Required Runtime

- Node.js: `>=24 <25`
- npm: `>=11`
- TypeScript strict mode is enabled.
- Do not add another frontend framework unless the user explicitly asks for it. The public UI is intentionally static HTML/CSS/JavaScript for GitHub Pages.

## Important Commands

Run these before finishing changes when relevant:

```bash
npm run check
npm run test:unit
npm run report:site
```

For Playwright changes, also run:

```bash
npm test
```

For local UI testing:

```bash
npm run ui:local
```

Then open:

```text
http://127.0.0.1:4174
```

## Main Project Areas

- `src/ai/generateTestCases.ts`: reads `requirements/*.md`, calls OpenAI/Azure OpenAI or mock fallback, writes `reports/test-cases.json`.
- `src/ai/generateSpec.ts`: reads `reports/test-cases.json`, generates Playwright specs under `tests/generated/`.
- `src/ai/analyzeFailure.ts`: reads Playwright JSON results and writes `reports/ai-failure-analysis.md`.
- `src/config/projects.ts`: default and local target project configuration.
- `src/cli/runProject.ts`: runs the target project pipeline.
- `src/ui/localCommandServer.ts`: local-only API server that serves `public/command-center.html` and can run whitelisted npm commands.
- `src/utils/buildReportSite.ts`: generates static GitHub Pages files in `public/`.
- `CHANGELOG.md`: current project version, versioning policy, daily release history, and notable changes.
- `public/index.html`: static report dashboard.
- `public/manual-test-cases.html`: static manual test case editor.
- `public/command-center.html`: shared Command Center page. It runs in preview mode on static hosting and enables command execution only when served by the local runner API.
- `tests/unit/*.test.ts`: Node.js built-in unit tests.
- `tests/*.spec.ts` and `tests/generated/*.spec.ts`: Playwright tests.

## Architecture Rules

1. Keep AI features usable without API keys.
   - If OpenAI/Azure OpenAI credentials are missing, use deterministic mock/fallback behavior.
   - Never require real secrets for local demos or CI.

2. Keep public GitHub Pages static.
   - GitHub Pages cannot run npm commands or write to repo files.
   - Static pages may use `localStorage` for browser-only config.
   - `command-center.html` may show commands and target config on static hosting, but must keep Run Command disabled unless the local runner API is available.

3. Keep local command execution local-only.
   - `src/ui/localCommandServer.ts` must only run whitelisted commands from `commandDefinitions`.
   - Do not accept arbitrary shell commands from request bodies.
   - Keep the host bound to `127.0.0.1` unless the user explicitly asks to expose it.

4. Keep target configs safe.
   - Default targets live in `src/config/projects.ts`.
   - User-created local targets live in `config/local-projects.json`.
   - `config/local-projects.json` must stay ignored by git.
   - Do not overwrite default target IDs from the local UI.

5. Keep the Command Center single-source.
   - Do not create a second copy of the Command Center UI in `localCommandServer.ts`.
   - The local runner should serve `public/command-center.html`.
   - If Command Center UI changes, update `src/utils/buildReportSite.ts`, run `npm run report:site`, and verify both static preview mode and local API mode.

6. Keep generated reports reproducible.
   - `npm run report:site` should regenerate public report assets.
   - If changing report UI generation, update both source generator and generated `public/*.html` files when needed.

## UI Guidelines

- Public UI must support English and Thai localization where language toggles exist.
- Public UI must be responsive on mobile, tablet, and desktop.
- Public UI must support light and dark themes where theme toggles exist.
- Use clean, practical dashboard UI. Avoid adding heavy dependencies.
- Header/navigation should make important pages discoverable:
  - Dashboard
  - Test Cases
  - Command Center
  - Playwright Report
  - AI Failure Analysis

## Localization, Responsive, And Theme Rules

Apply these rules whenever adding or changing public UI:

- Update both English and Thai visible text when language support exists on that page.
- Do not leave new labels, buttons, headings, help text, empty states, validation messages, or status messages in only one language.
- Verify that the language toggle still reflects the active language correctly.
- Keep common terms consistent:
  - Dashboard = หน้าหลัก
  - Test Cases = เทสเคส
  - Playwright Report = รายงาน Playwright
  - Command Center = Command Center
  - AI Failure Analysis = วิเคราะห์ข้อผิดพลาดด้วย AI
  - Local Runner = Local Runner
- Verify responsive layout at desktop and mobile widths.
- Make sure text does not overflow buttons, cards, forms, tables, headers, or navigation items.
- Avoid horizontal scrolling on mobile unless the content is intentionally scrollable, such as code or report output.
- Preserve light/dark theme variables when adding colors.
- Do not hardcode colors only for one theme. Add matching variables or theme-specific values when needed.
- Verify that theme toggle state and icons still match the active theme after UI changes.

## Testing Rules

- Add or update unit tests when changing:
  - AI spec generation logic
  - manual test case merging
  - target project config behavior
  - command whitelist/building logic
  - file helper behavior
  - report site generation logic that can be tested without a browser

- For UI changes, manually verify the generated/static page in a browser when practical.
- For Playwright behavior changes, run `npm test` or the most focused Playwright command possible.

## Environment Variables

Common variables:

```env
BASE_URL=http://localhost:3002
TARGET_PROJECT=portfolio
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=2024-10-21
APPLITOOLS_API_KEY=
```

Project-specific base URL overrides:

```env
DEV_PILOT_AI_URL=http://localhost:3000
CODE_REVIEW_PILOT_AI_URL=http://localhost:3001
PORTFOLIO_URL=http://localhost:3002
```

Never hardcode API keys, tokens, passwords, or private UAT credentials.

## Code Style

- Use TypeScript ESM imports with `.js` extensions for local source imports.
- Prefer explicit types for public functions and exported helpers.
- Keep comments short and only around non-obvious behavior.
- Use structured JSON parsing/serialization for test cases and target configs.
- Avoid hard-coded sleeps in Playwright tests.
- Prefer Playwright locators such as:
  - `getByRole`
  - `getByLabel`
  - `getByTestId`
  - `expect`

## Git And Generated Files

- Do not revert user changes unless explicitly requested.
- Update `CHANGELOG.md` when a change affects project behavior, public UI, commands, workflows, or release scope.
- Before committing, check:

```bash
git status --short
```

- Generated or report-related files may intentionally change after:

```bash
npm run ai:generate-cases
npm run ai:generate-specs
npm run ai:analyze-failure
npm run report:site
```

Review generated diffs before committing.

## Recommended Agent Workflow

1. Read the relevant source files before editing.
2. Make the smallest change that satisfies the request.
3. Update related docs if commands, pages, or workflows change.
4. Run focused tests first.
5. Run `npm run check` and `npm run test:unit` before final response.
6. Run `npm run report:site` after public UI/report generator changes.
7. Summarize changed files and verification results clearly.

## User Communication

The project owner usually prefers Thai explanations. Keep final responses concise and include:

- What changed
- Which commands passed
- Any remaining limitation or next action
