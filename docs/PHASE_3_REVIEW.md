# MindTrace 阶段 3 验收评审

评审日期：2026-06-25

本评审覆盖阶段 3A（安全基础与领域契约）、3B（真实 Gemini Provider 服务端接入）和 3C（独立同意与反馈界面）。状态使用“已通过”“未通过”“尚未验证”“阶段 3 不适用”。

## 核心验收

| 验收项                                          | 状态     | 依据                                                                                                                   |
| ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| 确定性安全路由与 Provider 调用分离              | 已通过   | `src/server/ai/policy.ts`、`ai-feedback-service.test.ts`；crisis/supportive 的 Provider 调用数为 0。                   |
| 最小化输入不含账户与资源标识                    | 已通过   | `src/server/ai/input.ts`、`ai-feedback-input.test.ts`。                                                                |
| 官方 Gemini SDK 仅存在于 server-only adapter    | 已通过   | `src/server/ai/gemini-provider.ts`；`@google/genai` 2.10.0。                                                           |
| 结构化输出经过本地 strict schema 与内容安全校验 | 已通过   | `ai-feedback-output.test.ts`、`gemini-provider.test.ts`。                                                              |
| 独立 AI 同意不影响基础日记准入                  | 已通过   | `tests/e2e/ai-feedback.spec.ts` 的拒绝流程；`registerAndConsent` 不接受 AI 同意。                                      |
| 未同意时 Provider 调用数为 0                    | 已通过   | `ai-feedback-service.test.ts`；`ai-feedback-service.integration.test.ts`。                                             |
| 详情页按需生成并覆盖安全状态                    | 已通过   | `EntryAiFeedback`；`tests/e2e/ai-feedback.spec.ts` 覆盖生成、crisis、supportive、fallback、未配置、超时、限流和错误。  |
| 输出仅按纯文本渲染                              | 已通过   | React 文本节点；E2E 使用 HTML 样式字符串并验证未创建 `<strong>`。                                                      |
| 跨用户与不存在 entryId 不泄露差异               | 已通过   | `ai-feedback-service.integration.test.ts`、`security.spec.ts` 的 feedback API 404 `NOT_FOUND`。                        |
| 真实 Gemini 冒烟测试                            | 已通过 | 使用固定虚构内容执行 pnpm smoke:gemini；Provider 成功调用，schema 与 safety 校验均通过，未打印 API Key、完整 Prompt、Gemini 原始输出、真实用户数据、Cookie 或 token。 |

验证结果：

providerCalled: true
requestSucceeded: true
schemaPassed: true
safetyPassed: true
fallbackUsed: false
policyDecision: allow_generation
latencyRange: 1-3s

说明：

本次仅使用固定虚构日记内容。
未读取真实 Firestore 用户日记。
未创建、修改或删除真实用户数据。
未打印 API Key、完整 Prompt、Gemini 原始输出、真实用户数据、Cookie 或 token。
测试运行后已清空本地 GEMINI_API_KEY、GEMINI_MODEL、代理相关环境变量。 |

## 隐私与安全

| 验收项                                                | 状态     | 依据                                                                   |
| ----------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| API key、prompt、原始输出和 Provider 错误不进入客户端 | 已通过   | server-only adapter、字段白名单 API、日志安全单元测试。                |
| 同意接受与拒绝均保存于服务端                          | 已通过   | `POST /api/v1/account/ai-consent`、Emulator/浏览器同意流程。           |
| 拒绝同意时不发送反馈请求                              | 已通过   | `ai-feedback.spec.ts` 断言 feedback 请求数为 0。                       |
| 反馈不持久化且不写浏览器存储                          | 已通过   | `EntryAiFeedback` 仅使用组件内 React state；阶段 3 repository 未写入。 |
| 真实供应商条款、地区和保留策略评审                    | 尚未验证 | 需在上线前依据实际 Gemini 账户层级和目标地区完成。                     |
| 独立模型安全分类器与专业安全审阅                      | 尚未验证 | 当前只有确定性规则；属于上线前事项，不以普通生成模型替代。             |

## 页面与回归

| 验收项                              | 状态     | 依据                                                         |
| ----------------------------------- | -------- | ------------------------------------------------------------ |
| 360px AI 同意与反馈流程             | 已通过   | `ai-feedback.spec.ts` 单次提交移动端用例。                   |
| 360px、768px、1280px 无整页横向溢出 | 尚未验证 | 等待本次最终独立浏览器检查后更新。                           |
| 键盘关闭/拒绝同意并完成生成         | 已通过   | 原生 `<dialog>` 支持 Escape，按钮均为原生可聚焦控件。        |
| loading 与错误状态可被辅助技术识别  | 已通过   | 禁用按钮文本、`role=status`、`role=alert` 和对话框标题关联。 |
| 完整单元、集成、E2E、构建与静态检查 | 尚未验证 | 等待本次最终命令执行后更新。                                 |

## 阶段外范围

反馈持久化、建议结果闭环、支付、30 天报告、数据导出、账户删除、聊天陪伴和阶段 4 均为“阶段 3 不适用”，本次未实现。
