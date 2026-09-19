"use client";

import React from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        display: "grid",
        placeItems: "center",
        padding: "16px",
        background: "rgba(8, 10, 16, 0.75)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "28px",
          borderRadius: "24px",
          border: isDanger ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(139, 92, 246, 0.4)",
          background: isDanger
            ? "linear-gradient(160deg, rgba(239, 68, 68, 0.12), rgba(255, 255, 255, 0.02) 40%, rgba(15, 18, 30, 0.95))"
            : "linear-gradient(160deg, rgba(139, 92, 246, 0.12), rgba(255, 255, 255, 0.02) 40%, rgba(15, 18, 30, 0.95))",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: isDanger
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(225, 29, 72, 0.25))"
                : "linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(99, 102, 241, 0.25))",
              border: isDanger ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(139, 92, 246, 0.5)",
              boxShadow: isDanger ? "0 0 24px rgba(239, 68, 68, 0.35)" : "0 0 24px rgba(139, 92, 246, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isDanger ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            )}
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isDanger ? "#fca5a5" : "#a78bfa" }}>
              {isDanger ? "Confirmar eliminación" : "Confirmar acción"}
            </span>
            <h3 style={{ margin: "2px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
              {title}
            </h3>
            <p style={{ margin: "6px 0 0", fontSize: "0.86rem", color: "var(--admin-text-soft)", lineHeight: 1.45 }}>
              {description}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              minHeight: "44px",
              borderRadius: "12px",
              border: "1px solid var(--admin-border)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--admin-text)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              minHeight: "44px",
              borderRadius: "12px",
              border: "none",
              background: isDanger
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.88rem",
              boxShadow: isDanger ? "0 4px 20px rgba(239, 68, 68, 0.4)" : "0 4px 20px rgba(139, 92, 246, 0.4)",
              cursor: loading ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
