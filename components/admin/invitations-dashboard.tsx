"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvitationRecord } from "@/types/invitations";
import { getDemoDisplayName } from "@/lib/catalog-metadata";
import { formatDateTimeLabel } from "@/lib/utils";
import { AdminShell } from "./admin-shell";
import { ConfirmModal } from "./confirm-modal";
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
  demos?: InvitationRecord[];
};

export function InvitationsDashboard({ invitations, demos = [] }: InvitationsDashboardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDemoId, setSelectedDemoId] = useState<string>("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<InvitationListItem | null>(null);
  const [convertToDemoTarget, setConvertToDemoTarget] = useState<InvitationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);

  const filteredInvitations = useMemo(() => {
    if (!query.trim()) return invitations;
    const q = query.trim().toLowerCase();
    return invitations.filter(
      (item) => item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)
    );
  }, [invitations, query]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2600);
  }

  async function handleCopyLink(slug: string) {
    const url = `${window.location.origin}/i/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link de invitación copiado al portapapeles");
    } catch {
      showToast("No se pudo copiar el link");
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/invitations/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        showToast("Invitación eliminada con éxito");
        router.refresh();
      } else {
        showToast("Error al eliminar la invitación");
      }
    } catch {
      showToast("Error de conexión al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  async function executeConvertToDemo() {
    if (!convertToDemoTarget) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/admin/invitations/${convertToDemoTarget.id}/duplicate?as=demo`, { method: "POST" });
      if (res.ok) {
        setConvertToDemoTarget(null);
        showToast("Copia de Demo creada en la sección Demos");
        router.push("/admin/demos");
      } else {
        showToast("Error al crear la copia como demo");
      }
    } catch {
      showToast("Error de conexión al crear demo");
    } finally {
      setConverting(false);
    }
  }

  const actions = (
    <button
      type="button"
      onClick={() => setShowNewModal(true)}
      className="gloobi-crm-btn-primary"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Nueva Invitación</span>
    </button>
  );

  return (
    <AdminShell
      title="Invitaciones de Clientes"
      description="Administra las invitaciones personalizadas para tus clientes. Puedes crear una invitación nueva en blanco o basarte en un demo maestro sin alterar el catálogo."
      actions={actions}
    >
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar invitación por cliente, título o slug..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className="gloobi-crm-badge-counter">
            <span>{filteredInvitations.length} Invitaciones de Clientes</span>
          </div>
        </div>

        <div className={styles.grid}>
          {filteredInvitations.map((invitation) => {
            const clientLink = `/i/${invitation.slug}/rsvp?token=${invitation.client_view_token}`;
            const isPublished = invitation.status === "published";

            return (
              <div key={invitation.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.badgeClient}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Cliente
                  </span>

                  <span className={isPublished ? styles.badgePublished : styles.badgeDraft}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isPublished ? <polyline points="20 6 9 17 4 12"></polyline> : <circle cx="12" cy="12" r="10"></circle>}
                    </svg>
                    {isPublished ? "Publicada" : "Borrador"}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.title}>{invitation.title || invitation.slug}</h3>
                  <p className={styles.date}>{formatDateTimeLabel(invitation.event_start_at, invitation.timezone)}</p>
                  <p className={styles.slug}>/i/{invitation.slug}</p>
                </div>

                <div className={styles.cardActions}>
                  {/* Primary Edit Button */}
                  <Link
                    href={`/admin/invitations/${invitation.id}`}
                    className={styles.btnEdit}
                    title="Editar la invitación y datos del cliente"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Editar Invitación</span>
                  </Link>

                  {/* Open Public Preview */}
                  <Link
                    href={`/i/${invitation.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btnSecondary}
                    title="Ver invitación en vivo"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>Previa</span>
                  </Link>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(invitation.slug)}
                    className={styles.btnSecondary}
                    title="Copiar enlace público"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span>Copiar Link</span>
                  </button>

                  {/* RSVP Dashboard */}
                  <Link
                    href={`/admin/rsvp/${invitation.id}`}
                    className={styles.btnSecondary}
                    title="Ver panel de confirmaciones RSVP recibidas"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <polyline points="17 11 19 13 23 9"></polyline>
                    </svg>
                    <span>RSVP</span>
                  </Link>

                          {/* Duplicate as Demo */}
                  <button
                    type="button"
                    onClick={() => setConvertToDemoTarget(invitation)}
                    className={styles.btnSecondary}
                    title="Crear una copia de esta invitación como plantilla demo en tu catálogo"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>Guardar como Demo</span>
                  </button>

                  {/* Delete Invitation */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(invitation)}
                    className={styles.btnDanger}
                    title="Eliminar esta invitación de cliente"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredInvitations.length === 0 && (
            <div className={styles.emptyState}>
              <svg className={styles.emptyIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <h3 className={styles.emptyTitle}>No hay invitaciones de clientes activas</h3>
              <p className={styles.emptyDesc}>Crea una nueva invitación seleccionando una de tus plantillas Demos como base o empezando desde cero.</p>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="gloobi-crm-btn-primary"
              >
                Crear Nueva Invitación
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Invitación */}
      {showNewModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowNewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Crear Nueva Invitación para Cliente</h3>
            <p className={styles.modalDesc}>Elige cómo deseas iniciar la invitación para tu cliente. El demo original no sufrirá cambios.</p>

            <div className={styles.modalOptions}>
              {/* Option A: Create from Demo */}
              {demos.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}>
                    Seleccionar Demo Base:
                  </label>
                  <select
                    value={selectedDemoId}
                    onChange={(e) => setSelectedDemoId(e.target.value)}
                    style={{
                      width: "100%",
                      height: "46px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#ffffff",
                      padding: "0 14px",
                      fontSize: "0.9rem",
                      marginBottom: "12px"
                    }}
                  >
                    <option value="" style={{ background: "#141228" }}>-- Selecciona una plantilla demo --</option>
                    {demos.map((d) => (
                      <option key={d.id} value={d.id} style={{ background: "#141228" }}>
                        {getDemoDisplayName(d)} ({d.theme_id})
                      </option>
                    ))}
                  </select>

                  {selectedDemoId && (
                    <Link
                      href={`/admin/invitations/new?fromDemo=${selectedDemoId}`}
                      className={styles.optionCard}
                      style={{ background: "rgba(124, 92, 255, 0.22)", borderColor: "#7c5cff" }}
                    >
                      <div className={styles.optionIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </div>
                      <div className={styles.optionText}>
                        <h4>Continuar con el Demo Seleccionado</h4>
                        <p>Carga los estilos, secciones y diseño del demo elegido sin alterar la plantilla.</p>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              {/* Option B: Blank Invitation */}
              <Link href="/admin/invitations/new" className={styles.optionCard}>
                <div className={styles.optionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <div className={styles.optionText}>
                  <h4>Crear Invitación en Blanco</h4>
                  <p>Inicia con la estructura estándar limpia para configurar cada sección libremente.</p>
                </div>
              </Link>
            </div>

            <button type="button" onClick={() => setShowNewModal(false)} className={styles.modalClose}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget ? `¿Eliminar invitación "${deleteTarget.title}"?` : ""}
        description="Esta invitación de cliente será eliminada permanentemente junto con su enlace y accesos."
        confirmText="Sí, eliminar invitación"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={() => void executeDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Custom Convert to Demo Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(convertToDemoTarget)}
        title={convertToDemoTarget ? `¿Guardar "${convertToDemoTarget.title}" como Demo?` : ""}
        description="Se generará una nueva plantilla demo independiente en tu catálogo basada en el contenido de esta invitación."
        confirmText="Crear plantilla demo"
        cancelText="Cancelar"
        variant="info"
        loading={converting}
        onConfirm={() => void executeConvertToDemo()}
        onCancel={() => setConvertToDemoTarget(null)}
      />

      {/* Toast Notification */}
      <div className={`${styles.toast} ${toastVisible ? styles.toastVisible : ""}`}>
        {toastMessage}
      </div>
    </AdminShell>
  );
}
