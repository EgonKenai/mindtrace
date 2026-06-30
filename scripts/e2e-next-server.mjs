import { createServer } from "node:http";
import next from "next";

const hostname = "127.0.0.1";
const port = 3000;
const app = next({ dev: true, hostname, port });
const handle = app.getRequestHandler();

let server;
let shuttingDown = false;

function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  const forceExit = setTimeout(() => process.exit(0), 1_000);
  forceExit.unref();

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await app.prepare();
  server = createServer((request, response) => {
    handle(request, response);
  });
  server.listen(port, hostname, () => {
    console.log(`E2E Next server ready on http://${hostname}:${port}`);
  });
} catch {
  console.error("E2E Next server failed to start.");
  process.exit(1);
}
