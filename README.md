# MindTrace

MindTrace 是面向成年人的个人情绪、压力、睡眠和生活事件记录 Web 应用。它不是心理治疗、疾病诊断、药物建议或紧急援助工具。

当前仓库实现到阶段 2A：工程基础、邮箱认证、安全会话、成年确认、版本化同意、访问保护、公开产品边界和安全资源页面，以及日记数据模型、服务端验证、Firestore repository 和 `/api/v1/entries` 后端 API。阶段 2A 不包含前端日记页面、趋势图、Gemini、AI 反馈、支付、报告、导出或账户删除实现。

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

最小 E2E 测试会自动启动 Emulator 和 Next.js，并使用本机 Google Chrome。测试账户使用 `example.test` 虚构邮箱，不连接真实 Firebase 项目：

```powershell
java -version
pnpm test:e2e
```

阶段 2A 只实现服务端数据模型和 API，没有新增页面，因此本阶段验证不运行 E2E。

生产构建：

```powershell
pnpm build
```

完整的阶段 2A 本地验证顺序：

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm build
```

## GitHub Actions

`.github/workflows/ci.yml` 包含两个不使用秘密的任务：

- `quality`：安装锁定依赖，运行格式、lint、类型、单元测试和构建。
- `integration`：在 Java 21 下使用 `mindtrace-demo` 运行 Firebase Emulator 集成测试。

基础 CI 暂不运行 E2E。GitHub Actions 配置不需要 Firebase 登录、真实 Firebase 项目、Gemini 密钥或服务账号。

## 本地认证流程

1. 打开 `/zh-CN/register` 创建一个虚构测试账户。
2. 浏览器从 Auth Emulator 获得 Firebase ID token。
3. `/api/v1/auth/session` 只验证 ID token 并设置 HttpOnly 会话 Cookie。
4. 新用户进入 `/zh-CN/onboarding/consent` 完成年确认和当前版本同意。
5. 完成准入后，受保护的 `/zh-CN/today` 才可访问。

会话创建不依赖同意状态，因此首次注册不会形成循环依赖。

## 安全约束

- Firebase Admin SDK 只在 `src/server` 和服务端 Route Handlers 中使用。
- 浏览器不能直接读写 Firestore 业务集合；`firestore.rules` 默认拒绝。
- API 从已验证的会话取得 UID，不接受客户端传入 UID 作为数据所有者。
- `accounts/{uid}` 不保存邮箱；邮箱由 Firebase Authentication 管理。
- 测试账户使用 `example.test` 和完全虚构的数据。
- 当前阶段没有 Gemini、AI 反馈、趋势图、报告、支付、导出、账户删除、Cloud Tasks 或 Cloud Run 正式部署代码；日记仅实现服务端数据模型和 API。
