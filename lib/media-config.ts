import path from "node:path";

const LOCAL_PUBLIC_PATH = "/uploads/media";

export type MediaBackend = "local" | "hostinger";

export interface MediaStorageConfig {
  backend: MediaBackend;
  baseUrl: string;
  storageRoot: string;
  isLocalFallback: boolean;
  ftp?: {
    host: string;
    port: number;
    user: string;
    password: string;
    root: string;
    secure: boolean;
    tlsServername?: string;
    timeoutMs: number;
    retries: number;
  };
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function parsePositiveInteger(value: string | undefined, fallback: number, name: string) {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} debe ser un entero positivo.`);
  return parsed;
}

function normalizeFtpRoot(value: string | undefined) {
  const root = (value?.trim() || "/").replace(/\\/g, "/");
  if (!root.startsWith("/") || root.includes("..")) throw new Error("MEDIA_FTP_ROOT debe ser una ruta absoluta segura.");
  return root === "/" ? root : `/${root.replace(/^\/+|\/+$/g, "")}`;
}

export function getMediaStorageConfig(): MediaStorageConfig {
  const configuredBackend = process.env.MEDIA_BACKEND?.trim().toLowerCase() || "local";
  if (!(["local", "hostinger"] as const).includes(configuredBackend as MediaBackend)) {
    throw new Error("MEDIA_BACKEND debe ser local o hostinger.");
  }
  const backend = configuredBackend as MediaBackend;
  const configuredPath = process.env.MEDIA_STORAGE_PATH?.trim();
  const configuredBaseUrl = process.env.MEDIA_BASE_URL?.trim();

  if (backend === "local" && process.env.NODE_ENV === "production" && (!configuredPath || !configuredBaseUrl)) {
    throw new Error("Configura MEDIA_STORAGE_PATH y MEDIA_BASE_URL para guardar multimedia persistente en producción.");
  }

  if (backend === "hostinger") {
    const host = process.env.MEDIA_FTP_HOST?.trim();
    const user = process.env.MEDIA_FTP_USER?.trim();
    const password = process.env.MEDIA_FTP_PASSWORD;
    if (!configuredBaseUrl) throw new Error("Configura MEDIA_BASE_URL para el almacenamiento Hostinger.");
    if (!host || !user || !password) {
      throw new Error("Configura MEDIA_FTP_HOST, MEDIA_FTP_USER y MEDIA_FTP_PASSWORD en el servidor.");
    }
    const secureValue = process.env.MEDIA_FTP_SECURE?.trim().toLowerCase();
    if (secureValue && !["true", "false"].includes(secureValue)) throw new Error("MEDIA_FTP_SECURE debe ser true o false.");
    const secure = secureValue !== "false";
    if (!secure && process.env.MEDIA_FTP_ALLOW_INSECURE !== "true") {
      throw new Error("FTP sin TLS está bloqueado. Usa FTPS o define MEDIA_FTP_ALLOW_INSECURE=true de forma deliberada.");
    }
    return {
      backend,
      baseUrl: trimTrailingSlash(configuredBaseUrl),
      storageRoot: "",
      isLocalFallback: false,
      ftp: {
        host,
        port: parsePositiveInteger(process.env.MEDIA_FTP_PORT, 21, "MEDIA_FTP_PORT"),
        user,
        password,
        root: normalizeFtpRoot(process.env.MEDIA_FTP_ROOT),
        secure,
        tlsServername: process.env.MEDIA_FTP_TLS_SERVERNAME?.trim() || undefined,
        timeoutMs: parsePositiveInteger(process.env.MEDIA_FTP_TIMEOUT_MS, 15_000, "MEDIA_FTP_TIMEOUT_MS"),
        retries: Math.min(parsePositiveInteger(process.env.MEDIA_FTP_RETRIES, 2, "MEDIA_FTP_RETRIES"), 3),
      },
    };
  }

  return {
    backend,
    storageRoot: configuredPath || path.join(process.cwd(), "public", "uploads", "media"),
    baseUrl: trimTrailingSlash(configuredBaseUrl || LOCAL_PUBLIC_PATH),
    isLocalFallback: !configuredPath && !configuredBaseUrl,
  };
}

export function buildMediaUrl(publicPath: string) {
  const { baseUrl } = getMediaStorageConfig();
  return `${baseUrl}/${publicPath.replace(/^\/+/, "")}`;
}
