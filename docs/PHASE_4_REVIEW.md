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
