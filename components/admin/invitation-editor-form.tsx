"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { getDemoDisplayName } from "@/lib/catalog-metadata";
import {
  normalizeBackgroundMedia,
  normalizeHeroAstronaut,
  normalizeKenBurns,
  normalizeInvitationBackground,
  normalizeInvitationRecord,
} from "@/lib/invitation-defaults";
import { sectionDisplayLabels } from "@/lib/section-labels";
import { createWhatsAppUrl, fromLocalDatetimeValue, toLocalDatetimeValue } from "@/lib/utils";
import type {
  BackgroundMediaConfig,
  GenericTextSectionData,
  HeroAstronautConfig,
  InvitationBackgroundConfig,
  InvitationRecord,
  KenBurnsConfig,
  QuickActionItem,
  SectionKey,
} from "@/types/invitations";
import styles from "./invitation-editor-form.module.css";
import { MediaField } from "@/components/admin/media-field";
import { categories, catalogStyles, invitationTypes } from "@/lib/catalog-taxonomy";
import { demoGalleryImages } from "@/lib/demo-gallery";

type InvitationEditorFormProps = {
  invitation: InvitationRecord;
};

type ExtraSectionKey =
  | "itinerary"
  | "dress_code"
  | "gifts"
  | "faq"
  | "livestream"
  | "transport"
  | "lodging";

type EditorCategoryKey =
  | "base"
  | "portada"
  | "evento"
  | "flujo"
  | "contenido"
  | "atencion"
  | "extras";

type PreviewMode = "live" | "capture";

type DevicePresetKey = "iphone_17_pro_max" | "honor_magic6_lite" | "ipad";

type DevicePreset = {
  label: string;
  viewportWidth: number;
  viewportHeight: number;
  frameWidth: string;
  frameRadius: number;
  bezel: number;
  cameraWidth: string;
  cameraHeight: string;
  cameraRadius: string;
};

const allSectionKeys: SectionKey[] = [
  "hero",
  "event_info",
  "quick_actions",
  "countdown",
  "map",
  "gallery",
  "notes",
  "rsvp",
  "contact",
  "itinerary",
  "dress_code",
  "gifts",
  "faq",
  "livestream",
  "transport",
  "lodging",
];

const extraSectionKeys: ExtraSectionKey[] = [
  "itinerary",
  "dress_code",
  "gifts",
  "faq",
  "livestream",
  "transport",
  "lodging",
];

const editableSectionLabels: Record<SectionKey, string> = sectionDisplayLabels;

const catalogStyleRows: string[][] = [
  ["Moderno", "Elegante", "Colorido", "Neón", "Boho"],
  ["Temático", "Floral", "Clásico", "Tierno", "Glamour"],
  ["Minimalista", "Divertido", "Fantasía", "Rústico"],
];

const WHATSAPP_QA_CHECKLIST: string[] = [
  "Sube una imagen OG horizontal (1200x630).",
  "Guarda cambios en la invitación y confirma título + descripción OG.",
  "Comparte primero desde WhatsApp móvil para validar preview real.",
  "Si no actualiza, comparte una vez con ?wa=1 (cache-buster).",
  "Si persiste caché, prueba ?wa=2 o ?wa=3 y vuelve a pegar la URL normal.",
];

const editorCategories: Array<{ key: EditorCategoryKey; label: string }> = [
  { key: "base", label: "General y Compartir" },
  { key: "portada", label: "Portada Hero" },
  { key: "evento", label: "Fecha y Lugar" },
  { key: "flujo", label: "Orden de Bloques" },
  { key: "contenido", label: "Archivo visual" },
  { key: "atencion", label: "RSVP y Pases" },
  { key: "extras", label: "Secciones Extras" },
];

const DEVICE_PRESET_STORAGE_KEY = "inv-editor-device-preset";

// Screen ratios follow hardware specifications. CSS sizes are reference profiles;
// actual browser dimensions vary with display settings.
const DEVICE_PRESETS: Record<DevicePresetKey, DevicePreset> = {
  iphone_17_pro_max: {
    label: "iPhone 17 Pro Max · Safari",
    viewportWidth: 440, viewportHeight: 956,
    frameWidth: "334px", frameRadius: 32, bezel: 5,
    cameraWidth: "28%", cameraHeight: "3.8%", cameraRadius: "999px",
  },
  honor_magic6_lite: {
    label: "HONOR Magic6 Lite · Android",
    viewportWidth: 400, viewportHeight: 884,
    frameWidth: "334px", frameRadius: 22, bezel: 4,
    cameraWidth: "3.5%", cameraHeight: "1.6%", cameraRadius: "50%",
  },
  ipad: {
    label: "iPad · Tablet 4:3",
    viewportWidth: 810, viewportHeight: 1080,
    frameWidth: "410px", frameRadius: 16, bezel: 8,
    cameraWidth: "1.5%", cameraHeight: "1.125%", cameraRadius: "50%",
  },
};

function getStatusLabel(status: InvitationRecord["status"]) {
  return status === "published" ? "Publicada" : "Borrador";
}

function getAnimationProfileLabel(profile: InvitationRecord["animation_profile"]) {
  switch (profile) {
    case "lite":
      return "Ligera";
    case "pro":
      return "Pro";
    case "max":
      return "Maxima";
    default:
      return profile;
  }
}

function getOrderedSectionKeys(order: SectionKey[]) {
  const validOrder = order.filter((key) => allSectionKeys.includes(key));
  const missingKeys = allSectionKeys.filter((key) => !validOrder.includes(key));
  return [...validOrder, ...missingKeys];
}

export function InvitationEditorForm({ invitation }: InvitationEditorFormProps) {
  const router = useRouter();
  const isDemo = invitation.slug.startsWith("demo-");
  const [draft, setDraft] = useState<InvitationRecord>(() => {
    const normalized = normalizeInvitationRecord(invitation);
    if (isDemo && normalized.catalog && !normalized.catalog.card_title?.trim()) {
      return {
        ...normalized,
        catalog: { ...normalized.catalog, card_title: getDemoDisplayName(normalized) },
      };
    }
    return normalized;
  });
  const [selectedCategory, setSelectedCategory] = useState<EditorCategoryKey>("base");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [templateName, setTemplateName] = useState(
    () => `${normalizeInvitationRecord(invitation).sections.hero.title} (Plantilla)`,
  );
  const [templateDescription, setTemplateDescription] = useState("Base reutilizable para nuevas invitaciones.");
  const [templateStatus, setTemplateStatus] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [isWhatsAppChecklistOpen, setIsWhatsAppChecklistOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("live");
  const [devicePresetKey, setDevicePresetKey] = useState<DevicePresetKey>("iphone_17_pro_max");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [activeDragSection, setActiveDragSection] = useState<SectionKey | null>(null);
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const previewScreenRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const previewDragStateRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    elementStartScrollLeft: 0,
    elementStartScrollTop: 0,
    windowStartScrollLeft: 0,
    windowStartScrollTop: 0,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const orderedSectionKeys = getOrderedSectionKeys(draft.sections_order);

  useEffect(() => {
    const screen = previewScreenRef.current;
    if (!screen) return;
    const updateScale = () => setPreviewScale(screen.clientWidth / DEVICE_PRESETS[devicePresetKey].viewportWidth);
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(screen);
    return () => observer.disconnect();
  }, [devicePresetKey]);

  useEffect(() => {
    const screen = previewScreenRef.current;
    if (!screen) return;
    // React delegates wheel events passively; this listener must cancel page scroll.
    screen.addEventListener("wheel", handlePreviewWheel, { passive: false });
    return () => screen.removeEventListener("wheel", handlePreviewWheel);
  }, [previewScale]);

  useEffect(() => {
    const savedPreset =
      typeof window !== "undefined" ? window.localStorage.getItem(DEVICE_PRESET_STORAGE_KEY) : null;
    if (!savedPreset) {
      return;
    }

    if (savedPreset in DEVICE_PRESETS) {
      setDevicePresetKey(savedPreset as DevicePresetKey);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DEVICE_PRESET_STORAGE_KEY, devicePresetKey);
  }, [devicePresetKey]);

  useEffect(() => {
    if (!isWhatsAppChecklistOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWhatsAppChecklistOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isWhatsAppChecklistOpen]);

  useEffect(() => {
    if (previewMode !== "live") return;
    const frameWindow = previewFrameRef.current?.contentWindow;
    if (!frameWindow) return;

    const sendDraft = () => frameWindow.postMessage(
      { type: "gloobi:editor-preview-draft", invitation: previewInvitation() },
      window.location.origin,
    );
    const onPreviewReady = (event: MessageEvent) => {
      if (event.source === frameWindow && event.origin === window.location.origin &&
          event.data?.type === "gloobi:editor-preview-ready" && event.data.slug === draft.slug) {
        sendDraft();
      }
    };

    window.addEventListener("message", onPreviewReady);
    sendDraft();
    return () => window.removeEventListener("message", onPreviewReady);
  }, [draft, previewMode]);

  function getPreviewScrollElement() {
    const frame = previewFrameRef.current;
    const doc = frame?.contentDocument;
    if (!doc) {
      return null;
    }

    const preferredCandidates: Array<HTMLElement | null> = [
      doc.querySelector<HTMLElement>("[data-preview-scroll]"),
      doc.scrollingElement as HTMLElement | null,
      doc.querySelector<HTMLElement>(".viewer-public-frame"),
      doc.querySelector<HTMLElement>(".app-viewer"),
      doc.querySelector<HTMLElement>("main.viewer-shell--public"),
      doc.scrollingElement as HTMLElement | null,
      doc.documentElement,
      doc.body,
    ];

    const isScrollable = (element: HTMLElement | null) =>
      Boolean(element && element.scrollHeight > element.clientHeight + 1);

    const preferredScrollable = preferredCandidates.find((element) => isScrollable(element));
    if (preferredScrollable) {
      return preferredScrollable;
    }

    const nodes = Array.from(doc.querySelectorAll<HTMLElement>("*"));
    for (const node of nodes) {
      const style = doc.defaultView?.getComputedStyle(node);
      if (!style) {
        continue;
      }

      const allowsVerticalScroll = style.overflowY === "auto" || style.overflowY === "scroll";
      if (allowsVerticalScroll && isScrollable(node)) {
        return node;
      }
    }

    return (doc.scrollingElement || doc.documentElement || doc.body) as HTMLElement | null;
  }

  function getPreviewFrameWindow() {
    return previewFrameRef.current?.contentWindow || null;
  }

  function applyPreviewFrameEnhancements(frame: HTMLIFrameElement | null) {
    const doc = frame?.contentDocument;
    if (!doc) {
      return;
    }

    if (!doc.getElementById("inv-editor-scrollbar-hide")) {
      const styleEl = doc.createElement("style");
      styleEl.id = "inv-editor-scrollbar-hide";
      styleEl.textContent = `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          min-height: 100% !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          scroll-behavior: auto !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .viewer-public-frame,
        main.viewer-shell--public,
        .app-viewer {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .app-viewer,
        .app-viewer * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-user-drag: none !important;
        }
        img,
        video {
          pointer-events: none !important;
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        *::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
      `;
      doc.head.appendChild(styleEl);
    }
  }

  function stopPreviewDrag() {
    if (!previewDragStateRef.current.active) {
      return;
    }

    previewDragStateRef.current.active = false;
    previewDragStateRef.current.pointerId = -1;
    if (typeof document !== "undefined") {
      document.body.style.userSelect = "";
    }
    setIsPreviewDragging(false);
  }

  function handlePreviewWheel(event: WheelEvent) {
    if (event.ctrlKey) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? (previewScreenRef.current?.clientHeight || 600) : 1;
    const deltaY = event.deltaY * unit / (previewScale || 1);
    const deltaX = event.deltaX * unit / (previewScale || 1);
    event.preventDefault();
    const scrollElement = getPreviewScrollElement();
    if (scrollElement) {
      const beforeTop = scrollElement.scrollTop;
      const beforeLeft = scrollElement.scrollLeft;
      scrollElement.scrollTo({ top: beforeTop + deltaY, left: beforeLeft + deltaX, behavior: "instant" });
      const didScroll =
        scrollElement.scrollTop !== beforeTop || scrollElement.scrollLeft !== beforeLeft;
      if (didScroll) {
        event.preventDefault();
        return;
      }
    }

    const frameWindow = getPreviewFrameWindow();
    if (!frameWindow) {
      return;
    }

    event.preventDefault();
    frameWindow.scrollBy({
      top: deltaY,
      left: deltaX,
      behavior: "instant",
    });
  }

  function handlePreviewPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const scrollElement = getPreviewScrollElement();
    const frameWindow = getPreviewFrameWindow();
    if (!scrollElement && !frameWindow) {
      return;
    }

    previewDragStateRef.current.active = true;
    previewDragStateRef.current.pointerId = event.pointerId;
    previewDragStateRef.current.startX = event.clientX;
    previewDragStateRef.current.startY = event.clientY;
    previewDragStateRef.current.elementStartScrollLeft = scrollElement?.scrollLeft ?? 0;
    previewDragStateRef.current.elementStartScrollTop = scrollElement?.scrollTop ?? 0;
    previewDragStateRef.current.windowStartScrollLeft = frameWindow?.scrollX ?? 0;
    previewDragStateRef.current.windowStartScrollTop = frameWindow?.scrollY ?? 0;
    if (typeof document !== "undefined") {
      document.body.style.userSelect = "none";
    }
    setIsPreviewDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handlePreviewPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = previewDragStateRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    const scrollElement = getPreviewScrollElement();
    const frameWindow = getPreviewFrameWindow();
    if (!scrollElement && !frameWindow) {
      return;
    }

    const deltaX = (event.clientX - dragState.startX) / (previewScale || 1);
    const deltaY = (event.clientY - dragState.startY) / (previewScale || 1);

    let didScrollElement = false;
    if (scrollElement) {
      const beforeTop = scrollElement.scrollTop;
      const beforeLeft = scrollElement.scrollLeft;
      scrollElement.scrollTop = dragState.elementStartScrollTop - deltaY;
      scrollElement.scrollLeft = dragState.elementStartScrollLeft - deltaX;
      didScrollElement = scrollElement.scrollTop !== beforeTop || scrollElement.scrollLeft !== beforeLeft;
    }

    if (!didScrollElement && frameWindow) {
      frameWindow.scrollTo({
        top: dragState.windowStartScrollTop - deltaY,
        left: dragState.windowStartScrollLeft - deltaX,
        behavior: "auto",
      });
    }

    event.preventDefault();
  }

  function handlePreviewPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (previewDragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stopPreviewDrag();
  }

  function updateDraft(next: InvitationRecord) {
    setDraft(normalizeInvitationRecord(next));
  }

  function updateSectionEnabled(key: SectionKey, enabled: boolean) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        [key]: {
          ...draft.sections[key],
          enabled,
        },
      },
    });
  }

  function setQuickActionEnabled(type: QuickActionItem["type"], enabled: boolean, defaultLabel: string) {
    const current = draft.sections.quick_actions.items.find((item) => item.type === type);
    const remaining = draft.sections.quick_actions.items.filter(
      (item) => item.type !== type && item.type !== "calendar",
    );

    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        quick_actions: {
          ...draft.sections.quick_actions,
          items: enabled ? [...remaining, current || { type, label: defaultLabel }] : remaining,
        },
      },
    });
  }

  function updateQuickActionLabel(type: QuickActionItem["type"], label: string) {
    const hasAction = draft.sections.quick_actions.items.some((item) => item.type === type);
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        quick_actions: {
          ...draft.sections.quick_actions,
          items: hasAction
            ? draft.sections.quick_actions.items
                .filter((item) => item.type !== "calendar")
                .map((item) => (item.type === type ? { ...item, label } : item))
            : [
                ...draft.sections.quick_actions.items.filter((item) => item.type !== "calendar"),
                { type, label },
              ],
        },
      },
    });
  }

  function updateGalleryItem(index: number, value: string) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        gallery: {
          ...draft.sections.gallery,
          image_urls: draft.sections.gallery.image_urls.map((item, itemIndex) =>
            itemIndex === index ? value : item,
          ),
        },
      },
    });
  }

  function addGalleryItem() {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        gallery: {
          ...draft.sections.gallery,
          image_urls: [...draft.sections.gallery.image_urls, ""],
        },
      },
    });
  }

  function addDemoGalleryImage(url: string) {
    if (draft.sections.gallery.image_urls.includes(url) || draft.sections.gallery.image_urls.length >= 20) return;
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        gallery: {
          ...draft.sections.gallery,
          image_urls: [...draft.sections.gallery.image_urls, url],
        },
      },
    });
  }

  function removeGalleryItem(index: number) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        gallery: {
          ...draft.sections.gallery,
          image_urls: draft.sections.gallery.image_urls.filter((_, itemIndex) => itemIndex !== index),
        },
      },
    });
  }

  function updateNoteItem(index: number, value: string) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        notes: {
          ...draft.sections.notes,
          items: draft.sections.notes.items.map((item, itemIndex) => (itemIndex === index ? value : item)),
        },
      },
    });
  }

  function addNoteItem() {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        notes: {
          ...draft.sections.notes,
          items: [...draft.sections.notes.items, ""],
        },
      },
    });
  }

  function removeNoteItem(index: number) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        notes: {
          ...draft.sections.notes,
          items: draft.sections.notes.items.filter((_, itemIndex) => itemIndex !== index),
        },
      },
    });
  }

  function updateExtraSection(key: ExtraSectionKey, next: Partial<GenericTextSectionData>) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        [key]: {
          ...draft.sections[key],
          ...next,
        },
      },
    });
  }

  function updateExtraSectionItem(key: ExtraSectionKey, index: number, value: string) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        [key]: {
          ...draft.sections[key],
          items: (draft.sections[key].items || []).map((item, itemIndex) =>
            itemIndex === index ? value : item,
          ),
        },
      },
    });
  }

  function addExtraSectionItem(key: ExtraSectionKey) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        [key]: {
          ...draft.sections[key],
          items: [...(draft.sections[key].items || []), ""],
        },
      },
    });
  }

  function removeExtraSectionItem(key: ExtraSectionKey, index: number) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        [key]: {
          ...draft.sections[key],
          items: (draft.sections[key].items || []).filter((_, itemIndex) => itemIndex !== index),
        },
      },
    });
  }

  function updateHeroBackground(
    nextBackground: Omit<Partial<BackgroundMediaConfig>, "kenburns"> & { kenburns?: Partial<KenBurnsConfig> },
  ) {
    const background = normalizeBackgroundMedia({
      ...draft.sections.hero.background,
      ...nextBackground,
      kenburns: nextBackground.kenburns
        ? normalizeKenBurns({
            ...draft.sections.hero.background?.kenburns,
            ...nextBackground.kenburns,
          })
        : draft.sections.hero.background?.kenburns,
    });

    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        hero: {
          ...draft.sections.hero,
          background,
          background_image_url:
            background.type === "image"
              ? background.image_url
              : background.type === "video"
                ? background.poster_url || background.image_url
                : "",
        },
      },
    });
  }

  function updateInvitationBackground(
    nextBackground: Omit<Partial<InvitationBackgroundConfig>, "kenburns"> & { kenburns?: Partial<KenBurnsConfig> },
  ) {
    const nextCustom = nextBackground.custom
      ? ({
          ...draft.background?.custom,
          ...nextBackground.custom,
        } as InvitationBackgroundConfig["custom"])
      : draft.background?.custom;

    const background = normalizeInvitationBackground({
      ...draft.background,
      ...nextBackground,
      kenburns: nextBackground.kenburns
        ? normalizeKenBurns({
            ...draft.background?.kenburns,
            ...nextBackground.kenburns,
          })
        : draft.background?.kenburns,
      custom: nextCustom,
    });

    updateDraft({
      ...draft,
      background,
    });
  }

  function updateHeroAstronaut(nextAstronaut: Partial<HeroAstronautConfig>) {
    const astronaut = normalizeHeroAstronaut({
      ...draft.sections.hero.astronaut,
      ...nextAstronaut,
    });

    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        hero: {
          ...draft.sections.hero,
          astronaut,
        },
      },
    });
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragSection(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedSectionKeys.indexOf(active.id as SectionKey);
    const newIndex = orderedSectionKeys.indexOf(over.id as SectionKey);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    updateDraft({
      ...draft,
      sections_order: arrayMove(orderedSectionKeys, oldIndex, newIndex),
    });
  }

  function handleSectionDragStart(event: DragStartEvent) {
    setActiveDragSection(event.active.id as SectionKey);
  }

  function previewInvitation(): InvitationRecord {
    return normalizeInvitationRecord({
      ...draft,
      sections_order: orderedSectionKeys,
    });
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setStatus("");
    const payload = previewInvitation();

    try {
      const response = await fetch(`/api/admin/invitations/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(responsePayload.error || "No se pudo guardar.");
      }
      setDraft(payload);
      setStatus("Cambios guardados.");
      setPreviewVersion((current) => current + 1);
      router.refresh();
      return true;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenPublicInvitation() {
    const saved = await handleSave();
    if (!saved) {
      return;
    }

    window.open(isDemo && draft.status === "draft" ? `/i/${draft.slug}?crm_preview=1` : `/i/${draft.slug}`, "_blank", "noopener,noreferrer");
  }

  async function handleOpenClientRsvpView() {
    const saved = await handleSave();
    if (!saved) {
      return;
    }

    window.open(`/i/${draft.slug}/rsvp?token=${draft.client_view_token}`, "_blank", "noopener,noreferrer");
  }

  async function handleSaveTemplate() {
    setTemplateLoading(true);
    setTemplateStatus("");
    setTemplateError("");

    try {
      const response = await fetch("/api/admin/invitation-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitation_id: draft.id,
          name: templateName,
          description: templateDescription,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar la plantilla.");
      }

      setTemplateStatus("Plantilla guardada.");
      router.refresh();
    } catch (saveTemplateError) {
      setTemplateError(
        saveTemplateError instanceof Error ? saveTemplateError.message : "No se pudo guardar la plantilla.",
      );
    } finally {
      setTemplateLoading(false);
    }
  }

  const heroBackground = normalizeBackgroundMedia(
    draft.sections.hero.background,
    draft.sections.hero.background_image_url,
  );
  const invitationBackground = normalizeInvitationBackground(draft.background);
  const heroAstronaut = normalizeHeroAstronaut(draft.sections.hero.astronaut);
  const mapUsesDarkDefault = draft.theme_id === "astronautas";
  const encodedSlug = encodeURIComponent(draft.slug);
  const livePreviewFrameUrl = `/i/${encodedSlug}?crm_live=1`;
  const capturePreviewFrameUrl = `/i/${encodedSlug}?crm_preview=${previewVersion}`;
  const activePreviewFrameUrl = previewMode === "live" ? livePreviewFrameUrl : capturePreviewFrameUrl;
  const activeCategoryLabel =
    editorCategories.find((category) => category.key === selectedCategory)?.label || "Base";
  const selectedDevicePreset = useMemo(
    () => DEVICE_PRESETS[devicePresetKey] || DEVICE_PRESETS.iphone_17_pro_max,
    [devicePresetKey],
  );
  const deviceFrameVars = useMemo(
    () =>
      ({
        "--device-ratio": String(selectedDevicePreset.viewportWidth / selectedDevicePreset.viewportHeight),
        "--device-viewport-width": `${selectedDevicePreset.viewportWidth}px`,
        "--device-viewport-height": `${selectedDevicePreset.viewportHeight}px`,
        "--device-preview-scale": previewScale,
        "--device-width": selectedDevicePreset.frameWidth,
        "--device-radius": `${selectedDevicePreset.frameRadius}px`,
        "--device-bezel": `${selectedDevicePreset.bezel}px`,
        "--device-camera-width": selectedDevicePreset.cameraWidth,
        "--device-camera-height": selectedDevicePreset.cameraHeight,
        "--device-camera-radius": selectedDevicePreset.cameraRadius,
      }) as CSSProperties,
    [selectedDevicePreset, previewScale],
  );

  return (
    <div className={styles["inv-editor-page"]}>
      <EditorCategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <section className={styles["inv-editor-main"]}>
        <div className={styles["inv-editor-header-banner"]}>
          <div className={styles["inv-editor-header-top"]}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flexWrap: "wrap" }}>
              <span className={styles["inv-editor-category-badge"]}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                {isDemo ? "Demo" : "Invitación"}
              </span>
              <h2 className={styles["inv-editor-header-title"]}>{isDemo ? getDemoDisplayName(draft) : draft.sections.hero.title || draft.slug}</h2>
              <code style={{ color: "#c4b5fd", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", padding: "2px 8px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 600 }}>
                /i/{draft.slug}
              </code>
            </div>

            <div className={styles["inv-editor-status-badge"]}>
              <span className={`${styles["inv-editor-status-dot"]} ${draft.status === "published" ? styles["inv-editor-status-dot--published"] : styles["inv-editor-status-dot--draft"]}`} />
              <span>{getStatusLabel(draft.status)}</span>
            </div>
          </div>
        </div>

        <div className="editor-form-shell">
          {selectedCategory === "base" ? (
            <div className={styles["inv-editor-base-grid"]}>
              <EditorSection eyebrow="General">
                <div style={{ display: "grid", gap: "16px" }}>
                  <div className={styles["inv-editor-catalog-card"]}>
                    <div className={styles["inv-editor-catalog-head"]}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Configuración Base</h3>
                        </div>
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: "14px" }}>
                      <label className="field">
                        <span>Slug público</span>
                        <input value={draft.slug} onChange={(event) => updateDraft({ ...draft, slug: event.target.value })} />
                      </label>
                      <label className="field">
                        <span>Estado de publicación</span>
                        <select
                          value={draft.status}
                          onChange={(event) =>
                            updateDraft({ ...draft, status: event.target.value as InvitationRecord["status"] })
                          }
                        >
                          <option value="draft">Borrador</option>
                          <option value="published">Publicada</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Perfil de animación</span>
                        <select
                          value={draft.animation_profile}
                          onChange={(event) =>
                            updateDraft({
                              ...draft,
                              animation_profile: event.target.value as InvitationRecord["animation_profile"],
                            })
                          }
                        >
                          <option value="lite">{getAnimationProfileLabel("lite")}</option>
                          <option value="pro">{getAnimationProfileLabel("pro")}</option>
                          <option value="max">{getAnimationProfileLabel("max")}</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Zona horaria</span>
                        <input value={draft.timezone} onChange={(event) => updateDraft({ ...draft, timezone: event.target.value })} />
                      </label>

                      {!isDemo && (
                        <label className="field-wide">
                          <span>Tema visual</span>
                          <input value={draft.theme_id} onChange={(event) => updateDraft({ ...draft, theme_id: event.target.value })} />
                        </label>
                      )}
                    </div>
                  </div>

                  {isDemo && draft.catalog && (
                    <div className={styles["inv-editor-catalog-card"]}>
                      <div className={styles["inv-editor-catalog-head"]}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Clasificación del catálogo</h3>
                          </div>
                        </div>
                      </div>

                      <div className="form-grid" style={{ marginTop: "14px" }}>
                        <label className="field">
                          <span>Tipo de invitación</span>
                          <select
                            value={draft.catalog.invitation_type}
                            onChange={(event) =>
                              updateDraft({
                                ...draft,
                                catalog: {
                                  ...draft.catalog!,
                                  invitation_type: event.target.value as NonNullable<InvitationRecord["catalog"]>["invitation_type"],
                                },
                              })
                            }
                          >
                            {!draft.catalog.invitation_type.startsWith("web-") && <option value={draft.catalog.invitation_type}>Formato de archivo anterior</option>}
                            {invitationTypes.filter((item) => item.slug.startsWith("web-")).map((item) => (
                              <option key={item.slug} value={item.slug}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        {!draft.catalog.invitation_type.startsWith("web-") && <p className="field-wide">Las muestras de imagen, PDF y video se administran en Sitio Web Público → Muestras.</p>}
                        <label className="field"><span>{isDemo ? "Nombre del demo en CRM y catálogo" : "Título de la tarjeta"}</span><input value={draft.catalog.card_title || ""} onChange={(event) => updateDraft({ ...draft, catalog: { ...draft.catalog!, card_title: event.target.value } })} placeholder={draft.sections.hero.title} /></label>
                        <label className="field-wide"><span>Descripción de la tarjeta</span><input value={draft.catalog.card_description || ""} onChange={(event) => updateDraft({ ...draft, catalog: { ...draft.catalog!, card_description: event.target.value } })} placeholder="Breve descripción para el catálogo" /></label>

                        <label className="field">
                          <span>Categoría</span>
                          <select
                            value={draft.catalog.category}
                            onChange={(event) =>
                              updateDraft({
                                ...draft,
                                catalog: { ...draft.catalog!, category: event.target.value, subcategory: "" },
                              })
                            }
                          >
                            <option value="">Selecciona una categoría</option>
                            {categories.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Subcategoría</span>
                          <select
                            value={draft.catalog.subcategory}
                            onChange={(event) =>
                              updateDraft({
                                ...draft,
                                catalog: { ...draft.catalog!, subcategory: event.target.value },
                              })
                            }
                          >
                            <option value="">Selecciona una subcategoría</option>
                            {categories
                              .find((item) => item.id === draft.catalog?.category)
                              ?.subcategories.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                          </select>
                        </label>

                        <div className="field-wide" style={{ marginTop: "4px" }}>
                          <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--admin-text-soft)", marginBottom: "8px" }}>
                            Estilos visuales
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {catalogStyleRows.map((row, rowIndex) => (
                              <div key={rowIndex} className={styles["inv-editor-style-chips"]}>
                                {row.map((item) => {
                                  const isSelected = draft.catalog!.styles.includes(item);
                                  return (
                                    <button
                                      key={item}
                                      type="button"
                                      className={`${styles["inv-editor-style-chip"]} ${isSelected ? styles["inv-editor-style-chip--active"] : ""}`}
                                      onClick={() => {
                                        const currentStyles = draft.catalog!.styles;
                                        const updated = isSelected
                                          ? currentStyles.filter((style) => style !== item)
                                          : [...currentStyles, item];
                                        updateDraft({
                                          ...draft,
                                          catalog: { ...draft.catalog!, styles: updated },
                                        });
                                      }}
                                    >
                                      <span className={styles["inv-editor-chip-icon"]}>
                                        {isSelected ? (
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                          </svg>
                                        ) : (
                                          <span className={styles["inv-editor-chip-dot"]} />
                                        )}
                                      </span>
                                      <span>{item}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>

                        {draft.catalog.invitation_type.startsWith("web-") && <MediaField label="Imagen estática de tarjeta y vista previa" accept="image/jpeg,image/png,image/webp,image/avif" value={draft.catalog.preview_url || ""} onChange={(value) => updateDraft({ ...draft, catalog: { ...draft.catalog!, preview_url: value } })} />}
                      </div>
                    </div>
                  )}
                </div>
              </EditorSection>

              <EditorSection eyebrow="Compartir & Vigencia">
                <div style={{ display: "grid", gap: "16px" }}>
                  <div className={styles["inv-editor-catalog-card"]}>
                    <div className={styles["inv-editor-catalog-head"]} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3"></circle>
                          <circle cx="6" cy="12" r="3"></circle>
                          <circle cx="18" cy="19" r="3"></circle>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Tarjeta para Compartir</h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="button-secondary"
                        style={{ fontSize: "0.78rem", padding: "6px 12px", borderRadius: "8px", flexShrink: 0 }}
                        onClick={() => setIsWhatsAppChecklistOpen(true)}
                      >
                        Checklist WhatsApp
                      </button>
                    </div>

                    <div className="form-grid" style={{ marginTop: "14px" }}>
                      <label className="field">
                        <span>Título al compartir (WhatsApp/Social)</span>
                        <input value={draft.share.og_title} onChange={(event) => updateDraft({ ...draft, share: { ...draft.share, og_title: event.target.value } })} placeholder="Título para la tarjeta de previsualización" />
                      </label>
                      <label className="field">
                        <span>Descripción al compartir</span>
                        <input value={draft.share.og_description} onChange={(event) => updateDraft({ ...draft, share: { ...draft.share, og_description: event.target.value } })} placeholder="Descripción breve para la vista previa" />
                      </label>
                      <MediaField label="Imagen de portada al compartir (1200x630)" accept="image/jpeg,image/png,image/webp,image/avif" value={draft.share.og_image_url} onChange={(value) => updateDraft({ ...draft, share: { ...draft.share, og_image_url: value } })} />
                      <div className={`field-wide ${styles["inv-editor-action-settings"]}`}>
                        <label className="checkbox-tile">
                          <input
                            type="checkbox"
                            checked={draft.sections.quick_actions.items.some((item) => item.type === "share")}
                            onChange={(event) => setQuickActionEnabled("share", event.target.checked, "Compartir")}
                          />
                          <span>Mostrar botón para compartir invitación</span>
                        </label>
                        <label className="field">
                          <span>Texto del botón</span>
                          <input
                            value={draft.sections.quick_actions.items.find((item) => item.type === "share")?.label || "Compartir"}
                            disabled={!draft.sections.quick_actions.items.some((item) => item.type === "share")}
                            onChange={(event) => updateQuickActionLabel("share", event.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className={styles["inv-editor-catalog-card"]}>
                    <div className={styles["inv-editor-catalog-head"]}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Fechas del Evento y Límites de Acceso</h3>
                        </div>
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: "14px" }}>
                      <label className="field">
                        <span>Inicio del evento</span>
                        <input
                          type="datetime-local"
                          value={toLocalDatetimeValue(draft.event_start_at)}
                          onChange={(event) => updateDraft({ ...draft, event_start_at: fromLocalDatetimeValue(event.target.value) })}
                        />
                      </label>
                      <label className="field">
                        <span>Activa hasta (Caducidad)</span>
                        <input
                          type="datetime-local"
                          value={toLocalDatetimeValue(draft.active_until)}
                          onChange={(event) => updateDraft({ ...draft, active_until: fromLocalDatetimeValue(event.target.value) })}
                        />
                      </label>
                      <label className="field-wide">
                        <span>RSVP abierto hasta</span>
                        <input
                          type="datetime-local"
                          value={toLocalDatetimeValue(draft.rsvp_until)}
                          onChange={(event) => updateDraft({ ...draft, rsvp_until: fromLocalDatetimeValue(event.target.value) })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles["inv-editor-catalog-card"]}>
                    <div className={styles["inv-editor-catalog-head"]}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Pantalla al Expirar</h3>
                        </div>
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: "14px" }}>
                      <label className="field">
                        <span>Título al expirar</span>
                        <input value={draft.expired_page.title} onChange={(event) => updateDraft({ ...draft, expired_page: { ...draft.expired_page, title: event.target.value } })} />
                      </label>
                      <label className="field">
                        <span>Mensaje al expirar</span>
                        <input value={draft.expired_page.message} onChange={(event) => updateDraft({ ...draft, expired_page: { ...draft.expired_page, message: event.target.value } })} />
                      </label>
                      <label className="field">
                        <span>CTA primaria texto</span>
                        <input
                          value={draft.expired_page.primary_cta.text}
                          onChange={(event) =>
                            updateDraft({
                              ...draft,
                              expired_page: { ...draft.expired_page, primary_cta: { ...draft.expired_page.primary_cta, text: event.target.value } },
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>CTA primaria href</span>
                        <input
                          value={draft.expired_page.primary_cta.href}
                          onChange={(event) =>
                            updateDraft({
                              ...draft,
                              expired_page: { ...draft.expired_page, primary_cta: { ...draft.expired_page.primary_cta, href: event.target.value } },
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>CTA secundaria texto</span>
                        <input
                          value={draft.expired_page.secondary_cta.text}
                          onChange={(event) =>
                            updateDraft({
                              ...draft,
                              expired_page: { ...draft.expired_page, secondary_cta: { ...draft.expired_page.secondary_cta, text: event.target.value } },
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>CTA secundaria href</span>
                        <input
                          value={draft.expired_page.secondary_cta.href}
                          onChange={(event) =>
                            updateDraft({
                              ...draft,
                              expired_page: { ...draft.expired_page, secondary_cta: { ...draft.expired_page.secondary_cta, href: event.target.value } },
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </EditorSection>
            </div>
          ) : null}

          {selectedCategory === "flujo" ? (
          <EditorSection
            eyebrow="Flujo"
          >
            <div className={styles["inv-editor-flow"]}>
              <div className="helper-text">
                Arrastra cada bloque desde el asa para cambiar el orden. La invitación pública respeta exactamente esta lista.
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleSectionDragStart}
                onDragCancel={() => setActiveDragSection(null)}
                onDragEnd={handleSectionDragEnd}
              >
                <SortableContext items={orderedSectionKeys} strategy={verticalListSortingStrategy}>
                  <div className={styles["inv-editor-flow-list"]}>
                    {orderedSectionKeys.map((key) => (
                      <SortableSectionItem
                        key={key}
                        id={key}
                        label={editableSectionLabels[key]}
                        enabled={draft.sections[key].enabled}
                        onToggle={(enabled) => updateSectionEnabled(key, enabled)}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeDragSection ? (
                    <FlowOverlayCard
                      label={editableSectionLabels[activeDragSection]}
                      enabled={draft.sections[activeDragSection].enabled}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </EditorSection>
          ) : null}

          {["portada", "evento", "contenido", "atencion", "extras"].includes(selectedCategory) ? (
          <EditorSection
            eyebrow={activeCategoryLabel}
          >
            <div className={`form-grid ${styles["inv-editor-form-grid"]}`}>
          {selectedCategory === "portada" ? (
            <div style={{ display: "grid", gap: "16px", gridColumn: "1 / -1" }}>
              {/* Card 1: Textos & Títulos de Portada */}
              <div className={styles["inv-editor-catalog-card"]}>
                <div className={styles["inv-editor-catalog-head"]} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7V4h16v3"></path>
                    <path d="M9 20h6"></path>
                    <path d="M12 4v16"></path>
                  </svg>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Textos de la Portada</h3>
                  </div>
                </div>

                <div className="form-grid" style={{ marginTop: "14px" }}>
                  <label className="field">
                    <span>Título principal</span>
                    <input
                      value={draft.sections.hero.title}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, hero: { ...draft.sections.hero, title: event.target.value } },
                        })
                      }
                      placeholder="Ej. Misión espacial"
                    />
                  </label>
                  <label className="field">
                    <span>Subtítulo principal</span>
                    <input
                      value={draft.sections.hero.subtitle}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, hero: { ...draft.sections.hero, subtitle: event.target.value } },
                        })
                      }
                      placeholder="Ej. La misión es que nos acompañes a celebrar"
                    />
                  </label>
                  <label className="field">
                    <span>Badge de portada</span>
                    <input
                      value={draft.sections.hero.badge}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, hero: { ...draft.sections.hero, badge: event.target.value } },
                        })
                      }
                      placeholder="Ej. Protocolo de despegue"
                    />
                  </label>
                  <label className="field">
                    <span>Línea de acento</span>
                    <input
                      value={draft.sections.hero.accent}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, hero: { ...draft.sections.hero, accent: event.target.value } },
                        })
                      }
                      placeholder="Ej. ID: MA - 07"
                    />
                  </label>
                </div>
              </div>

              <div className={styles["inv-editor-background-grid"]}>
              {/* Card 2: Fondo de Portada */}
              <div className={styles["inv-editor-catalog-card"]}>
                <div className={styles["inv-editor-catalog-head"]} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Fondo de la Portada</h3>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", marginTop: "14px" }}>
                  <label className="field" style={{ flex: "1 1 200px", margin: 0 }}>
                    <span>Tipo de fondo</span>
                    <select
                      value={heroBackground.type}
                      onChange={(event) => updateHeroBackground({ type: event.target.value as BackgroundMediaConfig["type"] })}
                    >
                      <option value="default">Default</option>
                      <option value="image">Imagen</option>
                      <option value="video">Video</option>
                    </select>
                  </label>

                  <div className={styles["inv-editor-parallax-group"]} style={{ flex: "2 1 360px" }}>
                    <label className="checkbox-tile" style={{ margin: 0, padding: 0, border: "none", background: "transparent" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(heroBackground.kenburns?.enabled)}
                        onChange={(event) =>
                          updateHeroBackground({
                            kenburns: {
                              enabled: event.target.checked,
                            },
                          })
                        }
                      />
                      <span>Parallax (Ken Burns)</span>
                    </label>

                    <div className={styles["inv-editor-subfield-wrap"]}>
                      <span className={styles["inv-editor-subfield-label"]}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        Intensidad
                      </span>
                      <select
                        disabled={!heroBackground.kenburns?.enabled}
                        value={heroBackground.kenburns?.strength || "medium"}
                        onChange={(event) =>
                          updateHeroBackground({
                            kenburns: {
                              strength: event.target.value as "low" | "medium" | "high",
                            },
                          })
                        }
                      >
                        <option value="low">Suave</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>
                </div>

                {heroBackground.type === "image" ? (
                  <div style={{ marginTop: "14px" }}>
                    <MediaField label="Imagen de portada" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" value={heroBackground.image_url} onChange={(value) => updateHeroBackground({ image_url: value })} />
                  </div>
                ) : null}
                {heroBackground.type === "video" ? (
                  <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
                    <MediaField label="Video de portada" accept="video/mp4,video/webm" value={heroBackground.video_url} onChange={(value) => updateHeroBackground({ video_url: value })} />
                    <MediaField label="Poster opcional" accept="image/jpeg,image/png,image/webp,image/avif" value={heroBackground.poster_url} onChange={(value) => updateHeroBackground({ poster_url: value })} />
                  </div>
                ) : null}
              </div>

              {/* Card 3: Fondo para el resto de secciones */}
              <div className={styles["inv-editor-catalog-card"]}>
                <div className={styles["inv-editor-catalog-head"]} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Fondo para Secciones Secundarias</h3>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", marginTop: "14px" }}>
                  <label className="field" style={{ flex: "1 1 200px", margin: 0 }}>
                    <span>Modo</span>
                    <select
                      value={invitationBackground.mode}
                      onChange={(event) => updateInvitationBackground({ mode: event.target.value as InvitationBackgroundConfig["mode"] })}
                    >
                      <option value="default_app">Default app</option>
                      <option value="inherit_hero">Usar fondo de portada</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </label>
                  {invitationBackground.mode !== "default_app" ? (
                    <div className={styles["inv-editor-parallax-group"]} style={{ flex: "2 1 360px" }}>
                      <label className="checkbox-tile" style={{ margin: 0, padding: 0, border: "none", background: "transparent" }}>
                        <input
                          type="checkbox"
                          checked={Boolean(invitationBackground.kenburns?.enabled)}
                          onChange={(event) =>
                            updateInvitationBackground({
                              kenburns: {
                                enabled: event.target.checked,
                              },
                            })
                          }
                        />
                        <span>Parallax (Ken Burns)</span>
                      </label>

                      <div className={styles["inv-editor-subfield-wrap"]}>
                        <span className={styles["inv-editor-subfield-label"]}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                          Intensidad
                        </span>
                        <select
                          disabled={!invitationBackground.kenburns?.enabled}
                          value={invitationBackground.kenburns?.strength || "medium"}
                          onChange={(event) =>
                            updateInvitationBackground({
                              kenburns: {
                                strength: event.target.value as "low" | "medium" | "high",
                              },
                            })
                          }
                        >
                          <option value="low">Suave</option>
                          <option value="medium">Media</option>
                          <option value="high">Alta</option>
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>

                {invitationBackground.mode === "custom" ? (
                  <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
                    <label className="field">
                      <span>Tipo personalizado</span>
                      <select
                        value={invitationBackground.custom.type}
                        onChange={(event) =>
                          updateInvitationBackground({
                            custom: { ...invitationBackground.custom, type: event.target.value as InvitationBackgroundConfig["custom"]["type"] },
                          })
                        }
                      >
                        <option value="image">Imagen</option>
                        <option value="video">Video</option>
                      </select>
                    </label>
                    {invitationBackground.custom.type === "image" ? (
                      <MediaField label="Imagen de fondo" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" value={invitationBackground.custom.image_url} onChange={(value) => updateInvitationBackground({ custom: { ...invitationBackground.custom, image_url: value } })} />
                    ) : (
                      <>
                        <MediaField label="Video de fondo" accept="video/mp4,video/webm" value={invitationBackground.custom.video_url} onChange={(value) => updateInvitationBackground({ custom: { ...invitationBackground.custom, video_url: value } })} />
                        <MediaField label="Poster opcional" accept="image/jpeg,image/png,image/webp,image/avif" value={invitationBackground.custom.poster_url} onChange={(value) => updateInvitationBackground({ custom: { ...invitationBackground.custom, poster_url: value } })} />
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Card 4: Elemento Flotante (Astronauta / Ilustración) */}
              <div className={styles["inv-editor-catalog-card"]}>
                <div className={`${styles["inv-editor-catalog-head"]} ${styles["inv-editor-decorative-head"]}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71.79-1.81.2-2.55L4.5 16.5z"></path>
                      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z"></path>
                      <path d="M9 12l-5 5"></path>
                      <path d="M15 15l5-5"></path>
                    </svg>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Elemento Decorativo Flotante</h3>
                    </div>
                  </div>

                  <label className="checkbox-tile" style={{ margin: 0, padding: "6px 12px", borderRadius: "10px", flexShrink: 0 }}>
                    <input type="checkbox" checked={heroAstronaut.enabled} onChange={(event) => updateHeroAstronaut({ enabled: event.target.checked })} />
                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Mostrar elemento</span>
                  </label>
                </div>

                {heroAstronaut.enabled ? (
                  <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
                    <MediaField label="Imagen del elemento decorativo" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" value={heroAstronaut.image_url} onChange={(value) => updateHeroAstronaut({ image_url: value })} />

                    <div className="form-grid">
                      <label className="field">
                        <span>Posición</span>
                        <select
                          value={heroAstronaut.position}
                          onChange={(event) => updateHeroAstronaut({ position: event.target.value as HeroAstronautConfig["position"] })}
                        >
                          <option value="bottom-right">Abajo derecha</option>
                          <option value="bottom-left">Abajo izquierda</option>
                          <option value="top-right">Arriba derecha</option>
                          <option value="top-left">Arriba izquierda</option>
                          <option value="center">Centro</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Opacidad (0.05 - 1.0)</span>
                        <input
                          type="number"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={heroAstronaut.opacity}
                          onChange={(event) => updateHeroAstronaut({ opacity: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>
              </div>
            </div>
          ) : null}

          {selectedCategory === "evento" ? (
            <div style={{ display: "grid", gap: "16px", gridColumn: "1 / -1" }}>
              {/* Card 1: Ubicación & Lugar del Evento */}
              <div className={styles["inv-editor-catalog-card"]}>
                <div className={styles["inv-editor-catalog-head"]} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Ubicación & Lugar del Evento</h3>
                  </div>
                </div>

                <div className="form-grid" style={{ marginTop: "14px" }}>
                  <label className="field-wide">
                    <span>Nombre del lugar / Salón</span>
                    <input
                      value={draft.sections.event_info.venue_name}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, event_info: { ...draft.sections.event_info, venue_name: event.target.value } },
                        })
                      }
                      placeholder="Ej. Jardín del Valle"
                    />
                  </label>
                  <label className="field-wide">
                    <span>Dirección completa</span>
                    <input
                      value={draft.sections.event_info.address_text}
                      onChange={(event) => {
                        const value = event.target.value;
                        updateDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            event_info: { ...draft.sections.event_info, address_text: value },
                            map: { ...draft.sections.map, address_text: value },
                          },
                        });
                      }}
                      placeholder="Ej. Cda. Tlalimaya 25, San Andrés Ahuayucan..."
                    />
                  </label>
                </div>
              </div>

              {/* Card 2: Fecha, Horario & Cuenta Regresiva */}
              <div className={styles["inv-editor-catalog-card"]}>
                <div className={styles["inv-editor-catalog-head"]} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Fecha, Horario & Cuenta Regresiva</h3>
                  </div>
                </div>

                <div className="form-grid" style={{ marginTop: "14px" }}>
                  <label className="field">
                    <span>Día de la semana</span>
                    <input
                      value={draft.sections.event_info.weekday_text}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, event_info: { ...draft.sections.event_info, weekday_text: event.target.value } },
                        })
                      }
                      placeholder="Ej. Sábado"
                    />
                  </label>
                  <label className="field">
                    <span>Fecha visible</span>
                    <input
                      value={draft.sections.event_info.date_text}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, event_info: { ...draft.sections.event_info, date_text: event.target.value } },
                        })
                      }
                      placeholder="Ej. 18 de abril de 2026"
                    />
                  </label>
                  <label className="field">
                    <span>Hora visible</span>
                    <input
                      value={draft.sections.event_info.time_text}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, event_info: { ...draft.sections.event_info, time_text: event.target.value } },
                        })
                      }
                      placeholder="Ej. A partir de las 11:00 am"
                    />
                  </label>
                  <label className="field">
                    <span>Texto de cuenta regresiva</span>
                    <input
                      value={draft.sections.countdown.label}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, countdown: { ...draft.sections.countdown, label: event.target.value } },
                        })
                      }
                      placeholder="Ej. Faltan para el despegue"
                    />
                  </label>
                  <label className="field-wide">
                    <span>Fecha/hora objetivo de cuenta regresiva</span>
                    <input
                      type="datetime-local"
                      value={toLocalDatetimeValue(draft.sections.countdown.target_at)}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            countdown: { ...draft.sections.countdown, target_at: fromLocalDatetimeValue(event.target.value) },
                          },
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Card 3: Mapa Interactivo & Coordenadas GPS */}
              <div className={styles["inv-editor-catalog-card"]}>
                <div className={styles["inv-editor-catalog-head"]} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                      <line x1="8" y1="2" x2="8" y2="18"></line>
                      <line x1="16" y1="6" x2="16" y2="22"></line>
                    </svg>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--admin-text)" }}>Mapa Interactivo & Coordenadas GPS</h3>
                    </div>
                  </div>

                  <label className="checkbox-tile" style={{ margin: 0, padding: "6px 12px", borderRadius: "10px", flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={typeof draft.sections.map.dark === "boolean" ? draft.sections.map.dark : mapUsesDarkDefault}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, map: { ...draft.sections.map, dark: event.target.checked } },
                        })
                      }
                    />
                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Mapa oscuro</span>
                  </label>
                </div>

                <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
                    <label className="field" style={{ minWidth: 0 }}>
                      <span>Latitud del mapa</span>
                      <input
                        value={String(draft.sections.map.embed.lat)}
                        onChange={(event) =>
                          updateDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              map: { ...draft.sections.map, embed: { ...draft.sections.map.embed, lat: Number(event.target.value) } },
                            },
                          })
                        }
                      />
                    </label>
                    <label className="field" style={{ minWidth: 0 }}>
                      <span>Longitud del mapa</span>
                      <input
                        value={String(draft.sections.map.embed.lng)}
                        onChange={(event) =>
                          updateDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              map: { ...draft.sections.map, embed: { ...draft.sections.map.embed, lng: Number(event.target.value) } },
                            },
                          })
                        }
                      />
                    </label>
                    <label className="field" style={{ minWidth: 0 }}>
                      <span>Zoom del mapa (0-22)</span>
                      <input
                        type="number"
                        min="0"
                        max="22"
                        value={String(draft.sections.map.embed.zoom)}
                        onChange={(event) =>
                          updateDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              map: { ...draft.sections.map, embed: { ...draft.sections.map.embed, zoom: Number(event.target.value) } },
                            },
                          })
                        }
                      />
                    </label>
                  </div>

                  <label className="field-wide">
                    <span>URL de Google Maps (Enlace "Cómo llegar")</span>
                    <input
                      value={draft.sections.map.maps_url}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          sections: { ...draft.sections, map: { ...draft.sections.map, maps_url: event.target.value } },
                        })
                      }
                      placeholder="https://www.google.com/maps/..."
                    />
                  </label>
                  <div className={styles["inv-editor-action-settings"]}>
                    <label className="checkbox-tile">
                      <input
                        type="checkbox"
                        checked={draft.sections.quick_actions.items.some((item) => item.type === "location")}
                        onChange={(event) => setQuickActionEnabled("location", event.target.checked, "Ubicación")}
                      />
                      <span>Mostrar botón de ubicación</span>
                    </label>
                    <label className="field">
                      <span>Texto del botón</span>
                      <input
                        value={draft.sections.quick_actions.items.find((item) => item.type === "location")?.label || "Ubicación"}
                        disabled={!draft.sections.quick_actions.items.some((item) => item.type === "location")}
                        onChange={(event) => updateQuickActionLabel("location", event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {selectedCategory === "contenido" ? (
          <>
          <div className={`field-wide ${styles["inv-editor-gallery-section"]}`}>
            <div className={styles["inv-editor-gallery-title"]}>
              <span>Archivo visual</span>
              <span className={styles["inv-editor-gallery-count"]}>
                {draft.sections.gallery.image_urls.length} imágenes agregadas
              </span>
            </div>
            <div className={`admin-subpanel ${styles["inv-editor-gallery-panel"]}`}>
              {isDemo && (
                <div className={styles["inv-editor-demo-gallery"]}>
                  <strong>Imágenes listas para demos</strong>
                  <div className={styles["inv-editor-demo-gallery-grid"]}>
                    {demoGalleryImages.map((url, index) => {
                      const selected = draft.sections.gallery.image_urls.includes(url);
                      return (
                        <button
                          key={url}
                          type="button"
                          className={styles["inv-editor-demo-gallery-option"]}
                          aria-label={`Agregar momento mágico ${index + 1}`}
                          aria-pressed={selected}
                          disabled={selected || draft.sections.gallery.image_urls.length >= 20}
                          onClick={() => addDemoGalleryImage(url)}
                        >
                          <img src={url} alt="" loading="lazy" />
                          <span>{index + 1}{selected ? " · Agregada" : " · Agregar"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {draft.sections.gallery.image_urls.length > 0 ? (
                <div className={styles["inv-editor-gallery-cards"]}>
                  {draft.sections.gallery.image_urls.map((item, index) => (
                    <div className={styles["inv-editor-gallery-card"]} key={`gallery-${index}`}>
                      <div className={styles["inv-editor-gallery-card-head"]}>
                        <span className={styles["inv-editor-gallery-card-number"]}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <strong>Imagen {index + 1}</strong>
                        <button
                          type="button"
                          className={`button-secondary ${styles["inv-editor-gallery-remove"]}`}
                          onClick={() => removeGalleryItem(index)}
                        >
                          Quitar
                        </button>
                      </div>
                      <MediaField
                        label={`URL de imagen ${index + 1}`}
                        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                        value={item}
                        onChange={(value) => updateGalleryItem(index, value)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles["inv-editor-grid-empty"]}>
                  No hay imágenes todavía. Agrega una para que aparezca en Archivo visual.
                </p>
              )}
              <button type="button" className={`button-secondary ${styles["inv-editor-gallery-add"]}`} onClick={addGalleryItem}>
                Agregar imagen
              </button>
            </div>
          </div>
          </>
          ) : null}
          {selectedCategory === "extras" ? (
          <>
          <div className="field-wide">
            <span>Checklist</span>
            <div className="admin-subpanel simple-list-editor">
              <EditorGridList
                columnsTemplate="minmax(0, 1fr) auto"
                headers={["Punto", "Acciones"]}
                emptyState={
                  <p className={styles["inv-editor-grid-empty"]}>
                    No hay puntos todavía. Agrega uno para que aparezca en Checklist.
                  </p>
                }
                hasRows={draft.sections.notes.items.length > 0}
              >
                {draft.sections.notes.items.map((item, index) => (
                  <EditorGridRow key={`note-${index}`} columnsTemplate="minmax(0, 1fr) auto">
                    <div className={styles["inv-editor-grid-cell"]}>
                      <label className="field" htmlFor={`note-item-${index}`}>
                        <span className={styles["inv-editor-sr-only"]}>Punto</span>
                        <input
                          id={`note-item-${index}`}
                          value={item}
                          onChange={(event) => updateNoteItem(index, event.target.value)}
                          placeholder="Escribe un detalle"
                        />
                      </label>
                    </div>
                    <div className={styles["inv-editor-grid-row-actions"]}>
                      <button
                        type="button"
                        className="button-secondary simple-list-editor__remove"
                        onClick={() => removeNoteItem(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  </EditorGridRow>
                ))}
              </EditorGridList>
              <button type="button" className="button-secondary" onClick={addNoteItem}>
                Agregar punto
              </button>
            </div>
          </div>
          <div className="field-wide editor-extra-grid">
            {extraSectionKeys.map((key) => (
              <div key={key} className="admin-subpanel editor-extra-card">
                <div className="editor-extra-card__header">
                  <div>
                    <strong>{editableSectionLabels[key]}</strong>
                    <p className="helper-text" style={{ margin: "6px 0 0" }}>
                      {draft.sections[key].enabled ? "Activa" : "Oculta"} en la invitación.
                    </p>
                  </div>
                </div>
                <div className="form-grid" style={{ marginTop: 14 }}>
                  <label className="field">
                    <span>Titulo visible</span>
                    <input
                      value={draft.sections[key].title || ""}
                      onChange={(event) => updateExtraSection(key, { title: event.target.value })}
                      placeholder={editableSectionLabels[key]}
                    />
                  </label>
                  <label className="field">
                    <span>URL opcional</span>
                    <input
                      value={draft.sections[key].url || ""}
                      onChange={(event) => updateExtraSection(key, { url: event.target.value })}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="field-wide">
                    <span>Descripción</span>
                    <textarea
                      value={draft.sections[key].text || ""}
                      onChange={(event) => updateExtraSection(key, { text: event.target.value })}
                      placeholder="Escribe aquí el texto que se mostrará en esta sección."
                    />
                  </label>
                </div>
                <div className="simple-list-editor" style={{ marginTop: 14 }}>
                  <EditorGridList
                    columnsTemplate="minmax(0, 1fr) auto"
                    headers={["Punto", "Acciones"]}
                    emptyState={
                      <p className={styles["inv-editor-grid-empty"]}>
                        No hay puntos todavía. Agrega los que necesites para esta sección.
                      </p>
                    }
                    hasRows={(draft.sections[key].items || []).length > 0}
                  >
                    {(draft.sections[key].items || []).map((item, index) => (
                      <EditorGridRow key={`${key}-item-${index}`} columnsTemplate="minmax(0, 1fr) auto">
                        <div className={styles["inv-editor-grid-cell"]}>
                          <label className="field" htmlFor={`${key}-item-${index}`}>
                            <span className={styles["inv-editor-sr-only"]}>Punto</span>
                            <input
                              id={`${key}-item-${index}`}
                              value={item}
                              onChange={(event) => updateExtraSectionItem(key, index, event.target.value)}
                              placeholder="Escribe un punto"
                            />
                          </label>
                        </div>
                        <div className={styles["inv-editor-grid-row-actions"]}>
                          <button
                            type="button"
                            className="button-secondary simple-list-editor__remove"
                            onClick={() => removeExtraSectionItem(key, index)}
                          >
                            Quitar
                          </button>
                        </div>
                      </EditorGridRow>
                    ))}
                  </EditorGridList>
                  <button type="button" className="button-secondary" onClick={() => addExtraSectionItem(key)}>
                    Agregar punto
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
          ) : null}
          {selectedCategory === "atencion" ? (
          <>
          <div className={`field-wide ${styles["inv-editor-attention-layout"]}`}>
            <section className={`admin-subpanel ${styles["inv-editor-attention-card"]}`}>
              <div className={styles["inv-editor-attention-head"]}>
                <strong>Formulario RSVP</strong>
              </div>
              <div className={styles["inv-editor-attention-toggles"]}>
                <label className="checkbox-tile">
                  <input
                    type="checkbox"
                    checked={draft.sections.rsvp.fields.guests_count}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          rsvp: {
                            ...draft.sections.rsvp,
                            fields: { ...draft.sections.rsvp.fields, guests_count: event.target.checked },
                          },
                        },
                      })
                    }
                  />
                  <span>Permitir # asistentes</span>
                </label>
                <label className="checkbox-tile">
                  <input
                    type="checkbox"
                    checked={draft.sections.rsvp.fields.message}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          rsvp: {
                            ...draft.sections.rsvp,
                            fields: { ...draft.sections.rsvp.fields, message: event.target.checked },
                          },
                        },
                      })
                    }
                  />
                  <span>Permitir mensaje</span>
                </label>
              </div>
              <div className={`form-grid ${styles["inv-editor-attention-form-grid"]}`}>
                <div className={`field-wide ${styles["inv-editor-action-settings"]}`}>
                  <label className="checkbox-tile">
                    <input
                      type="checkbox"
                      checked={draft.sections.quick_actions.items.some((item) => item.type === "confirm")}
                      onChange={(event) => setQuickActionEnabled("confirm", event.target.checked, "Confirmar")}
                    />
                    <span>Mostrar acceso rápido al RSVP</span>
                  </label>
                  <label className="field">
                    <span>Texto del acceso rápido</span>
                    <input
                      value={draft.sections.quick_actions.items.find((item) => item.type === "confirm")?.label || "Confirmar"}
                      disabled={!draft.sections.quick_actions.items.some((item) => item.type === "confirm")}
                      onChange={(event) => updateQuickActionLabel("confirm", event.target.value)}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Botón para enviar confirmación</span>
                  <input
                    value={draft.sections.rsvp.submit_button_label || "Enviar confirmación"}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: { ...draft.sections, rsvp: { ...draft.sections.rsvp, submit_button_label: event.target.value } },
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Botón para registrar no asistencia</span>
                  <input
                    value={draft.sections.rsvp.decline_button_label || "Registrar no asistencia"}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: { ...draft.sections, rsvp: { ...draft.sections.rsvp, decline_button_label: event.target.value } },
                      })
                    }
                  />
                </label>
                <label className="field-wide">
                  <span>Botón para cancelar asistencia</span>
                  <input
                    value={draft.sections.rsvp.cancel_button_label || "Cancelar asistencia"}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: { ...draft.sections, rsvp: { ...draft.sections.rsvp, cancel_button_label: event.target.value } },
                      })
                    }
                  />
                </label>
                <label className="field-wide">
                  <span>Mensaje de RSVP cerrado</span>
                  <input
                    value={draft.sections.rsvp.closed_message}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: { ...draft.sections, rsvp: { ...draft.sections.rsvp, closed_message: event.target.value } },
                      })
                    }
                  />
                </label>
              </div>
            </section>

            <section className={`admin-subpanel ${styles["inv-editor-attention-card"]}`}>
              <div className={styles["inv-editor-attention-head"]}>
                <strong>Canal directo (WhatsApp)</strong>
              </div>
              <div className={`form-grid ${styles["inv-editor-attention-form-grid"]}`}>
                <label className="field">
                  <span>Nombre del canal directo</span>
                  <input
                    value={draft.sections.contact.name}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: { ...draft.sections, contact: { ...draft.sections.contact, name: event.target.value } },
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Texto visible del canal directo</span>
                  <input
                    value={draft.sections.contact.label}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: { ...draft.sections, contact: { ...draft.sections.contact, label: event.target.value } },
                      })
                    }
                  />
                </label>
                <MediaField label="Foto de contacto (opcional)" accept="image/jpeg,image/png,image/webp,image/avif" value={draft.sections.contact.avatar_image_url || ""} onChange={(value) => updateDraft({ ...draft, sections: { ...draft.sections, contact: { ...draft.sections.contact, avatar_image_url: value } } })} />
                <label className="field">
                  <span>WhatsApp</span>
                  <input
                    value={draft.sections.contact.whatsapp_number}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          contact: {
                            ...draft.sections.contact,
                            whatsapp_number: event.target.value,
                            whatsapp_url: event.target.value.trim()
                              ? createWhatsAppUrl(event.target.value, `Hola, quiero detalles de ${draft.sections.hero.title}.`)
                              : draft.sections.contact.whatsapp_url,
                          },
                        },
                      })
                    }
                  />
                </label>
                <label className="field-wide">
                  <span>URL de WhatsApp</span>
                  <input
                    value={draft.sections.contact.whatsapp_url}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          contact: { ...draft.sections.contact, whatsapp_url: event.target.value },
                        },
                      })
                    }
                    placeholder="https://wa.me/..."
                  />
                </label>
              </div>
            </section>
          </div>
          </>
          ) : null}
            </div>
          </EditorSection>
          ) : null}

        </div>
      </section>

      <aside className={styles["inv-editor-preview-column"]}>
      <section className={`admin-panel ${styles["inv-editor-preview-sticky"]}`}>
        <p className="eyebrow">Vista adaptable por dispositivo</p>
        <h2>Vista previa en telefono</h2>
        <div className={styles["inv-editor-preview-tools"]}>
          <label className={`field ${styles["inv-editor-device-select"]}`}>
            <select
              value={devicePresetKey}
              onChange={(event) => setDevicePresetKey(event.target.value as DevicePresetKey)}
            >
              {(Object.keys(DEVICE_PRESETS) as DevicePresetKey[]).map((presetKey) => (
                <option key={presetKey} value={presetKey}>
                  {DEVICE_PRESETS[presetKey].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="helper-text">Pantalla completa: {selectedDevicePreset.viewportWidth} × {selectedDevicePreset.viewportHeight} px CSS, reducida para caber aquí.</p>
        <div className={styles["inv-editor-device-shell"]}>
          <div className={styles["inv-editor-device-frame"]} style={deviceFrameVars}>
            <div
              ref={previewScreenRef}
              className={`${styles["inv-editor-device-screen"]} ${
                isPreviewDragging ? styles["inv-editor-device-screen--dragging"] : ""
              }`}
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={stopPreviewDrag}
              onLostPointerCapture={stopPreviewDrag}
            >
              <div className={styles["inv-editor-device-camera"]} aria-hidden="true" />
              <iframe
                key={activePreviewFrameUrl}
                ref={previewFrameRef}
                className={styles["inv-editor-device-iframe"]}
                title="Vista real de la invitación"
                src={activePreviewFrameUrl}
                onLoad={(event) => applyPreviewFrameEnhancements(event.currentTarget)}
              />
            </div>
          </div>
        </div>
      </section>
      <section className={`admin-panel ${styles["inv-editor-save-card"]}`}>
        <p className="eyebrow">Publicacion</p>
        <h2>Guardar y probar</h2>
        {!isDemo && <div className={styles["inv-editor-template-fields"]}>
          <label className="field">
            <span>Nombre de plantilla</span>
            <input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Plantilla base"
            />
          </label>
          <label className="field">
            <span>Descripción (opcional)</span>
            <input
              value={templateDescription}
              onChange={(event) => setTemplateDescription(event.target.value)}
              placeholder="Uso sugerido de esta plantilla"
            />
          </label>
          <button
            type="button"
            className="button-secondary"
            onClick={() => void handleSaveTemplate()}
            disabled={templateLoading}
          >
            {templateLoading ? "Guardando plantilla..." : "Guardar como plantilla"}
          </button>
          {templateStatus ? <p className="success-text" style={{ margin: 0 }}>{templateStatus}</p> : null}
          {templateError ? <p className="error-text" style={{ margin: 0 }}>{templateError}</p> : null}
        </div>}
        <div className={`inline-actions editor-actions ${styles["inv-editor-save-actions"]}`}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button type="button" className="button-primary" onClick={() => void handleSave()} disabled={loading} style={{ width: "100%", justifyContent: "center", gap: "6px", padding: "10px 12px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>{loading ? "Guardando..." : "Guardar cambios"}</span>
            </button>
            <button type="button" className="button-secondary" onClick={() => void handleOpenPublicInvitation()} disabled={loading} style={{ width: "100%", justifyContent: "center", gap: "6px", padding: "10px 12px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span>{isDemo ? "Abrir demo" : "Abrir invitación"}</span>
            </button>
          </div>
          {!isDemo && <button
            type="button"
            className="button-secondary"
            onClick={() => void handleOpenClientRsvpView()}
            disabled={loading}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Vista cliente RSVP
          </button>}
        </div>
        {status ? <p className="success-text" style={{ margin: 0 }}>{status}</p> : null}
        {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}
      </section>
      </aside>

      {isWhatsAppChecklistOpen ? (
        <div
          className={styles["inv-editor-modal-backdrop"]}
          role="presentation"
          onClick={() => setIsWhatsAppChecklistOpen(false)}
        >
          <section
            className={styles["inv-editor-modal"]}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wa-checklist-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles["inv-editor-modal-head"]}>
              <div>
                <p className="eyebrow">Publicacion</p>
                <h3 id="wa-checklist-title">Checklist WhatsApp</h3>
              </div>
              <button
                type="button"
                className="button-ghost"
                onClick={() => setIsWhatsAppChecklistOpen(false)}
              >
                Cerrar
              </button>
            </header>
            <ol className={styles["inv-editor-modal-list"]}>
              {WHATSAPP_QA_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </div>
  );
}

const categoryIcons: Record<EditorCategoryKey, ReactNode> = {
  base: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  portada: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  ),
  evento: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  flujo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8"></polyline>
      <line x1="4" y1="20" x2="21" y2="3"></line>
      <polyline points="21 16 21 21 16 21"></polyline>
      <line x1="15" y1="15" x2="21" y2="21"></line>
      <line x1="4" y1="4" x2="9" y2="9"></line>
    </svg>
  ),
  contenido: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  atencion: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  extras: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
};

function EditorCategoryNav({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: EditorCategoryKey;
  onSelectCategory: (category: EditorCategoryKey) => void;
}) {
  return (
    <nav className={styles["inv-editor-nav"]} aria-label="Categorias del editor">
      <section className={`admin-panel ${styles["inv-editor-nav-panel"]}`}>
        <p className="eyebrow">Categorías</p>
        <label className={styles["inv-editor-nav-select-wrap"]}>
          <span>Selecciona categoría</span>
          <select
            value={selectedCategory}
            onChange={(event) => onSelectCategory(event.target.value as EditorCategoryKey)}
          >
            {editorCategories.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <div className={styles["inv-editor-nav-list"]} role="tablist" aria-label="Categorías del editor">
          {editorCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              role="tab"
              aria-selected={selectedCategory === category.key}
              className={`${styles["inv-editor-nav-button"]} ${
                selectedCategory === category.key ? styles["inv-editor-nav-button--active"] : ""
              }`}
              onClick={() => onSelectCategory(category.key)}
            >
              {categoryIcons[category.key]}
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </section>
    </nav>
  );
}

function EditorSection({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: ReactNode;
}) {
  const hasHeader = Boolean(eyebrow);
  return (
    <section className="editor-module">
      {hasHeader ? (
        <div className="editor-module__header">
          {eyebrow ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
              <p className="editor-module__eyebrow">{eyebrow}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="editor-module__body">{children}</div>
    </section>
  );
}

function EditorGridList({
  columnsTemplate,
  headers,
  hasRows,
  emptyState,
  children,
}: {
  columnsTemplate: string;
  headers: string[];
  hasRows: boolean;
  emptyState?: ReactNode;
  children: ReactNode;
}) {
  const style = { "--inv-editor-grid-cols": columnsTemplate } as CSSProperties;

  return (
    <div className={styles["inv-editor-grid-list"]}>
      <div className={styles["inv-editor-grid-list-head"]} style={style} aria-hidden="true">
        {headers.map((header) => (
          <span key={header} className={styles["inv-editor-grid-header-cell"]}>
            {header}
          </span>
        ))}
      </div>
      <div className={styles["inv-editor-grid-list-body"]}>{hasRows ? children : emptyState}</div>
    </div>
  );
}

function EditorGridRow({
  columnsTemplate,
  children,
}: {
  columnsTemplate: string;
  children: ReactNode;
}) {
  return (
    <div className={styles["inv-editor-grid-row"]} style={{ "--inv-editor-grid-cols": columnsTemplate } as CSSProperties}>
      {children}
    </div>
  );
}

function SortableSectionItem({
  id,
  label,
  enabled,
  onToggle,
}: {
  id: SectionKey;
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles["inv-editor-flow-item"]} ${
        isDragging ? styles["inv-editor-flow-item--dragging"] : ""
      }`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className={styles["inv-editor-flow-handle"]}
        aria-label={`Reordenar ${label}`}
        {...attributes}
        {...listeners}
      >
        <span />
        <span />
        <span />
      </button>
      <span className={styles["inv-editor-flow-title"]}>{label}</span>
      <label className={styles["inv-editor-flow-toggle"]}>
        <span className={styles["inv-editor-flow-toggle-label"]}>Activa</span>
        <span className={styles["inv-editor-flow-toggle-control"]}>
          <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} />
          <span>{enabled ? "Si" : "No"}</span>
        </span>
      </label>
    </div>
  );
}

function FlowOverlayCard({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className={`${styles["inv-editor-flow-item"]} ${styles["inv-editor-flow-item--overlay"]}`}>
      <span className={styles["inv-editor-flow-handle"]} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={styles["inv-editor-flow-title"]}>{label}</span>
      <span className={styles["inv-editor-flow-toggle"]}>
        <span className={styles["inv-editor-flow-toggle-label"]}>Activa</span>
        <span className={styles["inv-editor-flow-toggle-control"]}>
          <span>{enabled ? "Si" : "No"}</span>
        </span>
      </span>
    </div>
  );
}
