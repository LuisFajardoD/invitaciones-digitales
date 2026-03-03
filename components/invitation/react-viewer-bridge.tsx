"use client";

import { useEffect, useState, type ReactNode } from "react";
import { resolveViewerOrigin } from "@/shared/origins";

function isLikelyLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.16.") ||
    hostname.startsWith("172.17.") ||
    hostname.startsWith("172.18.") ||
    hostname.startsWith("172.19.") ||
    hostname.startsWith("172.2") ||
    hostname.startsWith("172.30.") ||
    hostname.startsWith("172.31.")
  );
}

type ReactViewerBridgeProps = {
  path: string;
  title: string;
  children: ReactNode;
};

export function ReactViewerBridge({ path, title, children }: ReactViewerBridgeProps) {
  const [state, setState] = useState<"checking" | "redirecting" | "unavailable">("checking");

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("no_react_bridge") === "1") {
      setState("unavailable");
      return;
    }

    const { protocol, hostname } = window.location;
    if (!isLikelyLocalHost(hostname)) {
      setState("unavailable");
      return;
    }

    const origin = resolveViewerOrigin(window.location, process.env.NEXT_PUBLIC_VIEWER_ORIGIN);
    if (!origin || origin === window.location.origin) {
      setState("unavailable");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 1400);

    async function probeViewer() {
      setState("checking");

      try {
        await fetch(`${origin}/`, {
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        });

        if (cancelled) {
          return;
        }

        setState("redirecting");
        window.location.replace(`${origin}${path}`);
      } catch {
        if (cancelled) {
          return;
        }

        setState("unavailable");
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    void probeViewer();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [path]);

  if (state === "checking" || state === "redirecting") {
    return (
      <div
        style={{
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
        }}
      >
        <div
          className="status-card"
          style={{
            width: "min(100%, 520px)",
            textAlign: "center",
          }}
        >
          <p className="eyebrow">React viewer</p>
          <h1 style={{ marginTop: 12 }}>
            {state === "redirecting" ? "Abriendo viewer React..." : "Cargando interfaz local..."}
          </h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            Si el viewer React esta disponible en el origen configurado, esta ruta se movera automaticamente a esa interfaz.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
