# 阶段 6 Review

## Phase 6A: Demo Assets / 截图录屏素材准备

阶段 6A 只准备演示素材计划、录屏脚本、提交草稿和展示目录说明，没有新增业务功能、API、数据库结构、部署、付费或真实 Gemini 调用。

| 验收项                               | 状态   | 依据                                                                         |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------- |
| Screenshot plan completed            | 已通过 | `docs/SCREENSHOT_PLAN.md`                                                    |
| Video script completed               | 已通过 | `docs/VIDEO_SCRIPT.md`                                                       |
| Hackathon submission draft completed | 已通过 | `docs/HACKATHON_SUBMISSION_DRAFT.md`                                         |
| README demo placeholders updated     | 已通过 | `README.md` 的 demo assets / screenshot placeholders                         |
| Project overview demo assets updated | 已通过 | `docs/PROJECT_OVERVIEW.md`                                                   |
| Portfolio notes enhanced             | 已通过 | `docs/PORTFOLIO_NOTES.md`                                                    |
| Assets directory notes added         | 已通过 | `assets/README.md`、`assets/screenshots/README.md`、`assets/video/README.md` |
| 未创建真实截图                       | 已通过 | 只新增 README 说明文件，没有新增图片文件                                     |
| 未录制视频                           | 已通过 | 只新增录屏脚本和 `assets/video/README.md`                                    |
| 未部署                               | 已通过 | 本阶段没有部署配置或发布操作                                                 |
| 未运行真实 Gemini                    | 已通过 | 本阶段只更新文档，不执行 `pnpm smoke:gemini`                                 |
| 未实现付费、PDF、账号删除            | 已通过 | 无产品代码或 API 变更                                                        |
| 项目仍不是医疗产品                   | 已通过 | 新增材料均明确非诊断、非治疗、非医疗建议和非紧急响应                         |

## 尚未验证

- 手动真实截图尚未拍摄。
- 演示视频尚未录制。
- Hackathon / XPRIZE 表单尚未正式提交。
- 真实 Gemini 预发布验证、真实部署、付费、PDF 报告、数据导出、账号删除、地区法律/隐私/危机资源审查仍未完成。

## 不适用

- 医疗诊断、治疗建议、用药建议、自动危机干预、聊天陪伴、社区、私信、公开动态、付费功能、PDF 报告、真实 Gemini 批量调用和生产部署。

## Phase 6B: Gemini 实机演示超时修复

阶段 6B 只调整真实 Gemini 演示等待时间，没有新增业务功能、部署、付费、真实 API Key、Prompt 持久化或原始 Gemini 输出保存。

| 验收项                                      | 状态   | 依据                                                                                                             |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Gemini Provider timeout 默认调整为约 30 秒  | 已通过 | `src/server/env.ts` 的 `GEMINI_PROVIDER_TIMEOUT_MS` 默认值为 `30000`                                             |
| timeout 仍然有限上限                        | 已通过 | `GEMINI_PROVIDER_TIMEOUT_MS` 通过 schema 限制在 1000 到 60000ms                                                  |
| 页面 AI feedback 使用同一 timeout 配置      | 已通过 | `src/server/services/ai-feedback-service.ts`                                                                     |
| AI plan suggestion / long-term insight 同步 | 已通过 | `src/server/services/plan-suggestion-service.ts`、`src/server/services/long-term-insight-service.ts`             |
| `smoke:gemini` 使用同一 timeout 配置        | 已通过 | `scripts/gemini-smoke.ts` 读取 `getServerEnv().GEMINI_PROVIDER_TIMEOUT_MS`                                       |
| provider_timeout fallback 仍保留            | 已通过 | 三个 service 仍通过 `AbortController` 和 `ProviderTimeoutError` 返回 `PROVIDER_TIMEOUT` / safe fallback          |
| schema 与 safety validation 仍保留          | 已通过 | Provider 返回后仍执行 `validateProviderOutput`、`validatePlanSuggestionProviderOutput` 和 long-term insight 校验 |
| 未写入真实 API Key                          | 已通过 | 仅新增 `.env.example` 占位变量，不读取或提交 `.env.local`                                                        |
| 未保存 Prompt 或 Gemini 原始输出            | 已通过 | 只调整 timeout 配置，不改变日志、持久化或响应字段                                                                |

### 阶段 6B 尚未验证

- 真实 `pnpm smoke:gemini` 需要本地显式配置 `GEMINI_API_KEY` 和 `GEMINI_MODEL` 后手动运行；常规 CI 仍不运行真实 Gemini。

## Phase 6B-2: Gemini Provider 配置统一

阶段 6B-2 修复真实演示中 `/api/v1/long-term/insights` 返回 `PROVIDER_NOT_CONFIGURED` 的问题。根因是 AI feedback 已接入 `createConfiguredAiFeedbackProvider()`，但 AI plan suggestion 和 AI long-term insight 的默认 Provider factory 仍返回 `null`，导致即使同一环境已配置 `GEMINI_API_KEY` 和 `GEMINI_MODEL`，长期洞察仍走未配置安全降级。

| 验收项                                                 | 状态   | 依据                                                                                                  |
| ------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------- |
| AI feedback 使用统一 Gemini 配置                       | 已通过 | `src/server/services/ai-feedback-service.ts`、`src/server/ai/gemini-provider.ts`                      |
| AI plan suggestion 使用统一 Gemini 配置                | 已通过 | `src/server/services/plan-suggestion-service.ts` 调用 `createConfiguredAiPlanSuggestionProvider()`    |
| AI long-term insight 使用统一 Gemini 配置              | 已通过 | `src/server/services/long-term-insight-service.ts` 调用 `createConfiguredAiLongTermInsightProvider()` |
| 三条路径共用 `GEMINI_API_KEY` 和 `GEMINI_MODEL`        | 已通过 | `src/server/env.ts` 和 `src/server/ai/gemini-provider.ts`                                             |
| 三条路径共用 `GEMINI_PROVIDER_TIMEOUT_MS` service 超时 | 已通过 | 三个 service 均读取 `getServerEnv().GEMINI_PROVIDER_TIMEOUT_MS`                                       |
| safety settings 未降低                                 | 已通过 | `GEMINI_SAFETY_SETTINGS` 仍用于 feedback、plan suggestion 和 long-term insight 请求                   |
| schema validation 仍保留                               | 已通过 | Provider 返回后仍进入各自本地 strict schema 与安全校验                                                |
| 未保存 Prompt 或 Gemini 原始输出                       | 已通过 | 只新增 Provider adapter 和 factory，未新增日志或持久化原始输出                                        |
| 未写入真实 API Key                                     | 已通过 | 只读取服务端环境变量，未提交真实密钥                                                                  |

### 阶段 6B-2 尚未验证

- 真实页面长期洞察演示需要在本地服务端显式配置 Gemini 环境变量后手动验证；自动化测试仍使用 fake provider / mocks，不调用真实 Gemini。

## Phase 6B-3: Long-term insight provider output stability

Phase 6B-3 fixes the real-demo case where `/api/v1/long-term/insights`
called Gemini successfully but returned `PROVIDER_OUTPUT_INVALID`. The likely
failure class was provider JSON transport/schema mismatch: markdown JSON code
fences or free-form tag/action values could reach the local strict validator.

| Acceptance item                                      | Status | Evidence                                                                                        |
| ---------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Markdown JSON code fences are safely stripped        | Passed | `src/server/ai/gemini-provider.ts` parses fenced JSON before local validation                   |
| Long-term insight prompt requires strict JSON only   | Passed | `GEMINI_LONG_TERM_INSIGHT_SYSTEM_INSTRUCTION` says no markdown/code fence                       |
| Provider schema matches controlled tag IDs           | Passed | `GEMINI_LONG_TERM_INSIGHT_RESPONSE_JSON_SCHEMA` uses `JOURNAL_EVENT_TAG_IDS` for `relatedTags`  |
| Provider schema matches action type enum             | Passed | `GEMINI_LONG_TERM_INSIGHT_RESPONSE_JSON_SCHEMA` uses `LONG_TERM_INSIGHT_ACTION_TYPES`           |
| Non-core arrays may default to empty arrays          | Passed | `strengths`, `watchPoints`, `planSuggestionRefs`, and nested `relatedTags` keep schema defaults |
| Core insight fields remain required                  | Passed | `title`, `overview`, non-empty `patterns`, and non-empty `gentleSuggestions` still validate     |
| Safety validation remains enabled                    | Passed | `validateLongTermInsightProviderOutput` still rejects diagnosis, medication, unsafe, and HTML   |
| Raw prompt/output and API keys are not stored/logged | Passed | No new logging or persistence was added                                                         |

### Phase 6B-3 not yet verified

- Real browser long-term insight generation should be retried manually with
  local `GEMINI_API_KEY`, `GEMINI_MODEL`, and fictional journal data. Automated
  tests still use mocks/fake providers and do not call real Gemini.
