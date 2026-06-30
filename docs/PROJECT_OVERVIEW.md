# MindTrace Project Overview

## One-Line Summary

MindTrace is a personal mood, stress, sleep, and life-event journal for adults, with trend views, long-term summaries, manual plans, and optional low-risk AI reflection drafts.

MindTrace is not a medical, therapy, diagnosis, medication, or emergency-response product.

## User Problem

Many people want to understand their recent patterns without turning every difficult day into a diagnosis. They need a private place to record mood, stress, sleep, energy, and life events; a simple way to review patterns over time; and optional support that stays cautious, non-clinical, and user-controlled.

## Product Solution

MindTrace focuses on a clear loop:

1. Record a daily state with structured scores, controlled tags, and optional text.
2. Review history and details without exposing long notes in lists.
3. See recent 7-day trends grouped by the user’s local date.
4. Read deterministic long-term summaries over 7, 14, or 30 days.
5. Create manual action plans and action items.
6. Optionally request AI feedback, AI plan suggestion drafts, or AI long-term insight drafts after independent AI consent.

The product keeps AI as an optional reflection aid. It does not automatically save AI plans, make decisions for the user, or present AI output as medical advice.

## Core User Flow

- Register or log in.
- Complete basic onboarding: adult confirmation, product boundary consent, privacy consent, and time zone setup.
- Create a fictional journal entry on `/zh-CN/today`.
- View entries in `/zh-CN/history` and open an entry detail page.
- Review `/zh-CN/trends` for the latest seven local dates.
- Review `/zh-CN/long-term` for deterministic 7/14/30 day summaries.
- Create a manual plan in `/zh-CN/plans`.
- Demonstrate AI entry points with Fake Provider or mocked responses.

## AI Feature Design

AI is split into three optional surfaces:

- Entry feedback: a short reflection and at most one low-risk suggestion for a single entry.
- Plan suggestion draft: a draft plan based on long-term summary data, saved only after user confirmation.
- Long-term insight draft: a low-risk self-reflection draft based on aggregate long-term summary data.

Safety boundaries:

- Independent AI data processing consent is required before Provider calls.
- Provider input is minimized and excludes uid, email, cookies, tokens, IP, Firestore paths, complete account profiles, and full history.
- Output must match strict local schemas and pass safety validation.
- Unsafe or malformed output is discarded and replaced with safe fallback copy.
- Crisis and supportive redirect flows use fixed locale copy and do not call the Provider.

## Privacy And Security Design

- User identity comes from verified server sessions, not client-supplied owner fields.
- Browser clients cannot directly read or write business Firestore collections.
- Every repository method is scoped to the verified user ID.
- State-changing routes enforce existing Origin/CSRF protections.
- Journal text, prompts, raw Provider output, tokens, cookies, and secrets are not written to ordinary logs.
- AI consent is separate from basic product consent, so users can refuse AI and still use core journaling features.

## Testing Coverage

The project includes:

- Unit tests for schema, validation, aggregation, AI output safety, services, and route behavior.
- Firebase Emulator integration tests for authorization, Firestore rules, service behavior, and cross-user isolation.
- Playwright E2E tests for onboarding, journal CRUD, history pagination, trends, long-term summaries, plans, AI consent/feedback, security, responsive views, and the MVP demo path.
- GitHub Actions jobs for quality, emulator integration, and E2E without real Firebase or Gemini credentials.

## Technical Highlights

- Modular Next.js monolith with route handlers, services, repositories, and feature modules.
- Server-only Gemini Provider boundary using the official `@google/genai` SDK.
- Stable cursor pagination for journal history.
- Local-date trend and summary aggregation that respects user IANA time zones.
- Strict schema validation for API inputs, AI Provider inputs, and AI outputs.
- Deny-by-default Firestore rules with emulator regression tests.
- Local-only Gemini smoke test script that never prints keys, full prompts, or raw model output.

## Demo-Ready Features

- Account registration and basic consent.
- Create, view, edit, and delete journal entries.
- History list with stable pagination.
- 7-day trends with missing-date handling.
- Long-term summaries over 7/14/30 days.
- Manual plans and action items.
- AI entry feedback UI with independent consent.
- AI plan suggestion and AI long-term insight draft entry points.
- Product boundary and safety resource pages.

## Not Yet Complete

- Production deployment.
- Payment and subscription flows.
- PDF reports.
- Data export and account deletion implementation.
- Email notifications.
- Chat companion features.
- Medical diagnosis or treatment functionality.
- Real Gemini batch validation in CI.

## Roadmap

- Phase 5C or later: export/account deletion implementation and privacy hardening.
- Future phase: deployment checklist, production observability, and region/legal review.
- Future phase: optional paid report or PDF flow, only after entitlement and privacy review.
- Future phase: additional human-reviewed AI safety regression sets and real Gemini pre-release validation.
