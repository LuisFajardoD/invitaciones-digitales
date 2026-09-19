"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventIntakeFormRecord, EventIntakeStatus } from "@/types/intake";
import styles from "./EventIntake.module.css";

type IntakeAdminListProps = {
  forms: EventIntakeFormRecord[];
};

const statusLabels: Record<EventIntakeStatus, string> = {
  new: "Nuevo (Sin revisar)",
  reviewed: "Revisado",
  in_progress: "En proceso",
  done: "Completado",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Pendiente de envío por el cliente";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

export function IntakeAdminList({ forms }: IntakeAdminListProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreate() {
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/intakes", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        form?: EventIntakeFormRecord;
      };
      if (!response.ok || !payload.form) {
        throw new Error(payload.error || "No se pudo crear el formulario.");
      }

      router.push(`/admin/intakes/${payload.form.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el formulario.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(token: string) {
    const url = `${window.location.origin}/brief/${token}`;
    try {
      await copyToClipboard(url);
      setMessage("¡Link del formulario copiado al portapapeles!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("No se pudo copiar el link.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Informative Explanation Header */}
      <div
        className="admin-subpanel"
        style={{
          padding: "20px 24px",
          borderRadius: "20px",
          borderColor: "rgba(124, 58, 237, 0.35)",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(15, 13, 30, 0.85))",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "14px",
            background: "rgba(124, 58, 237, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c4b5fd",
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: "1.05rem", color: "#ffffff", display: "block", marginBottom: "4px" }}>
            ¿Qué son los Formularios de Datos de Clientes?
          </strong>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255, 255, 255, 0.7)", lineHeight: "1.5" }}>
            Son enlaces privados que envías a tus clientes por WhatsApp para que ellos mismos llenen la información de su evento (nombres de los festejados, fechas, salón, código de vestimenta, itinerario, fotos y enlaces de música). Una vez que el cliente responde, puedes revisar sus respuestas aquí y crear su invitación en 1 clic.
          </p>
        </div>
        <button
          type="button"
          className="gloobi-crm-btn-primary"
          onClick={() => void handleCreate()}
          disabled={creating}
          style={{ whiteSpace: "nowrap" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{creating ? "Creando..." : "Nuevo Formulario"}</span>
        </button>
      </div>

      {message ? (
        <div className={styles["intake-success"]} style={{ padding: "12px 18px", borderRadius: "12px" }}>
          {message}
        </div>
      ) : null}

      {/* List of Intake Forms */}
      <div style={{ display: "grid", gap: "16px" }}>
        {forms.length ? (
          forms.map((form) => (
            <div
              key={form.id}
              className="admin-subpanel"
              style={{
                padding: "20px 24px",
                borderRadius: "20px",
                background: "linear-gradient(145deg, rgba(24, 22, 48, 0.8), rgba(14, 12, 30, 0.95))",
                borderColor: "rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#ffffff", fontWeight: 700 }}>
                    {form.event_data.celebrant_name || "Formulario de Cliente sin Título"}
                  </h3>
                  <span
                    className={`status-pill ${form.status === "done" ? "published" : "draft"}`}
                    style={{ fontSize: "0.72rem", padding: "3px 10px" }}
                  >
                    {statusLabels[form.status]}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--admin-text-soft)" }}>
                  Cliente: <strong style={{ color: "#ffffff" }}>{form.client_name || "Pendiente"}</strong> · Fecha Evento: {form.event_data.event_date || "Sin definir"}
                </p>
                <small style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>
                  Envío: {formatDate(form.submitted_at)}
                </small>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <Link
                  className="button-secondary"
                  href={`/brief/${form.token}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ gap: "6px" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>Vista Previa Formulario</span>
                </Link>

                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => void handleCopy(form.token)}
                  style={{ gap: "6px" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copiar Enlace WhatsApp</span>
                </button>

                <Link
                  className="button-primary"
                  href={`/admin/intakes/${form.id}`}
                  style={{ gap: "6px" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Ver Datos del Cliente</span>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div
            className="admin-subpanel"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              borderRadius: "20px",
              borderColor: "rgba(255,255,255,0.12)",
              background: "rgba(15, 13, 30, 0.6)",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.5"
              style={{ marginBottom: "12px" }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3 style={{ color: "#ffffff", margin: "0 0 6px", fontSize: "1.2rem" }}>No hay formularios creados todavía</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 20px", fontSize: "0.9rem" }}>
              Crea tu primer formulario de datos para enviárselo a tu cliente antes de diseñar su invitación.
            </p>
            <button
              type="button"
              className="gloobi-crm-btn-primary"
              onClick={() => void handleCreate()}
              disabled={creating}
            >
              <span>{creating ? "Creando..." : "Crear Primer Formulario"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
