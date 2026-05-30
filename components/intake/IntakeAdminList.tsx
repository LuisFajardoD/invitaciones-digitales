"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventIntakeFormRecord, EventIntakeStatus } from "@/types/intake";
import styles from "./EventIntake.module.css";
import { IntakeThemeShell } from "./IntakeThemeShell";

type IntakeAdminListProps = {
  forms: EventIntakeFormRecord[];
};

const statusLabels: Record<EventIntakeStatus, string> = {
  new: "Nuevo",
  reviewed: "Revisado",
  in_progress: "En proceso",
  done: "Terminado",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin enviar";
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
      setMessage("Link copiado.");
    } catch {
      setMessage("No se pudo copiar el link.");
    }
  }

  return (
    <IntakeThemeShell>
      <div className={styles["intake-container"]}>
        <header className={styles["intake-header"]}>
          <p className={styles["intake-kicker"]}>CRM</p>
          <h1>Formularios de información</h1>
          <p>Crea enlaces privados para que tus clientes envíen los datos del evento.</p>
          <div className={styles["intake-actions"]}>
            <Link className={styles["intake-button"]} href="/admin/invitations">
              Volver a invitaciones
            </Link>
            <button className={`${styles["intake-button"]} ${styles["intake-button-primary"]}`} type="button" onClick={() => void handleCreate()} disabled={creating}>
              {creating ? "Creando..." : "Nuevo formulario"}
            </button>
          </div>
          {message ? <p className={styles["intake-success"]}>{message}</p> : null}
        </header>

        <section className={styles["admin-list"]}>
          {forms.length ? (
            forms.map((form) => (
              <article key={form.id} className={styles["admin-row"]}>
                <div>
                  <h2>{form.event_data.celebrant_name || "Formulario sin nombre"}</h2>
                  <p>{form.event_data.event_date || "Sin fecha"} · {form.client_name || "Sin contacto"}</p>
                  <p>Estado: {statusLabels[form.status]} · Enviado: {formatDate(form.submitted_at)}</p>
                </div>
                <div className={styles["admin-row-actions"]}>
                  <Link className={`${styles["intake-button"]} ${styles["intake-button-primary"]}`} href={`/brief/${form.token}`} target="_blank" rel="noreferrer">
                    Abrir formulario
                  </Link>
                  <button className={styles["intake-button"]} type="button" onClick={() => void handleCopy(form.token)}>
                    Copiar link
                  </button>
                  <Link className={styles["intake-button"]} href={`/admin/intakes/${form.id}`}>
                    Ver resumen
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <section className={styles["intake-summary-card"]}>
              <h2>No hay formularios todavía</h2>
              <p>Crea el primero y comparte el enlace con tu cliente por WhatsApp.</p>
            </section>
          )}
        </section>
      </div>
    </IntakeThemeShell>
  );
}
