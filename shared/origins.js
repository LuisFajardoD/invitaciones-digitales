export var DEFAULT_BACKEND_ORIGIN = "http://localhost:3000";
export var DEFAULT_VIEWER_ORIGIN = "http://localhost:5173";
export var FRONTEND_DEV_PORTS = new Set(["4173", "5173"]);
function normalizeProtocol(protocol) {
    if (!protocol) {
        return "http:";
    }
    return protocol.endsWith(":") ? protocol : "".concat(protocol, ":");
}
function normalizeHostname(hostname) {
    return hostname || "localhost";
}
function trimTrailingSlash(value) {
    return value.replace(/\/+$/, "");
}
export function normalizeOrigin(value) {
    var trimmed = value === null || value === void 0 ? void 0 : value.trim();
    if (!trimmed) {
        return "";
    }
    try {
        return trimTrailingSlash(new URL(trimmed).toString());
    }
    catch (_a) {
        return "";
    }
}
export function buildLoopbackOrigin(locationLike, port) {
    var protocol = normalizeProtocol(locationLike.protocol);
    var hostname = normalizeHostname(locationLike.hostname);
    return "".concat(protocol, "//").concat(hostname, ":").concat(port);
}
export function resolveBackendOrigin(locationLike, configuredOrigin) {
    var configured = normalizeOrigin(configuredOrigin);
    if (configured) {
        return configured;
    }
    if (locationLike.port && FRONTEND_DEV_PORTS.has(locationLike.port)) {
        return buildLoopbackOrigin(locationLike, "3000");
    }
    var currentOrigin = normalizeOrigin(locationLike.origin);
    if (currentOrigin) {
        return currentOrigin;
    }
    return DEFAULT_BACKEND_ORIGIN;
}
export function resolveViewerOrigin(locationLike, configuredOrigin) {
    var configured = normalizeOrigin(configuredOrigin);
    if (configured) {
        return configured;
    }
    if (locationLike.port === "5173") {
        var currentOrigin = normalizeOrigin(locationLike.origin);
        if (currentOrigin) {
            return currentOrigin;
        }
    }
    return buildLoopbackOrigin(locationLike, "5173");
}
