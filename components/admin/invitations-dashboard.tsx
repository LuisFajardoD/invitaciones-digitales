"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDateTimeLabel } from "@/lib/utils";
import { PublicShell } from "@/components/site/PublicShell";
import styles from "./invitations-dashboard.module.css";

type InvitationListItem = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  event_start_at: string;
  timezone?: string;
  client_view_token: string;
};

type InvitationsDashboardProps = {
  invitations: InvitationListItem[];
};

type ToastState = {
  message: string;
  visible: boolean;
};

function getStatusLabel(status: InvitationListItem["status"]) {
  return status === "published" ? "Publicada" : "Borrador";
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporary = document.createElement("textarea");
  temporary.value = text;
  temporary.setAttribute("readonly", "true");
  temporary.style.position = "absolute";
  temporary.style.left = "-9999px";
  document.body.appendChild(temporary);
  temporary.select();
  document.execCommand("copy");
  document.body.removeChild(temporary);
}

export function InvitationsDashboard({ invitations }: InvitationsDashboardProps) {
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });

  const filteredInvitations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return invitations;
    }

    return invitations.filter((item) => {
      return item.title.toLowerCase().includes(normalized) || item.slug.toLowerCase().includes(normalized);
    });
  }, [invitations, query]);

  useEffect(() => {
    if (!toast.visible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((previous) => ({ ...previous, visible: false }));
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast.visible]);

  async function handleCopyLink(slug: string) {
    const url = `${window.location.origin}/i/${slug}`;
    try {
      await copyToClipboard(url);
      setToast({
        message: "Link copiado",
        visible: true,
      });
    } catch {
      setToast({
        message: "No se pudo copiar el link",
        visible: true,
      });
    }
  }

  return (
    <PublicShell showSiteLink>
      <div className={styles["admin-layout"]}>
        <header className={styles["admin-topbar"]}>
          <div className={styles["admin-topbar-title"]}>
            <p className={styles["admin-topbar-kicker"]}>CRM</p>
            <h1>Invitaciones</h1>
          </div>

          <label className={styles["admin-search"]}>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título o slug..."
              aria-label="Buscar por título o slug"
            />
          </label>

          <div className={styles["admin-topbar-actions"]}>
            <Link href="/admin/invitations/new" className={`${styles["admin-button"]} ${styles["admin-button-primary"]}`}>
              Nueva invitación
            </Link>
          </div>
        </header>

        <section className={styles["admin-list"]}>
          {filteredInvitations.length ? (
            filteredInvitations.map((invitation) => {
              const clientLink = `/i/${invitation.slug}/rsvp?token=${invitation.client_view_token}`;
              return (
                <article key={invitation.id} className={styles["admin-card"]}>
                  <div className={styles["admin-card-head"]}>
                    <div>
                      <h2>{invitation.title}</h2>
                      <p>{formatDateTimeLabel(invitation.event_start_at, invitation.timezone)}</p>
                      <p className={styles["admin-slug"]}>/{invitation.slug}</p>
                    </div>
                    <span className={`status-pill ${invitation.status}`}>{getStatusLabel(invitation.status)}</span>
                  </div>

                  <div className={styles["admin-card-actions"]}>
                    <a
                      href={`/i/${invitation.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`${styles["admin-button"]} ${styles["admin-button-secondary"]} ${styles["admin-button-compact"]}`}
                    >
                      Abrir
                    </a>
                    <Link
                      href={`/admin/invitations/${invitation.id}`}
                      className={`${styles["admin-button"]} ${styles["admin-button-secondary"]} ${styles["admin-button-compact"]}`}
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      className={`${styles["admin-button"]} ${styles["admin-button-secondary"]} ${styles["admin-button-compact"]}`}
                      onClick={() => void handleCopyLink(invitation.slug)}
                    >
                      Link
                    </button>

                    <details className={styles["admin-more"]}>
                      <summary aria-label="Más acciones">...</summary>
                      <div className={styles["admin-more-menu"]}>
                        <Link href={`/admin/rsvp/${invitation.id}`}>RSVP</Link>
                        <a href={clientLink} target="_blank" rel="noreferrer">
                          Link cliente
                        </a>
                        <form action={`/api/admin/invitations/${invitation.id}/duplicate`} method="post">
                          <button type="submit">Duplicar</button>
                        </form>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })
          ) : (
            <div className={styles["admin-empty"]}>No se encontraron invitaciones</div>
          )}
        </section>
      </div>

      <div className={`${styles["admin-toast"]} ${toast.visible ? styles["admin-toast--visible"] : ""}`}>
        {toast.message}
      </div>
    </PublicShell>
  );
}
