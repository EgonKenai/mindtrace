# MindTrace 系统架构

## 1. 架构目标

- 以简单的模块化单体完成 MVP，避免过早拆分微服务。
- 所有个人数据访问都经过服务端认证和授权。
- Gemini 密钥和服务账号凭据不进入浏览器。
- 日记、账户、分析、报告和运营状态按数据域隔离。
- AI 失败不阻塞记录主流程。
- 安全检测、普通生成和输出校验相互独立。
- 数据导出和永久删除是系统能力，不是人工操作。

## 2. 技术选择

| 层       | 选择                                     | 说明                                          |
| -------- | ---------------------------------------- | --------------------------------------------- |
| Web      | Next.js + TypeScript                     | App Router、响应式界面、服务端 Route Handlers |
| UI       | React + 项目内设计令牌                   | 首版不引入重型组件框架，优先无障碍原生控件    |
| 身份     | Firebase Authentication                  | 浏览器登录后换取服务端会话 Cookie             |
| 数据     | Cloud Firestore                          | 仅服务端 Admin SDK 访问业务数据               |
| AI       | Gemini API                               | 仅服务端调用，结构化输出                      |
| 运行环境 | Google Cloud Run                         | 部署整个 Next.js 模块化单体                   |
| 异步任务 | Cloud Tasks + Cloud Run 内部任务端点     | 用于可靠删除、可重试报告等长任务              |
| 验证     | 统一 schema 库                           | API 输入、环境变量和 AI 输出共用 schema       |
| 测试     | 单元、Firebase Emulator 集成、浏览器 E2E | 不使用真实用户数据                            |

具体稳定版本在开发阶段 1 选择并锁定，不在规划阶段安装依赖。

## 3. 高层结构

```mermaid
flowchart LR
    B["浏览器 / Next.js UI"] -->|"Firebase 登录"| FA["Firebase Authentication"]
    B -->|"Secure HttpOnly 会话 Cookie"| N["Next.js on Cloud Run"]
    N -->|"校验会话与资源所有权"| FA
    N -->|"Admin SDK"| F["Cloud Firestore"]
    N -->|"安全分类请求"| S["Gemini Safety Classifier"]
    N -->|"普通反馈或报告请求"| G["Gemini Generator"]
    N -->|"创建可重试任务"| T["Cloud Tasks"]
    T -->|"签名内部请求"| N
    N -->|"结构化、最小化日志"| O["Cloud Logging / Monitoring"]
```

安全分类器和普通生成器可以使用同一供应商与模型系列，但必须是两个独立请求、独立 schema 和独立决策步骤。不得让一次自由生成同时承担风险判断和建议生成。

## 4. 应用边界

建议采用单仓库模块化结构：

```text
src/
  app/
    [locale]/
    api/v1/
  components/
  features/
    auth/
    consent/
    journal/
    trends/
    ai-feedback/
    reports/
    settings/
    safety/
  i18n/
  lib/
    auth/
    billing/
    env/
    firebase/
    logging/
    validation/
  server/
    ai/
    repositories/
    services/
    tasks/
tests/
  unit/
  integration/
  e2e/
  fixtures/
```

约束：

- React 组件不直接导入 Firebase Admin SDK、Gemini SDK 或服务账号配置。
- Route Handler 只负责协议转换；业务规则放在 service；Firestore 查询放在 repository。
- repository 的每个用户数据方法必须显式接收已经验证的 `userId`。
- 日记原文不得进入普通日志、异常上下文或分析事件。
- `src/i18n/messages/zh-CN.*` 保存首版界面文本，不把中文散落在业务逻辑中。

## 5. 身份与会话

1. 浏览器使用 Firebase Web SDK 完成邮箱密码登录。
2. 浏览器将短期 ID token 发送给 `/api/v1/auth/session`。
3. 服务端只验证 ID token 的真实性和有效性，然后设置 `HttpOnly`、`Secure`、`SameSite=Lax` 会话 Cookie。创建会话不要求用户已经完成成年确认或同意。
4. 新用户获得会话后可以访问 onboarding、consent、设置、产品边界和安全页面。
5. 成年确认和当前版本同意是个人功能的准入条件。未满足条件的已登录用户不能访问日记、趋势、AI 反馈或报告页面和 API。
6. 后续 API 只信任服务端验证后的会话，不信任请求体中的 `uid`。
7. 登出时清除 Cookie；敏感操作需要近期登录或重新认证。
8. 账户删除、邮箱变更等高风险操作要求近期认证。
9. 所有状态变更请求校验同源 `Origin`，并采用 CSRF token 或等效的双重提交保护。

权限守卫分为两层：

- `requireSession`：只验证安全会话，供 onboarding、同意、设置和登出等流程使用。
- `requireProductAccess`：在 `requireSession` 基础上检查成年确认及当前必需版本同意，供日记、趋势、AI 反馈和报告使用。

Firebase Web 配置本身不是服务端密钥，但仍通过公开环境变量集中管理。Gemini 密钥、Admin 凭据和任务签名配置只能存在于服务端 Secret Manager 或本地忽略文件中。Cloud Run 使用服务账号身份，不提交 JSON 密钥。

## 6. 授权与 Firestore 访问

首版采用“浏览器不直连业务 Firestore”的策略：

- 浏览器只能调用同源 API。
- Firestore 安全规则默认拒绝所有客户端业务数据访问。
- Admin SDK 绕过规则，因此 API 必须执行会话验证、资源所有权检查和字段白名单更新。
- Emulator 测试同时验证客户端访问被拒绝，以及 API 不会跨用户返回数据。

规则策略示意：

```text
match /{document=**} {
  allow read, write: if false;
}
```

未来如为实时体验开放客户端读取，需要为单个集合单独设计 owner-only 规则，不得整体放宽。

## 7. Firestore 数据模型

所有时间使用 Firestore Timestamp 保存。所有文档禁止存储完整请求头、访问令牌和密钥。

### 7.1 `accounts/{uid}`

账户和偏好，不存日记正文。

| 字段                      | 类型        | 说明                           |
| ------------------------- | ----------- | ------------------------------ |
| `displayName`             | string/null | 可选                           |
| `locale`                  | string      | 初始为 `zh-CN`                 |
| `timeZone`                | string      | IANA 时区                      |
| `safetyRegion`            | string/null | 国家或地区代码，不是精确位置   |
| `adultConfirmedAt`        | timestamp   | 成年确认时间                   |
| `createdAt` / `updatedAt` | timestamp   | 服务端时间                     |
| `status`                  | string      | `active`、`deletion_requested` |

邮箱由 Firebase Authentication 管理，`accounts/{uid}` 默认不复制邮箱。只有未来出现明确业务需求并完成隐私评审后，才可增加邮箱副本及其同步、导出、删除和访问控制规则。

子集合 `accounts/{uid}/consents/{consentId}`：

| 字段                  | 类型      | 说明                |
| --------------------- | --------- | ------------------- |
| `privacyVersion`      | string    | 隐私文本版本        |
| `termsVersion`        | string    | 产品边界版本        |
| `aiProcessingVersion` | string    | AI 数据处理说明版本 |
| `acceptedAt`          | timestamp | 服务端时间          |
| `locale`              | string    | 接受时语言          |

### 7.2 `journals/{uid}/entries/{entryId}`

原始用户记录，与 AI 分析分离。

| 字段                      | 类型      | 说明                               |
| ------------------------- | --------- | ---------------------------------- |
| `mood`                    | number    | 1 到 10                            |
| `stress`                  | number    | 1 到 10                            |
| `energy`                  | number    | 1 到 10                            |
| `sleepHours`              | number    | 0 到 24                            |
| `sleepQuality`            | number    | 1 到 10                            |
| `eventTags`               | string[]  | 受控标签 ID                        |
| `note`                    | string    | 最多 5,000 字符                    |
| `occurredAt`              | timestamp | 用户记录的发生时间                 |
| `localDate`               | string    | `YYYY-MM-DD`，按保存时用户时区计算 |
| `timeZone`                | string    | 保存时的 IANA 时区快照             |
| `createdAt` / `updatedAt` | timestamp | 服务端时间                         |
| `revision`                | number    | 每次编辑递增                       |

建议索引：

- collection group `entries`: `localDate desc`
- collection group `entries`: `occurredAt desc`

由于查询限定在 `journals/{uid}/entries` 路径，索引不用于跨用户读取。

阶段 2A 已实现以下服务端约束：

- `eventTags` 仅接受受控 ID：`work`、`job_search`、`study`、`sleep`、`family`、`relationship`、`social`、`finance`、`health_routine`、`travel`、`other`；首版每条记录最多 5 个且不允许重复。中文名称仅保存在 `src/i18n/messages/zh-CN.ts`。
- API 输入使用严格 schema，拒绝未知字段；客户端不能写入 `createdAt`、`updatedAt`、`revision`、`localDate`、`timeZone` 或任何所有者字段。
- 创建时 `revision` 为 1；编辑时在事务内递增。仅当编辑提交新的 `occurredAt` 时，按当前账户 IANA 时区重新计算 `localDate` 并更新 `timeZone` 快照。
- 列表只查询 `journals/{uid}/entries`，默认按 `occurredAt desc`、`createdAt desc`、`documentId desc` 排序。分页游标编码这三个排序键，不做无限制全量读取。
- 单条删除会同时删除同用户下已存在的 `analyses/{uid}/entryFeedback`、`analyses/{uid}/suggestionOutcomes` 和 `safetyEvents/{uid}/events` 中与该记录关联的占位数据；阶段 2A 不创建 AI 反馈。
- 未来导出和账户删除必须覆盖 `journals/{uid}/entries/{entryId}`，并继续保持日记正文不进入普通日志或错误上下文。

阶段 2B 前端采用以下结构：

- `/[locale]/today`、`/[locale]/history` 和 `/[locale]/entries/[entryId]` 均位于 `requireProductAccessPage` 保护的产品路由组。
- 浏览器只调用阶段 2A 的 `/api/v1/entries` 接口，不导入 Firebase Firestore 客户端，也不复制服务端业务规则。
- 受控标签、字段限制、Zod 输入 schema 和 API 响应类型位于共享日记模块，服务端与表单转换共同复用。
- `JournalEntryForm` 复用于创建和编辑；评分、睡眠、标签、正文和删除确认拆分为独立可访问组件。
- 历史列表每页读取 10 条，使用服务端稳定游标追加；正文只展示 Unicode 安全截断的预览。
- 浏览器错误处理不记录请求体或正文；API schema 错误只返回安全字段名和通用错误代码。

### 7.3 `analyses/{uid}/entryFeedback/{feedbackId}`

AI 结果和建议，不修改原始日记。

| 字段                  | 类型        | 说明                                                    |
| --------------------- | ----------- | ------------------------------------------------------- |
| `entryId`             | string      | 来源记录                                                |
| `entryRevision`       | number      | 对应记录版本                                            |
| `status`              | string      | `pending`、`ready`、`safety_blocked`、`failed`、`stale` |
| `summary`             | string/null | 简短反馈                                                |
| `possiblePattern`     | string/null | 谨慎描述的可能规律                                      |
| `suggestion`          | map/null    | 最多一个建议                                            |
| `sourceType`          | string      | `ai_generated`、`rules_fallback`、`safety_template`     |
| `modelProvider`       | string/null | 如 `google`                                             |
| `modelVersion`        | string/null | 实际模型标识                                            |
| `promptVersion`       | string      | 提示词版本                                              |
| `safetyPolicyVersion` | string      | 安全策略版本                                            |
| `generatedAt`         | timestamp   | 生成时间                                                |
| `validationCodes`     | string[]    | 不含原文的校验结果代码                                  |

子集合或同域集合 `analyses/{uid}/suggestionOutcomes/{outcomeId}`：

| 字段            | 类型        | 说明                            |
| --------------- | ----------- | ------------------------------- |
| `feedbackId`    | string      | 对应 AI 反馈                    |
| `suggestionKey` | string      | 规范化建议类型                  |
| `status`        | string      | `undecided`、`tried`、`skipped` |
| `helpfulness`   | number/null | 1 到 5                          |
| `note`          | string/null | 可选短备注                      |
| `updatedAt`     | timestamp   | 服务端时间                      |

### 7.4 `reports/{uid}/monthly/{reportId}`

| 字段                        | 类型           | 说明                                              |
| --------------------------- | -------------- | ------------------------------------------------- |
| `periodStart` / `periodEnd` | string         | 用户本地日期                                      |
| `status`                    | string         | `pending`、`ready`、`insufficient_data`、`failed` |
| `entryDayCount`             | number         | 有记录的日期数                                    |
| `statistics`                | map            | 服务端计算的受控聚合值                            |
| `content`                   | map/null       | 报告各章节                                        |
| `sourceType`                | string         | 来源类型                                          |
| `modelVersion`              | string/null    | 模型标识                                          |
| `promptVersion`             | string         | 提示词版本                                        |
| `generatedAt`               | timestamp/null | 生成时间                                          |
| `createdAt`                 | timestamp      | 创建时间                                          |

不在报告文档中复制完整日记正文。

### 7.5 `entitlements/{uid}`

| 字段         | 类型           | 说明                     |
| ------------ | -------------- | ------------------------ |
| `provider`   | string         | 首版为 `test`            |
| `features`   | map            | 如 `report30Day: true`   |
| `validUntil` | timestamp/null | 可选                     |
| `updatedAt`  | timestamp      | 更新时间                 |
| `reason`     | string         | 不包含敏感信息的测试说明 |

### 7.6 `featureFlags/{flagKey}`

服务端可读的全局功能开关。客户端可获得经过筛选的公开状态，但不能据此绕过服务端授权。

建议首个文档：`featureFlags/report30Day`，字段包含 `enabled`、`rolloutPercent`、`updatedAt`。

### 7.7 `safetyEvents/{uid}/events/{eventId}`

只保存最小化的安全审计数据，不保存完整日记原文。

| 字段                | 类型      | 说明                                              |
| ------------------- | --------- | ------------------------------------------------- |
| `entryId`           | string    | 关联记录                                          |
| `riskLevel`         | string    | `low`、`medium`、`high`、`imminent`               |
| `signalCodes`       | string[]  | 规则或分类器代码                                  |
| `classifierVersion` | string    | 分类器版本                                        |
| `policyVersion`     | string    | 决策策略版本                                      |
| `action`            | string    | `normal_flow`、`safe_fallback`、`crisis_response` |
| `createdAt`         | timestamp | 创建时间                                          |
| `expiresAt`         | timestamp | 按保留策略清理                                    |

### 7.8 `deletionJobs/{jobId}`

可靠删除的任务状态。使用随机任务 ID，不保留邮箱、日记或可读个人资料。

| 字段                      | 类型        | 说明                                                 |
| ------------------------- | ----------- | ---------------------------------------------------- |
| `subjectUid`              | string      | 任务期间使用，完成后清空或不可逆哈希化               |
| `status`                  | string      | `queued`、`running`、`completed`、`failed_retryable` |
| `attempts`                | number      | 重试次数                                             |
| `lastErrorCode`           | string/null | 不含原文                                             |
| `createdAt` / `updatedAt` | timestamp   | 时间                                                 |
| `expiresAt`               | timestamp   | 完成后短期 TTL                                       |

## 8. 数据一致性

- 创建记录和创建 `pending` 分析占位使用批量写入。
- AI 生成在记录提交后独立触发；失败只更新分析状态。
- 编辑记录时递增 `revision`，并将旧反馈标记 `stale`。
- 分析写入前再次比较 `entryRevision`，避免旧请求覆盖新记录。
- 删除单条记录时，在事务或幂等 service 中删除记录、反馈、建议结果和最小化安全事件。
- 报告使用周期键作为幂等键，同一用户同一周期只保留一个有效版本。

## 9. Billing Provider 与功能开关

服务端接口概念：

```ts
interface BillingProvider {
  getEntitlements(userId: string): Promise<UserEntitlements>;
  createCheckoutSession?(input: CheckoutInput): Promise<CheckoutResult>;
  handleWebhook?(input: WebhookInput): Promise<void>;
}
```

首版 `TestBillingProvider` 只读取 `entitlements/{uid}`。报告授权需要同时满足：

1. `featureFlags/report30Day.enabled` 为真。
2. 当前用户 `report30Day` 权益有效。
3. 当前用户通过会话认证和必要同意。

真实支付接入时新增 provider adapter，不改变报告 service 的授权调用方式。

## 10. 导出与删除

### 10.1 导出

- 近期认证后才允许导出。
- 服务端按当前 `uid` 读取账户、同意、日记、分析、建议反馈和报告。
- JSON 包含 schema 版本和生成时间；可选 CSV 只导出日记表格字段。
- 响应使用 `Cache-Control: no-store`，不写临时公共文件。
- 导出事件只记录成功、失败代码和字节数，不记录内容。

### 10.2 永久删除

1. 用户重新认证并二次确认。
2. `accounts/{uid}.status` 设为 `deletion_requested`，撤销会话。
3. 创建 `deletionJobs` 并投递签名 Cloud Task。
4. 幂等 worker 删除 `journals`、`analyses`、`reports`、`safetyEvents`、`entitlements`、同意记录和账户文档。
5. 删除 Firebase Auth 用户。
6. 完成任务，清除 `subjectUid`，任务状态按 TTL 删除。
7. 任一步失败都可从固定步骤重试，不恢复产品访问。

普通日志和监控中不应存在需要额外清理的日记原文。

## 11. AI 与安全边界

完整流程见 `docs/SAFETY.md`。架构层要求：

- 安全检测请求与普通生成请求分开。
- 所有模型输入输出使用 schema。
- 高风险分支使用受控模板，不依赖自由生成。
- 普通输出经过诊断、药物、因果、依赖语言和建议数量校验。
- 模型不可用时返回安全、非个性化的降级反馈。
- 模型调用不得记录 prompt、日记原文或完整响应。

## 12. 日志、监控和审计

允许记录：

- 随机请求 ID、路由、状态码、延迟、模型版本
- 认证是否成功、授权拒绝原因代码
- schema 错误字段名和错误代码
- AI 安全级别、验证代码、token 用量和成本指标
- 删除任务步骤和重试状态

禁止记录：

- 完整日记、导出内容、AI prompt 或完整 AI 响应
- ID token、Cookie、API 密钥、服务账号凭据
- 不必要的邮箱、显示名或精确位置

监控至少覆盖 API 错误率、AI 超时率、安全分支率、删除失败任务、跨用户授权拒绝和报告任务积压。

认证、记录写入、AI 生成、报告生成、导出和删除分别设置服务端速率限制与并发保护。限制事件只记录计数和原因代码，不记录日记正文。

## 13. 测试架构

- 单元测试：schema、日期聚合、授权 service、输出校验、风险决策矩阵、报告统计。
- 集成测试：Firebase Auth/Firestore Emulator、repository、事务、级联删除、安全规则。
- 契约测试：Gemini adapter 使用固定虚构响应，不在常规 CI 调用真实模型。
- E2E：注册、同意、创建记录、历史、趋势、AI 降级、建议反馈、导出、删除、付费门控。
- 安全测试：跨用户 ID、越权修改、prompt injection、诊断/药物输出、危机语料、多语言变体。
- 所有 fixtures 使用明显虚构、匿名数据。

## 14. 部署拓扑

- 开发：Next.js 本地服务 + Firebase Emulator Suite + AI fake adapter。
- 预发布：独立 Firebase/GCP 项目、测试 Gemini 配额、测试权益。
- 生产：独立 Firebase/GCP 项目、Cloud Run、Secret Manager、Cloud Tasks、最小权限服务账号。
- 环境之间不共享 Firestore、Auth 用户、密钥或导出文件。
- Cloud Run 区域、Firestore 区域和 AI 数据处理区域在上线国家明确后统一确定。
