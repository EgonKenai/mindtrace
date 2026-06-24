# MindTrace 阶段 2 验收评审

评审日期：2026-06-24

## 评审范围

本评审覆盖阶段 2A（日记数据模型与 API）、2B（记录、历史、详情编辑删除页面）、2C（最近 7 天趋势与时区边界）和 2D（安全审查、完整回归、CI 与验收收尾）。

状态只使用“已通过”“未通过”“尚未验证”“阶段 2 不适用”。“已通过”必须列出代码、测试、页面、命令或手工检查依据。

## 核心验收

| #   | 验收项                                                   | 状态   | 依据                                                                                                                                                                              |
| --- | -------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 日记字段、边界、受控标签和 5,000 Unicode 字符限制        | 已通过 | `src/lib/validation/journal.ts`；`tests/unit/journal-schema.test.ts` 覆盖上下边界、小数睡眠、非法/重复/异常标签、Unicode 边界、日期和未知字段。                                   |
| 2   | 创建、分页列表、详情、编辑、删除均使用服务端会话用户路径 | 已通过 | `/api/v1/entries`、`/api/v1/entries/[entryId]` 从 `getSessionUser()` 取得 uid；`journal-service.ts` 使用 `requireProductDataAccess`；repository 每个方法显式接收 `userId`。       |
| 3   | 客户端不能写 owner、uid、时间戳、revision 或本地日期字段 | 已通过 | create/update schema 为 strict；`tests/unit/journal-schema.test.ts` 和 `tests/e2e/security.spec.ts` 覆盖 `uid`、`ownerId`、`createdAt`、`updatedAt`、`revision`、`localDate` 等。 |
| 4   | 编辑递增 revision，删除清理阶段 2 已有的关联占位数据     | 已通过 | `updateJournalEntryRecord` 事务递增；`tests/integration/journal-service.integration.test.ts` 覆盖 revision 1→2 和关联 feedback/outcome/safetyEvent 清理。                         |
| 5   | 历史按 occurredAt 倒序并稳定分页                         | 已通过 | repository 按 `occurredAt desc`、`createdAt desc`、文档 ID 排序；`tests/integration/journal-service.integration.test.ts` 和 `tests/e2e/pagination.spec.ts` 覆盖两页追加。         |
| 6   | 分页游标严格验证且不能跨用户使用                         | 已通过 | 版本 2 游标含排序键与用户作用域指纹，嵌套 schema 均 strict；集成测试覆盖畸形游标和用户 B 游标被用户 A 拒绝。                                                                      |
| 7   | 同一本地日期允许多条记录                                 | 已通过 | 数据路径不以日期作为唯一键；集成与 E2E 均创建同日多条记录。                                                                                                                       |
| 8   | 最近 7 天趋势使用全部记录的算术平均值                    | 已通过 | `aggregateJournalTrends`；单元、集成和 `tests/e2e/trends.spec.ts` 验证同日多条、平均值和真实 `entryCount`。                                                                       |
| 9   | 缺失日期返回 null，不伪造为 0                            | 已通过 | `aggregateJournalTrends` 返回 null 指标；单元、集成、趋势 E2E 的数据表和空状态均验证“无记录”。                                                                                    |
| 10  | 时区、跨午夜、DST 开始/结束和时区变化处理正确            | 已通过 | 日期窗口使用 IANA 时区与日期日历运算；`tests/unit/trends.test.ts` 覆盖跨午夜、DST 开始与结束；集成测试覆盖保存后更换账户时区。                                                    |

## 安全与隐私

| #   | 验收项                                                          | 状态   | 依据                                                                                                                                                    |
| --- | --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 未登录用户不能访问个人页面和日记/趋势 API                       | 已通过 | 产品路由组使用 `requireProductAccessPage`；`journal.spec.ts` 覆盖四个页面；`security.spec.ts` 验证 entries、detail、trends API 返回 `UNAUTHENTICATED`。 |
| 2   | 已登录未同意用户不能访问日记和趋势                              | 已通过 | `requireProductDataAccess` 检查当前版本同意；集成和 `security.spec.ts` 验证 `CONSENT_REQUIRED`。                                                        |
| 3   | 用户 A 不能读、改、删或通过趋势推断用户 B 数据                  | 已通过 | repository 固定 `journals/{uid}`；集成趋势隔离测试与 `security.spec.ts` 跨用户 E2E。                                                                    |
| 4   | 他人 ID 与不存在 ID 不泄露归属差异                              | 已通过 | service 对两者统一抛出 `ResourceNotFoundError`；集成与 E2E 比较 GET/PATCH/DELETE 均为相同 404 `NOT_FOUND`。                                             |
| 5   | 浏览器不能直接读写 journals 和其他业务集合                      | 已通过 | `firestore.rules` deny-all；`tests/integration/firestore-rules.integration.test.ts` 验证 accounts 和 journals 的客户端读写均失败。                      |
| 6   | POST、PATCH、DELETE 执行 Origin/CSRF 防护                       | 已通过 | 三个日记状态变更 route 均先调用 `assertSameOrigin`；单元测试覆盖缺失/外部 Origin，E2E 覆盖三个方法均返回 `INVALID_ORIGIN`。                             |
| 7   | 正文、标签、token、Cookie、请求体不进入普通日志或安全错误响应   | 已通过 | 阶段 2 代码无普通日志调用；`api-error-response.test.ts` 验证未知异常不回显正文；认证单元测试验证 token 不回显；趋势 repository 不读取正文和标签。       |
| 8   | API 响应使用字段白名单                                          | 已通过 | `serializeJournalEntry` 显式构造响应；趋势类型显式构造；`security.spec.ts` 验证详情响应键集合。                                                         |
| 9   | 超长正文、异常数组、未知字段、非法日期和非法游标安全拒绝        | 已通过 | schema 单元测试与 `security.spec.ts` API 回归，错误只含 `INVALID_REQUEST` 和允许字段名。                                                                |
| 10  | 仓库与 CI 不使用真实 Firebase、Gemini、服务账号、密钥或用户数据 | 已通过 | `.env.example`、`mindtrace-demo`、`example.test`；CI 不执行 `firebase login`，不定义 secrets；敏感模式与未跟踪文件检查未发现真实凭据。                  |
| 11  | CI 失败产物不上传正文或敏感浏览器状态                           | 已通过 | CI 关闭 screenshot/trace；`safe-ci-reporter.ts` 只写测试名称、状态和耗时，artifact 仅上传 `playwright-report/summary.json`。                            |

## 页面与可访问性

| #   | 验收项                                                    | 状态   | 依据                                                                                                                                              |
| --- | --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | today、history、detail、trends 在 360/768/1280 无整页溢出 | 已通过 | `responsive.spec.ts` 覆盖四页三视口；阶段 2D 独立浏览器检查逐页等待已加载状态后测得 12 个组合均满足 `documentElement.scrollWidth <= innerWidth`。 |
| 2   | 移动端趋势表在内部区域滚动，不撑破页面                    | 已通过 | 独立浏览器检查：360px 容器 319/760px、768px 容器 719/760px，均只在 `.trend-table-scroll` 内部滚动；1280px 容器与内容均为 1118px，无需内部滚动。   |
| 3   | 表单 label、aria-describedby、aria-invalid 正确关联       | 已通过 | `ScoreField`、`SleepHoursField`、`EventTagSelector`、`NoteField`、`JournalEntryForm` 使用原生 label/fieldset 和错误 ID；浏览器 E2E 通过标签定位。 |
| 4   | 键盘可创建、编辑、删除、取消，Escape 可关闭删除对话框     | 已通过 | 原生 form/button/dialog；`journal.spec.ts` 桌面和 360px 流程覆盖编辑删除，并使用 Escape 与取消按钮关闭对话框。                                    |
| 5   | 加载、空、错误和重试状态可访问                            | 已通过 | 页面使用 `role=status`/`role=alert`；`trends.spec.ts` 覆盖趋势空、失败和重试；历史和详情包含对应状态组件。                                        |
| 6   | 图表不只依赖颜色并提供数据表                              | 已通过 | 每个趋势柱显示数值或“无记录”，包含 ARIA listitem 描述，并提供完整 7 日可聚焦数据表。                                                              |
| 7   | 长正文、长标签组合和极端数值不破坏布局                    | 已通过 | 自动化与独立浏览器检查均使用 5,000 字符正文、5 个标签、1/10 评分和 24 小时睡眠记录，四页三视口无整页溢出。                                        |
| 8   | 浏览器控制台没有未处理错误                                | 已通过 | 单项响应式测试发现缺失站点图标导致 404 后新增 `src/app/icon.svg`；修复后的完整 E2E 和独立浏览器检查均无 console warning/error。                   |

## 自动化与 CI

| 项目                                | 状态     | 依据                                                                                                                                        |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality` job                       | 已通过   | `.github/workflows/ci.yml` 运行 frozen install、format、lint、typecheck、unit 和 build。                                                    |
| Firebase Emulator `integration` job | 已通过   | Java 21、Node 24、`mindtrace-demo`、`pnpm test:integration`；无 Firebase 登录和真实凭据。                                                   |
| 独立 `e2e` job 配置                 | 已通过   | Java 21、Playwright Chromium、Firebase Emulator、虚构项目和用户；`retries: 0`；失败上传净化摘要。                                           |
| 本地完整 E2E 回归                   | 已通过   | 首次完整运行 9/10、retries 0；修复确定性等待和 favicon 404 后，从干净环境完整运行 10/10、retries 0。详细过程见下节。                        |
| GitHub 托管 Runner 实际执行         | 尚未验证 | 本次明确禁止 commit/push，因此新增 job 尚未在远程 Runner 执行。提交后应以 `quality`、`integration`、`e2e` 三个 job 首次绿色结果为最终依据。 |

## E2E 运行历史与修复

1. 阶段 2D 首次完整 `pnpm test:e2e`：10 个测试中 9 个通过、1 个失败，Playwright `retries: 0`，没有重试。
2. 首次失败发生在 `responsive.spec.ts`。趋势 API 最终返回成功，失败产物中的后置快照也显示 loading 已结束、五张图和 `.trend-table-scroll` 已渲染；根因是测试在 `page.goto()` 后只等待静态 `<main>`，在客户端异步趋势数据完成前读取表格尺寸。
3. 修复仅增加确定性等待：导航前监听 `GET /api/v1/trends?days=7`，要求响应状态 200，并等待可访问数据表 region 可见；没有固定 sleep、全局超时放宽、断言削弱、跳过或自动重试。
4. 首次单项命令因 Windows 反斜杠匹配未找到测试，实际执行 0 个测试；改用 `responsive.spec.ts` 后，单项测试越过原竞态，但发现唯一浏览器控制台错误为缺失 favicon 的 404。
5. 新增 `src/app/icon.svg` 消除真实资源 404；没有过滤控制台日志或削弱 `consoleErrors` 断言。
6. 修复后从无残留端口和已清理测试产物的环境完整运行一次 `pnpm test:e2e`：10/10 通过，耗时约 1.6 分钟，`retries: 0`。

## 阶段 2 不适用

以下项目明确属于后续阶段，本次未实现：

- Gemini、AI 反馈、独立风险检测和高风险内容流程
- 建议结果、30 天报告、支付和权益
- 数据导出和账户删除 worker
- Cloud Run、Cloud Tasks、Secret Manager 和生产部署

## 当前结论

阶段 2 功能、安全、时区、页面和本地回归已通过，可以标记为“本地验收完成”。唯一“尚未验证”项是新增 GitHub Actions jobs 尚未在远程托管 Runner 实际执行；本次禁止 commit/push，因此不得写成远程 CI 已通过。若“正式完成”要求远程 CI 绿色，则需提交后等待 `quality`、`integration`、`e2e` 三个 job 首次运行成功。
