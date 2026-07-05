# MindTrace

MindTrace is a private mood, stress, sleep, and life-event journal for adults. It helps people record daily state, review trends, understand longer-term patterns, and turn reflections into user-confirmed action plans.

MindTrace is not a medical product. It does not diagnose, treat, provide medication guidance, replace professional care, or provide emergency-response advice. AI-generated content is for reflection only.

## Live Demo

- Live app: https://mindtrace-smoky.vercel.app/
- English: https://mindtrace-smoky.vercel.app/en
- Chinese: https://mindtrace-smoky.vercel.app/zh-CN

## Project Snapshot

| Area               | Final MVP status                                                                        |
| ------------------ | --------------------------------------------------------------------------------------- |
| Deployment         | Vercel demo deployment                                                                  |
| Default route      | Root path defaults to English at `/en`                                                  |
| Languages          | English and Simplified Chinese; Chinese remains available at `/zh-CN`                   |
| Onboarding         | Adult confirmation, product boundary, privacy notice, time zone, and language selection |
| Journal            | Daily entries with mood, stress, energy, sleep, tags, note, history, edit, and delete   |
| Trends             | Recent 7-day trends grouped by the local date saved with each record                    |
| Long-term review   | 7, 14, and 30 day summaries from structured record data                                 |
| Plans              | Manual plans and action items                                                           |
| Gemini AI          | AI feedback, long-term insight drafts, and plan suggestion drafts                       |
| Human confirmation | AI-generated plan suggestions are never saved as plans until the user confirms          |

## What It Does

- Records mood, stress, energy, sleep hours, sleep quality, life-event tags, optional notes, and occurrence time.
- Shows history with safe previews and stable pagination.
- Aggregates recent trends without turning missing days into zero.
- Builds deterministic long-term summaries from structured journal data.
- Lets users create manual action plans and mark action items complete.
- Uses Gemini to draft supportive feedback, long-term insights, and plan suggestions after separate AI data processing consent.
- Keeps AI output as draft material unless the user chooses to save or act on it.

## AI Safety Boundaries

MindTrace treats journal text as private, sensitive, and untrusted input.

- It is not a medical, diagnostic, therapy, medication, or emergency-response product.
- AI content is for reflection only.
- Browser code never receives Gemini API keys or Firebase Admin credentials.
- Gemini calls run only through server-side code.
- AI requests use minimized inputs rather than full account profiles.
- Crisis and high-risk flows use fixed product copy rather than normal AI generation.
- Model output must pass strict schema validation and local safety validation.
- Invalid, unsafe, malformed, blocked, timed-out, or unavailable AI output is discarded and replaced with safe fallback copy.
- The app does not expose prompts, raw Gemini output, provider errors, tokens, cookies, or Firebase Admin secrets to users.

## AI-Human Responsibility Split

- The user writes journal records and chooses what to save.
- The AI drafts feedback, long-term insight text, and plan suggestion ideas.
- The system validates schema, safety, access control, and consent before showing AI output.
- The user decides whether a draft is useful.
- The user must explicitly confirm before an AI-generated plan suggestion becomes a saved plan.

## Judge Demo Flow

1. Open the live demo at https://mindtrace-smoky.vercel.app/.
2. Confirm the root route opens the English experience at `/en`.
3. Switch to `/zh-CN` or use the header language switcher to show bilingual support.
4. Register or log in with a fictional demo account.
5. Complete onboarding, including language selection and time zone.
6. Create a journal entry from Today.
7. Open History, review the entry, and show edit/delete controls.
8. Open Trends to show recent structured aggregation.
9. Open Long-term Summary and switch between 7, 14, and 30 day windows.
10. Open Plans, create a manual plan, and add an action item.
11. Open an entry and generate Gemini AI feedback after AI consent.
12. Open Long-term Summary and generate a Gemini long-term insight draft.
13. Open Plans and generate a Gemini plan suggestion draft.
14. Show that AI plan suggestions require user confirmation before saving.
15. Point out the product boundary: reflection support only, not diagnosis or treatment.

## Tech Stack

- Next.js App Router, React, TypeScript
- Firebase Authentication
- Firestore with Firebase Admin SDK on the server
- Gemini via the official `@google/genai` SDK in server-only modules
- Zod-style validation at API and model boundaries
- Vitest for unit and integration tests
- Playwright for browser E2E tests
- GitHub Actions for quality, integration, and E2E workflows
- Vercel for the public demo deployment

## Local Development

Prerequisites:

- Node.js 24
- pnpm 11
- Java 21 for Firebase Emulator tests

Install dependencies:

```powershell
pnpm install --frozen-lockfile
```

Create local environment configuration from the example file if needed:

```powershell
Copy-Item .env.example .env.local
```

Do not commit `.env.local` or real secrets.

Run the app locally:

```powershell
pnpm dev
```

Local URLs:

- English: http://localhost:3000/en
- Chinese: http://localhost:3000/zh-CN

Gemini requires server-side environment variables when used outside the hosted demo:

```text
GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_PROVIDER_TIMEOUT_MS=30000
```

Never use a `NEXT_PUBLIC_` prefix for Gemini secrets.

## Testing

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm build
git diff --check
```

Integration and E2E tests use Firebase Emulator and fictional test data. They should not use real user data or real production Firebase credentials.

## Current Limitations

- Full production hardening is future work.
- Mainland China access may be unstable because the current demo uses international hosting and Google/Firebase/Gemini-related infrastructure.
- Payment, account deletion, PDF export, production observability, and incident monitoring are not implemented yet.
- The demo is an MVP for evaluation and portfolio review, not a commercial medical product.
- AI output is draft reflection material and should not be treated as professional advice.

## Documentation

- [Product overview](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Privacy](docs/PRIVACY.md)
- [AI safety](docs/AI_SAFETY.md)
- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Demo guide](docs/DEMO_GUIDE.md)
- [Submission summary](docs/SUBMISSION_SUMMARY.md)
- [Portfolio notes](docs/PORTFOLIO_NOTES.md)
- [Final demo checklist](docs/FINAL_DEMO_CHECKLIST.md)

## Chinese Summary

MindTrace 是一个面向成年人的情绪、压力、睡眠和生活事件记录 MVP。它支持英文和中文演示，默认入口为英文 `/en`，中文版本位于 `/zh-CN`。用户可以记录日常状态、查看趋势和长期摘要、创建手动计划，并在单独同意后使用 Gemini 生成反思、长期洞察和计划建议草稿。

MindTrace 不是医疗产品，不提供诊断、治疗、用药或紧急响应建议。AI 内容仅供反思参考，系统会进行严格的 schema 与安全校验，AI 计划建议必须由用户确认后才会保存。
