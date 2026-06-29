# MindTrace 阶段 3 AI 反馈安全设计

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

阶段 3B 提供 `GeminiAiFeedbackProvider`，使用官方 `@google/genai` 2.10.0 和无状态 `models.generateContent`。它不使用 Interactions、chat、previous interaction ID、后台任务、工具、搜索、缓存或长期对话状态。由于未采用 Interactions API，网络请求没有 `store` 字段；代码中的状态策略仍显式声明 `store: false`，且不会创建可检索 interaction。

默认配置缺少 `GEMINI_API_KEY` 或 `GEMINI_MODEL` 时，`UnconfiguredAiFeedbackProvider` 返回受控的未配置状态，service 将其映射为：

- `policyDecision: safe_fallback`
- `reasonCodes: ["PROVIDER_NOT_CONFIGURED"]`
- 本地化固定降级文案

测试使用 `tests/fixtures/fake-ai-feedback-provider.ts`。Fake Provider 不进入生产业务代码。

Provider 调用使用 `AbortSignal` 和 3 秒 service 超时。只有 429、502、503 可进行一次额外尝试；其余错误不重试。blocked、empty candidate、malformed JSON、unavailable、rate limited、timeout 和未知异常只映射为稳定 reason code 或本地 strict validation 失败，不回显供应商错误。

Gemini 请求显式设置：

- `responseMimeType: application/json`
- strict JSON response schema
- `candidateCount: 1`
- `temperature: 0.2`
- `maxOutputTokens: 512`
- harassment、hate speech、sexually explicit、dangerous content 均为 `BLOCK_LOW_AND_ABOVE`

不得降低为 `BLOCK_NONE` 或 `OFF`。

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

阶段 3A/3B 不持久化反馈，避免在生命周期规则尚未完成前复制敏感数据。`AiFeedbackRepository` 只定义未来边界；允许保存的形状仅包含已验证结果、版本、provider/model 标识、策略决定、reason codes、创建时间、输入 revision 和非敏感运行状态。

禁止持久化 API key、完整 prompt、session/token、Provider 原始错误、未验证输出或调试用日记副本。

## 7. 日志与隐私

反馈 service 的审计事件只允许 `decision` 和稳定 `reasonCodes`。默认 logger 为 no-op。禁止记录：

- 日记正文、事件标签或完整 Provider 输入；
- 系统 prompt 或完整 Provider 输出；
- token、Cookie、uid、email、entryId 或供应商原始错误。

API 未知异常继续使用统一 `INTERNAL_ERROR`，不返回内部消息。

## 8. 独立 AI 第三方处理同意

日记基础准入只要求成年确认、产品边界和隐私同意。AI 处理同意是单独的版本化决定：

- 当前 AI 处理版本为 `2026-06-25-v2`；
- 用户可拒绝 AI，同时继续创建、查看、编辑日记和趋势；
- 只有普通反馈分支且真实或测试 Provider 即将调用时，service 才检查当前 AI 同意；
- 未同意返回安全的 `AI_CONSENT_REQUIRED`，Provider 调用数为 0；
- 危机、支持、本地降级和 Provider 未配置分支不向第三方发送数据；
- 用户可通过 `POST /api/v1/account/ai-consent` 更新接受或拒绝决定。

同意文案说明发送的是最小化评分、受控标签和截断后的日记文字，不发送账户标识、Cookie 或 token。第三方 Provider 可能依据其服务条款为安全和滥用监测保留提示词与输出；具体保留期限、区域和训练用途必须在上线前按所选账户层级与条款再次核验。

阶段 3C 的记录详情页仅在用户点击“生成 AI 反馈”后查询服务端同意状态。未同意时显示独立原生对话框；接受或拒绝都通过同源 API 写入服务端版本化同意记录。拒绝不会发送反馈请求，关闭后仍可正常使用日记、历史和趋势。

## 9. 安全降级

以下情况都返回人工编写的固定降级，不展示原始 Provider 内容：

- Provider 未配置、超时、阻止、不可用、限流或抛错；
- JSON/schema 错误；
- 内容政策校验失败；
- 本地分类无法可靠完成。

日记创建与保存不依赖反馈成功。反馈 API 不修改日记记录；阶段 3C 的结果只存在于当前页面内存，不写入浏览器存储或 Firestore。

## 10. 阶段 3C 展示边界

- AI 区域只存在于当前用户记录详情页，按需调用 `POST /api/v1/entries/[entryId]/feedback`。
- reflection、suggestions 和 disclaimer 只作为 React 文本节点渲染，不解释 HTML。
- crisis 和 supportive 分支展示服务端固定 locale 模板，不展示 Provider 生成内容。
- loading、同意拒绝、正常结果、固定安全分流、安全降级、未配置、超时、限流和通用失败均有明确文本状态。
- 请求期间使用单次进行中保护并禁用按钮，不自动重试浏览器请求。
- API 原始 JSON、prompt、Provider 错误、堆栈和日记正文不进入页面日志。

## 11. 已知限制与上线前事项

- 确定性规则不能识别所有危机表达，不能作为临床判断依据。
- 当前只有基础中英文确定性规则，不包含独立模型安全分类器。
- 地区化危机资源和专业审核仍是上线前门槛。
- 当前没有建议效果闭环或反馈持久化。
- 仓库包含真实 Gemini adapter 和 SDK，但没有 API key，常规测试也不发起外部请求。`pnpm smoke:gemini` 是仅供本地或预发布服务端环境手动执行的真实 Provider 冒烟入口；它使用固定虚构日记内容，复用正式 Gemini Provider、最小化输入构造、结构化输出 schema 和本地安全校验，不读取 Firestore、真实账户或真实日记，也不写入任何数据。缺少 `GEMINI_API_KEY` 或 `GEMINI_MODEL` 时脚本安全跳过；配置齐全时也只输出请求是否成功、Provider 是否被调用、policyDecision、schema/safety 是否通过、是否 fallback 和延迟区间，不打印 API Key、Prompt、原始模型输出或原始错误。
- 真实 Gemini 冒烟测试尚未验证。

上线前仍需完成供应商条款与地区评审、独立安全分类器、模型/系统指令版本锁定、预发布真实模型 smoke test、日志抽查、输出人工抽样和专业安全回归。不得用普通生成模型替代独立安全决策。
