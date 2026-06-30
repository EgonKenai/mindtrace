# MindTrace Submission Summary

## 1. Project Name

MindTrace

## 2. One-Line Introduction

MindTrace is an adult mood, stress, sleep, and life-event journaling MVP with trend review, deterministic long-term summaries, manual plans, and optional low-risk AI reflection drafts.

## 3. Target Users

MindTrace is designed for adults who want a private, structured way to record daily state, notice patterns over time, and optionally receive cautious reflection prompts without turning the product into diagnosis, therapy, or crisis response.

## 4. Problem

Many people want to understand their recent mood, stress, energy, sleep, and life-event patterns, but common options are either too unstructured, too clinical, or too dependent on opaque AI behavior. MindTrace focuses on a safer middle path: structured personal records first, trend and summary visibility second, and optional AI only after explicit consent.

## 5. Core Features

- Email/password account flow with secure server session cookies.
- Adult confirmation, product boundary consent, privacy consent, and user time zone setup.
- Journal CRUD for mood, stress, energy, sleep hours, sleep quality, controlled tags, note, and occurred-at time.
- History list with stable cursor pagination and detail/edit/delete flows.
- Recent 7-day trends grouped by user-local dates.
- 7/14/30 day deterministic long-term summaries.
- Manual plans and action items.
- Optional AI entry feedback, AI plan suggestion drafts, and AI long-term insight drafts.
- Public product-boundary and safety information pages.

## 6. AI Usage

AI is used only as an optional self-reflection aid:

- Entry feedback: short reflection and at most one low-risk suggestion.
- Plan suggestion draft: AI proposes a draft, but the user must confirm before it becomes a plan.
- Long-term insight draft: AI summarizes aggregate long-term data for reflection, but does not create plans automatically.

The default local demo and CI use Fake Provider, SDK mocks, and fictional data. Real Gemini calls are not part of the standard demo or automated test suite.

## 7. Gemini And AI Safety Boundaries

- Gemini integration uses the official `@google/genai` SDK from server-only modules.
- API keys and model configuration are read only from server-side environment variables.
- Provider calls require independent AI data processing consent.
- Provider input is minimized and excludes uid, email, cookies, tokens, IP, Firestore paths, full account profiles, and full history.
- Output must pass strict local schemas and safety validation.
- Unsafe, malformed, blocked, timed-out, or unavailable Provider responses become safe fallback results.
- Crisis/supportive redirects use fixed locale copy and do not call the Provider.
- The product does not diagnose, treat, prescribe, or replace professional support.

## 8. Privacy Design

- User identity is derived from verified server sessions.
- APIs never trust client-supplied owner fields.
- Browser clients cannot directly read or write business Firestore collections.
- State-changing routes enforce existing Origin/CSRF protections.
- Journal text, full prompts, raw model output, cookies, tokens, API keys, and Firestore paths are not written to ordinary logs.
- Test and demo data are fictional and isolated from real Firebase projects.

## 9. Technical Stack

- Next.js App Router
- React
- TypeScript strict
- Firebase Authentication
- Cloud Firestore through Firebase Admin SDK
- Firebase Emulator Suite
- `@google/genai` server-only Provider adapter
- Vitest
- Playwright
- GitHub Actions

## 10. Testing And CI

The repository includes:

- Unit tests for schemas, services, aggregation, API errors, and AI validators.
- Firebase Emulator integration tests for authorization, Firestore rules, repositories, and cross-user isolation.
- Playwright E2E tests for onboarding, journal CRUD, pagination, trends, long-term summaries, plans, AI consent/feedback, security, responsiveness, and MVP demo flow.
- GitHub Actions quality, Firebase Emulator integration, and E2E jobs.

CI does not require real Firebase credentials, service accounts, Gemini API keys, or real user data.

## 11. Current Completion

The MVP is ready for local demo, GitHub showcase, portfolio review, and interview walkthrough. It includes the core account, journal, trends, long-term summary, plans, optional AI draft flows, documentation, and automated test coverage.

It is not deployed, not commercialized, and not a medical product.

## 12. Roadmap

Planned or future work:

- Data export.
- Account deletion and deletion worker coverage.
- Production deployment readiness.
- Production observability and operational runbooks.
- Region-specific privacy, legal, and crisis-resource review.
- Optional PDF/report packaging only after entitlement and privacy review.
- Expanded human-reviewed AI safety regression sets before public launch.

## 13. Medical Boundary

MindTrace is not a medical device, therapy product, diagnostic tool, medication guide, or emergency-response service. It should not be presented as a replacement for mental health professionals, doctors, local emergency services, or trusted real-world support.

## 14. Professional Support Boundary

AI output is only a low-risk reflection or draft. It may be incomplete or wrong, and users remain in control of decisions. The product does not automatically contact emergency services, create plans, prescribe actions, or promise emotional or clinical improvement.
