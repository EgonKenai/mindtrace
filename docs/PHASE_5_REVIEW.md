# 阶段 5 MVP 演示、材料与提交包装验收

## 范围

阶段 5A 只完成 MVP 信息架构、演示路径、中文文案、轻量 UI 统一、响应式检查和本地回归。没有部署，没有付费，没有真实 Gemini 批量调用，没有 PDF 报告、聊天陪伴、自动危机干预或自动创建计划。

AI 功能仍是低风险草稿或反思参考，不是医疗诊断、治疗、心理咨询、用药建议或紧急响应。AI 计划建议和 AI 长期洞察不会自动保存为正式计划；用户必须确认后才会保存。

## 已完成

| 验收项                                                   | 状态   | 依据                                                                                                                          |
| -------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 登录后有清晰总览和下一步入口                             | 已通过 | `/zh-CN` 总览页、`src/app/[locale]/page.tsx`、`zhCN.home`                                                                     |
| 主导航覆盖 today/history/trends/long-term/plans/settings | 已通过 | `src/components/site-header.tsx`                                                                                              |
| 首页说明产品不是诊断或治疗工具                           | 已通过 | `/zh-CN` 总览页、`README.md` demo flow、`docs/PRODUCT.md`                                                                     |
| 数据不足时给出下一步提示                                 | 已通过 | `zhCN.trends.emptyBody`、`zhCN.longTerm.insufficientBody`、`zhCN.plans.emptyBody`                                             |
| AI 入口明确仅供反思参考                                  | 已通过 | `zhCN.home.aiBoundaryBody`、`zhCN.aiFeedback.intro`、`zhCN.plans.suggestions.disclaimer`、`zhCN.longTerm.insights.disclaimer` |
| AI 同意仍独立可选                                        | 已通过 | 既有阶段 3 API/组件；MVP E2E 验证未同意时不调用反馈 API                                                                       |
| 手动计划仍由用户创建                                     | 已通过 | `/zh-CN/plans` 手动计划表单；AI 草稿保存前需确认                                                                              |
| 360px、768px、1280px 无整页横向溢出                      | 已通过 | `tests/e2e/mvp-demo.spec.ts` 中总览和核心页面视口检查                                                                         |
| README 增加 demo flow                                    | 已通过 | `README.md` 的 Stage 5A demo flow                                                                                             |
| 阶段 5A 文档记录                                         | 已通过 | 本文件、`docs/PRODUCT.md`、`docs/ARCHITECTURE.md`、`docs/PRIVACY.md`、`docs/AI_SAFETY.md`、`docs/IMPLEMENTATION_PLAN.md`      |

## MVP Demo Flow

1. 注册一个虚构测试用户。
2. 完成基础 onboarding：成年确认、产品边界同意、隐私说明同意和时区设置。
3. 打开 `/zh-CN` 总览页，说明产品定位和非医疗边界。
4. 在 `/zh-CN/today` 创建一条虚构日记。
5. 在 `/zh-CN/history` 查看历史和详情。
6. 在 `/zh-CN/trends` 查看最近 7 个本地日期趋势。
7. 在 `/zh-CN/long-term` 查看长期摘要和 AI 长期洞察入口。
8. 在 `/zh-CN/plans` 创建手动计划，并展示 AI 计划建议入口。
9. 在记录详情展示 AI 反馈入口；未接受 AI 同意时只显示独立说明，不调用反馈 API。
10. 展示产品边界和安全资源页面。

## 已验证

- `tests/e2e/mvp-demo.spec.ts` 覆盖基础 onboarding、总览、日记数据、历史、趋势、长期摘要、计划、AI 入口、未 AI 同意提示和移动端演示路径。
- 常规验证命令：`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test:unit`、`pnpm test:integration`、`pnpm test:e2e`、`pnpm build`、`git diff --check`。
- 自动化测试使用 Firebase Emulator、Fake Provider、SDK mock、浏览器 route mock 和虚构数据，不使用真实 Firebase 项目、真实用户数据或真实 Gemini。

## 尚未验证

- 真实 Gemini 长期洞察或计划建议 smoke test：阶段 5A 不运行真实 Gemini 请求。
- 真实部署环境、正式域名、Secret Manager、Cloud Run、监控与告警：阶段 5A 未部署。
- 付费、退款、发票、30 天 PDF 报告、数据导出和账户删除：不属于阶段 5A。

## 不适用

- 医疗诊断、治疗建议、用药建议、自动危机干预、聊天陪伴、社区、私信、公开动态和 provider marketplace。

## 阶段 5B：演示材料、作品集说明和提交准备

阶段 5B 只完成项目展示材料、作品集说明和提交准备文档，没有新增产品功能、API、数据库结构、付费、部署或真实 Gemini 调用。

| 验收项                         | 状态   | 依据                                                                               |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------- |
| README 展示优化                | 已通过 | `README.md` 的项目概览、核心功能、技术栈、AI 安全边界、demo flow、当前状态和路线图 |
| 项目亮点文档                   | 已通过 | `docs/PROJECT_OVERVIEW.md`                                                         |
| Demo guide 完成                | 已通过 | `docs/DEMO_GUIDE.md`                                                               |
| Portfolio notes 完成           | 已通过 | `docs/PORTFOLIO_NOTES.md`                                                          |
| 项目路线图更新                 | 已通过 | `README.md`、`docs/PROJECT_OVERVIEW.md`、`docs/IMPLEMENTATION_PLAN.md`             |
| 明确未部署                     | 已通过 | `README.md`、`docs/DEMO_GUIDE.md`、`docs/PROJECT_OVERVIEW.md`                      |
| 明确未实现付费、PDF、账号删除  | 已通过 | `README.md`、`docs/PROJECT_OVERVIEW.md`、`docs/PORTFOLIO_NOTES.md`                 |
| 明确未运行真实 Gemini 批量调用 | 已通过 | `README.md`、`docs/DEMO_GUIDE.md`、`docs/AI_SAFETY.md` 的既有边界                  |
| MVP 可以用于演示但不是医疗产品 | 已通过 | `README.md`、`docs/DEMO_GUIDE.md`、`docs/PORTFOLIO_NOTES.md`、`docs/PRODUCT.md`    |

### 阶段 5B 尚未验证

- 真实生产部署、正式域名、Secret Manager、Cloud Run、监控与告警：阶段 5B 未部署。
- 真实 Gemini 批量调用或真实长期报告生成：阶段 5B 不运行真实 Gemini 请求。
- 付费、退款、发票、30 天 PDF 报告、数据导出和账号删除：阶段 5B 未实现。

### 阶段 5B 不适用

- 医疗诊断、治疗建议、用药建议、自动危机干预、聊天陪伴、社区、私信、公开动态、provider marketplace 和自动创建计划。

## 阶段 5C：最终演示检查与提交包装

阶段 5C 只完成最终演示检查、提交摘要和作品集包装，没有新增产品功能、API、数据库结构、付费、部署、真实 Gemini 调用或医疗能力。

| 验收项                         | 状态   | 依据                                                                                                                                                   |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 最终 demo checklist 完成       | 已通过 | `docs/FINAL_DEMO_CHECKLIST.md`                                                                                                                         |
| Submission summary 完成        | 已通过 | `docs/SUBMISSION_SUMMARY.md`                                                                                                                           |
| Portfolio notes 精简版本完成   | 已通过 | `docs/PORTFOLIO_NOTES.md` 的中英文 3 行版本、简历 bullet 和讲解稿                                                                                      |
| README 最终校对完成            | 已通过 | `README.md` 的阶段 5C 状态、展示材料链接、AI 边界和路线图                                                                                              |
| 文档一致性检查完成             | 已通过 | `README.md`、`docs/PROJECT_OVERVIEW.md`、`docs/DEMO_GUIDE.md`、`docs/PORTFOLIO_NOTES.md`、`docs/SUBMISSION_SUMMARY.md`、`docs/FINAL_DEMO_CHECKLIST.md` |
| 明确未部署                     | 已通过 | `README.md`、`docs/FINAL_DEMO_CHECKLIST.md`、`docs/SUBMISSION_SUMMARY.md`                                                                              |
| 明确未付费或商业化             | 已通过 | `README.md`、`docs/PORTFOLIO_NOTES.md`、`docs/SUBMISSION_SUMMARY.md`                                                                                   |
| 明确未运行真实 Gemini 批量调用 | 已通过 | `README.md`、`docs/FINAL_DEMO_CHECKLIST.md`、`docs/SUBMISSION_SUMMARY.md`                                                                              |
| 明确未实现 PDF 报告            | 已通过 | `README.md`、`docs/FINAL_DEMO_CHECKLIST.md`、`docs/SUBMISSION_SUMMARY.md`                                                                              |
| 明确未实现账号删除             | 已通过 | `README.md`、`docs/FINAL_DEMO_CHECKLIST.md`、`docs/SUBMISSION_SUMMARY.md`                                                                              |
| 仍不是医疗产品                 | 已通过 | `README.md`、`docs/FINAL_DEMO_CHECKLIST.md`、`docs/SUBMISSION_SUMMARY.md`、`docs/PORTFOLIO_NOTES.md`                                                   |
| MVP 可用于本地演示和作品集展示 | 已通过 | `docs/DEMO_GUIDE.md`、`docs/FINAL_DEMO_CHECKLIST.md`、`docs/PROJECT_OVERVIEW.md`                                                                       |

### 阶段 5C 尚未验证

- 真实生产部署、正式域名、Secret Manager、Cloud Run、监控与告警：阶段 5C 未部署。
- 真实 Gemini 批量调用、预发布真实模型抽样或真实长期报告生成：阶段 5C 不运行真实 Gemini 请求。
- 付费、退款、发票、30 天 PDF 报告、数据导出和账号删除：阶段 5C 未实现。
- 地区特定法律、隐私、危机资源和专业安全文案审查：上线前仍需完成。

### 阶段 5C 不适用

- 医疗诊断、治疗建议、用药建议、自动危机干预、聊天陪伴、社区、私信、公开动态、provider marketplace、自动创建计划和阶段 6 部署工作。
