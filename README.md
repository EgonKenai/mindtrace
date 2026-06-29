# MindTrace

MindTrace 是面向成年人的个人情绪、压力、睡眠和生活事件记录 Web 应用。它不是心理治疗、疾病诊断、药物建议或紧急援助工具。

当前仓库已完成阶段 2，以及阶段 3A/3B/3C 的 AI 反馈安全基础、真实 Gemini Provider 服务端 adapter、独立 AI 同意界面和记录详情反馈界面。反馈仍经过确定性安全路由、最小化输入、结构化输出和本地严格安全校验。

阶段 3B 使用官方 `@google/genai` 2.10.0 的无状态 `models.generateContent` API。仓库不包含真实 API Key，自动化测试不调用 Gemini。未同时配置 `GEMINI_API_KEY` 和 `GEMINI_MODEL` 时，普通反馈继续返回明确的 `PROVIDER_NOT_CONFIGURED` 固定降级。阶段 3C 在 `/zh-CN/entries/[entryId]` 提供按需反馈和独立同意流程；反馈不持久化。独立模型安全分类器、建议效果闭环、支付、30 天报告、导出和账户删除仍未实现。

## Windows 环境要求

- Node.js 24
- pnpm 11.8.0
- Java 21
- Google Chrome，用于本地 E2E 测试

在 PowerShell 中确认版本：

```powershell
node --version
pnpm --version
java -version
```

预期主版本分别为 Node.js `24`、pnpm `11` 和 Java `21`。如果尚未安装项目声明的 pnpm：

```powershell
npm install --global pnpm@11.8.0
```

## 安装

在项目根目录执行：

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

`.env.example` 只包含本地 Emulator 的虚构配置。不要提交 `.env.local`、Firebase 服务账号 JSON、Firebase Admin 私钥、Gemini 密钥或任何真实用户数据。

如需在明确批准的本地或预发布环境启用 Gemini，请只在被 Git 忽略的服务端环境或 Secret Manager 设置：

```text
GEMINI_API_KEY=
GEMINI_MODEL=
```

两个值缺一不可。不要使用 `NEXT_PUBLIC_` 前缀。本阶段验证不需要也不会使用真实值。

## 本地 Gemini 冒烟测试

仓库提供一个 local-only 的真实 Gemini Provider 冒烟测试入口，用固定虚构日记内容验证 Provider、最小化输入、结构化输出 schema 和本地安全校验是否仍能贯通。它不会读取 Firestore、真实账户或真实用户日记，也不会创建、修改或删除任何数据。

仅在明确批准的本地或预发布服务端环境中设置 `GEMINI_API_KEY` 和 `GEMINI_MODEL` 后运行：

```powershell
pnpm smoke:gemini
```

如果缺少任一变量，脚本会安全跳过并提示缺少变量，不发送请求。配置齐全时，输出仅包含 `requestSucceeded`、`providerCalled`、`policyDecision`、`schemaPassed`、`safetyPassed`、`fallbackUsed` 和延迟区间。脚本不会打印 API Key、完整 Prompt、完整 Gemini 原始输出、用户 ID、邮箱、Cookie、token、Firestore 路径或真实日记内容。

该命令不属于 CI 流程；GitHub Actions 不设置真实 Gemini Key，也不运行真实 Gemini 请求。

## 启动 Firebase Emulator

Firebase Auth Emulator 和 Firestore Emulator 需要 Java 21。先检查当前 Java 版本：

```powershell
java -version
```

输出的主版本号必须为 `21`。如果系统默认 Java 不是 21，请先将 `JAVA_HOME` 和 `Path` 指向本机实际安装的 JDK 21 目录，再次运行 `java -version` 确认。

Firestore Emulator 首次启动或首次运行集成测试时，Firebase CLI 可能需要下载 Firestore Emulator JAR。默认缓存位置为：

```text
%USERPROFILE%\.cache\firebase\emulators
```

首次下载可能需要几分钟。不要把 Emulator JAR、临时下载或缓存文件复制进仓库。

然后启动 Emulator：

```powershell
pnpm emulators:start
```

默认地址：

- Auth Emulator：`127.0.0.1:9099`
- Firestore Emulator：`127.0.0.1:8080`
- Emulator UI：`http://127.0.0.1:4000`

## 启动 Web 应用

保持 Emulator 终端运行，打开第二个 PowerShell：

```powershell
pnpm dev
```

访问：

```text
http://localhost:3000/zh-CN
```

## 运行质量检查

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
```

Firebase 集成测试使用虚构项目 ID `mindtrace-demo`，通过 `firebase emulators:exec` 自动启动和停止 Auth、Firestore Emulator，不需要 `firebase login` 或真实 Firebase 凭据：

```powershell
java -version
pnpm test:integration
```

E2E 会自动启动 Emulator 和 Next.js。本地默认使用已安装的 Google Chrome；CI 设置 `PLAYWRIGHT_USE_BUNDLED_CHROMIUM=true` 后使用 Playwright Chromium。测试账户使用 `example.test` 虚构邮箱，不连接真实 Firebase 项目：

```powershell
java -version
pnpm test:e2e
```

生产构建：

```powershell
pnpm build
```

阶段 3C 浏览器测试通过路由 mock、SDK mock 和 Fake Provider 覆盖同意、生成、分流、降级与错误状态，不调用真实 Gemini。完整本地验证顺序：

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm build
git diff --check
```

## GitHub Actions

`.github/workflows/ci.yml` 包含三个不使用秘密的任务：

- `quality`：安装锁定依赖，运行格式、lint、类型、单元测试和构建。
- `integration`：在 Java 21 下使用 `mindtrace-demo` 运行 Firebase Emulator 集成测试。
- `e2e`：安装 Playwright Chromium 和 Java 21，使用 Firebase Emulator、虚构账户与项目运行浏览器回归；失败时只上传不含截图、trace、正文或请求体的净化测试摘要。

GitHub Actions 不执行 Firebase 登录，也不需要真实 Firebase 项目、Gemini 密钥或服务账号。

## 本地认证流程

1. 打开 `/zh-CN/register` 创建一个虚构测试账户。
2. 浏览器从 Auth Emulator 获得 Firebase ID token。
3. `/api/v1/auth/session` 只验证 ID token 并设置 HttpOnly 会话 Cookie。
4. 新用户进入 `/zh-CN/onboarding/consent` 完成年确认和当前版本同意。
5. 完成准入后，受保护的 `/zh-CN/today` 才可访问。
6. 用户在记录详情页首次选择“生成 AI 反馈”时，单独接受或拒绝当前 AI 数据处理说明。

会话创建不依赖同意状态，因此首次注册不会形成循环依赖。

## 安全约束

- Firebase Admin SDK 只在 `src/server` 和服务端 Route Handlers 中使用。
- 浏览器不能直接读写 Firestore 业务集合；`firestore.rules` 默认拒绝。
- API 从已验证的会话取得 UID，不接受客户端传入 UID 作为数据所有者。
- AI 反馈只有普通记录可进入 Provider；明确危险和高度痛苦分支使用本地化固定模板。
- Provider 输入不含 UID、邮箱、entryId、token、Cookie、精确时间或 Firestore 路径。
- `@google/genai` 只由 `src/server/ai/gemini-provider.ts` 的 `server-only` 模块导入。
- Gemini 使用无状态 `models.generateContent`，不使用 Interactions、聊天、工具、搜索、后台任务或 previous interaction ID。
- 四类 Gemini safety setting 均显式使用 `BLOCK_LOW_AND_ABOVE`，blocked response 进入固定降级。
- AI 第三方处理同意独立于日记准入；拒绝 AI 不影响日记、历史和趋势，但普通反馈不会调用 Provider。
- Fake Provider 和 SDK mock 只用于单元和 Emulator 集成测试。
- `accounts/{uid}` 不保存邮箱；邮箱由 Firebase Authentication 管理。
- 测试账户使用 `example.test` 和完全虚构的数据。
- 当前仓库包含 Gemini SDK adapter 和详情页反馈界面，但没有 API Key、真实调用、反馈持久化、30 天报告、支付、导出、账户删除、Cloud Tasks 或 Cloud Run 正式部署代码。

## 阶段 4A：长期摘要与手动行动计划

阶段 4A 新增确定性的长期摘要和手动行动计划基础结构，不调用真实 Gemini，不实现完整 AI 长报告、AI 自动创建计划、30 天 PDF、付费、部署、聊天陪伴、医疗诊断或自动危机干预。

- 长期摘要 API：`GET /api/v1/long-term/summary?window=7|14|30`
- 计划 API：`GET /api/v1/plans`、`POST /api/v1/plans`、`PATCH /api/v1/plans/[planId]`、`DELETE /api/v1/plans/[planId]`、`POST /api/v1/plans/[planId]/actions`、`PATCH /api/v1/plans/[planId]/actions/[actionId]`
- 页面：`/zh-CN/long-term` 和 `/zh-CN/plans`
- 数据路径：计划为 `plans/{uid}/items/{planId}`，行动项为 `plans/{uid}/items/{planId}/actions/{actionId}`。摘要当前按需计算，不持久化摘要副本。

摘要窗口使用当前账户 IANA 时区生成最近 7/14/30 个本地日期，聚合使用记录保存时的 `localDate`。数值字段使用算术平均值；缺失日期返回为空，不显示为 0；无记录时返回 `insufficient_data`。摘要查询不读取 `note`，不会复制完整日记正文、保存 prompt 或保存 Gemini 原始输出。

阶段 4A 完整本地检查：

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm build
git diff --check
```

## 阶段 4B-1：AI 辅助计划建议草稿

阶段 4B-1 新增按需生成的 AI 计划建议草稿，但不会自动创建正式计划。用户必须先完成基础产品同意；生成草稿前还必须接受独立 AI 数据处理说明。拒绝 AI 同意不影响日记、历史、趋势、长期摘要或手动计划。

- API：`POST /api/v1/plans/suggestions`、`GET /api/v1/plans/suggestions`、`POST /api/v1/plans/suggestions/[suggestionId]/accept`、`POST /api/v1/plans/suggestions/[suggestionId]/dismiss`
- 数据路径：草稿保存在 `analyses/{uid}/planSuggestions/{suggestionId}`；正式计划仍保存在 `plans/{uid}/items/{planId}`
- Provider 输入只包含长期摘要中的统计字段、常见标签、非识别性模式和缺失日期，不包含完整日记正文、uid、email、Cookie、token、IP 或 Firestore 路径
- 自动化测试使用 Fake Provider 和浏览器路由 mock，不调用真实 Gemini，不需要真实 API Key
- `/zh-CN/plans` 提供最小草稿 UI：生成草稿、保存为计划、忽略建议、AI 同意缺失、数据不足和安全降级状态

阶段 4B-1 不包含完整 AI 长报告、AI 自动创建计划、真实 Gemini 计划建议 smoke test、支付、部署、聊天陪伴、医疗诊断或阶段 4C/5/6 功能。

AI 安全设计、第三方处理边界和阶段 3 验收见 `docs/AI_SAFETY.md` 与 `docs/PHASE_3_REVIEW.md`。
