# MindTrace Screenshot Plan

Use this plan for manual screenshots only. Do not create fake screenshots, do not capture real user data, and do not show API keys, tokens, cookies, full prompts, raw Gemini output, or real journal content. Use Firebase Emulator, fictional `example.test` users, and clearly fictional journal notes.

Recommended output folder: `assets/screenshots/`.

## General Capture Rules

- Use fictional demo data only.
- Prefer clean browser chrome or app-only captures.
- Confirm no `.env.local`, terminal secrets, request headers, cookies, or provider logs are visible.
- Do not show real Gemini output. For AI areas, show the entry point, consent prompt, Fake Provider result, or safe fallback state.
- Do not screenshot Playwright traces or reports if they contain page data.
- Keep filenames lowercase and descriptive.

## Screenshot Checklist

| #   | Page or State                    | Suggested Filename                      | Recommended Size | Needs Test Data | Value To Show                                                    | Safety Notes                                        |
| --- | -------------------------------- | --------------------------------------- | ---------------- | --------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Login page                       | `screenshots/auth-login.png`            | 1280x720         | No              | Clear entry point for returning users                            | Use fictional email only if field is filled         |
| 2   | Register page                    | `screenshots/auth-register.png`         | 1280x720         | No              | New-user onboarding start                                        | Do not show real email                              |
| 3   | Onboarding / consent             | `screenshots/onboarding-consent.png`    | 1280x720         | No              | Adult confirmation, product boundary, privacy consent, time zone | Basic consent only; AI consent stays separate       |
| 4   | MVP overview                     | `screenshots/home-overview.png`         | 1280x720         | Optional        | Product map and next-step navigation                             | Ensure non-medical boundary copy is visible         |
| 5   | Today page                       | `screenshots/today-page.png`            | 1280x720         | Optional        | Primary daily recording route                                    | Use fictional values                                |
| 6   | Journal creation form            | `screenshots/journal-entry-form.png`    | 1280x720         | Yes             | Scores, sleep, tags, note count, occurred-at field               | Use fictional note only                             |
| 7   | History list                     | `screenshots/history-list.png`          | 1280x720         | Yes             | Paginated records with safe note previews                        | Do not show long full notes                         |
| 8   | Entry detail                     | `screenshots/entry-detail.png`          | 1280x720         | Yes             | Full record, edit/delete, AI feedback entry point                | Keep note fictional and non-sensitive               |
| 9   | Trends dashboard                 | `screenshots/trends-dashboard.png`      | 1280x720         | Yes             | 7 local dates, missing-day handling, accessible table            | Missing dates should remain empty, not 0            |
| 10  | Long-term summary                | `screenshots/long-term-summary.png`     | 1280x720         | Yes             | 7/14/30 day deterministic summary and insufficient-data state    | Do not imply diagnosis                              |
| 11  | Manual plans                     | `screenshots/plans-dashboard.png`       | 1280x720         | Yes             | Manual plan creation and action items                            | Show user confirmation flow                         |
| 12  | AI feedback entry/status         | `screenshots/ai-feedback-boundary.png`  | 1280x720         | Yes             | Independent AI consent, safe fallback, or Fake Provider feedback | Do not show prompt, raw JSON, or real Gemini output |
| 13  | AI plan suggestion draft entry   | `screenshots/ai-plan-suggestion.png`    | 1280x720         | Yes             | AI suggestion is a draft and requires user confirmation          | Do not show automatic plan creation                 |
| 14  | AI long-term insight draft entry | `screenshots/ai-long-term-insight.png`  | 1280x720         | Yes             | Aggregate-only insight draft entry point                         | Do not show raw provider output                     |
| 15  | Product boundary page            | `screenshots/product-boundary.png`      | 1280x720         | No              | Non-medical product scope                                        | Keep boundary text readable                         |
| 16  | Safety information page          | `screenshots/safety-resources.png`      | 1280x720         | No              | Public safety resources and crisis boundary                      | Do not imply automatic crisis intervention          |
| 17  | Mobile overview                  | `screenshots/mobile-360-overview.png`   | 360x800          | Optional        | 360px navigation and readable overview                           | Check no whole-page horizontal overflow             |
| 18  | Mobile journal flow              | `screenshots/mobile-360-journal.png`    | 360x800          | Yes             | 360px form usability                                             | Avoid real notes                                    |
| 19  | Tablet overview                  | `screenshots/tablet-768-overview.png`   | 768x1024         | Optional        | Tablet layout and navigation                                     | Check text wrapping                                 |
| 20  | Desktop overview                 | `screenshots/desktop-1280-overview.png` | 1280x720         | Optional        | Full desktop demo start                                          | Keep app-only content visible                       |

## Suggested Demo Data

Use fictional content such as:

- Email: `demo-user@example.test`
- Note: `今天完成了学习任务，下午有点累，晚上准备早点休息。`
- Tags: `study`, `sleep`
- Scores: mood 6, stress 5, energy 4, sleepHours 6.5, sleepQuality 5

Do not use real names, real workplaces, real medical details, real crisis content, or copied public posts.

## Viewport Coverage

- 360px mobile: capture overview or journal form, and one AI consent/state screen if useful.
- 768px tablet: capture overview or trends.
- 1280px desktop: capture the main feature set.

For dense tables, confirm the table scrolls inside its own container and does not create whole-page horizontal overflow.
