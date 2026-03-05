"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
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

type DevicePresetKey =
  | "iphone_15_pro_max"
  | "iphone_13_14"
  | "galaxy_ultra"
  | "pixel_8"
  | "ipad";

type DevicePreset = {
  label: string;
  ratio: number;
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

const quickActionTypeOptions: Array<{
  value: QuickActionItem["type"];
  label: string;
}> = [
  { value: "confirm", label: "Confirmar asistencia" },
  { value: "location", label: "Ver mapa" },
  { value: "calendar", label: "Agregar al calendario" },
  { value: "share", label: "Compartir invitacion" },
];

const editorCategories: Array<{ key: EditorCategoryKey; label: string }> = [
  { key: "base", label: "Base" },
  { key: "portada", label: "Portada" },
  { key: "evento", label: "Evento" },
  { key: "flujo", label: "Flujo" },
  { key: "contenido", label: "Contenido" },
  { key: "atencion", label: "Atencion" },
  { key: "extras", label: "Extras" },
];

const DEVICE_PRESET_STORAGE_KEY = "inv-editor-device-preset";

const DEVICE_PRESETS: Record<DevicePresetKey, DevicePreset> = {
  iphone_15_pro_max: {
    label: "iPhone 15 Pro Max",
    ratio: 9 / 19.5,
    frameWidth: "clamp(250px, 23vw, 334px)",
    frameRadius: 38,
    bezel: 10,
    cameraWidth: "120px",
    cameraHeight: "20px",
    cameraRadius: "999px",
  },
  iphone_13_14: {
    label: "iPhone 13/14",
    ratio: 9 / 19.2,
    frameWidth: "clamp(246px, 22.5vw, 326px)",
    frameRadius: 36,
    bezel: 10,
    cameraWidth: "114px",
    cameraHeight: "20px",
    cameraRadius: "999px",
  },
  galaxy_ultra: {
    label: "Galaxy S23/S24 Ultra",
    ratio: 9 / 19.4,
    frameWidth: "clamp(248px, 23vw, 332px)",
    frameRadius: 32,
    bezel: 9,
    cameraWidth: "16px",
    cameraHeight: "16px",
    cameraRadius: "999px",
  },
  pixel_8: {
    label: "Pixel 8",
    ratio: 9 / 20,
    frameWidth: "clamp(244px, 22.3vw, 322px)",
    frameRadius: 34,
    bezel: 10,
    cameraWidth: "14px",
    cameraHeight: "14px",
    cameraRadius: "999px",
  },
  ipad: {
    label: "iPad",
    ratio: 3 / 4,
    frameWidth: "clamp(300px, 27vw, 410px)",
    frameRadius: 24,
    bezel: 12,
    cameraWidth: "56px",
    cameraHeight: "8px",
    cameraRadius: "999px",
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

function getEditableQuickActionType(type: string): QuickActionItem["type"] {
  if (type === "rsvp") {
    return "confirm";
  }

  if (type === "map") {
    return "location";
  }

  return quickActionTypeOptions.some((option) => option.value === type)
    ? (type as QuickActionItem["type"])
    : "confirm";
}

export function InvitationEditorForm({ invitation }: InvitationEditorFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<InvitationRecord>(() => normalizeInvitationRecord(invitation));
  const [selectedCategory, setSelectedCategory] = useState<EditorCategoryKey>("base");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("live");
  const [devicePresetKey, setDevicePresetKey] = useState<DevicePresetKey>("iphone_15_pro_max");
  const [previewVersion, setPreviewVersion] = useState(0);
  const [livePreviewVersion, setLivePreviewVersion] = useState(0);
  const [activeDragSection, setActiveDragSection] = useState<SectionKey | null>(null);
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const previewDragStateRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const orderedSectionKeys = getOrderedSectionKeys(draft.sections_order);

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
    if (previewMode !== "live") {
      return;
    }

    const timer = window.setTimeout(() => {
      setLivePreviewVersion((current) => current + 1);
    }, 520);

    return () => window.clearTimeout(timer);
  }, [previewMode, draft]);

  function getPreviewScrollElement() {
    const frame = previewFrameRef.current;
    const doc = frame?.contentDocument;
    if (!doc) {
      return null;
    }

    return (doc.scrollingElement || doc.documentElement || doc.body) as HTMLElement | null;
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
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
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
    setIsPreviewDragging(false);
  }

  function handlePreviewWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const scrollElement = getPreviewScrollElement();
    if (!scrollElement) {
      return;
    }

    event.preventDefault();
    scrollElement.scrollTop += event.deltaY;
    scrollElement.scrollLeft += event.deltaX;
  }

  function handlePreviewPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const scrollElement = getPreviewScrollElement();
    if (!scrollElement) {
      return;
    }

    previewDragStateRef.current.active = true;
    previewDragStateRef.current.pointerId = event.pointerId;
    previewDragStateRef.current.startX = event.clientX;
    previewDragStateRef.current.startY = event.clientY;
    previewDragStateRef.current.startScrollLeft = scrollElement.scrollLeft;
    previewDragStateRef.current.startScrollTop = scrollElement.scrollTop;
    setIsPreviewDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePreviewPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = previewDragStateRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    const scrollElement = getPreviewScrollElement();
    if (!scrollElement) {
      return;
    }

    scrollElement.scrollTop = dragState.startScrollTop - (event.clientY - dragState.startY);
    scrollElement.scrollLeft = dragState.startScrollLeft - (event.clientX - dragState.startX);
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

  function updateQuickAction(index: number, next: Partial<QuickActionItem>) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        quick_actions: {
          ...draft.sections.quick_actions,
          items: draft.sections.quick_actions.items.map((item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  ...next,
                }
              : item,
          ),
        },
      },
    });
  }

  function addQuickAction() {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        quick_actions: {
          ...draft.sections.quick_actions,
          items: [
            ...draft.sections.quick_actions.items,
            {
              type: "confirm",
              label: "Nueva accion",
            },
          ],
        },
      },
    });
  }

  function removeQuickAction(index: number) {
    updateDraft({
      ...draft,
      sections: {
        ...draft.sections,
        quick_actions: {
          ...draft.sections.quick_actions,
          items: draft.sections.quick_actions.items.filter((_, itemIndex) => itemIndex !== index),
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
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
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
  const livePreviewFrameUrl = `/i/${encodedSlug}?crm_live=${livePreviewVersion}`;
  const capturePreviewFrameUrl = `/i/${encodedSlug}?crm_preview=${previewVersion}`;
  const activePreviewFrameUrl = previewMode === "live" ? livePreviewFrameUrl : capturePreviewFrameUrl;
  const activeCategoryLabel =
    editorCategories.find((category) => category.key === selectedCategory)?.label || "Base";
  const selectedDevicePreset = useMemo(
    () => DEVICE_PRESETS[devicePresetKey] || DEVICE_PRESETS.iphone_15_pro_max,
    [devicePresetKey],
  );
  const deviceFrameVars = useMemo(
    () =>
      ({
        "--device-ratio": String(selectedDevicePreset.ratio),
        "--device-width": selectedDevicePreset.frameWidth,
        "--device-radius": `${selectedDevicePreset.frameRadius}px`,
        "--device-bezel": `${selectedDevicePreset.bezel}px`,
        "--device-camera-width": selectedDevicePreset.cameraWidth,
        "--device-camera-height": selectedDevicePreset.cameraHeight,
        "--device-camera-radius": selectedDevicePreset.cameraRadius,
      }) as CSSProperties,
    [selectedDevicePreset],
  );

  return (
    <div className={styles["inv-editor-page"]}>
      <EditorCategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <section className={styles["inv-editor-main"]}>
        <section className="admin-panel">
        <div className="inline-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">Editor</p>
            <h2>{draft.sections.hero.title}</h2>
            <p className="helper-text" style={{ margin: "6px 0 0" }}>
              Categoria activa: <strong>{activeCategoryLabel}</strong>
            </p>
          </div>
          <span className={`status-pill ${draft.status}`}>{getStatusLabel(draft.status)}</span>
        </div>

        <div className="editor-form-shell">
          {selectedCategory === "base" ? (
          <EditorSection
            eyebrow="Base"
            title="Configuracion general"
            description="Datos tecnicos del enlace, fechas y estado de publicacion."
          >
            <div className={`form-grid ${styles["inv-editor-form-grid"]}`}>
          <label className="field">
            <span>Slug publico</span>
            <input value={draft.slug} onChange={(event) => updateDraft({ ...draft, slug: event.target.value })} />
          </label>
          <label className="field">
            <span>Estado</span>
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
            <span>Tema</span>
            <input value={draft.theme_id} onChange={(event) => updateDraft({ ...draft, theme_id: event.target.value })} />
          </label>
          <label className="field">
            <span>Perfil de animacion</span>
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
          <label className="field-wide">
            <span>Inicio del evento</span>
            <input
              type="datetime-local"
              value={toLocalDatetimeValue(draft.event_start_at)}
              onChange={(event) => updateDraft({ ...draft, event_start_at: fromLocalDatetimeValue(event.target.value) })}
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
          <label className="field-wide">
            <span>Activa hasta</span>
            <input
              type="datetime-local"
              value={toLocalDatetimeValue(draft.active_until)}
              onChange={(event) => updateDraft({ ...draft, active_until: fromLocalDatetimeValue(event.target.value) })}
            />
          </label>
            </div>
          </EditorSection>
          ) : null}

          {selectedCategory === "flujo" ? (
          <EditorSection
            eyebrow="Flujo"
            title="Orden y estado de secciones"
            description="Arrastra, activa u oculta bloques. La invitacion publica respeta exactamente esta lista."
          >
            <div className={styles["inv-editor-flow"]}>
              <div className="helper-text">
                Arrastra cada bloque desde el asa para cambiar el orden. La invitacion publica respeta exactamente esta lista.
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
            title={`Ajustes de ${activeCategoryLabel}`}
            description="Solo se muestran los ajustes de la categoria seleccionada."
          >
            <div className={`form-grid ${styles["inv-editor-form-grid"]}`}>
          {selectedCategory === "portada" ? (
          <>
          <label className="field">
            <span>Titulo principal</span>
            <input
              value={draft.sections.hero.title}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: { ...draft.sections, hero: { ...draft.sections.hero, title: event.target.value } },
                })
              }
            />
          </label>
          <label className="field">
            <span>Subtitulo principal</span>
            <input
              value={draft.sections.hero.subtitle}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: { ...draft.sections, hero: { ...draft.sections.hero, subtitle: event.target.value } },
                })
              }
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
            />
          </label>
          <label className="field">
            <span>Linea de acento</span>
            <input
              value={draft.sections.hero.accent}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: { ...draft.sections, hero: { ...draft.sections.hero, accent: event.target.value } },
                })
              }
            />
          </label>

          <div className="field-wide admin-subpanel">
            <strong>Fondo de portada</strong>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <label className="field">
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
              <label className="checkbox-tile">
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
                <span>Efecto parallax (Ken Burns)</span>
              </label>
              <label className="field">
                <span>Intensidad</span>
                <select
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
              </label>
              {heroBackground.type === "image" ? (
                <label className="field-wide">
                  <span>URL de imagen</span>
                  <input value={heroBackground.image_url} onChange={(event) => updateHeroBackground({ image_url: event.target.value })} />
                </label>
              ) : null}
              {heroBackground.type === "video" ? (
                <>
                  <label className="field">
                    <span>URL de video</span>
                    <input value={heroBackground.video_url} onChange={(event) => updateHeroBackground({ video_url: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Poster opcional</span>
                    <input value={heroBackground.poster_url} onChange={(event) => updateHeroBackground({ poster_url: event.target.value })} />
                  </label>
                </>
              ) : null}
            </div>
          </div>

          <div className="field-wide admin-subpanel">
            <strong>Fondo para el resto de secciones</strong>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <label className="field">
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
                <>
                  <label className="checkbox-tile">
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
                    <span>Efecto parallax (Ken Burns)</span>
                  </label>
                  <label className="field">
                    <span>Intensidad</span>
                    <select
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
                  </label>
                </>
              ) : null}
              {invitationBackground.mode === "custom" ? (
                <>
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
                    <label className="field-wide">
                      <span>URL de imagen</span>
                      <input
                        value={invitationBackground.custom.image_url}
                        onChange={(event) =>
                          updateInvitationBackground({
                            custom: { ...invitationBackground.custom, image_url: event.target.value },
                          })
                        }
                      />
                    </label>
                  ) : (
                    <>
                      <label className="field">
                        <span>URL de video</span>
                        <input
                          value={invitationBackground.custom.video_url}
                          onChange={(event) =>
                            updateInvitationBackground({
                              custom: { ...invitationBackground.custom, video_url: event.target.value },
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Poster opcional</span>
                        <input
                          value={invitationBackground.custom.poster_url}
                          onChange={(event) =>
                            updateInvitationBackground({
                              custom: { ...invitationBackground.custom, poster_url: event.target.value },
                            })
                          }
                        />
                      </label>
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>

          <div className="field-wide admin-subpanel">
            <strong>Astronauta</strong>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <label className="checkbox-tile">
                <input type="checkbox" checked={heroAstronaut.enabled} onChange={(event) => updateHeroAstronaut({ enabled: event.target.checked })} />
                <span>Mostrar astronauta</span>
              </label>
              <label className="field">
                <span>URL del astronauta</span>
                <input value={heroAstronaut.image_url} onChange={(event) => updateHeroAstronaut({ image_url: event.target.value })} />
              </label>
              <label className="field">
                <span>Posicion</span>
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
                <span>Opacidad</span>
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
          </>
          ) : null}

          {selectedCategory === "evento" ? (
          <>
          <label className="field">
            <span>Lugar</span>
            <input
              value={draft.sections.event_info.venue_name}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: { ...draft.sections, event_info: { ...draft.sections.event_info, venue_name: event.target.value } },
                })
              }
            />
          </label>
          <label className="field-wide">
            <span>Direccion</span>
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
            />
          </label>
          <label className="field">
            <span>Dia de la semana</span>
            <input
              value={draft.sections.event_info.weekday_text}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: { ...draft.sections, event_info: { ...draft.sections.event_info, weekday_text: event.target.value } },
                })
              }
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
          <label className="field">
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
          <label className="field">
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
          <label className="field">
            <span>Zoom del mapa</span>
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
          <label className="field">
            <span>URL de Google Maps</span>
            <input
              value={draft.sections.map.maps_url}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: { ...draft.sections, map: { ...draft.sections.map, maps_url: event.target.value } },
                })
              }
            />
          </label>
          <label className="checkbox-tile">
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
            <span>Mapa oscuro</span>
          </label>
          </>
          ) : null}
          {selectedCategory === "contenido" ? (
          <>
          <div className="field-wide">
            <span>Acciones rapidas</span>
            <div className="admin-subpanel quick-actions-editor">
              <div className="quick-actions-editor__list">
                {draft.sections.quick_actions.items.length ? (
                  draft.sections.quick_actions.items.map((item, index) => (
                    <div key={`${item.type}-${item.label}-${index}`} className="quick-actions-editor__item">
                      <label className="field">
                        <span>Tipo</span>
                        <select
                          value={getEditableQuickActionType(String(item.type))}
                          onChange={(event) =>
                            updateQuickAction(index, {
                              type: event.target.value as QuickActionItem["type"],
                            })
                          }
                        >
                          {quickActionTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Texto del boton</span>
                        <input
                          value={item.label}
                          onChange={(event) =>
                            updateQuickAction(index, {
                              label: event.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="button-secondary quick-actions-editor__remove"
                        onClick={() => removeQuickAction(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, opacity: 0.76 }}>
                    No hay acciones todavia. Agrega una para que aparezca en la invitacion.
                  </p>
                )}
              </div>
              <button type="button" className="button-secondary" onClick={addQuickAction}>
                Agregar accion
              </button>
            </div>
          </div>
          <div className="field-wide">
            <span>Archivo visual</span>
            <div className="admin-subpanel simple-list-editor">
              <div className="form-grid" style={{ marginBottom: 12 }}>
                <label className="field">
                  <span>Maximo de imagenes visibles</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={String(draft.sections.gallery.max_images)}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          gallery: {
                            ...draft.sections.gallery,
                            max_images: Math.max(1, Number(event.target.value) || 1),
                          },
                        },
                      })
                    }
                  />
                </label>
              </div>
              <div className="simple-list-editor__list">
                {draft.sections.gallery.image_urls.length ? (
                  draft.sections.gallery.image_urls.map((item, index) => (
                    <div key={`gallery-${index}`} className="simple-list-editor__item">
                      <label className="field">
                        <span>URL de imagen {index + 1}</span>
                        <input
                          value={item}
                          onChange={(event) => updateGalleryItem(index, event.target.value)}
                          placeholder="https://..."
                        />
                      </label>
                      <button
                        type="button"
                        className="button-secondary simple-list-editor__remove"
                        onClick={() => removeGalleryItem(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, opacity: 0.76 }}>
                    No hay imagenes todavia. Agrega una para que aparezca en Archivo visual.
                  </p>
                )}
              </div>
              <button type="button" className="button-secondary" onClick={addGalleryItem}>
                Agregar imagen
              </button>
            </div>
          </div>
          <div className="field-wide">
            <span>Checklist</span>
            <div className="admin-subpanel simple-list-editor">
              <div className="simple-list-editor__list">
                {draft.sections.notes.items.length ? (
                  draft.sections.notes.items.map((item, index) => (
                    <div key={`note-${index}`} className="simple-list-editor__item">
                      <label className="field">
                        <span>Punto {index + 1}</span>
                        <input
                          value={item}
                          onChange={(event) => updateNoteItem(index, event.target.value)}
                          placeholder="Escribe un detalle"
                        />
                      </label>
                      <button
                        type="button"
                        className="button-secondary simple-list-editor__remove"
                        onClick={() => removeNoteItem(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, opacity: 0.76 }}>
                    No hay puntos todavia. Agrega uno para que aparezca en Checklist.
                  </p>
                )}
              </div>
              <button type="button" className="button-secondary" onClick={addNoteItem}>
                Agregar punto
              </button>
            </div>
          </div>
          </>
          ) : null}
          {selectedCategory === "extras" ? (
          <>
          <div className="field-wide editor-extra-grid">
            {extraSectionKeys.map((key) => (
              <div key={key} className="admin-subpanel editor-extra-card">
                <div className="editor-extra-card__header">
                  <div>
                    <strong>{editableSectionLabels[key]}</strong>
                    <p className="helper-text" style={{ margin: "6px 0 0" }}>
                      {draft.sections[key].enabled ? "Activa" : "Oculta"} en la invitacion.
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
                    <span>Descripcion</span>
                    <textarea
                      value={draft.sections[key].text || ""}
                      onChange={(event) => updateExtraSection(key, { text: event.target.value })}
                      placeholder="Escribe aqui el texto que se mostrara en esta seccion."
                    />
                  </label>
                </div>
                <div className="simple-list-editor" style={{ marginTop: 14 }}>
                  <div className="simple-list-editor__list">
                    {(draft.sections[key].items || []).length ? (
                      (draft.sections[key].items || []).map((item, index) => (
                        <div key={`${key}-item-${index}`} className="simple-list-editor__item">
                          <label className="field">
                            <span>Punto {index + 1}</span>
                            <input
                              value={item}
                              onChange={(event) => updateExtraSectionItem(key, index, event.target.value)}
                              placeholder="Escribe un punto"
                            />
                          </label>
                          <button
                            type="button"
                            className="button-secondary simple-list-editor__remove"
                            onClick={() => removeExtraSectionItem(key, index)}
                          >
                            Quitar
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ margin: 0, opacity: 0.76 }}>
                        No hay puntos todavia. Agrega los que necesites para esta seccion.
                      </p>
                    )}
                  </div>
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
          <label className="field">
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
          <label className="field">
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
          </>
          ) : null}
            </div>
          </EditorSection>
          ) : null}

          {selectedCategory === "base" ? (
          <EditorSection
            eyebrow="Share"
            title="Metadatos y expiracion"
            description="Configuracion OG y contenido de la pagina de expiracion."
          >
            <div className={`form-grid ${styles["inv-editor-form-grid"]}`}>
              <label className="field">
                <span>Titulo OG</span>
                <input value={draft.share.og_title} onChange={(event) => updateDraft({ ...draft, share: { ...draft.share, og_title: event.target.value } })} />
              </label>
              <label className="field-wide">
                <span>Descripcion OG</span>
                <input value={draft.share.og_description} onChange={(event) => updateDraft({ ...draft, share: { ...draft.share, og_description: event.target.value } })} />
              </label>
              <label className="field">
                <span>URL de imagen OG</span>
                <input value={draft.share.og_image_url} onChange={(event) => updateDraft({ ...draft, share: { ...draft.share, og_image_url: event.target.value } })} />
              </label>
              <label className="field">
                <span>Titulo al expirar</span>
                <input value={draft.expired_page.title} onChange={(event) => updateDraft({ ...draft, expired_page: { ...draft.expired_page, title: event.target.value } })} />
              </label>
              <label className="field-wide">
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
          </EditorSection>
          ) : null}

        </div>
      </section>
      </section>

      <aside className={styles["inv-editor-preview-column"]}>
      <section className={`admin-panel ${styles["inv-editor-preview-sticky"]}`}>
        <p className="eyebrow">Vista movil real</p>
        <h2>Vista previa en telefono</h2>
        <p className="helper-text">Este marco siempre carga la ruta publica real. Si el viewer React local esta activo, esa misma ruta lo usa automaticamente; si no, cae al render actual de Next.</p>
        <p className="helper-text" style={{ marginTop: 8 }}>
          Fuente activa: <strong>Ruta publica real</strong>
        </p>
        <div className={styles["inv-editor-preview-tabs"]} role="tablist" aria-label="Modo de vista previa">
          <button
            type="button"
            role="tab"
            aria-selected={previewMode === "live"}
            className={`${styles["inv-editor-preview-tab"]} ${
              previewMode === "live" ? styles["inv-editor-preview-tab--active"] : ""
            }`}
            onClick={() => setPreviewMode("live")}
          >
            Vista en vivo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={previewMode === "capture"}
            className={`${styles["inv-editor-preview-tab"]} ${
              previewMode === "capture" ? styles["inv-editor-preview-tab--active"] : ""
            }`}
            onClick={() => setPreviewMode("capture")}
          >
            Vista real (captura)
          </button>
        </div>
        <div className={styles["inv-editor-preview-tools"]}>
          <label className={`field ${styles["inv-editor-device-select"]}`}>
            <span>Dispositivo</span>
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
          <div className="inline-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                previewMode === "live"
                  ? setLivePreviewVersion((current) => current + 1)
                  : setPreviewVersion((current) => current + 1)
              }
            >
              {previewMode === "live" ? "Sincronizar vista" : "Actualizar captura"}
            </button>
          <a href={activePreviewFrameUrl} className="button-ghost" target="_blank" rel="noreferrer">
            Abrir vista actual
          </a>
          </div>
        </div>
        <div className={styles["inv-editor-device-shell"]}>
          <div className={styles["inv-editor-device-frame"]} style={deviceFrameVars}>
            <div className={styles["inv-editor-device-camera"]} aria-hidden="true" />
            <div
              className={`${styles["inv-editor-device-screen"]} ${
                isPreviewDragging ? styles["inv-editor-device-screen--dragging"] : ""
              }`}
              onWheel={handlePreviewWheel}
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={stopPreviewDrag}
              onLostPointerCapture={stopPreviewDrag}
            >
              <iframe
                key={activePreviewFrameUrl}
                ref={previewFrameRef}
                className={styles["inv-editor-device-iframe"]}
                title="Vista real de la invitacion"
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
        <p className="helper-text">Guarda cambios y abre la invitacion publica o la vista del formulario RSVP.</p>
        <div className={`inline-actions editor-actions ${styles["inv-editor-save-actions"]}`}>
          <button type="button" className="button-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          <a href={`/i/${draft.slug}`} className="button-secondary" target="_blank" rel="noreferrer">
            Abrir invitacion publica
          </a>
          <a
            href={`/i/${draft.slug}/rsvp?token=${draft.client_view_token}`}
            className="button-secondary"
            target="_blank"
            rel="noreferrer"
          >
            Vista cliente RSVP
          </a>
        </div>
        {status ? <p className="success-text" style={{ margin: 0 }}>{status}</p> : null}
        {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}
      </section>
      </aside>
    </div>
  );
}

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
        <p className="eyebrow">Categorias</p>
        <label className={styles["inv-editor-nav-select-wrap"]}>
          <span>Selecciona categoria</span>
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
        <div className={styles["inv-editor-nav-list"]} role="tablist" aria-label="Categorias del editor">
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
              {category.label}
            </button>
          ))}
        </div>
      </section>
    </nav>
  );
}

function EditorSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="editor-module">
      <div className="editor-module__header">
        <p className="editor-module__eyebrow">{eyebrow}</p>
        <h3 className="editor-module__title">{title}</h3>
        {description ? <p className="editor-module__description">{description}</p> : null}
      </div>
      <div className="editor-module__body">{children}</div>
    </section>
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
