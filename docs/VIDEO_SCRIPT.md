# MindTrace Video Script

These scripts are for local demo recordings with fictional data. Do not run real Gemini, do not show real user records, and do not display API keys, prompts, cookies, tokens, raw provider output, or terminal logs with secrets.

## 30-Second Short Demo

| Time   | Shot                         | Voiceover                                                                                             |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| 0-5s   | MVP overview                 | MindTrace is a personal journaling MVP for adults to record mood, stress, sleep, and life events.     |
| 5-12s  | Today form                   | A user records structured scores, controlled tags, and an optional fictional note.                    |
| 12-18s | Trends                       | The app turns entries into recent local-date trends without treating missing days as zero.            |
| 18-24s | Long-term / plans            | Longer summaries and manual plans help the user reflect and choose next steps.                        |
| 24-30s | AI entry point / safety copy | Optional AI features provide low-risk drafts only after separate consent; this is not medical advice. |

## 90-Second Standard Demo

| Time   | Shot                   | Voiceover                                                                                                                                                           |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-10s  | Register and consent   | Start with a fictional user. Basic onboarding confirms adult status, product boundaries, privacy consent, and time zone.                                            |
| 10-25s | MVP overview           | The overview shows the core path: record, review history, inspect trends, read summaries, and maintain plans.                                                       |
| 25-40s | Journal form           | The daily record captures mood, stress, energy, sleep, controlled tags, and optional text.                                                                          |
| 40-52s | History/detail         | History uses safe previews and detail pages for editing or deleting the user's own records.                                                                         |
| 52-65s | Trends                 | Trends aggregate the latest seven user-local dates and keep missing dates empty rather than inventing values.                                                       |
| 65-78s | Long-term/plans        | Deterministic summaries and manual plans support user-controlled reflection and follow-through.                                                                     |
| 78-90s | AI surfaces and safety | AI feedback, plan suggestions, and long-term insights are optional drafts. They need separate AI consent, use minimized inputs, and are not diagnosis or treatment. |

## 3-Minute Complete Demo

| Time     | Shot                         | Voiceover                                                                                                                                         |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-15s    | Project title / overview     | MindTrace is a local-demo-ready MVP for adult journaling and self-reflection. It is not a medical, therapy, or emergency-response product.        |
| 15-35s   | Register/login               | Use a fictional `example.test` user. Firebase Authentication handles sign-in, then the app creates a secure server session.                       |
| 35-55s   | Onboarding/consent           | Basic consent covers adult confirmation, product boundaries, privacy notice, and time zone. AI consent is separate and optional.                  |
| 55-80s   | Today form                   | Create a fictional journal entry with scores, sleep, tags, and note text. The server validates all fields and derives ownership from the session. |
| 80-100s  | History/detail               | Open history and detail. Point out pagination, safe previews, edit/delete controls, and no direct browser Firestore access.                       |
| 100-120s | Trends                       | Show the latest seven local dates. Same-day records are averaged, and missing days remain empty.                                                  |
| 120-140s | Long-term summary            | Switch between 7, 14, and 30 day summaries. These are deterministic and do not call Gemini.                                                       |
| 140-160s | Manual plans                 | Create a manual plan and action item. Plans are user-confirmed and scoped to the current session user.                                            |
| 160-170s | AI feedback                  | Show the AI feedback entry point and independent consent dialog or Fake Provider result.                                                          |
| 170-176s | AI plan suggestion / insight | Show draft-only AI plan suggestions and long-term insight entry points. AI does not automatically save plans.                                     |
| 176-180s | Safety/privacy close         | Explain minimized Provider inputs, strict output validation, safe fallbacks, and fictional emulator data.                                         |

## 中文旁白稿

MindTrace 是一个面向成年人的个人记录与反思 MVP。用户可以每天记录情绪、压力、精力、睡眠和生活事件，然后查看历史、最近 7 天趋势、长期摘要和手动行动计划。AI 功能是可选的，只在用户单独同意后提供低风险反思或草稿建议。AI 不会自动替用户保存计划，也不会替用户做决定。MindTrace 不是医疗产品，不提供诊断、治疗、用药建议或紧急响应。标准演示使用 Firebase Emulator、虚构用户和 Fake Provider，不运行真实 Gemini，也不展示真实用户数据。

## English Voiceover

MindTrace is a personal journaling and reflection MVP for adults. Users can record mood, stress, energy, sleep, and life events, then review history, seven-day trends, long-term summaries, and manual action plans. AI features are optional and require separate consent. They only provide low-risk reflection or draft suggestions, and they never automatically create plans or make decisions for the user. MindTrace is not a medical product and does not provide diagnosis, treatment, medication guidance, or emergency response. The standard demo uses Firebase Emulator, fictional users, and a Fake Provider rather than real Gemini calls.

## AI Boundary Lines To Say On Camera

- "AI is optional and separate from the core journal."
- "The product sends only minimized inputs and never sends account identifiers such as uid, email, cookies, or tokens."
- "AI suggestions are drafts. The user must explicitly confirm before anything becomes a plan."
- "Unsafe, malformed, timed-out, or blocked provider output becomes a safe fallback."
- "This is not diagnosis, treatment, medication advice, or crisis intervention."

## Features To Show Only As Entry Points

- Real Gemini production behavior.
- AI plan suggestion conversion with any real personal data.
- AI long-term insight generation with real user history; show only fictional or mocked entry points in the standard demo.
- Any future paid report or PDF flow.

For the standard recording, use Fake Provider, SDK mocks, or a prepared local emulator state only.
