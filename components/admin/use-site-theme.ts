"use client";

import { useEffect, useMemo, useState } from "react";

export type SiteThemeMode = "dark" | "light";

export const SITE_THEME_STORAGE_KEY = "site-theme-mode";
export const SITE_THEME_EVENT = "site-theme-change";
export const SITE_THEME_VERSION_KEY = "site-theme-mode-version";
export const SITE_THEME_VERSION = "3";

function getStoredThemeMode(): SiteThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.localStorage.getItem(SITE_THEME_VERSION_KEY) !== SITE_THEME_VERSION) {
    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, "light");
    window.localStorage.setItem(SITE_THEME_VERSION_KEY, SITE_THEME_VERSION);
    return "light";
  }

  const value = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
  return value === "dark" || value === "light" ? value : null;
}

export function useSiteTheme() {
  const [themeMode, setThemeMode] = useState<SiteThemeMode>("light");

  useEffect(() => {
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SITE_THEME_STORAGE_KEY) {
        return;
      }

      const next = event.newValue;
      if (next === "dark" || next === "light") {
        setThemeMode(next);
      }
    };

    const handleThemeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<SiteThemeMode>;
      if (customEvent.detail === "dark" || customEvent.detail === "light") {
        setThemeMode(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SITE_THEME_EVENT, handleThemeEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SITE_THEME_EVENT, handleThemeEvent as EventListener);
    };
  }, []);

  const isDark = useMemo(() => themeMode === "dark", [themeMode]);

  return {
    isDark,
    themeMode,
    setThemeMode,
    toggleTheme: () => setThemeMode((current) => (current === "dark" ? "light" : "dark")),
  };
}
