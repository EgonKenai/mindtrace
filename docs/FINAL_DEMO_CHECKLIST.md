# MindTrace Final Demo Checklist

Use this checklist before a local portfolio, hackathon, XPRIZE-style, or interview demo. The standard demo uses only fictional data, Firebase Emulator, and Fake Provider or mocked AI responses. Do not use real journal content, real users, real Firebase projects, or real Gemini credentials.

For asset planning, use `docs/SCREENSHOT_PLAN.md` before taking screenshots and `docs/VIDEO_SCRIPT.md` before recording. Future manual assets should live under `assets/screenshots/` and `assets/video/` after privacy review.

## 1. Local Pre-Run Check

- Confirm the branch and working tree are ready:

```powershell
git status --short --branch
```

- Confirm no local secrets or test artifacts are present:

```powershell
Get-ChildItem -Force -Name .env.local,.tmp,test-results,playwright-report,coverage,firebase-debug.log,firestore-debug.log 2>$null
```

- Confirm the demo will use fictional `example.test` users and fictional journal text.
- Do not run `pnpm smoke:gemini` during the standard demo.

## 2. Environment Dependencies

Expected local tools:

- Node.js 24
- pnpm 11.8.0
- Java 21
- Google Chrome or Playwright Chromium

Check versions:

```powershell
node --version
pnpm --version
java -version
```

Install dependencies if needed:

```powershell
pnpm install --frozen-lockfile
```

## 3. Run The Local App

For automated confidence before the demo:

```powershell
pnpm test:e2e
```

For an interactive manual demo, start the services in separate terminals:

```powershell
pnpm emulators:start
pnpm dev
```

Open:

```text
http://localhost:3000/zh-CN
```

## 4. New User Demo Flow

1. Open `/zh-CN`.
2. Show that unauthenticated users are sent to login.
3. Register with a fictional `example.test` email.
4. Complete basic onboarding:
   - Adult confirmation.
   - Product boundary consent.
   - Privacy notice consent.
   - IANA time zone selection.
5. Mention that AI data processing consent is separate and optional.

## 5. Journal Entry Demo

1. Open `/zh-CN/today`.
2. Create a fictional entry:
   - mood: 6
   - stress: 5
   - energy: 4
   - sleepHours: 6.5
   - sleepQuality: 5
   - eventTags: study, sleep
   - note: clearly fictional, non-sensitive text.
3. Show success feedback and the link to the saved entry.
4. Open `/zh-CN/history`.
5. Explain stable API pagination and safe note preview.
6. Open the entry detail page.
7. Optionally show edit/delete controls without using real content.

## 6. Trends Page Demo

1. Open `/zh-CN/trends`.
2. Explain that the page uses the latest seven user-local dates.
3. Explain that same-day records are aggregated with arithmetic averages.
4. Point out that missing dates stay empty rather than becoming 0.
5. Show the accessible data table as the non-color-only representation.

## 7. Long-Term Summary Demo

1. Open `/zh-CN/long-term`.
2. Switch between 7, 14, and 30 day windows.
3. If the account has little data, use the insufficient-data state to explain the next step: record a few days first.
4. Explain that deterministic summaries do not call Gemini and do not copy full journal text.

## 8. Manual Plan Demo

1. Open `/zh-CN/plans`.
2. Create a fictional manual plan.
3. Add an action item.
4. Mark the action item complete.
5. Explain that manual plans are user-created and scoped to the verified session user.

## 9. AI Feedback Entry Point

1. Open a journal entry detail page.
2. Show the AI feedback area.
3. If AI consent is not accepted, show the independent AI data processing dialog.
4. Explain that declining AI consent does not block journal, history, trends, long-term summary, or manual plans.
5. Explain that crisis/supportive responses use fixed locale copy and do not call the Provider.

## 10. AI Plan Suggestion Entry Point

1. Open `/zh-CN/plans`.
2. Show the AI plan suggestion draft area.
3. Explain that AI can only produce a draft.
4. Explain that a plan is saved only after the user explicitly confirms.
5. Do not describe AI suggestions as treatment or clinical advice.

## 11. AI Long-Term Insight Entry Point

1. Open `/zh-CN/long-term`.
2. Show the AI long-term insight draft area.
3. Explain that Provider input is limited to aggregate summary fields.
4. Explain that the draft can be saved or dismissed, but it does not automatically create plans.

## 12. Privacy And Safety Talking Points

- MindTrace is a journaling and self-reflection MVP, not a medical product.
- It does not diagnose, treat, prescribe, or replace professional support.
- Browser clients do not receive Gemini keys, Firebase Admin credentials, prompts, raw model output, cookies, or tokens.
- Personal APIs derive `uid` from server sessions, not client-supplied owner fields.
- Business Firestore collections are deny-by-default for direct browser access.
- Default tests and demo flows use Firebase Emulator, fictional users, and Fake Provider or mocks.
- Real Gemini validation is manual, local-only, and never part of normal CI.

## 13. Mobile 360px Check

Use browser device emulation or Playwright output to check:

- `/zh-CN`
- `/zh-CN/today`
- `/zh-CN/history`
- `/zh-CN/trends`
- `/zh-CN/long-term`
- `/zh-CN/plans`
- A journal entry detail page

Expected result:

- No whole-page horizontal overflow.
- Primary buttons remain visible.
- Long text wraps.
- Tables or dense lists scroll inside their own container.
- AI safety notices remain readable.

## 14. Likely Judge Or Interview Questions

**Why is this not a medical product?**  
MindTrace records and summarizes user-entered data for reflection. It avoids diagnosis, treatment, medication guidance, emergency response, or claims that AI can replace professionals.

**How is AI kept optional?**  
Core journaling requires only basic product and privacy consent. AI data processing consent is separate, and Provider calls are blocked when AI consent is missing or declined.

**How do you prevent cross-user access?**  
All user-data repository methods receive the verified server-session user ID. APIs do not accept client-supplied `uid` or `ownerId`, and cross-user IDs use indistinguishable safe errors.

**What happens if Gemini fails or returns unsafe output?**  
The output is discarded and replaced with safe fallback copy. Raw Provider errors and raw model output are never returned to the user.

**Why use Firebase Emulator in demos and CI?**  
It gives reproducible auth and Firestore behavior without real Firebase data, service accounts, or user records.

**What is unfinished?**  
Production deployment, payment, PDF reports, data export, account deletion, email notifications, and public launch compliance review.

## 15. Currently Not Complete

- Production deployment.
- Payment or subscription.
- PDF report generation.
- Data export.
- Account deletion implementation.
- Email notifications.
- Chat companion features.
- Medical diagnosis, treatment, medication advice, or automatic crisis intervention.
- Real Gemini batch validation in CI.
- Region-specific legal, privacy, and crisis-resource review.
