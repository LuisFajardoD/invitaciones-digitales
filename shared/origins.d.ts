export declare const DEFAULT_BACKEND_ORIGIN = "http://localhost:3000";
export declare const DEFAULT_VIEWER_ORIGIN = "http://localhost:5173";
export declare const FRONTEND_DEV_PORTS: Set<string>;
type BrowserLocationLike = {
    protocol?: string;
    hostname?: string;
    origin?: string;
    port?: string;
};
export declare function normalizeOrigin(value?: string | null): string;
export declare function buildLoopbackOrigin(locationLike: BrowserLocationLike, port: string): string;
export declare function resolveBackendOrigin(locationLike: BrowserLocationLike, configuredOrigin?: string | null): string;
export declare function resolveViewerOrigin(locationLike: BrowserLocationLike, configuredOrigin?: string | null): string;
export {};
