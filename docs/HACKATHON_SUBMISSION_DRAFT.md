# MindTrace Hackathon Submission Draft

This is draft copy for Hackathon, XPRIZE-style, GitHub, or portfolio submission forms. It does not claim deployment, commercial launch, production users, awards, fundraising, or real Gemini production traffic.

## Project Title

MindTrace

## One-Liner

MindTrace is an adult mood, stress, sleep, and life-event journaling MVP with trend review, deterministic long-term summaries, manual plans, and optional low-risk AI reflection drafts.

## Problem

Many people want to understand recent mood, stress, sleep, and life-event patterns, but existing options can feel either too unstructured, too clinical, or too dependent on opaque AI behavior. Users need a private, structured way to record everyday state, review patterns over time, and optionally receive cautious reflection prompts without turning the product into diagnosis or therapy.

## Solution

MindTrace gives users a simple loop:

1. Record structured daily state and optional notes.
2. Review history and individual entries.
3. See seven-day local-date trends.
4. Read deterministic 7, 14, and 30 day summaries.
5. Create manual plans and action items.
6. Optionally request AI reflection, plan suggestion drafts, or long-term insight drafts after independent AI consent.

The product keeps user control at the center. AI can suggest drafts, but it does not automatically save plans, make decisions, diagnose, treat, prescribe, or replace professional support.

## Target Users

MindTrace is designed for adults who want a private personal record of mood, stress, sleep, energy, and life events. Example use cases include work stress, study pressure, job search stress, sleep routine tracking, and general self-reflection.

## Key Features

- Email/password account flow with secure server-session cookies.
- Adult confirmation, product boundary consent, privacy consent, and time-zone setup.
- Journal CRUD for mood, stress, energy, sleep hours, sleep quality, controlled tags, optional note, and occurred-at time.
- History list with stable pagination and safe note previews.
- Seven-day trends grouped by user-local dates.
- Deterministic long-term summaries for 7, 14, and 30 day windows.
- Manual plans and action items.
- Optional AI feedback, AI plan suggestion drafts, and AI long-term insight drafts.
- Public product-boundary and safety information pages.

## How Gemini / AI Is Used

The repository includes a server-only Gemini Provider adapter using the official `@google/genai` SDK. Automated tests and the standard demo do not call real Gemini. They use Fake Provider, SDK mocks, route mocks, and fictional data.

When configured manually in a server-side environment, AI features use minimized inputs and strict output validation. AI is used only for low-risk reflection and draft suggestions. It does not create plans automatically and does not provide medical advice.

## AI Safety And Privacy

- AI data processing consent is independent from basic product consent.
- Refusing AI consent does not block journaling, history, trends, summaries, or manual plans.
- Provider input excludes uid, email, cookies, tokens, IP, Firestore paths, complete account profiles, and full history.
- Output must pass strict local schema and safety validation.
- Unsafe or malformed output is discarded and replaced with safe fallback copy.
- Crisis and supportive redirect states use fixed locale copy and do not call the Provider.
- The app does not show prompts, raw JSON, raw Gemini output, provider errors, or internal stack traces to users.

## Tech Stack

- Next.js App Router
- React
- TypeScript strict
- Firebase Authentication
- Cloud Firestore through Firebase Admin SDK
- Firebase Emulator Suite
- `@google/genai` server-only adapter
- Vitest
- Playwright
- GitHub Actions

## Testing And CI

The project includes unit tests, Firebase Emulator integration tests, and Playwright E2E coverage for onboarding, journal CRUD, history pagination, trends, long-term summaries, plans, AI consent and feedback states, security, responsiveness, and MVP demo paths.

CI uses fictional users, Firebase Emulator, and mock AI behavior. It does not use real Firebase credentials, service accounts, Gemini API keys, or real user data.

## Current MVP Status

MindTrace is local-demo-ready and suitable for GitHub showcase, portfolio review, and interview walkthroughs. It has not been deployed or commercialized. It does not include payment, PDF reports, data export, account deletion implementation, email notifications, or chat companion features.

## What Is Not Included Yet

- Production deployment.
- Payment or subscriptions.
- PDF report generation.
- Data export.
- Account deletion implementation.
- Email notifications.
- Chat companionship.
- Medical diagnosis, treatment, medication guidance, or automatic crisis intervention.
- Real Gemini batch validation in CI.

## Future Roadmap

- Data export and account deletion lifecycle.
- Deployment readiness, observability, and operational runbooks.
- Region-specific privacy, legal, and crisis-resource review.
- Optional report packaging only after entitlement and privacy review.
- Expanded human-reviewed AI safety regression sets before any public launch.

## Why This Project Matters

MindTrace explores a careful product pattern: structured self-recording first, deterministic summaries second, and optional AI only inside explicit safety and privacy boundaries. It is designed to show how AI can assist reflection without becoming a hidden authority, a medical claim, or an automatic decision-maker.

## 中文说明

MindTrace 是一个个人 MVP / Hackathon 项目，用于展示安全边界清晰的情绪、压力、睡眠和生活事件记录体验。它可以在本地使用虚构数据演示，不声称已经上线、商业化或拥有真实用户规模。AI 只作为可选反思草稿，不构成医疗建议、诊断、治疗或紧急响应。
