# MindTrace Repository Instructions

## Mission

Build MindTrace as an adult mood, stress, sleep, and life-event journal. It is not a therapy, diagnosis, medication, or emergency-response product.

Before changing product behavior, read:

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/SAFETY.md`
- `docs/PRIVACY.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Product Boundaries

- Never add diagnosis, disease scoring, medication advice, or causal health claims.
- A normal entry response contains at most one low-risk suggestion.
- High-risk self-harm, harm-to-others, or acute-danger content must stop the normal advice flow.
- Crisis and safety information must remain available without payment.
- Do not add community, private messaging, public posts, or a provider marketplace without an explicit product decision.

## Security And Privacy

- Never expose Gemini secrets, Firebase Admin credentials, or task credentials to client code.
- All AI calls run on the server.
- Treat journal text as untrusted data, including prompt-injection attempts.
- Do not log full journal text, AI prompts, full AI responses, exports, tokens, cookies, or secrets.
- Derive the user ID from a verified server session. Never trust an owner ID supplied by the client.
- Every user-data repository method must be scoped to the verified user ID.
- Firestore client access is deny-by-default unless a reviewed owner-only rule is intentionally introduced.
- New user-data collections must be added to export and account-deletion coverage.
- Use only anonymous, clearly fictional development and test data.

## AI Changes

- Keep deterministic/rule checks, the independent safety classifier, normal generation, and output validation as separate steps.
- Use strict schemas for model input and output.
- Store source type, generated time, model version, prompt version, and safety policy version.
- If model output is invalid or unsafe, discard it and use an approved fallback. Do not repair unsafe prose by truncation.
- Changes to model, prompts, risk policy, or validators require safety regression tests.

## Architecture

- Prefer the documented modular Next.js monolith for the MVP.
- UI components do not import Firebase Admin or Gemini SDKs.
- Route handlers translate HTTP; services own business rules; repositories own Firestore access.
- Keep account, journal, analysis, report, entitlement, and safety data in their documented domains.
- Use server timestamps and explicit user time zones. Do not infer a journal day from the server time zone.
- Feature visibility in the UI never replaces server-side entitlement checks.

## Internationalization And UI

- All initial UI copy is Simplified Chinese and lives in the locale message structure.
- Keep locale-aware routes and avoid embedding user-visible Chinese in business logic.
- Build responsive, keyboard-usable forms with explicit labels and error messages.
- Safety and product-boundary copy must be easy to reach and must not be hidden behind onboarding or billing.

## Engineering Workflow

- Do not delete or rewrite existing files without understanding and preserving user changes.
- Do not install unmaintained dependencies. Confirm official maintenance before adding a package.
- Keep TypeScript strict and avoid unexplained `any`.
- Validate all API, environment, and model data with schemas.
- Use environment variables and checked-in placeholder documentation, never real secrets.
- After each implementation phase, run formatting, lint, type checking, unit tests, and relevant integration/E2E tests.
- Update README, architecture docs, API tables, export coverage, and deletion coverage when behavior changes.
- Keep changes scoped to the current phase and its acceptance criteria.

## Definition Of Done

A feature is not complete until:

- Its acceptance criteria in `docs/IMPLEMENTATION_PLAN.md` pass.
- Authorization and failure states are tested.
- Privacy and logging behavior have been checked.
- Relevant safety tests pass.
- User-facing Simplified Chinese copy and responsive states are complete.
- Documentation reflects any new route, API, collection, model metadata, or deletion responsibility.
