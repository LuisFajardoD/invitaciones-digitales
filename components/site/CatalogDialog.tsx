"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./InvitationCatalog.module.css";
export function CatalogDialog({ title, onClose, children, drawer = false }: { title: string; onClose: () => void; children: ReactNode; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const body = document.body;
    const overflow = body.style.overflow;
    const padding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gap}px`;
    ref.current?.showModal();
    return () => { body.style.overflow = overflow; body.style.paddingRight = padding; opener?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`${styles.dialog} ${drawer ? styles.drawer : ""}`} role="dialog" aria-modal="true" aria-label={title}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]')).filter(el => !el.hasAttribute("disabled") && el.getClientRects().length > 0);
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <header className={styles.dialogHeader}><h2>{title}</h2><button autoFocus onClick={onClose} aria-label={drawer ? "Cerrar filtros" : "Cerrar vista previa"}>×</button></header>
    {children}
  </dialog>;
}
