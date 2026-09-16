"use client";

import Link from "next/link";
import { useSiteTheme } from "@/components/admin/use-site-theme";
import styles from "./GloobiNotFound.module.css";

function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4A8.9 8.9 0 1 0 20 14.2Z" />
  ) : (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  );
}

export function GloobiNotFound() {
  const { isDark, themeMode, toggleTheme } = useSiteTheme();

  return (
    <main className={`${styles.page} ${styles[themeMode]}`}>
      <div className={styles.ambient} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <header className={styles.header}>
        <Link href="/" aria-label="Gloobi, volver al inicio">
          <img src="/assets/compartidos/marca/logo-gloobi.svg" alt="Gloobi" width="122" height="48" />
        </Link>
        <button type="button" onClick={toggleTheme} aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><ThemeIcon dark={isDark} /></svg>
        </button>
      </header>

      <section className={styles.card}>
        <div className={styles.glow} aria-hidden="true" />
        <p className={styles.eyebrow}>PÁGINA NO ENCONTRADA</p>
        <div className={styles.code} aria-hidden="true">404</div>
        <h1>Página no encontrada</h1>
        <p className={styles.copy}>Parece que esta página no existe o cambió de lugar.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/">Volver al inicio</Link>
          <Link className={styles.secondary} href="/contact.html#contacto">Contacto</Link>
        </div>
      </section>

      <footer className={styles.footer}>© Copyright Gloobi 2026. Todos los derechos reservados.</footer>
    </main>
  );
}
