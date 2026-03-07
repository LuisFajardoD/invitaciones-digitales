"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  SITE_THEME_EVENT,
  SITE_THEME_STORAGE_KEY,
  type SiteThemeMode,
} from "@/components/admin/use-site-theme";
import "../../src/crm/admin.css";
import "../../src/crm/viewer.css";

const PublicReactApp = dynamic(() => import("@/src/crm/App").then((module) => module.App), {
  ssr: false,
});

type ViewerReactAppProps = {
  initialInvitationThemeId?: string;
};

function getInitialThemeMode(): SiteThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ViewerReactApp({ initialInvitationThemeId }: ViewerReactAppProps) {
  const [themeMode, setThemeMode] = useState<SiteThemeMode>(() => getInitialThemeMode());

  useEffect(() => {
    setThemeMode(getInitialThemeMode());

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SITE_THEME_STORAGE_KEY) {
        return;
      }

      if (event.newValue === "dark" || event.newValue === "light") {
        setThemeMode(event.newValue);
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

  return (
    <div className={`viewer-theme-sync viewer-theme-sync--${themeMode}`}>
      <PublicReactApp initialInvitationThemeId={initialInvitationThemeId} />
    </div>
  );
}

