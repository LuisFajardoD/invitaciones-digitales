import { useEffect, useRef, type ReactNode } from "react";

export type AdminAuthState = "checking" | "authenticated" | "unauthenticated";

export function isProtectedAdminMode(mode: string) {
  return mode === "admin-list" || mode === "admin-editor" || mode === "admin-new";
}

export function getSafeAdminRedirectPath(rawPath?: string | null) {
  const candidate = rawPath?.trim() || "";
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/admin/login")) {
    return "/admin/invitations";
  }

  return candidate;
}

export function buildAdminLoginRedirectTarget(path: string) {
  const redirect = getSafeAdminRedirectPath(path);
  return `/admin/login?redirect=${encodeURIComponent(redirect)}`;
}

export function RequireAuth({
  enabled,
  authState,
  redirectPath,
  fallback = null,
  children,
}: {
  enabled: boolean;
  authState: AdminAuthState;
  redirectPath: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || authState !== "unauthenticated") {
      hasRedirectedRef.current = false;
      return;
    }

    if (hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    window.location.replace(buildAdminLoginRedirectTarget(redirectPath));
  }, [authState, enabled, redirectPath]);

  if (!enabled) {
    return <>{children}</>;
  }

  if (authState !== "authenticated") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
