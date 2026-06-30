# 阶段 4A 验收记录

范围：阶段 4A 只实现长期摘要与行动计划基础数据结构、API、最小页面和回归测试。不调用真实 Gemini，不实现完整 AI 长报告、AI 自动创建计划、30 天 PDF、付费订阅、部署、邮件通知、聊天陪伴、医疗诊断或自动危机干预。

## 已完成

- 7/14/30 天长期摘要 API：`GET /api/v1/long-term/summary?window=7|14|30`。
  依据：`tests/unit/long-term-summary.test.ts`、`tests/integration/long-term-plans.integration.test.ts`。
- 摘要使用用户本地日期窗口，并按记录保存时的 `localDate` 聚合。
  依据：复用 `buildRecentLocalDates`；摘要单元测试覆盖 7/14/30 天、时区边界和 localDate 权威性。
- 数据不足返回 `insufficient_data`，缺失日期保留为空，不伪造为 0。
  依据：单元测试、集成测试和 `tests/e2e/long-term-plans.spec.ts`。
- 摘要不复制完整日记正文，不保存 prompt 或 Gemini 原始输出。
  依据：`listJournalSummaryRecords` 只选择 `localDate`、五项数值和 `eventTags`；测试断言响应不含正文。
- 计划 CRUD 和行动项基础服务。
  依据：`src/server/services/plan-service.ts`、`tests/integration/long-term-plans.integration.test.ts`。
- 计划与行动项只访问当前用户数据。
  依据：Firestore 路径 `plans/{uid}/items/{planId}`；跨用户集成测试统一返回 `ResourceNotFoundError`。
- 状态变更继续执行 Origin/CSRF 防护。
  依据：`POST/PATCH/DELETE` route handler 调用 `assertSameOrigin`。
- 浏览器不能直连新业务集合。
  依据：`firestore.rules` deny-by-default；`tests/integration/firestore-rules.integration.test.ts` 覆盖 `longTermSummaries`、`plans` 和行动项。
- `/zh-CN/long-term` 最小页面。
  依据：页面支持 7/14/30 切换、数据不足、平均值、常见标签、简短非诊断性模式和缺失日期表。
- `/zh-CN/plans` 最小页面。
  依据：页面支持计划列表、创建手动计划、修改状态、添加行动项和标记完成。
- 360px 计划页面可用。
  依据：`tests/e2e/long-term-plans.spec.ts` 移动视口流程通过。

## 不适用

- 真实 Gemini 长期报告：阶段 4A 明确排除，未调用 Gemini。
- AI 自动创建计划：阶段 4A 明确排除，计划只能由用户手动创建。
- 付费、部署、聊天陪伴、临床诊断、自动危机干预：阶段 4A 明确排除。

## 本地验证结果

- `pnpm format:check`：已通过。
- `pnpm lint`：已通过。
- `pnpm typecheck`：已通过。
- `pnpm test:unit`：已通过，19 个测试文件、130 个测试。
- `pnpm test:integration`：已通过，5 个测试文件、28 个测试。
- `pnpm test:e2e`：已通过，17 个测试，`retries=0`。
- `pnpm build`：已通过。
- `git diff --check`：已通过。

## E2E 修复记录

- 公共 helper 原先在 `tests/e2e/helpers.ts:21` 等待 `POST /api/v1/auth/session`，predicate 只检查 method 和 URL 后缀，且 click 与等待逻辑分散。
- 已改为 `Promise.all([page.waitForResponse(...), click])`，并用稳定的 method、pathname 和 status predicate 等待 `POST /api/v1/auth/session`、`POST /api/v1/account/consents` 和独立 AI consent。
- 通用注册流程只包含成年确认、产品边界同意、隐私同意和时区设置；AI 同意仍通过独立 `acceptAiConsent(page)` helper，仅由 AI 用例调用。
- 阶段 4A 计划页面修复了初始列表加载与创建响应竞态：创建成功后按 `plan.id` upsert，行动项追加按 `action.id` 去重。

## 尚未验证

- 768px 和 1280px 的独立手工视口检查未单独运行；已有 E2E 覆盖 360px 手机计划流程，现有响应式 E2E 覆盖阶段 2 页面。

## 阶段 4B-1：AI 辅助计划建议草稿

范围：阶段 4B-1 只实现 AI 计划建议草稿基础、确认保存和忽略流程。它不实现完整 AI 长报告、AI 自动创建正式计划、真实 Gemini 计划建议 smoke test、支付、部署、聊天陪伴、医疗诊断、阶段 4C、阶段 5 或阶段 6。

### 已完成

- AI 计划建议草稿数据结构与 Firestore 路径 `analyses/{uid}/planSuggestions/{suggestionId}`。
  依据：`src/features/plans/model.ts`、`src/server/repositories/plan-suggestion-repository.ts`。
- 草稿生成 API `POST /api/v1/plans/suggestions` 与列表 API `GET /api/v1/plans/suggestions`。
  依据：`src/app/api/v1/plans/suggestions/route.ts`、`tests/integration/long-term-plans.integration.test.ts`。
- 用户确认后保存为正式计划，不由 AI 自动写入 `plans`。
  依据：`POST /api/v1/plans/suggestions/[suggestionId]/accept`、`createSuggestedPlanFromDraft`、集成测试“accepts a draft into a formal plan”。
- 忽略草稿和防止已接受/已忽略草稿再次接受。
  依据：`dismissPlanSuggestion`、单元测试和集成测试。
- AI 输入最小化，Provider 输入不包含完整日记正文、uid、email、Cookie、token 或 Firestore 路径。
  依据：`buildProviderInput`、`plan-suggestion-service.test.ts`。
- 数据不足、缺少 AI 同意和高风险安全路由不会调用 Provider。
  依据：`plan-suggestion-service.test.ts`、`long-term-plans.integration.test.ts`。
- Provider 输出通过 strict schema 和安全校验，诊断、用药、治疗承诺、绝对化语言和 HTML 被拒绝。
  依据：`plan-suggestion-output.test.ts`。
- `/zh-CN/plans` 最小 UI 支持生成草稿、保存为计划、忽略建议、AI 同意缺失、数据不足和安全降级状态。
  依据：`src/features/plans/components/plans-dashboard.tsx`、`tests/e2e/long-term-plans.spec.ts`。
- 浏览器客户端仍不能直接读写草稿集合。
  依据：`tests/integration/firestore-rules.integration.test.ts`。

### 尚未验证

- 真实 Gemini 计划建议 smoke test 尚未运行；当前阶段自动化测试只使用 Fake Provider 或浏览器 mock。
- 768px 和 1280px 的阶段 4B-1 独立手工视口检查需在最终本地验收中补记。

### 阶段 4B-1 不适用

- 完整 AI 长报告、30 天 PDF、付费、部署、聊天陪伴、医疗诊断、自动危机干预和 AI 自动创建计划。

## 阶段 4C-1：AI 长期洞察报告草稿

范围：阶段 4C-1 只实现基于 7/14/30 天长期摘要的 AI 长期洞察草稿基础、保存和忽略流程。它不实现真实 Gemini 长期洞察 smoke test、完整 AI 长报告、30 天 PDF、付费、部署、聊天陪伴、医疗诊断、自动危机干预、自动创建计划、阶段 5 或阶段 6。

### 已完成

- AI 长期洞察草稿数据结构与 Firestore 路径 `analyses/{uid}/longTermInsights/{insightId}`。
  依据：`src/features/long-term/model.ts`、`src/server/repositories/long-term-insight-repository.ts`。
- 洞察生成 API、列表 API、详情 API、保存 API 和忽略 API。
  依据：`src/app/api/v1/long-term/insights/**/route.ts`、`tests/integration/long-term-plans.integration.test.ts`。
- AI 输入最小化，不包含完整日记正文、uid、email、Cookie、token、IP 或 Firestore 路径。
  依据：`buildProviderInput`、`long-term-insight-service.test.ts`、集成测试中的 provider input 断言。
- 数据不足、AI 同意缺失和高风险安全路由不会调用 Provider。
  依据：`long-term-insight-service.test.ts` 与 `long-term-plans.integration.test.ts`。
- Provider 输出通过 strict schema 与本地安全校验；诊断、用药、治疗承诺、绝对化语言、HTML 和缺少不确定性表达会被拒绝。
  依据：`long-term-insight-output.test.ts`。
- save insight 只把草稿状态改为 `saved`，不会自动创建计划；dismiss 只把草稿状态改为 `dismissed`。
  依据：`long-term-plans.integration.test.ts`。
- `/zh-CN/long-term` 最小 UI 支持生成、AI 同意缺失、数据不足、安全降级、保存、忽略和历史列表。
  依据：`src/features/long-term/components/long-term-summary-dashboard.tsx`、`tests/e2e/long-term-plans.spec.ts`。
- 浏览器客户端仍不能直接读写 insight 集合。
  依据：`tests/integration/firestore-rules.integration.test.ts`。

### 尚未验证

- 真实 Gemini 长期洞察 smoke test 尚未运行；当前阶段自动化测试只使用 Fake Provider 或浏览器 mock。
- 768px 和 1280px 的阶段 4C-1 独立手工视口检查需在最终本地验收中补记。

### 阶段 4C-1 不适用

- 完整 AI 长报告、30 天 PDF、付费、部署、邮件通知、聊天陪伴、医疗诊断、自动危机干预、自动创建计划、阶段 5 和阶段 6。
