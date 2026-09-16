import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import nextEnv from "@next/env";
import { Client, FTPError } from "basic-ftp";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const backend = (process.env.MEDIA_BACKEND || "local").trim().toLowerCase();
const baseUrl = (process.env.MEDIA_BASE_URL || "/uploads/media").replace(/\/+$/, "");
const token = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const tempDirectory = `gloobi-storage-check-${token}`;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name}.`);
  return value;
}

async function fetchWithRetry(url, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, cache: "no-store" });
      if (response.ok || response.status === 206 || response.status === 404) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1250 * attempt));
  }
  throw lastError;
}

async function checkPublicFiles() {
  if (!baseUrl.startsWith("http")) {
    console.log("HTTP_PUBLIC_CHECK=SKIPPED_LOCAL_URL");
    return;
  }
  const pngUrl = `${baseUrl}/${tempDirectory}/probe.png`;
  const pdfUrl = `${baseUrl}/${tempDirectory}/probe.pdf`;
  const videoUrl = `${baseUrl}/${tempDirectory}/probe.webm`;
  const png = await fetchWithRetry(pngUrl);
  const pdf = await fetchWithRetry(pdfUrl);
  const range = await fetchWithRetry(videoUrl, { headers: { Range: "bytes=0-3" } });
  console.log(`PUBLIC_PNG_STATUS=${png.status}`);
  console.log(`PUBLIC_PDF_STATUS=${pdf.status}`);
  console.log(`PUBLIC_PDF_CONTENT_TYPE=${pdf.headers.get("content-type") || ""}`);
  console.log(`PUBLIC_RANGE_STATUS=${range.status}`);
  console.log(`PUBLIC_RANGE_HEADER=${range.headers.get("content-range") || ""}`);
  if (png.status !== 200 || pdf.status !== 200 || pdf.headers.get("content-type")?.split(";")[0] !== "application/pdf" || range.status !== 206 || !range.headers.get("content-range")) {
    throw new Error("La publicación HTTP no devolvió los estados, MIME o Range esperados.");
  }
}

async function checkLocal() {
  const root = process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), "public", "uploads", "media");
  const target = path.join(root, tempDirectory);
  try {
    await mkdir(target, { recursive: true });
    const payload = Buffer.from("gloobi-media-storage-check", "utf8");
    await writeFile(path.join(target, "probe.bin"), payload);
    const saved = await readFile(path.join(target, "probe.bin"));
    const info = await stat(path.join(target, "probe.bin"));
    if (!saved.equals(payload) || info.size !== payload.length) throw new Error("La lectura local no coincide con el upload.");
    console.log(`BACKEND=local`);
    console.log(`LOCAL_ROOT=${root}`);
    console.log(`UPLOAD_BYTES=${info.size}`);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
  console.log("CLEANUP=OK");
}

async function checkHostinger() {
  const host = required("MEDIA_FTP_HOST");
  const user = required("MEDIA_FTP_USER");
  const password = required("MEDIA_FTP_PASSWORD");
  const port = Number.parseInt(process.env.MEDIA_FTP_PORT || "21", 10);
  const root = process.env.MEDIA_FTP_ROOT || "/";
  const secure = (process.env.MEDIA_FTP_SECURE || "true").toLowerCase() !== "false";
  if (!secure && process.env.MEDIA_FTP_ALLOW_INSECURE !== "true") throw new Error("FTP sin TLS está bloqueado.");
  const client = new Client(Number.parseInt(process.env.MEDIA_FTP_TIMEOUT_MS || "15000", 10));
  client.ftp.verbose = false;
  let detectedRoot = "";
  let connected = false;
  let temporaryDirectoryCreated = false;
  try {
    await client.access({
      host, port, user, password, secure,
      secureOptions: secure ? {
        rejectUnauthorized: true,
        ...(process.env.MEDIA_FTP_TLS_SERVERNAME ? { servername: process.env.MEDIA_FTP_TLS_SERVERNAME } : {}),
      } : undefined,
    });
    connected = true;
    detectedRoot = await client.pwd();
    const rootEntries = await client.list();
    await client.cd(root);
    await client.ensureDir(tempDirectory);
    temporaryDirectoryCreated = true;
    const payloads = {
      "probe.png": Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
      "probe.pdf": Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF", "utf8"),
      "probe.webm": Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x42, 0x86, 0x81, 0x01]),
    };
    for (const [name, payload] of Object.entries(payloads)) {
      await client.uploadFrom(Readable.from(payload), name);
      const size = await client.size(name);
      if (size !== payload.length) throw new Error(`Tamaño remoto incorrecto para ${name}.`);
    }
    console.log(`REMOTE_PROBE_FILES=${(await client.list()).map((entry) => entry.name).join(",")}`);
    console.log("BACKEND=hostinger");
    console.log(`TLS=${secure ? "STRICT" : "INSECURE_EXPLICIT"}`);
    console.log(`DETECTED_LOGIN_ROOT=${detectedRoot}`);
    console.log(`CONFIGURED_ROOT=${root}`);
    console.log(`ROOT_ENTRY_COUNT=${rootEntries.length}`);
    await checkPublicFiles();
  } finally {
    if (connected && temporaryDirectoryCreated) {
      try {
        await client.cd(root);
        await client.removeDir(tempDirectory);
        console.log("CLEANUP=OK");
      } catch (error) {
        if (!(error instanceof FTPError && error.code === 550)) console.error(`CLEANUP_ERROR=${error instanceof Error ? error.message : "unknown"}`);
      }
    }
    client.close();
  }
}

try {
  if (backend === "local") await checkLocal();
  else if (backend === "hostinger") await checkHostinger();
  else throw new Error("MEDIA_BACKEND debe ser local o hostinger.");
} catch (error) {
  console.error(`MEDIA_CHECK_FAILED=${error instanceof Error ? error.message : "error desconocido"}`);
  process.exitCode = 1;
}
