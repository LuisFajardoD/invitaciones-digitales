export const DEFAULT_BACKEND_ORIGIN = "http://localhost:3000";
export const DEFAULT_VIEWER_ORIGIN = "http://localhost:5173";
export const FRONTEND_DEV_PORTS = new Set(["4173", "5173"]);

type BrowserLocationLike = {
  protocol?: string;
  hostname?: string;
  origin?: string;
  port?: string;
};

function normalizeProtocol(protocol?: string) {
  if (!protocol) {
    return "http:";
  }

  return protocol.endsWith(":") ? protocol : `${protocol}:`;
}

function normalizeHostname(hostname?: string) {
  return hostname || "localhost";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function normalizeOrigin(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  try {
    return trimTrailingSlash(new URL(trimmed).toString());
  } catch {
    return "";
  }
}

export function buildLoopbackOrigin(locationLike: BrowserLocationLike, port: string) {
  const protocol = normalizeProtocol(locationLike.protocol);
  const hostname = normalizeHostname(locationLike.hostname);
  return `${protocol}//${hostname}:${port}`;
}

export function resolveBackendOrigin(locationLike: BrowserLocationLike, configuredOrigin?: string | null) {
  const configured = normalizeOrigin(configuredOrigin);
  if (configured) {
    return configured;
  }

  if (locationLike.port && FRONTEND_DEV_PORTS.has(locationLike.port)) {
    return buildLoopbackOrigin(locationLike, "3000");
  }

  const currentOrigin = normalizeOrigin(locationLike.origin);
  if (currentOrigin) {
    return currentOrigin;
  }

  return DEFAULT_BACKEND_ORIGIN;
}

export function resolveViewerOrigin(locationLike: BrowserLocationLike, configuredOrigin?: string | null) {
  const configured = normalizeOrigin(configuredOrigin);
  if (configured) {
    return configured;
  }

  if (locationLike.port === "5173") {
    const currentOrigin = normalizeOrigin(locationLike.origin);
    if (currentOrigin) {
      return currentOrigin;
    }
  }

  return buildLoopbackOrigin(locationLike, "5173");
}
