# Changelog

All notable changes to **Automate Test Pilot AI** are documented here.

The project follows semantic versioning. Dates use `YYYY-MM-DD`.

Current version: **1.1.0**

## Version Policy

- **Major**: breaking project structure, command behavior, or public workflow changes
- **Minor**: new features, new UI pages, new automation capabilities, or significant report improvements
- **Patch**: bug fixes, documentation updates, small UI polish, or test-only changes

## [1.1.0] - 2026-05-29

### Added

- Added Node.js unit tests for file helpers, AI spec generation, manual test case merge rules, target project config, and local command server command building.
- Added Local Command Center UI for running whitelisted npm scripts from the browser.
- Added editable local Target Config for UAT/internal web apps.
- Added static GitHub Pages Command Center for command discovery and target config drafting.
- Added default target visibility in static Command Center for DevPilotAI, CodeReviewPilotAI, and JakapanKPortfolio.
- Added `AGENTS.md` with project-specific coding agent instructions.
- Added shared Command Center mode detection:
  - static mode keeps `Run Command` disabled
  - local runner mode enables command execution through the local API
- Added current version and version policy to `CHANGELOG.md`.

### Changed

- Refactored Command Center to use one shared page instead of duplicating static and local runner UI.
- Updated `src/ui/localCommandServer.ts` to serve `public/command-center.html`.
- Updated Command Center header to use centered navigation consistent with the main report UI.
- Updated documentation for local runner, target config, static GitHub Pages behavior, and shared Command Center behavior.
- Updated package version from `1.0.0` to `1.1.0`.

### Verified

- `npm run check`
- `npm run test:unit`
- `npm run report:site`
- Static Command Center preview mode
- Local Command Center API mode
- Desktop and mobile responsive layout checks

## [1.0.0] - 2026-05-28

### Added

- Created the initial AutomateTestPilotAI framework.
- Added TypeScript, Playwright, Node.js, OpenAI/Azure OpenAI support, Applitools Eyes, GitHub Actions, and GitHub Pages foundation.
- Added AI Test Case Generator from markdown requirements.
- Added AI Playwright Spec Generator from structured JSON test cases.
- Added AI Failure Analyzer for Playwright JSON reports and failure artifacts.
- Added deterministic mock AI fallback for public demos and CI without API keys.
- Added Page Object Model examples for login and dashboard flows.
- Added sample Playwright login tests and visual test structure.
- Added GitHub Actions CI and Pages deployment workflow.
- Added Node 24 support for local development and GitHub Actions.
- Added project target runner for:
  - DevPilotAI
  - CodeReviewPilotAI
  - JakapanKPortfolio
- Added manual test case UI and JSON editor controls.
- Added report dashboard, Playwright report wrapper, and GitHub Pages report landing page.
- Added shared navigation preferences, language toggle behavior, theme toggle behavior, and favicon.
- Added active language flag and active theme icon.
- Added Thai translations and important code comments.
- Added responsive UI improvements for dashboard, header, test cases, and report pages.

### Changed

- Renamed and polished navigation labels, including `Manual Cases` to `Test Cases`.
- Improved report UI layout and mobile responsiveness.
- Improved header navigation consistency across public report pages.

### Verified

- Initial local project commands
- GitHub Actions CI
- GitHub Pages deployment
- Responsive report UI checks
