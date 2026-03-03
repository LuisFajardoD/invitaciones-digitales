import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { platform } from "node:os";
import process from "node:process";
import {
  clearNextCache,
  DEFAULT_BACKEND_PORT,
  DEFAULT_VIEWER_PORT,
  stopLocalDevListeners,
  waitForLoopbackUrl,
} from "./dev-runtime.mjs";

const npmCommand = platform() === "win32" ? "npm.cmd" : "npm";
const children = [];
let shuttingDown = false;

function isPortAvailable(port) {
  return Promise.all(["127.0.0.1", "::1"].map((host) => isPortTakenOnLoopback(port, host))).then(
    (results) => !results.some(Boolean),
  );
}

function isPortTakenOnLoopback(port, host) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });
    const finish = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(250);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", (error) => {
      if (error && typeof error === "object" && "code" in error) {
        if (
          error.code === "ECONNREFUSED" ||
          error.code === "EHOSTUNREACH" ||
          error.code === "ENETUNREACH" ||
          error.code === "ETIMEDOUT" ||
          error.code === "EINVAL" ||
          error.code === "EADDRNOTAVAIL"
        ) {
          finish(false);
          return;
        }
      }

      reject(error);
    });
  });
}

async function ensureRequiredPortsAvailable() {
  const requiredPorts = [
    { port: DEFAULT_BACKEND_PORT, label: "Next" },
    { port: DEFAULT_VIEWER_PORT, label: "React viewer" },
  ];
  const occupied = [];

  for (const item of requiredPorts) {
    const available = await isPortAvailable(item.port);
    if (!available) {
      occupied.push(item);
    }
  }

  if (!occupied.length) {
    return;
  }

  console.error("No se pudo iniciar dev:all porque el stack requiere puertos fijos y ya estan ocupados:");
  for (const item of occupied) {
    console.error(`- ${item.label}: ${item.port}`);
  }
  console.error("Deten la instancia previa o libera esos puertos y vuelve a intentar.");
  process.exit(1);
}

function run(label, args) {
  const child = platform() === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", `${npmCommand} ${args.join(" ")}`], {
        cwd: process.cwd(),
        stdio: "inherit",
        env: process.env,
      })
    : spawn(npmCommand, args, {
        cwd: process.cwd(),
        stdio: "inherit",
        env: process.env,
      });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `senal ${signal}` : `codigo ${code ?? 0}`;
    console.log(`\n[${label}] termino con ${reason}. Cerrando el resto del stack...`);
    void shutdown(code ?? 0);
  });

  child.on("error", (error) => {
    if (shuttingDown) {
      return;
    }

    console.error(`\n[${label}] no pudo iniciar:`, error);
    void shutdown(1);
  });

  children.push(child);
  console.log(`[dev-stack] ${label} iniciado (PID ${child.pid ?? "n/d"})`);
}

function terminateChild(child) {
  return new Promise((resolve) => {
    if (!child.pid) {
      resolve();
      return;
    }

    if (platform() === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
      return;
    }

    child.kill("SIGTERM");
    resolve();
  });
}

async function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await Promise.all(children.map((child) => terminateChild(child)));
  await stopLocalDevListeners({
    label: "dev-stack/shutdown",
  });
  process.exit(exitCode);
}

process.on("SIGINT", () => {
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});

await stopLocalDevListeners({
  label: "dev-stack",
});

await ensureRequiredPortsAvailable();

console.log(`Levantando stack local: Next (${DEFAULT_BACKEND_PORT}) + viewer React (${DEFAULT_VIEWER_PORT})`);
run("next", ["run", "dev", "--", "--port", String(DEFAULT_BACKEND_PORT)]);

const nextProbeUrl = `http://127.0.0.1:${DEFAULT_BACKEND_PORT}/admin?no_react_bridge=1&__dev_stack_probe=1`;
const nextIsHealthy = await waitForLoopbackUrl(nextProbeUrl, 20000);

if (!nextIsHealthy) {
  console.error(`[dev-stack] Next no confirmo la ruta de smoke esperada en ${nextProbeUrl}. Se aborta para evitar mismatch de instancia.`);
  clearNextCache();
  console.error("[dev-stack] Se limpio .next porque el preflight de Next fallo.");
  await shutdown(1);
} else {
  console.log(`[dev-stack] Next verificado en puerto ${DEFAULT_BACKEND_PORT} (ruta /admin disponible).`);
  console.log(`[dev-stack] Iniciando React viewer en puerto ${DEFAULT_VIEWER_PORT} despues de validar el backend.`);
  run("react-viewer", ["run", "frontend:dev"]);
}
