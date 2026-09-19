"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type NewDemoFormProps = {
  onCancel?: () => void;
  isModal?: boolean;
};

export function NewDemoForm({ onCancel, isModal = false }: NewDemoFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug }),
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "No se pudo crear el demo.");
      router.push(`/admin/demos/${result.id}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear el demo.");
    } finally {
      setBusy(false);
    }
  }

  const generatedSlugPreview = slug.trim()
    ? `demo-${slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^demo-/, "")}`
    : "demo-mision-espacial";

  return (
    <div
      style={{
        maxWidth: "680px",
        margin: isModal ? "0" : "32px auto 0",
        padding: "32px",
        borderRadius: "24px",
        border: "1px solid rgba(139, 92, 246, 0.35)",
        background:
          "linear-gradient(160deg, rgba(139, 92, 246, 0.14), rgba(255, 255, 255, 0.02) 40%, rgba(15, 18, 30, 0.92))",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(99, 102, 241, 0.25))",
            border: "1px solid rgba(139, 92, 246, 0.5)",
            boxShadow: "0 0 24px rgba(139, 92, 246, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a78bfa" }}>
            Catálogo Demos
          </span>
          <h2 style={{ margin: "2px 0 0", fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            Crear Nuevo Demo
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "var(--admin-text-soft)" }}>
            Ingresa la temática y el slug. El demo iniciará en borrador para que luego edites su contenido.
          </p>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gap: "18px", marginTop: "20px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 600, color: "var(--admin-text-soft)", marginBottom: "8px" }}>
            Título del demo
          </label>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slug) {
                setSlug(
                  event.target.value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^demo-/, "")
                );
              }
            }}
            placeholder="Ej. Misión Espacial, Boda Real, XV Años Neón..."
            required
            style={{
              width: "100%",
              minHeight: "48px",
              padding: "0 16px",
              borderRadius: "12px",
              border: "1px solid var(--admin-border)",
              background: "rgba(0, 0, 0, 0.35)",
              color: "var(--admin-text)",
              fontSize: "0.94rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 600, color: "var(--admin-text-soft)", marginBottom: "8px" }}>
            Slug del demo
          </label>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="mision-espacial"
            required
            style={{
              width: "100%",
              minHeight: "48px",
              padding: "0 16px",
              borderRadius: "12px",
              border: "1px solid var(--admin-border)",
              background: "rgba(0, 0, 0, 0.35)",
              color: "var(--admin-text)",
              fontSize: "0.94rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "14px",
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <div style={{ minWidth: 0, fontSize: "0.84rem" }}>
            <span style={{ color: "var(--admin-text-soft)", display: "block", fontSize: "0.76rem" }}>URL asignada en el catálogo:</span>
            <code style={{ color: "#c4b5fd", fontWeight: 600, wordBreak: "break-all" }}>/i/{generatedSlugPreview}</code>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              style={{
                minHeight: "46px",
                borderRadius: "12px",
                border: "1px solid var(--admin-border)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--admin-text)",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Cancelar
            </button>
          ) : (
            <Link
              href="/admin/demos"
              style={{
                minHeight: "46px",
                borderRadius: "12px",
                border: "1px solid var(--admin-border)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--admin-text)",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              Cancelar
            </Link>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              minHeight: "46px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.9rem",
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
              cursor: busy ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <span>Creando demo...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Crear demo y abrir editor</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="error-text" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
