"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DEFAULT_PACKAGES_SERVICE_NOTE, RECOMMENDED_SITE_PACKAGES } from "@/lib/site-packages";
import { createWhatsAppUrl } from "@/lib/utils";
import type { SiteSettingsData } from "@/types/invitations";
import styles from "./Landing.module.css";

type LandingProps = {
  settings: SiteSettingsData;
  variant?: "home" | "examples";
};

type DemoItem = {
  title: string;
  description: string;
  slug: string;
  cover_url: string;
};

type RawDemoItem = Partial<DemoItem> & {
  demo_url?: string;
};

type PackageItem = {
  name: string;
  price: string;
  description: string;
  features: string[];
};

type ThemeMode = "dark" | "light";
type HeroPhase = "intro" | "wave" | "ready";

type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  alpha: number;
  decay: number;
  rot: number;
  rotSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  shape: 0 | 1 | 2 | 3;
};

const THEME_STORAGE_KEY = "site-theme-mode";
const THEME_EVENT_NAME = "site-theme-change";
const HERO_TITLE_LINES = ["Hazlo mágico"];
const HERO_SUPPORTING_COPY =
  "Invitaciones digitales animadas y personalizadas para celebrar a lo grande.";
const HERO_INITIAL_HOLD_MS = 1700;
const HERO_WAVE_STAGGER_MS = 62;
const HERO_WAVE_DURATION_MS = 860;
const HERO_PALETTE = [
  "#ff4fd8",
  "#ffd23f",
  "#13dce4",
  "#40cfff",
  "#ff9f2e",
  "#ff6848",
  "#63df7b",
  "#80d8ff",
  "#b06cff",
];
const ADVENTURE_THEMES = [
  { name: "Espacio", icon: "🚀", desc: "Aventuras estelares y galaxias", image: "/assets/gloobi-home/tematicas-infantiles/espacio.avif" },
  { name: "Dinosaurios", icon: "🦖", desc: "Mundo jurásico y expedición", image: "/assets/gloobi-home/tematicas-infantiles/dinosaurios.avif" },
  { name: "Fútbol", icon: "⚽", desc: "Campeones y la gran copa", image: "/assets/gloobi-home/tematicas-infantiles/futbol.avif" },
  { name: "Carreras", icon: "🏎️", desc: "Pista de velocidad y adrenalina", image: "/assets/gloobi-home/tematicas-infantiles/carreras.avif" },
  { name: "Fantasía", icon: "🦄", desc: "Unicornios y magia de cuento", image: "/assets/gloobi-home/tematicas-infantiles/fantasia.avif" },
  { name: "Animales", icon: "🦁", desc: "Safari y la selva divertida", image: "/assets/gloobi-home/tematicas-infantiles/animales.avif" },
  { name: "Videojuegos", icon: "🎮", desc: "Nivel legendario y gamer", image: "/assets/gloobi-home/tematicas-infantiles/videojuegos.avif" },
];
const AIOR_INITIAL_FAN_STATES = [
  { xPercent: 60, rotate: 10 },
  { xPercent: 40, rotate: 6 },
  { xPercent: 20, rotate: 3 },
  { xPercent: 0, rotate: 0 },
  { xPercent: -20, rotate: -3 },
  { xPercent: -40, rotate: -6 },
  { xPercent: -60, rotate: -10 },
];
const EVENT_TYPES = [
  { label: "Cumpleaños Infantiles", icon: "🎈" },
  { label: "Baby Shower", icon: "🍼" },
  { label: "Bautizos", icon: "🕊️" },
  { label: "XV Años", icon: "👑" },
  { label: "Bodas", icon: "💍" },
  { label: "Graduaciones", icon: "🎓" },
  { label: "Otros Eventos Mágicos", icon: "✨" },
];
const PROCESS_STEPS = [
  { title: "Eliges estilo o temática", desc: "Seleccionas de nuestro catálogo o nos propones tu idea única.", icon: "🎨" },
  { title: "Me proporcionas los datos", desc: "Fecha, lugar, horarios y detalles especiales de la fiesta.", icon: "📝" },
  { title: "Personalizo tu invitación", desc: "Diseñamos la magia con animaciones, música y mapa.", icon: "🪄" },
  { title: "La recibes y compartes", desc: "Te entregamos el enlace listo para enviar por WhatsApp.", icon: "🚀" },
];
const CAPABILITY_CANDIDATES = [
  { label: "Música ambiental", icon: "🎵", match: /m[uú]sica/i },
  { label: "Ubicación e itinerario", icon: "📍", match: /ubicaci[oó]n|google maps|mapas?/i },
  { label: "Cuenta regresiva", icon: "⏳", match: /cuenta regresiva/i },
  { label: "RSVP interactivo", icon: "✉️", match: /rsvp|confirmaci[oó]n de asistencia/i },
  { label: "Contacto WhatsApp", icon: "💬", match: /whatsapp/i },
  { label: "Galería de fotos", icon: "📸", match: /galer[ií]a|archivo visual/i },
  { label: "Itinerario del evento", icon: "📋", match: /itinerario/i },
  { label: "Mesa de regalos", icon: "🎁", match: /regalos/i },
  { label: "Pase / PDF digital", icon: "📄", match: /pdf/i },
];

const FALLBACK_DEMOS: DemoItem[] = [
  {
    title: "Invitación Astronauta",
    description: "Tema astronautas con animación espacial, mapa interactivo y RSVP.",
    slug: "cumple-7-luis-arturo-astronautas",
    cover_url: "/api/public/invitations/cumple-7-luis-arturo-astronautas/og-image",
  },
  {
    title: "Invitación Sirena",
    description: "Aventura mágica bajo el mar estilo Sirenita con itinerario, mapa y RSVP.",
    slug: "cumple-5-julieta-mabell",
    cover_url: "/api/public/invitations/cumple-5-julieta-mabell/og-image",
  },
];

const FALLBACK_PACKAGES: PackageItem[] = [
  ...RECOMMENDED_SITE_PACKAGES.map((item) => ({
    name: item.name,
    price: item.price,
    description: item.description,
    features: [...item.features],
  })),
];

function buildDemos(settings: SiteSettingsData): DemoItem[] {
  const items = settings?.blocks?.examples?.items;
  if (Array.isArray(items) && items.length) {
    const normalizedItems = items
      .slice(0, 6)
      .map((item, index) => {
        const source = item as RawDemoItem;
        const slugFromUrl = source.demo_url ? extractDemoSlug(source.demo_url) : "";
        const slug = (source.slug || slugFromUrl || "").trim();
        const coverFromSlug = slug ? `/api/public/invitations/${encodeURIComponent(slug)}/og-image` : "";

        if (!slug) {
          return null;
        }

        return {
          title: (source.title || `Demo ${index + 1}`).trim(),
          description: (source.description || "Modelo listo para publicar.").trim(),
          slug,
          cover_url: (source.cover_url || coverFromSlug).trim(),
        } as DemoItem;
      })
      .filter((item): item is DemoItem => Boolean(item));

    if (normalizedItems.length) {
      return normalizedItems;
    }
  }
  return FALLBACK_DEMOS;
}

function extractDemoSlug(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      const match = parsedUrl.pathname.match(/\/i\/([^/?#]+)/i);
      if (match?.[1]) {
        return decodeURIComponent(match[1]);
      }
      return parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
    } catch {
      return "";
    }
  }

  const match = trimmed.match(/\/i\/([^/?#]+)/i);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return trimmed.replace(/^\/+|\/+$/g, "");
}

function buildPackages(settings: SiteSettingsData): PackageItem[] {
  const items = settings?.blocks?.packages?.items;
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          name: (item?.name || "").trim(),
          price: (item?.price || "").trim(),
          description: (item?.description || "").trim(),
          features: Array.isArray(item?.features)
            ? item.features.map((feature) => feature.trim()).filter(Boolean)
            : [],
        }))
        .filter((item) => Boolean(item.name || item.price || item.description || item.features.length))
    : [];

  if (!normalizedItems.length) {
    return FALLBACK_PACKAGES;
  }

  return normalizedItems.slice(0, 8).map((item) => ({
    name: item.name || "Servicio",
    price: item.price || "Precio a cotizar",
    description: item.description || "Servicio personalizado para tu evento.",
    features: item.features.length ? item.features : ["Diseño personalizado"],
  }));
}

function resolveWhatsAppHref(settings: SiteSettingsData): string {
  const number = settings?.blocks?.contact?.whatsapp_number || "5527225459";
    const prefill =
      settings?.blocks?.contact?.whatsapp_prefill_text ||
    "Hola, quiero cotizar una invitación digital premium.";
  return createWhatsAppUrl(number, prefill);
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getCanvasContext(canvas: HTMLCanvasElement | null) {
  return canvas?.getContext("2d") || null;
}

function buildCapabilities(howItems: string[], packages: PackageItem[]) {
  const sourceText = `${howItems.join(" ")} ${packages
    .flatMap((item) => [item.description, ...item.features])
    .join(" ")}`;
  return CAPABILITY_CANDIDATES.filter((item) => item.match.test(sourceText)).map((item) => ({
    label: item.label,
    icon: item.icon,
  }));
}

export function Landing({ settings, variant = "home" }: LandingProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroPhase, setHeroPhase] = useState<HeroPhase>("intro");
  const [heroInView, setHeroInView] = useState(true);
  const [coverStatus, setCoverStatus] = useState<Record<string, "loaded" | "error">>({});
  const [coverSourceIndex, setCoverSourceIndex] = useState<Record<string, number>>({});
  const heroRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const flipTimersRef = useRef<number[]>([]);
  const demos = buildDemos(settings);
  const packages = buildPackages(settings);
  const packageServiceNote =
    settings?.blocks?.packages?.service_note?.trim() || DEFAULT_PACKAGES_SERVICE_NOTE;
  const extrasItems =
    settings?.blocks?.extras?.enabled && Array.isArray(settings?.blocks?.extras?.items)
      ? settings.blocks.extras.items.map((item) => item.trim()).filter(Boolean)
      : [];
  const extrasTitle = settings?.blocks?.extras?.title?.trim() || "Extras";
  const howItems =
    settings?.blocks?.how_it_works?.enabled && Array.isArray(settings?.blocks?.how_it_works?.items)
      ? settings.blocks.how_it_works.items.map((item) => item.trim()).filter(Boolean)
      : [];
  const faqItems =
    settings?.blocks?.faq?.enabled && Array.isArray(settings?.blocks?.faq?.items)
      ? settings.blocks.faq.items.filter((item) => (item?.question || item?.answer || "").trim())
      : [];
  const faqTitle = settings?.blocks?.faq?.title?.trim() || "Preguntas frecuentes";
  const whatsappHref = resolveWhatsAppHref(settings);
  const rootThemeClass =
    themeMode === "light" ? styles["landing-root--light"] : styles["landing-root--dark"];
  const heroLetterCount = useMemo(
    () => HERO_TITLE_LINES.join("").replace(/\s/g, "").length,
    [],
  );
  const capabilities = useMemo(
    () => buildCapabilities(howItems, packages),
    [howItems, packages],
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    const ctx = getCanvasContext(canvas);
    if (!canvas || !hero || !ctx) {
      return;
    }

    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const drawConfettiPiece = useCallback((ctx: CanvasRenderingContext2D, particle: ConfettiParticle) => {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rot);
    ctx.globalAlpha = Math.max(0, particle.alpha);
    ctx.fillStyle = particle.color;

    const scaleY = Math.abs(Math.cos(particle.wobble)) || 0.05;

    if (particle.shape === 0) {
      ctx.scale(1, scaleY);
      ctx.fillRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h);
    } else if (particle.shape === 1) {
      ctx.scale(1, scaleY);
      ctx.fillRect(-particle.w * 0.8, -particle.h * 0.4, particle.w * 1.6, particle.h * 0.8);
    } else if (particle.shape === 2) {
      ctx.beginPath();
      ctx.arc(0, 0, particle.h, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.scale(1, scaleY);
      ctx.beginPath();
      ctx.moveTo(0, -particle.h);
      ctx.lineTo(particle.h * 0.866, particle.h * 0.5);
      ctx.lineTo(-particle.h * 0.866, particle.h * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const drawConfettiFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext(canvas);
    if (!canvas || !ctx) {
      animationFrameRef.current = null;
      lastFrameTimeRef.current = null;
      return;
    }

    const now = performance.now();
    const lastTime = lastFrameTimeRef.current ?? now;
    const deltaMs = Math.max(1, now - lastTime);
    lastFrameTimeRef.current = now;
    const dt = Math.min(deltaMs / 16.667, 3);

    const width = canvas.width / Math.min(window.devicePixelRatio || 1, 2);
    const height = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, width, height);

    particlesRef.current = particlesRef.current.filter(
      (particle) => particle.alpha > 0 && particle.y < height + 80,
    );

    particlesRef.current.forEach((particle) => {
      particle.wobble += particle.wobbleSpeed * dt;
      particle.x += (particle.vx + Math.sin(particle.wobble) * particle.wobbleAmp) * dt;
      particle.y += particle.vy * dt;
      particle.vy += 0.85 * dt;
      particle.vx *= Math.pow(0.94, dt);
      particle.rot += particle.rotSpeed * dt;
      particle.alpha -= particle.decay * dt;

      drawConfettiPiece(ctx, particle);
    });

    if (particlesRef.current.length) {
      animationFrameRef.current = window.requestAnimationFrame(drawConfettiFrame);
    } else {
      animationFrameRef.current = null;
      lastFrameTimeRef.current = null;
      ctx.clearRect(0, 0, width, height);
    }
  }, [drawConfettiPiece]);

  const spawnConfetti = useCallback(
    (originX: number, originY: number, count = 80) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const height = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
      const fromTop = originY / height;
      const biasY = (fromTop - 0.5) * -14;

      Array.from({ length: count }).forEach(() => {
        const angle = randomBetween(-Math.PI * 0.9, -Math.PI * 0.1);
        const speed = randomBetween(12, 34);
        const spread = randomBetween(-1, 1) * Math.PI * 0.45;
        const shape = Math.random();

        particlesRef.current.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle + spread) * speed * randomBetween(0.8, 1.4),
          vy: Math.sin(angle + spread) * speed + biasY - randomBetween(6, 16),
          w: randomBetween(8, 28),
          h: randomBetween(4, 14),
          color: HERO_PALETTE[Math.floor(randomBetween(0, HERO_PALETTE.length))],
          alpha: 1,
          decay: randomBetween(0.014, 0.032),
          rot: randomBetween(0, Math.PI * 2),
          rotSpeed: randomBetween(-0.4, 0.4),
          wobble: randomBetween(0, Math.PI * 2),
          wobbleSpeed: randomBetween(0.08, 0.22),
          wobbleAmp: randomBetween(1.2, 3.5),
          shape: shape < 0.45 ? 0 : shape < 0.72 ? 1 : shape < 0.88 ? 2 : 3,
        });
      });

      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(drawConfettiFrame);
      }
    },
    [drawConfettiFrame],
  );

  const spawnTitleConfetti = useCallback(() => {
    const title = titleRef.current;
    const hero = heroRef.current;
    if (!title || !hero) {
      return;
    }

    const titleRect = title.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const centerX = titleRect.left - heroRect.left + titleRect.width / 2;
    const centerY = titleRect.top - heroRect.top + titleRect.height / 2;
    spawnConfetti(centerX, centerY, 90);
    spawnConfetti(centerX, centerY, 50);
  }, [spawnConfetti]);

  const triggerHeroConfetti = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (heroPhase !== "ready") {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const hero = heroRef.current;
      if (!hero) {
        return;
      }

      const heroRect = hero.getBoundingClientRect();
      spawnConfetti(event.clientX - heroRect.left, event.clientY - heroRect.top, 110);
    },
    [heroPhase, spawnConfetti],
  );

  const triggerLetterFlip = useCallback((element: HTMLElement) => {
    if (heroPhase !== "ready") {
      return;
    }

    const flipClass = styles["landing-hero-title-letter--flipping"];
    element.classList.remove(flipClass);
    void element.offsetWidth;
    element.classList.add(flipClass);

    const timer = window.setTimeout(() => {
      element.classList.remove(flipClass);
    }, 520);
    flipTimersRef.current.push(timer);
  }, [heroPhase]);

  useEffect(() => {
    const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedMode === "light" || savedMode === "dark") {
      setThemeMode(savedMode);
      return;
    }

    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setThemeMode(prefersLight ? "light" : "dark");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    document.documentElement.dataset.siteTheme = themeMode;
    document.documentElement.setAttribute("data-theme", themeMode);
    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT_NAME, { detail: themeMode }));
  }, [themeMode]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setHeroPhase("ready");
      return undefined;
    }

    const startTimer = window.setTimeout(() => {
      setHeroPhase("wave");
    }, HERO_INITIAL_HOLD_MS);

    const finishTimer = window.setTimeout(() => {
      setHeroPhase("ready");
      window.requestAnimationFrame(spawnTitleConfetti);
    }, HERO_INITIAL_HOLD_MS + HERO_WAVE_DURATION_MS + (heroLetterCount - 1) * HERO_WAVE_STAGGER_MS);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(finishTimer);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      flipTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      flipTimersRef.current = [];
      animationFrameRef.current = null;
      particlesRef.current = [];
    };
  }, [heroLetterCount, spawnTitleConfetti]);

  useEffect(() => {
    const heroNode = heroRef.current;
    if (!heroNode || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? true;
        setHeroInView(isVisible);
      },
      { threshold: 0.02 },
    );

    observer.observe(heroNode);
    return () => observer.disconnect();
  }, []);

  return (
    <main
      className={`${styles["landing-root"]} ${rootThemeClass} ${
        variant === "examples" ? styles["landing-root--examples"] : ""
      }`}
    >
      <section
        ref={heroRef}
        className={`${styles["landing-hero"]} ${heroPhase === "ready" ? styles["landing-hero--ready"] : ""} ${
          !heroInView ? styles["landing-hero--paused"] : ""
        }`}
        onPointerUp={triggerHeroConfetti}
      >
        <div className={styles["landing-hero-backdrop"]} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className={styles["landing-goo-filter"]}>
            <defs>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
                <feBlend in="SourceGraphic" in2="goo" />
              </filter>
            </defs>
          </svg>
          <div className={styles["landing-bubbles-bg"]}>
            <div className={styles["landing-bubbles-container"]}>
              <div className={styles["landing-bubble-g1"]} />
              <div className={styles["landing-bubble-g2"]} />
              <div className={styles["landing-bubble-g3"]} />
              <div className={styles["landing-bubble-g4"]} />
              <div className={styles["landing-bubble-g5"]} />
              <div className={styles["landing-bubble-interactive"]} />
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className={styles["landing-confetti-canvas"]} aria-hidden="true" />

        <div className={styles["landing-hero-shell"]}>
          {/* Dock / Rail lateral izquierdo estilo blanco de la imagen */}
          <aside className={styles["landing-rail"]} aria-label="Navegación principal">
            <div className={styles["landing-rail-top"]}>
              <Link href="/" className={styles["landing-rail-icon-btn"]} title="Inicio">
                ⌂
              </Link>
              <a href="#demos" className={styles["landing-rail-icon-btn"]} title="Buscar Demos">
                ⌕
              </a>
              <a href="#aventuras" className={styles["landing-rail-icon-btn"]} title="Categorías Infantiles">
                ▦
              </a>
              <a href="#contacto" className={styles["landing-rail-icon-btn"]} title="Mensajes / WhatsApp">
                ≡
              </a>
              <Link href="/admin/login" className={styles["landing-rail-icon-btn-avatar"]} title="Acceso CRM Admin">
                <img src="/logo-gloobi/Logo_Gloobi.svg" alt="Gloobi" />
              </Link>
              <button type="button" className={styles["landing-rail-icon-btn"]} title="Notificaciones">
                ◦
              </button>
            </div>

          </aside>

          {/* Bar superior de la imagen: Píldora Izquierda, Buscador Central, Píldora Derecha */}
          <header className={styles["landing-top-bar"]}>
            <a href="#demos" className={styles["landing-top-btn-left"]}>
              Ver Invitaciones <span className={styles["landing-pill-arrow"]}>↗</span>
            </a>

            <svg
              className={styles["landing-top-wave"]}
              viewBox="0 0 558.5 62.8"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                transform="translate(0 62.8) scale(1 -1)"
                d="M0 62.6497C8.5 61.3164 23.2938 54.8334 22 27.6629C20.5 -3.83681 53 0.16008 61 0.167316C69.3481 0.174867 377.697 0.169147 458.456 0.167649L477.5 0.167316C486.5 0.167316 520.5 -3.37199 520.5 22.6469C520.5 46.8658 517.685 62.1892 554.772 62.6719C556.095 62.6719 557.339 62.6719 558.5 62.6719C557.214 62.6876 555.972 62.6875 554.772 62.6719C480.897 62.6711 158.494 62.6497 0 62.6497Z"
              />
            </svg>

            <div className={styles["landing-top-filter-bar"]}>
              <div className={styles["landing-filter-item"]}>
                <span className={styles["landing-filter-label"]}>Ubicación</span>
                <span className={styles["landing-filter-value"]}>México ▾</span>
              </div>
              <div className={styles["landing-filter-divider"]} />
              <div className={styles["landing-filter-item"]}>
                <span className={styles["landing-filter-label"]}>Evento</span>
                <span className={styles["landing-filter-value"]}>Infantil ▾</span>
              </div>
              <div className={styles["landing-filter-divider"]} />
              <div className={styles["landing-filter-item"]}>
                <span className={styles["landing-filter-label"]}>Precio máx</span>
                <span className={styles["landing-filter-value"]}>$990 MXN ▾</span>
              </div>
            </div>

            <a href={whatsappHref} className={styles["landing-top-btn-right"]}>
              Cotizar <span className={styles["landing-pill-arrow"]}>↗</span>
            </a>
          </header>

          {/* Área Central: Título gigante "Hazlo mágico" (INTACTO) + Párrafo Descriptivo Izquierdo */}
          <div className={styles["landing-hero-center-area"]}>
            <p className={styles["landing-kicker"]}>Sí tu evento es muy importante</p>
            <h1
              ref={titleRef}
              className={`${styles["landing-hero-title"]} ${styles[`landing-hero-title--${heroPhase}`]}`}
              aria-label={HERO_TITLE_LINES.join(" ")}
            >
              {(() => {
                let letterIndex = 0;

                return HERO_TITLE_LINES.map((line, lineIndex) => (
                  <span key={line} className={styles["landing-hero-title-row"]}>
                    <span className={styles["landing-hero-title-line"]} aria-hidden="true">
                      {Array.from(line).map((char, charIndex) => {
                        if (char === " ") {
                          return (
                            <span
                              key={`${line}-${charIndex}`}
                              className={styles["landing-hero-title-space"]}
                              aria-hidden="true"
                            >
                              &nbsp;
                            </span>
                          );
                        }

                        const currentIndex = letterIndex;
                        letterIndex += 1;

                        return (
                          <span
                            key={`${line}-${charIndex}-${char}`}
                            className={styles["landing-hero-title-letter"]}
                            style={{
                              "--letter-color": HERO_PALETTE[currentIndex % HERO_PALETTE.length],
                              "--letter-delay": `${currentIndex * HERO_WAVE_STAGGER_MS}ms`,
                            } as CSSProperties}
                            onPointerEnter={(event) => {
                              if (event.pointerType !== "touch") {
                                triggerLetterFlip(event.currentTarget);
                              }
                            }}
                            onPointerUp={(event) => {
                              if (event.pointerType === "touch") {
                                triggerLetterFlip(event.currentTarget);
                              }
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                    {lineIndex < HERO_TITLE_LINES.length - 1 ? (
                      <span className={styles["landing-hero-title-separator"]}> </span>
                    ) : null}
                  </span>
                ));
              })()}
            </h1>

            <p className={styles["landing-hero-left-desc"]}>
              Descubre invitaciones digitales interactivas para celebraciones infantiles, bodas, XV años y eventos especiales. Diseños con música en vivo, mapas GPS y confirmación RSVP al instante.
            </p>
          </div>

          {/* Dos Tarjetas Inferiores Flotantes (Réplica 1:1 de Find The Perfect Place & Lunar Oasis Villa) */}
          <div className={styles["landing-hero-bottom-cards"]}>
            {/* Panel Inferior Izquierdo (switch + tarjeta tipo Find The Perfect Place) */}
            <div className={styles["landing-left-panel"]}>
              <div className={styles["landing-theme-dock"]} aria-label="Cambiar modo visual">
                <svg
                  className={styles["landing-theme-dock-shape"]}
                  viewBox="0 0 220 360"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="landingThemeDockSurface" x1="18" y1="20" x2="152" y2="336" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#ffffff" />
                      <stop offset="0.56" stopColor="#fbfbff" />
                      <stop offset="1" stopColor="#f1f2f8" />
                    </linearGradient>
                  </defs>
                  <path d="M64 0C99 0 128 29 128 64V252C128 302 164 344 220 360H76C34 360 0 326 0 284V64C0 29 29 0 64 0Z" />
                </svg>
                <div className={styles["landing-theme-dock-controls"]}>
                  <a href="#paquetes" className={styles["landing-theme-dock-settings-btn"]} title="Configuración / Paquetes">
                    ⚙
                  </a>
                  <div className={styles["landing-theme-switch-track"]} aria-label="Cambiar modo visual">
                    <button
                      type="button"
                      className={`${styles["landing-theme-switch-btn"]} ${themeMode === "dark" ? styles["landing-theme-switch-btn--active"] : ""}`}
                      onClick={() => setThemeMode("dark")}
                      title="Modo oscuro"
                      aria-pressed={themeMode === "dark"}
                    >
                      ☾
                    </button>
                    <button
                      type="button"
                      className={`${styles["landing-theme-switch-btn"]} ${themeMode === "light" ? styles["landing-theme-switch-btn--active"] : ""}`}
                      onClick={() => setThemeMode("light")}
                      title="Modo claro"
                      aria-pressed={themeMode === "light"}
                    >
                      ☼
                    </button>
                  </div>
                </div>
              </div>

              <article className={styles["landing-card-left-white"]}>
                <svg
                  className={styles["landing-card-left-shape"]}
                  viewBox="0 0 750 360"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M 104 0 H 520 C 590 0, 646 56, 646 126 V 200 C 646 270, 672 360, 750 360 H 84 C 38 360, 0 322, 0 276 V 104 C 0 46, 46 0, 104 0 Z" />
                </svg>
                <div className={styles["landing-card-left-content"]}>
                  <h3>Crea Tu Fiesta Mágica</h3>
                  <p>
                    Conecta a tus invitados con una experiencia única. Personaliza tu temática favorita en minutos.
                  </p>
                  <div className={styles["landing-card-left-stat-row"]}>
                    <div>
                      <div className={styles["landing-stat-number"]}>10K+</div>
                      <span className={styles["landing-stat-label"]}>Invitaciones</span>
                    </div>
                    <div className={styles["landing-stat-avatars"]}>
                      <span className={styles["landing-avatar-dot"]}>🎈</span>
                      <span className={styles["landing-avatar-dot"]}>🚀</span>
                      <span className={styles["landing-avatar-dot"]}>⚽</span>
                    </div>
                    <a href="#demos" className={styles["landing-circle-btn-soft"]} title="Explorar Demos">
                      ↗
                    </a>
                  </div>
                </div>
              </article>
            </div>

            {/* Tarjeta Inferior Derecha Cristal (Lunar Oasis Villa) */}
            <div className={styles["landing-card-right-wrap"]}>
              <article className={styles["landing-card-right-glass"]}>
                <svg
                  className={styles["landing-card-right-shape"]}
                  viewBox="0 0 430 430"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="landingCardRightSurface" x1="34" y1="16" x2="432" y2="342" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#ffffff" stopOpacity="0.82" />
                      <stop offset="0.48" stopColor="#efe8ff" stopOpacity="0.65" />
                      <stop offset="1" stopColor="#bda7f1" stopOpacity="0.82" />
                    </linearGradient>
                    <radialGradient id="landingCardRightSheen" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(366 78) rotate(124) scale(210 150)">
                      <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
                      <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="landingCardRightBorder" x1="0" y1="0" x2="430" y2="430" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="35%" stopColor="#ffffff" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 75 0 H 355 C 396 0, 430 34, 430 75 V 355 C 430 396, 396 430, 355 430 H 198 C 170 430, 153 400, 153 355 C 153 312, 118 277, 75 277 C 35 277, 0 225, 0 180 V 75 C 0 34, 34 0, 75 0 Z"
                    fill="url(#landingCardRightSurface)"
                  />
                  <path
                    d="M 75 0 H 355 C 396 0, 430 34, 430 75 V 355 C 430 396, 396 430, 355 430 H 198 C 170 430, 153 400, 153 355 C 153 312, 118 277, 75 277 C 35 277, 0 225, 0 180 V 75 C 0 34, 34 0, 75 0 Z"
                    fill="url(#landingCardRightSheen)"
                  />
                  <path
                    d="M 75 0 H 355 C 396 0, 430 34, 430 75 V 355 C 430 396, 396 430, 355 430 H 198 C 170 430, 153 400, 153 355 C 153 312, 118 277, 75 277 C 35 277, 0 225, 0 180 V 75 C 0 34, 34 0, 75 0 Z"
                    fill="none"
                    stroke="url(#landingCardRightBorder)"
                    strokeWidth="1.75"
                  />
                </svg>
                <div className={styles["landing-card-right-top"]}>
                  <div>
                    <h3>Astronautas & Galaxia</h3>
                    <span className={styles["landing-card-location-text"]}>📍 Fiesta de Cumpleaños · Tema Espacial</span>
                  </div>
                  <a href="#demos" className={styles["landing-circle-btn-white"]} title="Ver Demo">
                    ↗
                  </a>
                </div>

                <p className={styles["landing-card-right-desc"]}>
                  Invitación futurista animada que combina música en vivo, mapa interactivo y confirmación de asistencia en tiempo real.
                </p>

                <div className={styles["landing-card-specs"]}>
                  <span>🎵 Música</span>
                  <span>•</span>
                  <span>📍 Mapa GPS</span>
                  <span>•</span>
                  <span>⏳ Contador</span>
                  <span>•</span>
                  <span>💬 RSVP</span>
                </div>

                <div className={styles["landing-card-right-bottom-bar"]}>
                  <div className={styles["landing-card-actions-row"]}>
                    <span className={styles["landing-glass-action-btn"]}>❤️ 4.4k</span>
                    <a href="#demos" className={styles["landing-glass-action-btn"]}>🔖 157</a>
                    <a href={whatsappHref} className={styles["landing-glass-action-btn-share"]}>↗</a>
                  </div>
                </div>
              </article>
              <div className={styles["landing-badge-logo-overlapping"]} aria-hidden="true">
                <img src="/logo-gloobi/Logo_Gloobi.svg" alt="" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles["landing-hero-transition"]} aria-hidden="true" />
      </section>

    </main>
  );
}

