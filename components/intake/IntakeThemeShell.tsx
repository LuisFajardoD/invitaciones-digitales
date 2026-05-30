"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SITE_THEME_EVENT, SITE_THEME_STORAGE_KEY, SITE_THEME_VERSION, SITE_THEME_VERSION_KEY, type SiteThemeMode } from "@/components/admin/use-site-theme";
import styles from "./EventIntake.module.css";

type IntakeThemeShellProps = {
  children: ReactNode;
  as?: "div" | "main";
};

function getStoredThemeMode() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

export function IntakeThemeShell({ children, as = "div" }: IntakeThemeShellProps) {
  const [themeMode, setThemeMode] = useState<SiteThemeMode>("light");

  useEffect(() => {
    if (window.localStorage.getItem(SITE_THEME_VERSION_KEY) !== SITE_THEME_VERSION) {
      window.localStorage.setItem(SITE_THEME_STORAGE_KEY, "light");
      window.localStorage.setItem(SITE_THEME_VERSION_KEY, SITE_THEME_VERSION);
      setThemeMode("light");
      return;
    }

    setThemeMode(getStoredThemeMode() || "light");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, themeMode);
    window.localStorage.setItem(SITE_THEME_VERSION_KEY, SITE_THEME_VERSION);
    document.documentElement.dataset.siteTheme = themeMode;
    window.dispatchEvent(new CustomEvent<SiteThemeMode>(SITE_THEME_EVENT, { detail: themeMode }));
  }, [themeMode]);

  const ShellTag = as;
  const nextMode = themeMode === "light" ? "dark" : "light";

  return (
    <ShellTag className={`${styles["intake-shell"]} ${themeMode === "light" ? styles["intake-shell-light"] : ""}`}>
      <button
        className={styles["intake-theme-toggle"]}
        type="button"
        onClick={() => setThemeMode(nextMode)}
        aria-label={themeMode === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      >
        {themeMode === "light" ? "Modo oscuro" : "Modo claro"}
      </button>
      {children}
    </ShellTag>
  );
}
