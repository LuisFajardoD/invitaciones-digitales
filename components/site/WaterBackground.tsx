"use client";

import { useEffect, useRef } from "react";

type LiquidApp = {
  loadImage: (source: string) => void;
  liquidPlane: {
    material: { metalness: number; roughness: number };
    uniforms: { displacementScale: { value: number } };
  };
  setRain: (enabled: boolean) => void;
  setRainTime: (seconds: number) => void;
};

const LIQUID_MODULE = "https://cdn.jsdelivr.net/npm/threejs-components@0.0.27/build/backgrounds/liquid1.min.js";

export function WaterBackground({ darkSource, lightSource }: { darkSource?: string; lightSource?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let active = true;
    let removeThemeListener: (() => void) | undefined;

    async function initialize(target: HTMLCanvasElement) {
      try {
        const module = await import(/* webpackIgnore: true */ LIQUID_MODULE);
        if (!active || !target.isConnected) return;

        const app = module.default(target) as LiquidApp;
        const loadTheme = (theme: string | null | undefined) => {
          app.loadImage(theme === "light"
            ? (lightSource || "/assets/compartidos/fondos/fondo-global-claro.avif")
            : (darkSource || "/assets/compartidos/fondos/fondo-global-oscuro.avif"));
        };
        const onThemeChange = (event: Event) => loadTheme((event as CustomEvent<string>).detail);

        loadTheme(target.closest("[data-theme]")?.getAttribute("data-theme") || document.documentElement.dataset.theme);
        window.addEventListener("site-theme-change", onThemeChange);
        removeThemeListener = () => window.removeEventListener("site-theme-change", onThemeChange);

        app.liquidPlane.material.metalness = 0.75;
        app.liquidPlane.material.roughness = 0.25;
        app.liquidPlane.uniforms.displacementScale.value = 5;
        app.setRainTime(0.08);
        app.setRain(true);
        target.dataset.liquidReady = "true";
      } catch {
        if (active) target.dataset.liquidReady = "false";
      }
    }

    void initialize(canvas);
    return () => {
      active = false;
      removeThemeListener?.();
    };
  }, [darkSource, lightSource]);

  return <canvas ref={canvasRef} className="gloobi-liquid-global-canvas" aria-hidden="true" />;
}
