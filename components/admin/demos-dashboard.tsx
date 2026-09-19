"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDemoDisplayName } from "@/lib/catalog-metadata";
import { InvitationRecord } from "@/types/invitations";
import { AdminShell } from "./admin-shell";
import { NewDemoForm } from "./new-demo-form";
import { ConfirmModal } from "./confirm-modal";
import styles from "./demos-dashboard.module.css";

type DemosDashboardProps = {
  initialDemos: InvitationRecord[];
};

export function DemosDashboard({ initialDemos }: DemosDashboardProps) {
  const router = useRouter();
  const [demos, setDemos] = useState<InvitationRecord[]>(initialDemos);
  const [query, setQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }

  const filteredDemos = demos.filter((demo) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      getDemoDisplayName(demo).toLowerCase().includes(q) ||
      demo.sections.hero.title.toLowerCase().includes(q) ||
      demo.slug.toLowerCase().includes(q) ||
      demo.theme_id.toLowerCase().includes(q)
    );
  });

  async function executeDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/invitations/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDemos((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        showToast("Plantilla demo eliminada con éxito");
      } else {
        showToast("Error al eliminar la plantilla demo");
      }
    } catch {
      showToast("Error de conexión al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  async function executeDuplicate() {
    if (!duplicateTarget) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/admin/invitations/${duplicateTarget.id}/duplicate?as=demo`, { method: "POST" });
      if (res.ok) {
        const payload = (await res.json()) as { id: string };
        setDuplicateTarget(null);
        router.push(`/admin/demos/${payload.id}`);
      } else {
        showToast("Error al duplicar el demo");
      }
    } catch {
      showToast("Error de conexión al duplicar");
    } finally {
      setDuplicating(false);
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
      <span>Nuevo demo</span>
    </button>
  );

  return (
    <AdminShell
      title="Demos y Plantillas Maestras"
      description="Gestiona las plantillas base del catálogo. Editar un demo mantiene intactas las invitaciones de los clientes. Al crear una invitación a partir de un demo, se genera una copia independiente."
      actions={actions}
    >
      <div className={styles.container}>
        {toastVisible && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              zIndex: 300,
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.9))",
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: "14px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              fontWeight: 600,
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backdropFilter: "blur(8px)",
              animation: "fadeIn 0.22s ease-out",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        <div className={styles.topBar}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar demo por título, slug o tema..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className="gloobi-crm-badge-counter">
            <span>{filteredDemos.length} Plantillas Demos</span>
          </div>
        </div>

        <div className={styles.grid}>
          {filteredDemos.map((demo) => (
            <div key={demo.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.badgeDemo}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  Demo Catálogo
                </span>

                <span className={styles.badgePublished}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {demo.status === "published" ? "Activa en Sitio" : "Borrador"}
                </span>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.title}>{getDemoDisplayName(demo)}</h3>
                <p className={styles.slug}>/i/{demo.slug}</p>

                <div className={styles.metaRow}>
                  <span>Tema: <strong>{demo.theme_id}</strong></span>
                  <span>•</span>
                  <span>Perfil: <strong>{demo.animation_profile}</strong></span>
                </div>
              </div>

              <div className={styles.cardActions}>
                {/* Main Action: Create client invitation from this Demo */}
                <Link
                  href={`/admin/invitations/new?fromDemo=${demo.id}`}
                  className={styles.btnPrimary}
                  title="Crear una nueva invitación para un cliente usando este demo como plantilla base"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>Crear Invitación desde este Demo</span>
                </Link>

                {/* Edit Demo */}
                <Link
                  href={`/admin/demos/${demo.id}`}
                  className={styles.btnSecondary}
                  title="Editar la plantilla demo base"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Editar Demo</span>
                </Link>

                {/* View Preview */}
                <Link
                  href={`/i/${demo.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnSecondary}
                  title="Ver demo en vivo en navegador"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Previa</span>
                </Link>

                {/* Duplicate Demo */}
                <button
                  type="button"
                  onClick={() => setDuplicateTarget({ id: demo.id, title: getDemoDisplayName(demo) })}
                  className={styles.btnSecondary}
                  title="Duplicar esta plantilla demo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Duplicar</span>
                </button>

                {/* Delete Demo */}
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: demo.id, title: getDemoDisplayName(demo) })}
                  className={styles.btnDanger}
                  title="Eliminar esta plantilla demo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ))}

          {filteredDemos.length === 0 && (
            <div className={styles.emptyState}>
              <svg className={styles.emptyIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <h3 className={styles.emptyTitle}>No se encontraron plantillas Demos</h3>
              <p className={styles.emptyDesc}>Crea tu primer demo para alimentar el catálogo público y usarlo como plantilla inicial para las invitaciones de tus clientes.</p>
              <button type="button" onClick={() => setShowNewModal(true)} className="gloobi-crm-btn-primary">
                Crear Nuevo Demo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Demo Modal */}
      {showNewModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 180,
            display: "grid",
            placeItems: "center",
            padding: "16px",
            background: "rgba(8, 10, 16, 0.75)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowNewModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(680px, 100%)" }}>
            <NewDemoForm onCancel={() => setShowNewModal(false)} isModal />
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget ? `¿Eliminar plantilla "${deleteTarget.title}"?` : ""}
        description="Esta plantilla demo dejará de estar disponible en tu catálogo público. Las invitaciones de clientes existentes basadas en ella seguirán funcionando sin problemas."
        confirmText="Sí, eliminar demo"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={() => void executeDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Custom Duplicate Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(duplicateTarget)}
        title={duplicateTarget ? `¿Duplicar plantilla "${duplicateTarget.title}"?` : ""}
        description="Se creará una nueva copia independiente de esta plantilla demo en tu catálogo con los mismos contenidos y configuración."
        confirmText="Duplicar demo"
        cancelText="Cancelar"
        variant="info"
        loading={duplicating}
        onConfirm={() => void executeDuplicate()}
        onCancel={() => setDuplicateTarget(null)}
      />
    </AdminShell>
  );
}
