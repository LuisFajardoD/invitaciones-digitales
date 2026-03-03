import { execFileSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { platform } from "node:os";
import process from "node:process";

function readPortFromEnv(name, fallback) {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

export const DEFAULT_BACKEND_PORT = readPortFromEnv("DEV_BACKEND_PORT", 3000);
export const DEFAULT_VIEWER_PORT = readPortFromEnv("DEV_VIEWER_PORT", 5173);
export const DEFAULT_FRONTEND_PREVIEW_PORT = readPortFromEnv("DEV_FRONTEND_PREVIEW_PORT", 4173);
export const LOCAL_DEV_PORTS = Array.from(new Set([3000, 3001, 4173, 5173, 5174, DEFAULT_BACKEND_PORT, DEFAULT_VIEWER_PORT, DEFAULT_FRONTEND_PREVIEW_PORT]));

function parseJsonOutput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  const parsed = JSON.parse(trimmed);
  if (Array.isArray(parsed)) {
    return parsed;
  }

  return [parsed];
}

function summarizeCommand(commandLine) {
  return commandLine.replace(/\s+/g, " ").trim();
}

function runPowerShell(script, extraEnv = {}) {
  return execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        ...extraEnv,
      },
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
}

function findWindowsLocalDevListeners(ports, force = false) {
  const script = `
$repoPath = [System.IO.Path]::GetFullPath($env:CODEX_REPO_PATH)
$ports = @($env:CODEX_PORTS.Split(',') | Where-Object { $_ } | ForEach-Object { [int]$_ })
$force = $env:CODEX_FORCE_KILL -eq '1'
$results = @()
$seen = @{}

Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort } |
  Sort-Object LocalPort |
  ForEach-Object {
    $ownerPid = [int]$_.OwningProcess
    $process = Get-CimInstance Win32_Process -Filter ("ProcessId = " + $ownerPid) -ErrorAction SilentlyContinue
    if (-not $process) {
      return
    }

    $commandLine = $process.CommandLine
    if ([string]::IsNullOrWhiteSpace($commandLine)) {
      return
    }

    if ((-not $force) -and $commandLine.IndexOf($repoPath, [System.StringComparison]::OrdinalIgnoreCase) -lt 0) {
      return
    }

    if ($seen.ContainsKey($ownerPid)) {
      $seen[$ownerPid].ports += [int]$_.LocalPort
      return
    }

    $entry = [PSCustomObject]@{
      pid = $ownerPid
      ports = @([int]$_.LocalPort)
      commandLine = $commandLine
    }

    $seen[$ownerPid] = $entry
    $results += $entry
  }

$results | ConvertTo-Json -Compress
`;

  try {
    const raw = runPowerShell(script, {
      CODEX_REPO_PATH: process.cwd(),
      CODEX_PORTS: ports.join(","),
      CODEX_FORCE_KILL: force ? "1" : "0",
    });
    return parseJsonOutput(raw);
  } catch {
    return [];
  }
}

export function findLocalDevListeners(ports = LOCAL_DEV_PORTS, force = false) {
  if (platform() === "win32") {
    return findWindowsLocalDevListeners(ports, force);
  }

  return [];
}

export function clearNextCache() {
  rmSync(".next", { recursive: true, force: true });
}

export function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function waitForLoopbackUrl(url, timeoutMs = 15000) {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    async function probe() {
      try {
        const response = await fetch(url, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-store",
          },
        });

        if (response.ok) {
          await response.body?.cancel();
          resolve(true);
          return;
        }
      } catch {
        // keep polling until timeout
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }

      setTimeout(() => {
        void probe();
      }, 300);
    }

    void probe();
  });
}

export function terminatePidTree(pid) {
  return new Promise((resolve) => {
    if (!pid) {
      resolve();
      return;
    }

    if (platform() === "win32") {
      const killer = spawn("taskkill", ["/pid", String(pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
      return;
    }

    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // ignore missing or already-exited processes
    }
    resolve();
  });
}

export async function stopLocalDevListeners({
  label,
  ports = LOCAL_DEV_PORTS,
  force = false,
} = {}) {
  const listeners = findLocalDevListeners(ports, force).filter((listener) => listener.pid !== process.pid);
  if (!listeners.length) {
    return [];
  }

  const prefix = label ? `[${label}] ` : "";
  const scopeLabel = force ? "Se cerraran en modo force:" : "Solo se cerraran procesos cuyo command line apunta a este repo:";
  console.log(`${prefix}Se detectaron procesos locales del proyecto en puertos de desarrollo. ${scopeLabel}`);
  for (const listener of listeners) {
    console.log(
      `${prefix}- PID ${listener.pid} | puerto(s) ${listener.ports.join(", ")} | ${summarizeCommand(listener.commandLine)}`,
    );
  }

  for (const listener of listeners) {
    await terminatePidTree(listener.pid);
  }

  await delay(400);
  return listeners;
}
