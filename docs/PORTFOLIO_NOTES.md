# MindTrace Portfolio Notes

## Project Name

MindTrace

## Project Positioning

MindTrace is a personal MVP for adult mood, stress, sleep, and life-event journaling. It combines structured journaling, trend review, deterministic long-term summaries, manual action plans, and optional AI reflection drafts with strict safety and privacy boundaries.

It should be presented as a personal MVP or hackathon/portfolio project, not as an already launched medical or commercial product.

## What I Built

Use this wording when presenting the project:

- Built the full-stack MVP architecture with Next.js App Router and TypeScript strict.
- Implemented secure Firebase Authentication session exchange with HttpOnly cookies.
- Built onboarding, product boundary consent, privacy consent, and independent AI data processing consent.
- Implemented journal CRUD APIs, server validation, Firestore repositories, stable pagination, and detail/edit/delete pages.
- Implemented 7-day local-date trends and 7/14/30 day deterministic long-term summaries.
- Built manual plans and action items, plus AI plan suggestion draft and AI long-term insight draft flows.
- Integrated a server-only Gemini Provider adapter behind an interface, with Fake Provider and SDK mock tests.
- Added strict AI input minimization, structured output validation, local safety validation, and safe fallback handling.
- Added unit, Firebase Emulator integration, Playwright E2E, and GitHub Actions quality/integration/e2e coverage.

Avoid claiming this was a team project unless you are explicitly describing collaboration outside this repository.

## Tech Stack

- Next.js App Router
- React
- TypeScript strict
- Firebase Authentication
- Cloud Firestore through Admin SDK
- Firebase Emulator Suite
- `@google/genai` server-only adapter
- Vitest
- Playwright
- GitHub Actions

## Hard Problems And Solutions

### 1. Keeping AI Optional

Problem: AI features can easily become a hidden requirement for the core product.

Solution: Basic journaling requires only product/privacy consent. AI data processing consent is separate, optional, and checked only before Provider calls. Refusing AI consent leaves journal, history, trends, long-term summaries, and manual plans usable.

### 2. Preventing Cross-User Access

Problem: Personal journal data must not be accessible through guessed IDs or client-supplied owner fields.

Solution: Every repository method receives a verified server-session user ID. API requests do not accept uid/ownerId fields. Missing and cross-user resources use indistinguishable safe errors.

### 3. Handling Time Zones Correctly

Problem: Mood and sleep records should group by the user’s local date, not server UTC boundaries.

Solution: Entries store `localDate` and `timeZone` at save time. Trends and summaries use local-date windows and aggregate by saved `localDate`.

### 4. Making AI Output Safe Enough For A Non-Clinical Product

Problem: Model output may be overconfident, diagnostic, medication-related, malformed, or too similar to sensitive input.

Solution: AI output must pass strict schema and safety validation. Unsafe output is discarded rather than repaired. Crisis/supportive flows use fixed locale copy and do not call the Provider.

### 5. Making The Demo Reproducible

Problem: Real Firebase projects, real Gemini keys, screenshots, traces, and personal data are risky for demos and CI.

Solution: The automated path uses Firebase Emulator, fake users, Fake Provider, SDK mocks, and sanitized reports. Real Gemini validation is manual and local-only.

## Security And Privacy Considerations

- Server sessions are stored in HttpOnly cookies.
- Browser clients cannot directly read or write Firestore business collections.
- State-changing routes enforce Origin/CSRF protection.
- Journal text, prompts, raw model output, cookies, tokens, API keys, and Firestore paths are not logged.
- Provider input is minimized and excludes user identifiers.
- Firestore rules are deny-by-default for business collections.
- Tests use fictional `example.test` users and fictional journal content.

## Testing And CI

Testing layers:

- Unit tests for schemas, service rules, aggregation, API error behavior, and AI output validators.
- Firebase Emulator integration tests for repositories, API behavior, Firestore rules, and cross-user isolation.
- Playwright E2E tests for onboarding, journal CRUD, pagination, trends, long-term summaries, plans, AI consent and feedback, security, responsive layouts, and MVP demo flow.
- GitHub Actions jobs for format/lint/typecheck/unit/build, Firebase Emulator integration, and E2E.

CI does not use real Firebase, service accounts, Gemini keys, or real user data.

## Resume Bullets

Possible concise resume bullets:

- Built MindTrace, a full-stack Next.js and Firebase journaling MVP with secure session-scoped APIs, Firestore repositories, local-date trend aggregation, and Playwright E2E coverage.
- Designed an optional AI reflection pipeline using a server-only Gemini adapter, independent AI consent, minimized Provider input, strict JSON output schemas, local safety validation, and safe fallbacks.
- Implemented privacy-focused testing and CI with Firebase Emulator, fake AI providers, deny-by-default Firestore rules, and cross-user isolation tests.

## Interview Narrative

1. Start with the product boundary: “It is a journaling and self-reflection MVP, not a medical product.”
2. Explain the core user flow: onboarding, journal entry, history, trends, long-term summaries, plans.
3. Describe the security model: verified server session, no client owner IDs, repository path scoping, deny-by-default Firestore rules.
4. Explain AI safety: optional consent, minimized inputs, no raw output display, strict validation, fixed crisis/supportive copy.
5. Show the test strategy: unit, integration, E2E, responsive, CI, and fake data.
6. Close with roadmap and limitations: no deployment, no payment, no PDF reports, no account deletion yet, real Gemini only via local smoke test.

## Demo Features To Show

- `/zh-CN` MVP overview.
- Register and basic onboarding.
- Create a journal entry.
- History and entry detail.
- Trends and accessible data table.
- Long-term summaries.
- Manual plans and action items.
- AI feedback consent dialog.
- AI plan suggestion and AI long-term insight draft areas.
- Product boundary and safety pages.

## Follow-Up Improvements

- Implement export and account deletion.
- Add deployment and production observability.
- Add professionally reviewed safety copy and regional crisis resource review.
- Add optional report/PDF flow only after entitlement and privacy review.
- Expand AI safety regression datasets before any public launch.
