"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSiteTheme } from "@/components/admin/use-site-theme";
import styles from "./PublicShell.module.css";

type PublicShellProps = {
  children: ReactNode;
  showLogout?: boolean;
  showSiteLink?: boolean;
  centered?: boolean;
};

function ThemeIcon({ mode }: { mode: "dark" | "light" }) {
  if (mode === "dark") {
    return (
      <svg viewBox="0 0 24 24" className={styles["site-shell-icon"]} aria-hidden="true">
        <path
          d="M20 14.2A8.4 8.4 0 0 1 9.8 4A8.9 8.9 0 1 0 20 14.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={styles["site-shell-icon"]} aria-hidden="true">
      <path
        d="M12 4.5V2m0 20v-2.5m7.5-7.5H22m-20 0h2.5m12.8 5.3 1.8 1.8m-13-13 1.8 1.8m11.2 0 1.8-1.8m-13 13 1.8-1.8M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles["site-shell-icon"]} aria-hidden="true">
      <path
        d="M12 5.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm0 5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Zm0 5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PublicShell({
  children,
  showLogout = true,
  showSiteLink = false,
  centered = false,
}: PublicShellProps) {
  const router = useRouter();
  const { isDark, themeMode, toggleTheme } = useSiteTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleWindowClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("click", handleWindowClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("click", handleWindowClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className={`${styles["site-shell-root"]} app-admin viewer-admin-theme viewer-admin-theme--${themeMode}`}>
      <div className={styles["site-shell-backdrop"]} aria-hidden="true" />

      <div className={styles["site-shell-toolbar"]}>
        <button
          type="button"
          className={styles["site-shell-icon-button"]}
          onClick={toggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          <ThemeIcon mode={themeMode} />
        </button>

        {(showLogout || showSiteLink) ? (
          <div className={styles["site-shell-menu"]} ref={menuRef}>
            <button
              type="button"
              className={styles["site-shell-icon-button"]}
              aria-label="Opciones de sesion"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <MenuIcon />
            </button>

            {menuOpen ? (
              <div className={styles["site-shell-dropdown"]} role="menu" aria-label="Acciones de usuario">
                {showSiteLink ? (
                  <Link href="/" className={styles["site-shell-dropdown-item"]} role="menuitem" onClick={() => setMenuOpen(false)}>
                    Ir al sitio
                  </Link>
                ) : null}

                {showLogout ? (
                  <button
                    type="button"
                    className={styles["site-shell-dropdown-item"]}
                    role="menuitem"
                    onClick={() => void handleLogout()}
                  >
                    Cerrar sesion
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={styles["site-shell-container"]}>
        <div
          className={`${styles["site-shell-content"]} ${centered ? styles["site-shell-content--centered"] : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
