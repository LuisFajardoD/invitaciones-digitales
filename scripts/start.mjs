import { createRequire } from "node:module";
import { spawn } from "node:child_process";

const requestedPort = process.env.PORT?.trim();
const port = requestedPort && /^\d+$/.test(requestedPort) ? requestedPort : "3000";
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "start", "-p", port], {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
