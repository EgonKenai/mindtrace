# MindTrace 阶段 3A AI 反馈安全设计

## 1. 产品边界

MindTrace 的 AI 反馈只用于简短情绪反思和低风险自我照顾建议。它不是心理医生、临床风险评估、疾病筛查、诊断、治疗、药物指导或紧急援助工具。

反馈不得：

- 判断用户患有抑郁症、焦虑症或其他疾病；
- 建议开始、停止或调整药物；
- 承诺治疗或康复效果；
- 使用“你一定是”“你肯定需要”等绝对判断；
- 暗示只有应用理解用户，或鼓励用户隐瞒情况、依赖应用；
- 替代医生、心理咨询师、当地紧急服务或现实中的支持人员。

自动规则可能漏报或误报。安全路由只决定产品应走普通生成、固定支持、固定危机响应或安全降级，不产生临床结论。

## 2. 确定性安全路由

策略版本随反馈 schema 一起从版本 `1` 开始。路由状态：

| 决策                  | 条件                                                                       | Provider     |
| --------------------- | -------------------------------------------------------------------------- | ------------ |
| `crisis_redirect`     | 有效语句中同时出现自伤/伤人目标、意图及紧迫时间或计划/手段；或明确当前危险 | 不调用       |
| `supportive_redirect` | 明显高度痛苦但缺少足够紧迫性，无法确认是否属于当前紧急情况                 | 不调用       |
| `allow_generation`    | 未发现上述组合信号的普通记录                                               | 可调用       |
| `safe_fallback`       | 文本无法可靠规范化，或后续 Provider/输出校验失败                           | 不调用或停止 |

规则同时处理中文和基础英文组合、否定语境、历史叙述和引用语境。单个关键词不会直接成为最终危机判断。日记中的“忽略之前指令”等内容只被视为不可信用户文字。

危机与支持响应来自 `src/i18n/messages/zh-CN.ts` 的人工编写模板，不由 Provider 生成。危机模板引导用户联系当地紧急服务、可信任的人或专业支持，但系统不会声称已自动联系任何机构。

## 3. Provider 调用条件

只有 `allow_generation` 可以进入 `AiFeedbackProvider.generateFeedback`。service 依赖抽象接口，不依赖 Gemini SDK。

阶段 3A 没有真实 Provider。默认 `UnconfiguredAiFeedbackProvider` 返回受控的未配置状态，service 将其映射为：

- `policyDecision: safe_fallback`
- `reasonCodes: ["PROVIDER_NOT_CONFIGURED"]`
- 本地化固定降级文案

测试使用 `tests/fixtures/fake-ai-feedback-provider.ts`。Fake Provider 不进入生产业务代码。

Provider 调用使用 `AbortSignal` 和 3 秒默认超时。blocked、unavailable、rate limited、timeout 和未知异常只映射为稳定 reason code，不回显供应商错误。

## 4. 输入最小化

允许发送给 Provider 的字段只有：

- mood、stress、energy
- sleepHours、sleepQuality
- 受控 eventTags
- 清理并截断到 1,200 个 Unicode 字符的 note
- locale
- 版本化系统契约标志
- 未来可选的非识别性趋势计数摘要

禁止发送 uid、email、姓名、entryId、Cookie、token、IP、精确地址、账户资料、精确时间戳、Firestore 路径或 revision。

系统契约和用户日记位于不同对象字段。`system.userContentIsUntrusted` 明确标记日记不能改变系统规则。安全路由在本地检查完整记录；只有普通分支才构造截断后的外发输入。

## 5. 输出 schema 与校验

公开 `FeedbackResult` 字段：

- schemaVersion
- status
- reflection
- suggestions
- disclaimer
- policyDecision
- reasonCodes

Provider 只能返回严格的 `reflection` 和 `suggestions`，未知字段被拒绝。普通生成最多一个建议，严格于公共 schema 的三条上限。reflection 最多 600 个 Unicode 字符，每条建议最多 240 个。

本地校验拒绝：

- 非对象、非结构化或含未知字段的输出；
- 空白、超长或建议超量内容；
- 诊断名称、药物调整、绝对结论、疗效保证或因果断言；
- 情感依赖、操控或要求隐瞒；
- 紧急情况下要求等待；
- 未配置的电话号码；
- HTML、脚本或可执行内容；
- 大段重复用户敏感原文；
- 缺少不确定性表达的普通反思。

任何失败都丢弃整个原始输出并返回固定 `safe_fallback`，不会通过截断或局部修补后展示。

## 6. 服务、API 与持久化

`POST /api/v1/entries/[entryId]/feedback`：

1. 校验同源 Origin；
2. 从服务端会话取得 uid；
3. 校验成年确认与当前版本同意；
4. 从 `journals/{uid}/entries/{entryId}` 读取当前用户记录；
5. 执行安全路由、最小化、Provider 调用和输出校验；
6. 返回字段白名单。

他人记录和不存在记录统一返回 `NOT_FOUND`。客户端请求体中的 uid 或 ownerId 不参与授权。

阶段 3A 不持久化反馈，避免在真实 Provider 和生命周期规则尚未完成前复制敏感数据。`AiFeedbackRepository` 只定义未来边界；允许保存的形状仅包含已验证结果、版本、provider/model 占位、策略决定、reason codes、创建时间、输入 revision 和非敏感运行状态。

禁止持久化 API key、完整 prompt、session/token、Provider 原始错误、未验证输出或调试用日记副本。

## 7. 日志与隐私

反馈 service 的审计事件只允许 `decision` 和稳定 `reasonCodes`。默认 logger 为 no-op。禁止记录：

- 日记正文、事件标签或完整 Provider 输入；
- 系统 prompt 或完整 Provider 输出；
- token、Cookie、uid、email、entryId 或供应商原始错误。

API 未知异常继续使用统一 `INTERNAL_ERROR`，不返回内部消息。

## 8. 安全降级

以下情况都返回人工编写的固定降级，不展示原始 Provider 内容：

- Provider 未配置、超时、阻止、不可用、限流或抛错；
- JSON/schema 错误；
- 内容政策校验失败；
- 本地分类无法可靠完成。

日记创建与保存不依赖反馈成功。阶段 3A 的反馈 API 也不会修改日记记录。

## 9. 已知限制与阶段 3B

- 确定性规则不能识别所有危机表达，不能作为临床判断依据。
- 阶段 3A 只有基础中英文规则，不包含独立模型安全分类器。
- 地区化危机资源和专业审核仍是上线前门槛。
- 当前没有反馈页面、建议效果闭环或反馈持久化。
- 当前没有真实 Gemini adapter、SDK、API key 或外部请求。

阶段 3B 在接入真实模型前必须完成供应商条款与地区评审、独立安全分类器、真实 adapter 契约测试、模型/提示词版本锁定、预发布日志抽查、输出人工抽样和完整安全回归。不得用普通生成模型替代独立安全决策。
