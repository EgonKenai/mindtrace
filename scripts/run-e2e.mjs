import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const isWindows = process.platform === "win32";
const binSuffix = isWindows ? ".CMD" : "";
const firebaseBin = path.join(
  rootDir,
  "node_modules",
  ".bin",
  `firebase${binSuffix}`,
);
const playwrightBin = path.join(
  rootDir,
  "node_modules",
  ".bin",
  `playwright${binSuffix}`,
);
const childEnv = {
  ...process.env,
  APP_ORIGIN: "http://127.0.0.1:3000",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIREBASE_PROJECT_ID: "mindtrace-demo",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  MINDTRACE_EXTERNAL_E2E_SERVER: "true",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "mindtrace-demo",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  XDG_CONFIG_HOME:
    process.env.XDG_CONFIG_HOME ??
    path.join(rootDir, ".tmp", "firebase-config"),
};
const playwrightArgs = ["test", ...process.argv.slice(2)];

let emulatorProcess;
let nextProcess;
let shuttingDown = false;

function waitForPort(port, host, timeoutMs) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect({ host, port });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }

        setTimeout(tryConnect, 250);
      });
    };

    tryConnect();
  });
}

function requestStatus(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      response.once("end", () => resolve(response.statusCode ?? 0));
    });

    request.setTimeout(2_000, () => {
      request.destroy();
      resolve(0);
    });
    request.once("error", () => resolve(0));
  });
}

async function waitForHttpStatus(url, expectedStatus, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const status = await requestStatus(url);

    if (status === expectedStatus) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url} to return ${expectedStatus}`);
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: childEnv,
      shell: isWindows,
      stdio: "inherit",
    });

    child.once("exit", (code, signal) => {
      resolve({ code: code ?? 1, signal });
    });
  });
}

async function stopEmulators() {
  if (!emulatorProcess) {
    return;
  }

  if (isWindows) {
    await run("taskkill", ["/pid", String(emulatorProcess.pid), "/t", "/f"]);
    return;
  }

  emulatorProcess.kill("SIGTERM");
}

async function stopNextServer() {
  if (!nextProcess) {
    return;
  }

  if (isWindows) {
    await run("taskkill", ["/pid", String(nextProcess.pid), "/t", "/f"]);
    return;
  }

  nextProcess.kill("SIGTERM");
}

async function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  await stopNextServer();
  await stopEmulators();
  process.exit(exitCode);
}

process.once("SIGINT", async () => {
  await shutdown(130);
});
process.once("SIGTERM", async () => {
  await shutdown(143);
});

try {
  emulatorProcess = spawn(
    firebaseBin,
    [
      "emulators:start",
      "--project",
      "mindtrace-demo",
      "--only",
      "auth,firestore",
    ],
    {
      cwd: rootDir,
      env: childEnv,
      shell: isWindows,
      stdio: "inherit",
    },
  );

  emulatorProcess.once("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`Firebase Emulator exited unexpectedly with code ${code}.`);
      process.exit(code ?? 1);
    }
  });

  await Promise.all([
    waitForPort(9099, "127.0.0.1", 120_000),
    waitForPort(8080, "127.0.0.1", 120_000),
  ]);

  nextProcess = spawn(
    process.execPath,
    [path.join(rootDir, "scripts", "e2e-next-server.mjs")],
    {
      cwd: rootDir,
      env: childEnv,
      stdio: "inherit",
    },
  );

  nextProcess.once("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`E2E Next server exited unexpectedly with code ${code}.`);
      process.exit(code ?? 1);
    }
  });

  await waitForPort(3000, "127.0.0.1", 120_000);
  await waitForHttpStatus("http://127.0.0.1:3000/zh-CN/login", 200, 120_000);

  const result = await run(playwrightBin, playwrightArgs);
  await shutdown(result.code);
} catch (error) {
  await stopNextServer();
  await stopEmulators();
  console.error(
    error instanceof Error ? error.message : "E2E runner failed unexpectedly.",
  );
  process.exit(1);
}
