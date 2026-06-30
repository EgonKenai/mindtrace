# MindTrace Portfolio Notes

## Project Name

MindTrace

## Project Positioning

MindTrace is a personal MVP for adult mood, stress, sleep, and life-event journaling. It combines structured journaling, trend review, deterministic long-term summaries, manual action plans, and optional AI reflection drafts with strict safety and privacy boundaries.

It should be presented as a personal MVP or hackathon/portfolio project, not as an already launched medical or commercial product.

## Copy-Ready Concise Versions

### GitHub Project Short Description

MindTrace is a local-demo-ready journaling MVP for adult mood, stress, sleep, and life-event reflection, with secure Firebase-backed data access and optional AI drafts behind strict safety boundaries.

### Resume Project Name Suggestions

- MindTrace: Privacy-Focused Journaling And Optional AI Reflection MVP
- MindTrace: Full-Stack Mood Journal With AI Safety Boundaries
- MindTrace: Next.js + Firebase Personal Reflection MVP

### 中文作品集介绍

MindTrace 是一个个人 MVP / Hackathon 项目，面向成年人记录情绪、压力、精力、睡眠和生活事件。它实现了账户、基础同意、日记 CRUD、历史分页、7 天趋势、长期摘要、手动行动计划，以及可选 AI 反馈、计划建议草稿和长期洞察草稿。项目重点不是“让 AI 替用户判断”，而是展示如何在服务端授权、输入最小化、独立 AI 同意、输出安全校验和完整自动化测试的约束下构建一个可本地演示的全栈产品。

### English Portfolio Description

MindTrace is a personal MVP / hackathon project for adult mood, stress, sleep, and life-event journaling. It includes account onboarding, journal CRUD, paginated history, seven-day trends, deterministic long-term summaries, manual action plans, and optional AI feedback, plan suggestion, and long-term insight drafts. The project focuses on secure server-side data access, AI input minimization, independent AI consent, strict output safety validation, Firebase Emulator testing, Playwright E2E, and honest local-demo readiness rather than medical claims or production launch claims.

### Interview Follow-Up Questions And Answer Points

**How would you explain the project status honestly?**

It is a personal MVP / Hackathon project that is local-demo-ready, tested with emulators and fictional data, and not deployed or commercialized.

**Why separate AI consent from product consent?**

Core journaling should remain usable without third-party AI processing. Provider calls are blocked until the user explicitly accepts the current AI data processing notice.

**What were the hardest technical parts?**

AI safety validation, E2E reliability, Firestore owner isolation, local-date aggregation, input minimization, and user-confirmed AI draft workflows.

**How do Firestore rules and service authorization work together?**

Browser direct access to business collections is denied by default. Server APIs derive `uid` from the verified session and route all Firestore access through scoped repositories.

**How do you avoid overclaiming AI value?**

AI output is framed as low-risk reflection or draft suggestions. It is not diagnosis, treatment, medication advice, emergency response, or an automatic decision-maker.

**What would you do next before public launch?**

Implement export and account deletion, complete deployment readiness, perform legal/privacy and region-specific safety review, expand human-reviewed AI regression tests, and validate real Gemini behavior in a controlled pre-release environment.

### Technical Difficulty Talking Points

- **AI safety:** strict schemas, local validators, conservative prompts, safe fallbacks, and no raw output display.
- **E2E reliability:** Firebase Emulator, fictional users, deterministic readiness checks, and Playwright coverage across core flows.
- **Firestore rules:** deny-by-default browser access plus server-session scoped repositories.
- **Input minimization:** Provider input excludes uid, email, cookies, tokens, IP, Firestore paths, full account profiles, and full history.
- **User confirmation:** AI plan suggestions are drafts; they become plans only after explicit user action.
- **Honest status:** local demo ready, not deployed, not commercialized, not a medical product.

### 中文 3 行版本

MindTrace 是一个个人全栈 MVP，用于成年人的情绪、压力、睡眠和生活事件记录。
它支持日记 CRUD、历史分页、7 天趋势、长期摘要、手动行动计划和可选 AI 反思草稿。
项目重点是服务端授权、隐私最小化、AI 安全校验、Firebase Emulator 测试和可复现本地 demo；它不是医疗诊断或治疗产品。

### English 3-Line Version

MindTrace is a personal full-stack MVP for adult mood, stress, sleep, and life-event journaling.
It includes journal CRUD, paginated history, 7-day trends, long-term summaries, manual plans, and optional AI reflection drafts.
The project emphasizes server-side authorization, data minimization, AI safety validation, Firebase Emulator testing, and reproducible local demos; it is not a medical or therapy product.

### 中文简历 Bullet 版本

- 独立实现 MindTrace 全栈 MVP：Next.js App Router、TypeScript strict、Firebase Auth、Firestore Admin SDK、日记 CRUD、趋势聚合、长期摘要和行动计划。
- 设计可选 AI 反思流程：独立 AI 同意、服务端 Gemini adapter、最小化 Provider 输入、严格 JSON schema、本地安全校验和安全降级。
- 建立完整质量保障：Vitest 单元测试、Firebase Emulator 集成测试、Playwright E2E、响应式检查、GitHub Actions CI 和虚构数据 demo flow。

### English Resume Bullet Version

- Built MindTrace, a full-stack Next.js and Firebase journaling MVP with strict TypeScript, secure session-scoped APIs, Firestore repositories, journal CRUD, trend aggregation, long-term summaries, and manual plans.
- Designed an optional AI reflection pipeline with independent AI consent, a server-only Gemini adapter, minimized Provider input, strict JSON schemas, local safety validation, and safe fallbacks.
- Implemented quality coverage with Vitest unit tests, Firebase Emulator integration tests, Playwright E2E, responsive checks, GitHub Actions CI, and reproducible fictional-data demo flows.

### 60-Second Interview Pitch

MindTrace is a personal MVP I built to explore how to combine private journaling, trend review, and optional AI assistance without turning the product into diagnosis or therapy. The core flow is simple: a user registers, accepts basic product and privacy boundaries, records mood, stress, energy, sleep, tags, and notes, then reviews history, seven-day trends, long-term summaries, and manual plans. AI features are deliberately optional: they require separate AI data processing consent, use minimized inputs, and only produce low-risk reflection drafts or plan suggestions that the user must confirm. Technically, the project is a modular Next.js monolith with Firebase Auth, Firestore through Admin SDK, strict schemas, server-scoped repositories, Firebase Emulator integration tests, Playwright E2E, and CI. The result is demo-ready locally, but it is not deployed, not commercialized, and not a medical product.

### Technical Highlights Talk Track

The engineering focus was authorization, data modeling, and deterministic behavior before AI. Every user-data API derives identity from the verified server session and rejects client-supplied owner fields. Firestore access is routed through service and repository layers, while browser direct access to business collections remains deny-by-default. Journal history uses stable cursor pagination, trends and long-term summaries use saved `localDate` values rather than server UTC grouping, and tests cover cross-user isolation, invalid inputs, pagination, time-zone boundaries, and responsive flows. CI uses Firebase Emulator and fictional users rather than real projects or secrets.

### AI Safety Design Talk Track

AI is treated as a constrained optional subsystem, not the center of the product. Core journaling works without AI consent. Before Provider calls, the service checks independent AI consent, runs local safety routing, minimizes input, and excludes identifiers such as uid, email, cookies, tokens, IP, Firestore paths, and full account profiles. Gemini code lives in server-only modules, and normal tests use Fake Provider or SDK mocks. Output must match strict schemas and pass local safety validation; malformed, unsafe, blocked, timed-out, or unavailable responses are discarded and replaced with safe fallback copy. Crisis and supportive responses are fixed locale text, not model-generated.

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
