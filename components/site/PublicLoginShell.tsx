import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./PublicLoginShell.module.css";

export function PublicLoginShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles["site-login-root"]}>
      <div className={styles["site-login-backdrop"]} aria-hidden="true" />

      <header className={styles["site-login-header"]}>
        <Link href="/" className={styles["site-login-brand"]}>
          Invitaciones Digitales
        </Link>

        <nav className={styles["site-login-nav"]} aria-label="Navegacion publica">
          <Link href="/examples#demos">Demos</Link>
          <Link href="/examples#paquetes">Paquetes</Link>
          <Link href="/examples#contacto">Contacto</Link>
        </nav>

        <Link href="/" className={styles["site-login-home-link"]}>
          Volver al sitio
        </Link>
      </header>

      <div className={styles["site-login-content"]}>
        <section className={styles["site-login-card"]}>{children}</section>
      </div>
    </main>
  );
}
