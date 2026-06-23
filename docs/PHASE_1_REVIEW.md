# MindTrace 阶段 1 验收评审

评审日期：2026-06-23

## 评审范围

本评审逐条对应 `docs/IMPLEMENTATION_PLAN.md` 中“阶段 1：工程基础、身份和同意”的验收标准。状态只使用“已通过”“未通过”“尚未验证”。“已通过”必须有本地测试、文件或直接检查依据。

## 验收结果

| #   | 验收标准                                                                  | 状态   | 验证依据                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Windows 按 README 可启动 Web、Auth Emulator 和 Firestore Emulator         | 已通过 | 本项目已在 Windows 上通过 `pnpm test:e2e` 启动 Next.js、Auth Emulator 和 Firestore Emulator；`pnpm test:integration` 也已通过。启动命令记录在 `README.md`。                                                                                                                                                                                                   |
| 2   | 格式检查、lint、类型检查和单元测试通过                                    | 已通过 | 2026-06-23 本地执行 `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test:unit`；单元测试为 4 个文件、13 个测试。项目使用 pnpm，因此执行的是实施计划中 npm 命令的 pnpm 等价命令。                                                                                                                                                                    |
| 3   | TypeScript strict，生产代码没有未说明的 `any`                             | 已通过 | `tsconfig.json` 设置 `"strict": true`；对 `src` 执行文本检查未发现显式 `any`；`pnpm typecheck` 和 `pnpm lint` 通过。                                                                                                                                                                                                                                          |
| 4   | 用户可注册、登录、退出；有效 ID token 可创建会话；无效和过期 token 被拒绝 | 已通过 | `tests/e2e/onboarding.spec.ts` 验证注册、登录和退出；`tests/integration/auth-consent.integration.test.ts` 验证有效 token 创建会话；`tests/unit/auth-session-route.test.ts` 验证无效、过期、撤销和缺失 token 被拒绝，拒绝响应不设置 Cookie、不回显 token 或 Firebase 内部错误。`src/server/auth/session.ts` 使用 `verifyIdToken(idToken, true)` 启用撤销检查。 |
| 5   | 会话创建不依赖成年确认或同意，新用户可进入 onboarding                     | 已通过 | `src/app/api/v1/auth/session/route.ts` 只验证 token、创建账户和 Cookie，不读取同意；集成测试先创建会话再确认 `hasProductAccess: false`；E2E 验证新用户进入 `/zh-CN/onboarding/consent`。                                                                                                                                                                      |
| 6   | 已登录未同意用户可访问 onboarding、设置、产品边界和安全页面               | 已通过 | `tests/e2e/onboarding.spec.ts` 验证未同意用户进入 onboarding、访问设置，并可访问公开产品边界和安全页。`src/app/[locale]/(session)/layout.tsx` 只要求会话。                                                                                                                                                                                                    |
| 7   | 未同意用户不能访问阶段 1 个人功能页面或 API                               | 已通过 | E2E 验证未同意用户访问 `/zh-CN/today` 时返回 onboarding；`src/app/[locale]/(product)/layout.tsx` 和 `/api/v1/personal/status` 使用产品准入检查。日记、趋势、AI 和报告属于阶段 2 至阶段 4，本阶段不适用，由对应后续阶段验证。                                                                                                                                  |
| 8   | 成年确认和同意记录包含版本、语言和服务端时间                              | 已通过 | `src/server/consent/constants.ts` 定义版本；`src/server/services/consent-service.ts` 写入隐私、产品边界、AI 处理版本、`locale`、`acceptedAt` 和 `adultConfirmedAt` 服务端时间；Firebase Emulator 集成测试验证记录写入后产品准入生效。                                                                                                                         |
| 9   | 未登录用户可访问产品边界和安全资源页                                      | 已通过 | `tests/e2e/onboarding.spec.ts` 在注册前及退出后验证 `/zh-CN/product-boundary` 和 `/zh-CN/safety` 可访问。                                                                                                                                                                                                                                                     |
| 10  | 仓库不包含真实密钥、服务账号 JSON 或真实日记                              | 已通过 | `.gitignore` 忽略 `.env.local`、服务账号命名文件、私钥和本地工具；`.env.example` 只有 `mindtrace-demo` 虚构配置；测试数据使用 `example.test`；仓库敏感模式扫描未发现私钥或真实密钥。                                                                                                                                                                          |

## CI 状态

| 项目                                   | 状态     | 依据                                                                                                                                        |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 基础 CI 配置                           | 已通过   | `.github/workflows/ci.yml` 的 `quality` job 使用 Node 24、pnpm 11.5.3 和 pnpm 缓存，运行 frozen install、格式、lint、类型、单元测试和构建。 |
| Firebase Emulator integration job 配置 | 已通过   | `integration` job 使用 Java 21、虚构项目 `mindtrace-demo` 和 `pnpm test:integration`，不执行 Firebase 登录、不配置真实凭据。                |
| GitHub 托管 Runner 实际执行            | 尚未验证 | 当前未提交或推送仓库，因此 GitHub Actions 尚未在远程 Runner 上实际运行。                                                                    |
| 基础 CI 中的 E2E                       | 尚未验证 | 按阶段 1 收尾范围，E2E 暂不加入基础 CI；本地 E2E 已连续三次首次直接通过。                                                                   |

## 本地测试记录

- `pnpm format:check`：通过
- `pnpm lint`：通过
- `pnpm typecheck`：通过
- `pnpm test:unit`：4 个文件、13 个测试通过
- `pnpm test:integration`：2 个文件、2 个测试通过
- `pnpm test:e2e`：1 个测试通过；稳定性验证连续三次首次直接通过
- `pnpm build`：通过

最终收尾后已重新确认格式、lint、类型、单元测试、Firebase Emulator 集成测试和构建。E2E 业务流程本次仍首次直接通过；当前受限执行环境在测试完成后的 Chrome/WebServer 回收阶段触发外层超时，历史三次稳定性验证均已正常退出且未使用重试。

## 结论

阶段 1 范围内的功能、认证拒绝路径和本地质量检查已具备自动化验证。日记、趋势、AI 和报告属于后续阶段，本阶段不适用，由对应阶段验收。

GitHub Actions 已配置但尚未在远程 Runner 上实际执行。在不把远程 CI 配置误写为已运行的前提下，阶段 1 可以标记为“本地验证完成”。
