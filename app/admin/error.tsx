"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin route error", error);
  }, [error]);

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <p className="eyebrow">CRM</p>
        <h1>No se pudo cargar el panel</h1>
        <p className="muted">
          Es posible que el navegador tenga archivos antiguos del sitio después de una actualización.
        </p>
        <div className="action-row">
          <button type="button" className="button-primary" onClick={() => window.location.reload()}>
            Recargar CRM
          </button>
          <button type="button" className="button-secondary" onClick={reset}>
            Intentar de nuevo
          </button>
        </div>
      </section>
    </main>
  );
}
