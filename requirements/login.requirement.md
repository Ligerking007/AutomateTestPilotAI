# Login and Portfolio Smoke Requirements

## Objective

Automate smoke, navigation, and visual checks for Jakapan's portfolio and AI assistant projects.

## Target Projects

- DevPilotAI: AI developer assistant
- CodeReviewPilotAI: AI code review assistant
- JakapanKPortfolio: public portfolio website

## Functional Requirements

1. The application home page must load successfully.
2. The page must show visible content in the first viewport.
3. Users must be able to discover primary navigation or a primary call to action.
4. Login-capable applications must allow a user to submit valid credentials.
5. Login-capable applications must show a clear error for invalid credentials.
6. Authenticated users must be able to log out.
7. Public pages must maintain a stable visual baseline.

## Quality Requirements

- Tests must use accessible Playwright locators when possible.
- Tests must collect screenshot, video, and trace artifacts on failure.
- AI failure analysis must be generated after each run.
- The framework must run locally without AI credentials by using mock test cases.
