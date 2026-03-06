import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BackgroundMediaViewer,
  ContactSectionViewer,
  CountdownSectionViewer,
  EventInfoSectionViewer,
  GallerySectionViewer,
  GenericBlockViewer,
  HeroSectionViewer,
  LightboxViewer,
  MapSectionViewer,
  NotesSectionViewer,
  QuickActionsSectionViewer,
  RsvpSectionViewer,
} from "./viewer-sections";
import {
  type AdminInvitationListSuccess,
  type ApiSuccess,
  type BackgroundMode,
  type BackgroundMediaType,
  type ClientRsvpApiSuccess,
  type ClientRsvpView,
  type GenericSection,
  type InvitationRecord,
  type QuickActionItem,
  type SectionKey,
  sectionDisplayLabels,
} from "./viewer-types";
import {
  buildGoogleCalendarUrl,
  getBackendAssetOrigin,
  getCountdown,
  getViewerRoute,
  resolveMediaUrl,
  resolveShellBackground,
  trimList,
} from "./viewer-utils";
import { RequireAuth, getSafeAdminRedirectPath, isProtectedAdminMode, type AdminAuthState } from "./RequireAuth";
import { PublicShell } from "@/components/site/PublicShell";

function formatResponseDate(input: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(input));
}

type ClientRsvpResponseStatus = "confirmed" | "cancelled" | "declined";

function normalizeGuestKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function resolveClientRsvpStatuses(responses: ClientRsvpView["summary"]["responses"]) {
  const chronological = [...responses].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const hadPreviousConfirmation = new Set<string>();
  const statusById = new Map<string, ClientRsvpResponseStatus>();

  for (const response of chronological) {
    const guestKey = normalizeGuestKey(response.name);
    if (response.attending) {
      hadPreviousConfirmation.add(guestKey);
      statusById.set(response.id, "confirmed");
      continue;
    }

    statusById.set(response.id, hadPreviousConfirmation.has(guestKey) ? "cancelled" : "declined");
  }

  return statusById;
}

function getClientRsvpStatusMeta(status: ClientRsvpResponseStatus) {
  switch (status) {
    case "confirmed":
      return { label: "Confirmado", className: "confirmed" };
    case "cancelled":
      return { label: "Cancelo", className: "cancelled" };
    case "declined":
      return { label: "No asiste", className: "declined" };
    default:
      return { label: "Sin estado", className: "draft" };
  }
}

function toLocalDatetimeValue(input: string) {
  const date = new Date(input);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function fromLocalDatetimeValue(input: string) {
  return new Date(input).toISOString();
}

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

const quickActionTypeOptions: QuickActionItem["type"][] = ["confirm", "location", "calendar", "share"];
const backgroundMediaTypeOptions: BackgroundMediaType[] = ["default", "image", "video"];
const customBackgroundTypeOptions: Array<Exclude<BackgroundMediaType, "default">> = ["image", "video"];
const backgroundModeOptions: BackgroundMode[] = ["default_app", "inherit_hero", "custom"];
const astronautPositionOptions = ["bottom-right", "bottom-left", "top-right", "top-left", "center"] as const;
const extraSectionKeys = [
  "itinerary",
  "dress_code",
  "gifts",
  "faq",
  "livestream",
  "transport",
  "lodging",
] as const;

type EditorPanelKey = "base" | "hero" | "event" | "flow" | "content" | "attention" | "extras";
type EditorPreviewMode = "live" | "screenshot";

const editorPanelTabs: Array<{ key: EditorPanelKey; label: string }> = [
  { key: "base", label: "Base" },
  { key: "hero", label: "Portada" },
  { key: "event", label: "Evento" },
  { key: "flow", label: "Flujo" },
  { key: "content", label: "Contenido" },
  { key: "attention", label: "Atencion" },
  { key: "extras", label: "Extras" },
];

type AdminPreviewDevice = {
  id: string;
  name: string;
  group: string;
  order: number;
  viewport: {
    w: number;
    h: number;
  };
  dpr: number;
  isMobile: boolean;
  hasTouch: boolean;
  userAgent: string;
};

function getEditorSectionLabel(key: SectionKey) {
  if (key === "hero") {
    return "Portada";
  }

  return sectionDisplayLabels[key];
}

function getOrderedSectionKeys(order: SectionKey[]) {
  const valid = order.filter((key) => allSectionKeys.includes(key));
  const missing = allSectionKeys.filter((key) => !valid.includes(key));
  return [...valid, ...missing];
}

function SortableSectionOrderRow({
  sectionKey,
  label,
  enabled,
  onToggle,
}: {
  sectionKey: SectionKey;
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionKey,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`viewer-section-order-row${isDragging ? " viewer-section-order-row--placeholder" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="viewer-section-order-row__handle"
        aria-label={`Reordenar ${label}`}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">≡</span>
      </button>
      <span className="viewer-section-order-row__label" title={label}>
        {label}
      </span>
      <label className="viewer-section-order-row__toggle">
        <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} />
        <span>{enabled ? "Sí" : "No"}</span>
      </label>
    </div>
  );
}

function SectionOrderRowOverlay({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="viewer-section-order-row viewer-section-order-row--overlay">
      <span className="viewer-section-order-row__handle" aria-hidden="true">
        <span aria-hidden="true">≡</span>
      </span>
      <span className="viewer-section-order-row__label" title={label}>
        {label}
      </span>
      <span className="viewer-section-order-row__toggle viewer-section-order-row__toggle--static">
        <input type="checkbox" checked={enabled} readOnly tabIndex={-1} />
        <span>{enabled ? "Sí" : "No"}</span>
      </span>
    </div>
  );
}

function getQuickActionTypeLabel(type: QuickActionItem["type"]) {
  switch (type) {
    case "confirm":
      return "Confirmar";
    case "location":
      return "Ubicacion";
    case "calendar":
      return "Calendario";
    case "share":
      return "Compartir";
    default:
      return type;
  }
}

function getBackgroundMediaTypeLabel(type: BackgroundMediaType) {
  switch (type) {
    case "default":
      return "Predeterminado";
    case "image":
      return "Imagen";
    case "video":
      return "Video";
    default:
      return type;
  }
}

function getBackgroundModeLabel(mode: BackgroundMode) {
  switch (mode) {
    case "default_app":
      return "Fondo oscuro";
    case "inherit_hero":
      return "Usar fondo de portada";
    case "custom":
      return "Personalizado";
    default:
      return mode;
  }
}

function getAstronautPositionLabel(position: (typeof astronautPositionOptions)[number]) {
  switch (position) {
    case "bottom-right":
      return "Abajo derecha";
    case "bottom-left":
      return "Abajo izquierda";
    case "top-right":
      return "Arriba derecha";
    case "top-left":
      return "Arriba izquierda";
    case "center":
      return "Centro";
    default:
      return position;
  }
}

function getEditorHeroBackground(draft: InvitationRecord) {
  return {
    type: draft.sections.hero.background?.type || (draft.sections.hero.background_image_url ? "image" : "default"),
    image_url: draft.sections.hero.background?.image_url || draft.sections.hero.background_image_url || "",
    video_url: draft.sections.hero.background?.video_url || "",
    poster_url: draft.sections.hero.background?.poster_url || "",
    kenburns: {
      enabled: Boolean(draft.sections.hero.background?.kenburns?.enabled),
      strength: draft.sections.hero.background?.kenburns?.strength || "medium",
    },
  };
}

function getEditorInvitationBackground(draft: InvitationRecord) {
  return {
    mode: draft.background?.mode || "default_app",
    kenburns: {
      enabled: Boolean(draft.background?.kenburns?.enabled),
      strength: draft.background?.kenburns?.strength || "medium",
    },
    custom: {
      type: draft.background?.custom?.type || "image",
      image_url: draft.background?.custom?.image_url || "",
      video_url: draft.background?.custom?.video_url || "",
      poster_url: draft.background?.custom?.poster_url || "",
    },
  };
}

function EditorModuleMarker({
  anchor,
  title,
}: {
  anchor?: string;
  title: string;
}) {
  return (
    <div id={anchor} className="viewer-editor-marker viewer-field--wide">
      <h3 className="viewer-editor-marker__title">{title}</h3>
    </div>
  );
}

function EditorPanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="viewer-module-panel">
      <div className="viewer-module-panel__header">
        <div className="viewer-module-panel__heading-row">
          <h3 className="viewer-module-panel__title">{title}</h3>
        </div>
      </div>
      <div className="viewer-module-panel__content">{children}</div>
    </section>
  );
}

function InvitationViewerCanvas({
  invitation,
  assetOrigin,
  countdown,
  allowLightbox = true,
}: {
  invitation: InvitationRecord;
  assetOrigin: string;
  countdown: Array<{ label: string; value: number }>;
  allowLightbox?: boolean;
}) {
  const [lightboxImage, setLightboxImage] = useState("");
  const orderedSectionKeys = getOrderedSectionKeys(invitation.sections_order);
  const mapsUrl = invitation.sections.map.maps_url?.trim();
  const noteItems = trimList(invitation.sections.notes.items);
  const galleryImages = trimList(invitation.sections.gallery.image_urls).slice(
    0,
    invitation.sections.gallery.max_images || 6,
  );
  const genericSections: Partial<Record<keyof typeof sectionDisplayLabels, GenericSection>> = {
    itinerary: invitation.sections.itinerary,
    dress_code: invitation.sections.dress_code,
    gifts: invitation.sections.gifts,
    faq: invitation.sections.faq,
    livestream: invitation.sections.livestream,
    transport: invitation.sections.transport,
    lodging: invitation.sections.lodging,
  };

  const quickActionHandlers = {
    confirm: () => {
      document.getElementById("viewer-rsvp-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    location: () => {
      const mapSection = document.getElementById("viewer-map-section");
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (mapsUrl) {
        window.open(mapsUrl, "_blank", "noopener,noreferrer");
      }
    },
    calendar: () => {
      window.open(buildGoogleCalendarUrl(invitation), "_blank", "noopener,noreferrer");
    },
    share: async () => {
      const shareUrl = `${window.location.origin}/i/${invitation.slug}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: invitation.sections.hero.title,
            text: invitation.sections.hero.subtitle,
            url: shareUrl,
          });
          return;
        } catch {
          // fall through to clipboard
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    },
  } as const;

  return (
    <>
      <div className="viewer-stage">
        <BackgroundMediaViewer
          config={resolveShellBackground(invitation)}
          assetOrigin={assetOrigin}
          className="viewer-stage__media"
          fallbackClassName="viewer-stage__fallback"
        />
        <div className="viewer-stage__content">
          {orderedSectionKeys.map((key) => {
            switch (key) {
              case "hero":
                return invitation.sections.hero.enabled ? (
                  <HeroSectionViewer key={key} invitation={invitation} assetOrigin={assetOrigin} />
                ) : null;
              case "event_info":
                return invitation.sections.event_info.enabled ? <EventInfoSectionViewer key={key} invitation={invitation} /> : null;
              case "quick_actions":
                return invitation.sections.quick_actions.enabled ? (
                  <QuickActionsSectionViewer
                    key={key}
                    items={invitation.sections.quick_actions.items}
                    onAction={(type) => void quickActionHandlers[type]()}
                  />
                ) : null;
              case "countdown":
                return invitation.sections.countdown.enabled ? (
                  <CountdownSectionViewer key={key} label={invitation.sections.countdown.label} countdown={countdown} />
                ) : null;
              case "map":
                return invitation.sections.map.enabled && mapsUrl ? (
                  <MapSectionViewer key={key} invitation={invitation} mapsUrl={mapsUrl} />
                ) : null;
              case "gallery":
                return invitation.sections.gallery.enabled ? (
                  <GallerySectionViewer
                    key={key}
                    images={galleryImages}
                    assetOrigin={assetOrigin}
                    onOpen={allowLightbox ? setLightboxImage : () => undefined}
                  />
                ) : null;
              case "notes":
                return invitation.sections.notes.enabled && noteItems.length ? (
                  <NotesSectionViewer key={key} items={noteItems} />
                ) : null;
              case "rsvp":
                return invitation.sections.rsvp.enabled ? <RsvpSectionViewer key={key} invitation={invitation} /> : null;
              case "contact":
                return invitation.sections.contact.enabled ? <ContactSectionViewer key={key} invitation={invitation} /> : null;
              default: {
                const section = genericSections[key];
                return section?.enabled ? (
                  <GenericBlockViewer key={key} title={sectionDisplayLabels[key]} data={section} />
                ) : null;
              }
            }
          })}
        </div>
      </div>

      {allowLightbox && lightboxImage ? <LightboxViewer image={lightboxImage} onClose={() => setLightboxImage("")} /> : null}
    </>
  );
}

export function App() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => {
    const serialized = searchParams.toString();
    return serialized ? `?${serialized}` : "";
  }, [searchParams]);
  const route = useMemo(() => getViewerRoute(pathname, search), [pathname, search]);
  const assetOrigin = useMemo(() => getBackendAssetOrigin(), []);
  const currentPath = useMemo(() => `${pathname}${search}`, [pathname, search]);
  const isDataRoute = route.mode !== "unknown" && route.mode !== "admin-new" && route.mode !== "admin-login";
  const isProtectedAdminRoute = isProtectedAdminMode(route.mode);
  const [invitation, setInvitation] = useState<InvitationRecord | null>(null);
  const [editorDraft, setEditorDraft] = useState<InvitationRecord | null>(null);
  const [adminInvitations, setAdminInvitations] = useState<InvitationRecord[]>([]);
  const [clientRsvpView, setClientRsvpView] = useState<ClientRsvpView | null>(null);
  const [loading, setLoading] = useState(isDataRoute);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [adminAuthState, setAdminAuthState] = useState<AdminAuthState>(isProtectedAdminRoute ? "checking" : "unauthenticated");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [editorPreviewVersion, setEditorPreviewVersion] = useState(0);
  const [countdown, setCountdown] = useState<Array<{ label: string; value: number }>>([]);
  const [draggingSectionKey, setDraggingSectionKey] = useState<SectionKey | null>(null);
  const [activeEditorPanel, setActiveEditorPanel] = useState<EditorPanelKey>("base");
  const [editorPreviewMode, setEditorPreviewMode] = useState<EditorPreviewMode>("live");
  const [previewDevices, setPreviewDevices] = useState<AdminPreviewDevice[]>([]);
  const [previewDeviceId, setPreviewDeviceId] = useState("iphone-pro-max");
  const [previewDeviceError, setPreviewDeviceError] = useState("");
  const [previewCaptureMode, setPreviewCaptureMode] = useState<"viewport" | "fullpage">("viewport");
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState("");
  const [previewScreenshotSignature, setPreviewScreenshotSignature] = useState("");
  const [previewScreenshotLoading, setPreviewScreenshotLoading] = useState(false);
  const [previewScreenshotError, setPreviewScreenshotError] = useState("");
  const [previewScreenshotCached, setPreviewScreenshotCached] = useState(false);
  const [clientRsvpActionStatus, setClientRsvpActionStatus] = useState("");
  const livePreviewScrollRef = useRef<HTMLDivElement | null>(null);
  const sectionOrderSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const livePreviewDragStateRef = useRef({
    active: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
  });
  const [isLivePreviewDragging, setIsLivePreviewDragging] = useState(false);
  const hasRedirectedToAdminNewRef = useRef(false);
  const hasRedirectedAfterLoginRef = useRef(false);

  function stopLivePreviewDrag() {
    if (!livePreviewDragStateRef.current.active) {
      return;
    }

    livePreviewDragStateRef.current.active = false;
    livePreviewDragStateRef.current.pointerId = -1;
    setIsLivePreviewDragging(false);
  }

  function handleLivePreviewPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const container = livePreviewScrollRef.current;
    if (!container) {
      return;
    }

    livePreviewDragStateRef.current.active = true;
    livePreviewDragStateRef.current.pointerId = event.pointerId;
    livePreviewDragStateRef.current.startY = event.clientY;
    livePreviewDragStateRef.current.startScrollTop = container.scrollTop;
    setIsLivePreviewDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleLivePreviewPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const container = livePreviewScrollRef.current;
    const dragState = livePreviewDragStateRef.current;

    if (!container || !dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    container.scrollTop = dragState.startScrollTop - (event.clientY - dragState.startY);
    event.preventDefault();
  }

  function handleLivePreviewPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (livePreviewDragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stopLivePreviewDrag();
  }

  async function handleClientRsvpCopyLink() {
    if (typeof window === "undefined") {
      return;
    }

    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setClientRsvpActionStatus("Enlace copiado.");
    } catch {
      setClientRsvpActionStatus("No se pudo copiar automaticamente.");
    }

    window.setTimeout(() => {
      setClientRsvpActionStatus((current) => (current === "Enlace copiado." ? "" : current));
    }, 2200);
  }

  async function handleClientRsvpSendLink() {
    if (typeof window === "undefined") {
      return;
    }

    const shareUrl = window.location.href;
    const invitationTitle = clientRsvpView?.invitation.sections.hero.title || "Invitacion";
    const shareText = `Te comparto el enlace privado RSVP de ${invitationTitle}: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `RSVP - ${invitationTitle}`,
          text: shareText,
          url: shareUrl,
        });
        setClientRsvpActionStatus("Enlace enviado.");
        return;
      } catch {
        // Continue to fallback below.
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  async function handleClientRsvpExportPdf() {
    if (!clientRsvpView) {
      return;
    }

    try {
      const [{ jsPDF }, jsPdfAutoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = (jsPdfAutoTableModule as { default: (doc: unknown, options: unknown) => void }).default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      const contentWidth = pageWidth - marginX * 2;
      let cursorY = 52;

      doc.setFillColor(15, 23, 42);
      doc.roundedRect(marginX, cursorY, contentWidth, 86, 14, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(21);
      doc.text("Panel cliente RSVP", marginX + 18, cursorY + 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(191, 206, 225);
      doc.text(clientRsvpView.invitation.sections.hero.title, marginX + 18, cursorY + 50);
      doc.text(`Generado: ${formatResponseDate(new Date().toISOString())}`, marginX + 18, cursorY + 68);
      cursorY += 106;

      const summaryItems = [
        { label: "Asisten", value: clientRsvpView.summary.attendingCount },
        { label: "No asisten", value: clientRsvpView.summary.notAttendingCount },
        { label: "Total", value: clientRsvpView.summary.totalCount },
      ];
      const summaryWidth = (contentWidth - 20) / 3;

      for (const [index, item] of summaryItems.entries()) {
        const cardX = marginX + index * (summaryWidth + 10);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(cardX, cursorY, summaryWidth, 74, 10, 10, "FD");
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(item.label, cardX + summaryWidth / 2, cursorY + 24, { align: "center" });
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text(String(item.value), cardX + summaryWidth / 2, cursorY + 54, { align: "center" });
      }
      cursorY += 94;

      const responseStatuses = resolveClientRsvpStatuses(clientRsvpView.summary.responses);
      const tableRows = clientRsvpView.summary.responses.map((response) => {
        const responseStatus = responseStatuses.get(response.id) || "declined";
        const statusMeta = getClientRsvpStatusMeta(responseStatus);
        const attendees = response.attending
          ? Math.max(1, Number(response.guests_count) || 1)
          : Math.max(0, Number(response.guests_count) || 0);

        return [
          response.name,
          String(attendees),
          response.message?.trim() || "Sin mensaje",
          formatResponseDate(response.created_at),
          statusMeta.label,
        ];
      });

      autoTable(doc, {
        startY: cursorY,
        margin: { left: marginX, right: marginX, top: 36, bottom: 36 },
        head: [["Invitado / Familia", "Asistentes", "Mensaje", "Fecha y hora", "Estado"]],
        body: tableRows,
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
          fontSize: 10,
          cellPadding: 8,
        },
        styles: {
          fontSize: 10,
          cellPadding: 8,
          lineColor: [203, 213, 225],
          lineWidth: 0.6,
          textColor: [15, 23, 42],
          valign: "middle",
        },
        columnStyles: {
          1: { halign: "center", fontStyle: "bold", fontSize: 13 },
          4: { halign: "center" },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      doc.save(`rsvp-${clientRsvpView.invitation.slug}.pdf`);
      setClientRsvpActionStatus("PDF descargado.");
    } catch {
      setClientRsvpActionStatus("No se pudo generar el PDF.");
    }

    window.setTimeout(() => {
      setClientRsvpActionStatus((current) => (current === "PDF descargado." ? "" : current));
    }, 2200);
  }

  useEffect(() => {
    if (route.mode !== "admin-editor") {
      return;
    }

    const sections = Array.from(document.querySelectorAll<HTMLElement>(".editor-section"));
    if (!sections.length) {
      return;
    }

    const sectionKeyMap: Record<string, EditorPanelKey> = {
      "section-base": "base",
      "section-portada": "hero",
      "section-evento": "event",
      "section-flujo": "flow",
      "section-contenido": "content",
      "section-atencion": "attention",
      "section-extras": "extras",
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        const nextTarget = visibleEntries[0]?.target as HTMLElement | undefined;
        if (!nextTarget) {
          return;
        }

        const nextPanel = sectionKeyMap[nextTarget.id];
        if (nextPanel) {
          setActiveEditorPanel(nextPanel);
        }
      },
      {
        rootMargin: "-96px 0px -55% 0px",
        threshold: [0.15, 0.35, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [route.mode, editorDraft]);

  useEffect(() => {
    if (!isProtectedAdminRoute) {
      setAdminAuthState("unauthenticated");
      return;
    }

    let cancelled = false;
    setAdminAuthState("checking");

    async function verifyAdminSession() {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "include",
        });

        if (cancelled) {
          return;
        }

        setAdminAuthState(response.ok ? "authenticated" : "unauthenticated");
      } catch {
        if (!cancelled) {
          setAdminAuthState("unauthenticated");
        }
      }
    }

    void verifyAdminSession();

    return () => {
      cancelled = true;
    };
  }, [isProtectedAdminRoute]);

  useEffect(() => {
    if (route.mode !== "admin-editor" || adminAuthState !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function loadPreviewDevices() {
      setPreviewDeviceError("");

      try {
        const response = await fetch("/api/preview/devices", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los dispositivos.");
        }

        const payload = (await response.json()) as { devices?: AdminPreviewDevice[] };
        if (cancelled) {
          return;
        }

        const devices = (payload.devices || []).slice().sort((a, b) => a.order - b.order);
        setPreviewDevices(devices);
        if (devices.length && !devices.some((device) => device.id === previewDeviceId)) {
          setPreviewDeviceId(devices[0].id);
        }
      } catch {
        if (!cancelled) {
          setPreviewDeviceError("No se pudieron cargar los perfiles de dispositivo.");
        }
      }
    }

    void loadPreviewDevices();

    return () => {
      cancelled = true;
    };
  }, [adminAuthState, route.mode]);

  useEffect(() => {
    if (route.mode === "unknown") {
      return;
    }

    if (isProtectedAdminRoute && adminAuthState === "checking") {
      setLoading(true);
      setError("");
      return;
    }

    if (isProtectedAdminRoute && adminAuthState !== "authenticated") {
      setLoading(false);
      setError("");
      return;
    }

    if (route.mode === "admin-new" || route.mode === "admin-login") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      setSaveStatus("");
      setSaveError("");
      setInvitation(null);
      setEditorDraft(null);
      setClientRsvpView(null);
      setAdminInvitations([]);

      try {
        if (route.mode === "client-rsvp") {
          if (!route.token) {
            throw new Error("El token es obligatorio para la vista cliente.");
          }

          const response = await fetch(
            `/api/public/invitations/${encodeURIComponent(route.slug)}/client-rsvp?token=${encodeURIComponent(route.token)}`,
            { cache: "no-store" },
          );
          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error || "No se pudo cargar la vista cliente.");
          }
          const payload = (await response.json()) as ClientRsvpApiSuccess;
          if (!cancelled) {
            setClientRsvpView(payload.result);
            setInvitation(payload.result.invitation);
          }
          return;
        }

        if (route.mode === "admin-list") {
          const response = await fetch("/api/admin/invitations", { cache: "no-store", credentials: "include" });
          if (response.status === 401) {
            if (!cancelled) {
              setAdminAuthState("unauthenticated");
            }
            return;
          }
          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error || "No se pudo cargar la lista de invitaciones.");
          }
          const payload = (await response.json()) as AdminInvitationListSuccess;
          if (!cancelled) {
            setAdminInvitations(payload.invitations);
          }
          return;
        }

        if (route.mode === "admin-editor") {
          const response = await fetch(`/api/admin/invitations/${encodeURIComponent(route.id)}`, {
            cache: "no-store",
            credentials: "include",
          });
          if (response.status === 401) {
            if (!cancelled) {
              setAdminAuthState("unauthenticated");
            }
            return;
          }
          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error || "No se pudo cargar la invitacion.");
          }
          const payload = (await response.json()) as ApiSuccess;
          if (!cancelled) {
            setInvitation(payload.invitation);
            setEditorDraft(payload.invitation);
          }
          return;
        }

        const response = await fetch(`/api/public/invitations/${encodeURIComponent(route.slug)}`, { cache: "no-store" });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || "No se pudo cargar la invitacion.");
        }
        const payload = (await response.json()) as ApiSuccess;
        if (!cancelled) {
          setInvitation(payload.invitation);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la vista.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [adminAuthState, isProtectedAdminRoute, route.id, route.mode, route.slug, route.token]);

  useEffect(() => {
    if (route.mode !== "admin-new" || adminAuthState !== "authenticated") {
      hasRedirectedToAdminNewRef.current = false;
      return;
    }

    if (hasRedirectedToAdminNewRef.current) {
      return;
    }

    const targetUrl = `${assetOrigin}/admin/invitations/new`;
    if (targetUrl === window.location.href || assetOrigin === window.location.origin) {
      return;
    }

    hasRedirectedToAdminNewRef.current = true;
    const timeoutId = window.setTimeout(() => {
      window.location.replace(targetUrl);
    }, 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [adminAuthState, assetOrigin, route.mode]);

  useEffect(() => {
    if (!invitation?.sections.countdown.enabled || route.mode !== "invitation") {
      setCountdown([]);
      return;
    }

    const run = () => setCountdown(getCountdown(invitation.sections.countdown.target_at));
    run();
    const timer = window.setInterval(run, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [invitation, route.mode]);

  useEffect(() => {
    if (route.mode !== "admin-editor" || !editorDraft || editorPreviewMode !== "screenshot") {
      return;
    }

    void requestEditorPreviewScreenshot();
  }, [route.mode, editorDraft?.id, previewDeviceId, previewCaptureMode, editorPreviewVersion, editorPreviewMode]);

  useEffect(() => {
    if (route.mode !== "admin-login" || adminAuthState !== "authenticated") {
      hasRedirectedAfterLoginRef.current = false;
      return;
    }

    if (hasRedirectedAfterLoginRef.current) {
      return;
    }

    const targetPath = getSafeAdminRedirectPath(new URLSearchParams(window.location.search).get("redirect"));
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (currentPath === targetPath) {
      return;
    }

    hasRedirectedAfterLoginRef.current = true;
    window.location.replace(targetPath);
  }, [adminAuthState, route.mode]);

  async function handleSaveEditor() {
    if (!editorDraft) {
      return;
    }

    setSaving(true);
    setSaveStatus("");
    setSaveError("");

    try {
      const response = await fetch(`/api/admin/invitations/${encodeURIComponent(editorDraft.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editorDraft),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo guardar.");
      }

      setInvitation(editorDraft);
      setSaveStatus("Cambios guardados.");
      setEditorPreviewVersion((current) => current + 1);
    } catch (submitError) {
      setSaveError(submitError instanceof Error ? submitError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function requestEditorPreviewScreenshot(force = false) {
    if (!editorDraft) {
      return;
    }

    const requestSignature = `${previewDeviceId}:${previewCaptureMode}`;
    setPreviewScreenshotLoading(true);
    setPreviewScreenshotError("");

    try {
      const response = await fetch(
        `/api/preview?invitationId=${encodeURIComponent(editorDraft.id)}&deviceId=${encodeURIComponent(
          previewDeviceId,
        )}&mode=${encodeURIComponent(previewCaptureMode)}${force ? "&force=1" : ""}`,
        { cache: "no-store" },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        previewUrl?: string;
        cached?: boolean;
      };

      if (!response.ok || !payload.previewUrl) {
        throw new Error(payload.error || "No se pudo generar la captura.");
      }

      setPreviewScreenshotUrl(resolveMediaUrl(payload.previewUrl, assetOrigin));
      setPreviewScreenshotSignature(requestSignature);
      setPreviewScreenshotCached(Boolean(payload.cached));
    } catch (requestError) {
      setPreviewScreenshotError(
        requestError instanceof Error ? requestError.message : "No se pudo generar la captura.",
      );
    } finally {
      setPreviewScreenshotLoading(false);
    }
  }

  function updateEditorDraft(next: InvitationRecord) {
    setEditorDraft(next);
  }

  function updateEditorSectionEnabled(key: SectionKey, enabled: boolean) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        [key]: {
          ...editorDraft.sections[key],
          enabled,
        },
      },
    });
  }

  function moveEditorSectionToTarget(sourceKey: SectionKey, targetKey: SectionKey) {
    if (!editorDraft || sourceKey === targetKey) {
      return;
    }

    const currentOrder = getOrderedSectionKeys(editorDraft.sections_order);
    const sourceIndex = currentOrder.indexOf(sourceKey);
    const targetIndex = currentOrder.indexOf(targetKey);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    updateEditorDraft({
      ...editorDraft,
      sections_order: nextOrder,
    });
  }

  function handleEditorSectionSortStart(event: DragStartEvent) {
    setDraggingSectionKey(event.active.id as SectionKey);
  }

  function handleEditorSectionSortCancel() {
    setDraggingSectionKey(null);
  }

  function handleEditorSectionSortEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggingSectionKey(null);

    if (!over || active.id === over.id) {
      return;
    }

    moveEditorSectionToTarget(active.id as SectionKey, over.id as SectionKey);
  }

  function updateEditorQuickAction(index: number, next: Partial<QuickActionItem>) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        quick_actions: {
          ...editorDraft.sections.quick_actions,
          items: editorDraft.sections.quick_actions.items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, ...next } : item,
          ),
        },
      },
    });
  }

  function addEditorQuickAction() {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        quick_actions: {
          ...editorDraft.sections.quick_actions,
          items: [
            ...editorDraft.sections.quick_actions.items,
            {
              type: "confirm",
              label: "Nueva accion",
            },
          ],
        },
      },
    });
  }

  function removeEditorQuickAction(index: number) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        quick_actions: {
          ...editorDraft.sections.quick_actions,
          items: editorDraft.sections.quick_actions.items.filter((_, itemIndex) => itemIndex !== index),
        },
      },
    });
  }

  function updateEditorGalleryItem(index: number, value: string) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        gallery: {
          ...editorDraft.sections.gallery,
          image_urls: editorDraft.sections.gallery.image_urls.map((item, itemIndex) =>
            itemIndex === index ? value : item,
          ),
        },
      },
    });
  }

  function addEditorGalleryItem() {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        gallery: {
          ...editorDraft.sections.gallery,
          image_urls: [...editorDraft.sections.gallery.image_urls, ""],
        },
      },
    });
  }

  function removeEditorGalleryItem(index: number) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        gallery: {
          ...editorDraft.sections.gallery,
          image_urls: editorDraft.sections.gallery.image_urls.filter((_, itemIndex) => itemIndex !== index),
        },
      },
    });
  }

  function updateEditorNoteItem(index: number, value: string) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        notes: {
          ...editorDraft.sections.notes,
          items: editorDraft.sections.notes.items.map((item, itemIndex) => (itemIndex === index ? value : item)),
        },
      },
    });
  }

  function addEditorNoteItem() {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        notes: {
          ...editorDraft.sections.notes,
          items: [...editorDraft.sections.notes.items, ""],
        },
      },
    });
  }

  function removeEditorNoteItem(index: number) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        notes: {
          ...editorDraft.sections.notes,
          items: editorDraft.sections.notes.items.filter((_, itemIndex) => itemIndex !== index),
        },
      },
    });
  }

  function updateEditorMap(
    next: Omit<Partial<InvitationRecord["sections"]["map"]>, "embed"> & {
      embed?: Partial<NonNullable<InvitationRecord["sections"]["map"]["embed"]>>;
    },
  ) {
    if (!editorDraft) {
      return;
    }

    const currentEmbed = editorDraft.sections.map.embed || {
      lat: 19.220703435663584,
      lng: -99.10241678480557,
      zoom: 16,
    };

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        map: {
          ...editorDraft.sections.map,
          ...next,
          embed: {
            ...currentEmbed,
            ...(next.embed || {}),
          },
        },
      },
    });
  }

  function updateEditorRsvp(
    next: Omit<Partial<InvitationRecord["sections"]["rsvp"]>, "fields"> & {
      fields?: Partial<InvitationRecord["sections"]["rsvp"]["fields"]>;
    },
  ) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        rsvp: {
          ...editorDraft.sections.rsvp,
          ...next,
          fields: {
            ...editorDraft.sections.rsvp.fields,
            ...(next.fields || {}),
          },
        },
      },
    });
  }

  function updateEditorContact(next: Partial<InvitationRecord["sections"]["contact"]>) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        contact: {
          ...editorDraft.sections.contact,
          ...next,
        },
      },
    });
  }

  function updateEditorGenericSection(key: (typeof extraSectionKeys)[number], next: Partial<GenericSection>) {
    if (!editorDraft) {
      return;
    }

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        [key]: {
          ...editorDraft.sections[key],
          ...next,
        },
      },
    });
  }

  function updateEditorGenericSectionItem(key: (typeof extraSectionKeys)[number], index: number, value: string) {
    if (!editorDraft) {
      return;
    }

    const currentItems = editorDraft.sections[key].items || [];
    updateEditorGenericSection(key, {
      items: currentItems.map((item, itemIndex) => (itemIndex === index ? value : item)),
    });
  }

  function addEditorGenericSectionItem(key: (typeof extraSectionKeys)[number]) {
    if (!editorDraft) {
      return;
    }

    const currentItems = editorDraft.sections[key].items || [];
    updateEditorGenericSection(key, {
      items: [...currentItems, ""],
    });
  }

  function removeEditorGenericSectionItem(key: (typeof extraSectionKeys)[number], index: number) {
    if (!editorDraft) {
      return;
    }

    const currentItems = editorDraft.sections[key].items || [];
    updateEditorGenericSection(key, {
      items: currentItems.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  function updateEditorHeroBackground(
    next: Omit<Partial<ReturnType<typeof getEditorHeroBackground>>, "kenburns"> & {
      kenburns?: Partial<ReturnType<typeof getEditorHeroBackground>["kenburns"]>;
    },
  ) {
    if (!editorDraft) {
      return;
    }

    const current = getEditorHeroBackground(editorDraft);
    const merged = {
      ...current,
      ...next,
      kenburns: {
        ...current.kenburns,
        ...(next.kenburns || {}),
      },
    };

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        hero: {
          ...editorDraft.sections.hero,
          background: merged,
          background_image_url:
            merged.type === "image"
              ? merged.image_url
              : merged.type === "video"
                ? merged.poster_url || merged.image_url
                : "",
        },
      },
    });
  }

  function updateEditorAstronaut(next: Partial<NonNullable<InvitationRecord["sections"]["hero"]["astronaut"]>>) {
    if (!editorDraft) {
      return;
    }

    const current = {
      enabled: editorDraft.sections.hero.astronaut?.enabled ?? true,
      image_url: editorDraft.sections.hero.astronaut?.image_url || "",
      position: editorDraft.sections.hero.astronaut?.position || "bottom-right",
      opacity: editorDraft.sections.hero.astronaut?.opacity ?? 1,
    };

    updateEditorDraft({
      ...editorDraft,
      sections: {
        ...editorDraft.sections,
        hero: {
          ...editorDraft.sections.hero,
          astronaut: {
            ...current,
            ...next,
          },
        },
      },
    });
  }

  function updateEditorInvitationBackground(
    next: Omit<Partial<ReturnType<typeof getEditorInvitationBackground>>, "kenburns" | "custom"> & {
      kenburns?: Partial<ReturnType<typeof getEditorInvitationBackground>["kenburns"]>;
      custom?: Partial<ReturnType<typeof getEditorInvitationBackground>["custom"]>;
    },
  ) {
    if (!editorDraft) {
      return;
    }

    const current = getEditorInvitationBackground(editorDraft);
    const merged = {
      ...current,
      ...next,
      kenburns: {
        ...current.kenburns,
        ...(next.kenburns || {}),
      },
      custom: {
        ...current.custom,
        ...(next.custom || {}),
      },
    };

    updateEditorDraft({
      ...editorDraft,
      background: merged,
    });
  }

  async function handleAdminLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo iniciar sesion.");
      }

      const redirectTarget = getSafeAdminRedirectPath(new URLSearchParams(window.location.search).get("redirect"));
      window.location.replace(redirectTarget);
    } catch (submitError) {
      setLoginError(submitError instanceof Error ? submitError.message : "No se pudo iniciar sesion.");
    } finally {
      setLoginLoading(false);
    }
  }

  const adminGuardFallback = (
    <main className="viewer-shell viewer-shell--centered">
      <section className="viewer-card">
        <p className="viewer-eyebrow">Acceso administrativo</p>
        <h1>Verificando acceso...</h1>
      </section>
    </main>
  );

  if (route.mode === "unknown") {
    return (
      <PublicShell showSiteLink centered>
        <main className="auth-wrap">
          <section className="auth-card viewer-card">
            <div className="viewer-admin-topbar viewer-admin-topbar--compact">
              <div>
                <p className="viewer-eyebrow">Editor</p>
                <h1>CRM React</h1>
              </div>
            </div>
            <p className="viewer-section__subtitle">Rutas soportadas desde este frontend:</p>
            <div className="viewer-stack-list">
              <p><code>/i/cumple-7-luis-arturo-astronautas</code></p>
              <p><code>/i/cumple-7-luis-arturo-astronautas/rsvp?token=...</code></p>
              <p><code>/admin/login</code></p>
              <p><code>/admin/invitations</code></p>
              <p><code>/admin/invitations/[id]</code></p>
            </div>
          </section>
        </main>
      </PublicShell>
    );
  }

  if (route.mode === "admin-login") {
    const redirectTarget = getSafeAdminRedirectPath(new URLSearchParams(window.location.search).get("redirect"));

    return (
      <PublicShell showLogout={false} showSiteLink centered>
        <section className="auth-card viewer-card">
          <p className="viewer-eyebrow">Acceso administrativo</p>
          <h1>Login del CRM</h1>
          <p className="viewer-section__subtitle">Inicia sesion para continuar con el panel administrativo.</p>
          <form className="viewer-stack-list" onSubmit={handleAdminLoginSubmit}>
            <label className="viewer-field">
              <span>Email</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
            </label>
            <label className="viewer-field">
              <span>Contrasena</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
              />
            </label>
            <button type="submit" className="viewer-link" disabled={loginLoading}>
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
            {loginError ? <p className="viewer-error-text">{loginError}</p> : null}
            <p className="viewer-response-meta">
              <span>Redireccion al entrar:</span>
              <span>{redirectTarget}</span>
            </p>
          </form>
        </section>
      </PublicShell>
    );
  }

  if (route.mode === "admin-new") {
    const targetUrl = `${assetOrigin}/admin/invitations/new`;
    const isSameOriginFallback = assetOrigin === window.location.origin;

    return (
      <RequireAuth enabled={isProtectedAdminRoute} authState={adminAuthState} redirectPath={currentPath} fallback={adminGuardFallback}>
        <PublicShell showSiteLink centered>
          <main className="auth-wrap">
            <section className="auth-card viewer-card">
              <div className="viewer-admin-topbar viewer-admin-topbar--compact">
                <div>
                  <p className="viewer-eyebrow">Editor</p>
                  <h1>Ruta historica</h1>
                </div>
              </div>
              <p className="viewer-section__subtitle">
                {isSameOriginFallback
                  ? "Abre esta ruta desde el backend de Next para usar el formulario historico."
                  : "Abriendo el formulario del panel Next..."}
              </p>
              <p>
                <a className="viewer-link" href={targetUrl}>
                  Ir a crear invitacion
                </a>
              </p>
            </section>
          </main>
        </PublicShell>
      </RequireAuth>
    );
  }

  if (loading) {
    return (
      <main className="viewer-shell viewer-shell--centered">
        <section className="viewer-card">
          <p className="viewer-eyebrow">Cargando</p>
          <h1>Preparando vista...</h1>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="viewer-shell viewer-shell--centered">
        <section className="viewer-card">
          <p className="viewer-eyebrow">Error</p>
          <h1>No disponible</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (route.mode === "admin-list") {
    return (
      <RequireAuth enabled={isProtectedAdminRoute} authState={adminAuthState} redirectPath={currentPath} fallback={adminGuardFallback}>
        <PublicShell showSiteLink>
          <main className="viewer-admin-shell">
            <div className="viewer-admin-container">
              <section className="viewer-card">
                <div className="viewer-admin-topbar">
                  <div>
                    <p className="viewer-eyebrow">CRM React</p>
                    <h1>Invitaciones</h1>
                  </div>
                </div>
                <p className="viewer-section__subtitle">Lista inicial del editor migrado. Usa esta vista para entrar al detalle React.</p>
                <div className="viewer-response-list">
                  {adminInvitations.map((item) => (
                    <article key={item.id} className="viewer-response-item">
                      <strong>{item.sections.hero.title}</strong>
                      <div className="viewer-response-meta">
                        <span>{item.slug}</span>
                        <span>{item.status === "published" ? "Publicada" : "Borrador"}</span>
                      </div>
                      <div className="viewer-admin-actions">
                        <a className="viewer-link viewer-link--muted" href={`/admin/invitations/${item.id}`}>
                          Editar en React
                        </a>
                        <a className="viewer-link" href={`/i/${item.slug}`} target="_blank" rel="noreferrer">
                          Abrir publica
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </PublicShell>
      </RequireAuth>
    );
  }

  if (route.mode === "admin-editor") {
    if (!editorDraft) {
      return (
        <RequireAuth enabled={isProtectedAdminRoute} authState={adminAuthState} redirectPath={currentPath} fallback={adminGuardFallback}>
          {null}
        </RequireAuth>
      );
    }

    const orderedSectionKeys = getOrderedSectionKeys(editorDraft.sections_order);
    const editorHeroBackground = getEditorHeroBackground(editorDraft);
    const editorInvitationBackground = getEditorInvitationBackground(editorDraft);
    const selectedPreviewDevice =
      previewDevices.find((device) => device.id === previewDeviceId) ||
      previewDevices[0] || {
        id: "iphone-pro-max",
        name: "iPhone Pro Max",
        group: "ios",
        order: 1,
        viewport: { w: 430, h: 932 },
        dpr: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: "",
      };
    const currentPreviewSignature = `${previewDeviceId}:${previewCaptureMode}`;
    const hasMatchingPreviewScreenshot =
      Boolean(previewScreenshotUrl) && previewScreenshotSignature === currentPreviewSignature;
    const editorLiveCountdown = editorDraft.sections.countdown.enabled
      ? getCountdown(editorDraft.sections.countdown.target_at)
      : [];
    const previewDisplayWidth = Math.min(selectedPreviewDevice.viewport.w, 304);
    const previewShellWidth = Math.min(previewDisplayWidth + 24, 328);
    const previewDisplayHeight = Math.round(
      previewDisplayWidth * (selectedPreviewDevice.viewport.h / selectedPreviewDevice.viewport.w),
    );
    const livePreviewScale = previewDisplayWidth / selectedPreviewDevice.viewport.w;
    const previewDeviceShellStyle = {
      ["--preview-device-width" as string]: `${selectedPreviewDevice.viewport.w}px`,
      ["--preview-device-height" as string]: `${selectedPreviewDevice.viewport.h}px`,
      ["--preview-display-width" as string]: `${previewDisplayWidth}px`,
      ["--preview-shell-width" as string]: `${previewShellWidth}px`,
      ["--live-preview-scale" as string]: String(livePreviewScale),
    } as CSSProperties;
    const previewViewportStyle = {
      width: `${previewDisplayWidth}px`,
      height: `${previewDisplayHeight}px`,
    } as CSSProperties;
    const editorSections: Array<{ key: EditorPanelKey; id: string; label: string }> = [
      { key: "base", id: "section-base", label: "Base" },
      { key: "hero", id: "section-portada", label: "Portada" },
      { key: "event", id: "section-evento", label: "Evento" },
      { key: "flow", id: "section-flujo", label: "Flujo" },
      { key: "content", id: "section-contenido", label: "Contenido" },
      { key: "attention", id: "section-atencion", label: "Atencion" },
      { key: "extras", id: "section-extras", label: "Extras" },
    ];
    const scrollToEditorSection = (panel: EditorPanelKey, targetId: string) => {
      const section = document.getElementById(targetId);
      if (!section) {
        return;
      }

      setActiveEditorPanel(panel);
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
      <RequireAuth enabled={isProtectedAdminRoute} authState={adminAuthState} redirectPath={currentPath} fallback={adminGuardFallback}>
      <PublicShell showSiteLink>
      <main className="editor-page viewer-admin-shell">
        <div className="viewer-admin-container editor-grid">
          <section className="viewer-card editor-form">
            <div className={`editor-sticky-header${activeEditorPanel !== "base" ? " editor-sticky-header--collapsed" : ""}`}>
          <div className="viewer-admin-topbar viewer-admin-topbar--compact">
            <div>
              <p className="viewer-eyebrow">Editor</p>
              <h1>Editor de invitación</h1>
            </div>
          </div>
          <div className="viewer-module-nav editor-module-nav" role="tablist" aria-label="Secciones del editor">
            {editorSections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`viewer-module-chip${activeEditorPanel === section.key ? " viewer-module-chip--active" : ""}`}
                aria-pressed={activeEditorPanel === section.key}
                aria-current={activeEditorPanel === section.key ? "page" : undefined}
                onClick={() => scrollToEditorSection(section.key, section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
            </div>
          <div className="viewer-form editor-sections">
            <section id="section-base" className="editor-section">
              <div className="editor-card">
                <EditorModuleMarker
                  title="Publicacion"
                />
            <div className="pub-row">
              <label className="viewer-field pub-slug">
                <span>Slug publico</span>
                <input
                  className="field-full"
                  value={editorDraft.slug}
                  onChange={(event) => setEditorDraft({ ...editorDraft, slug: event.target.value })}
                />
              </label>
              <label className="viewer-field pub-status">
                <span>Estado</span>
                <select
                  className="field-auto"
                  value={editorDraft.status}
                  onChange={(event) =>
                    setEditorDraft({
                      ...editorDraft,
                      status: event.target.value as InvitationRecord["status"],
                    })
                  }
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicada</option>
                </select>
              </label>
            </div>
              </div>
            </section>
            <section id="section-portada" className="editor-section">
              <div className="editor-card cover-card">
                <EditorModuleMarker
                  title="Portada"
                />
            <div className="cover-card__top-row cover-card__top-row--compact">
              <label className="viewer-field">
                <span>Etiqueta superior</span>
                <input
                  value={editorDraft.sections.hero.badge}
                  onChange={(event) =>
                    setEditorDraft({
                      ...editorDraft,
                      sections: {
                        ...editorDraft.sections,
                        hero: {
                          ...editorDraft.sections.hero,
                          badge: event.target.value,
                        },
                      },
                    })
                  }
                />
              </label>
              <label className="viewer-field">
                <span>Código</span>
                <input
                  value={editorDraft.sections.hero.accent}
                  onChange={(event) =>
                    setEditorDraft({
                      ...editorDraft,
                      sections: {
                        ...editorDraft.sections,
                        hero: {
                          ...editorDraft.sections.hero,
                          accent: event.target.value,
                        },
                      },
                    })
                  }
                />
              </label>
            </div>
            <div className="cover-card__top-row">
              <label className="viewer-field cover-card__field--primary">
                <span>Título principal</span>
                <input
                  value={editorDraft.sections.hero.title}
                  onChange={(event) =>
                    setEditorDraft({
                      ...editorDraft,
                      sections: {
                        ...editorDraft.sections,
                        hero: {
                          ...editorDraft.sections.hero,
                          title: event.target.value,
                        },
                      },
                    })
                  }
                />
              </label>
              <label className="viewer-field">
                <span>Subtítulo principal</span>
                <input
                  value={editorDraft.sections.hero.subtitle}
                  onChange={(event) =>
                    setEditorDraft({
                      ...editorDraft,
                      sections: {
                        ...editorDraft.sections,
                        hero: {
                          ...editorDraft.sections.hero,
                          subtitle: event.target.value,
                        },
                      },
                    })
                  }
                />
              </label>
            </div>
            <div className="viewer-field viewer-field--wide">
              <span>Fondo de portada</span>
              <div className="viewer-stack-list">
                <div className="viewer-stack-item">
                  <div className="cover-card__controls-row">
                    <label className="viewer-field cover-card__control cover-card__control--auto">
                      <span>Tipo</span>
                      <select
                        className="cover-card__select"
                        value={editorHeroBackground.type}
                        onChange={(event) =>
                          updateEditorHeroBackground({
                            type: event.target.value as BackgroundMediaType,
                          })
                        }
                      >
                        {backgroundMediaTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {getBackgroundMediaTypeLabel(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="viewer-field cover-card__control cover-card__control--auto cover-card__toggle-field">
                      <span>Efecto Ken Burns</span>
                      <label className="viewer-toggle cover-card__toggle">
                        <input
                          type="checkbox"
                          checked={editorHeroBackground.kenburns.enabled}
                          onChange={(event) =>
                            updateEditorHeroBackground({
                              kenburns: { enabled: event.target.checked },
                            })
                          }
                        />
                        <span>{editorHeroBackground.kenburns.enabled ? "Sí" : "No"}</span>
                      </label>
                    </div>
                    <label className="viewer-field cover-card__control cover-card__control--auto">
                      <span>Intensidad</span>
                      <select
                        className="cover-card__select"
                        value={editorHeroBackground.kenburns.strength}
                        onChange={(event) =>
                          updateEditorHeroBackground({
                            kenburns: { strength: event.target.value as "low" | "medium" | "high" },
                          })
                        }
                      >
                        <option value="low">Suave</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </label>
                  </div>
                  {editorHeroBackground.type === "image" ? (
                    <label className="viewer-field">
                      <span>URL de imagen</span>
                      <input
                        value={editorHeroBackground.image_url}
                        onChange={(event) =>
                          updateEditorHeroBackground({
                            image_url: event.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                    </label>
                  ) : null}
                  {editorHeroBackground.type === "video" ? (
                    <div className="viewer-inline-grid">
                      <label className="viewer-field">
                        <span>URL de video</span>
                        <input
                          value={editorHeroBackground.video_url}
                          onChange={(event) =>
                            updateEditorHeroBackground({
                              video_url: event.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </label>
                      <label className="viewer-field">
                        <span>Póster de video</span>
                        <input
                          value={editorHeroBackground.poster_url}
                          onChange={(event) =>
                            updateEditorHeroBackground({
                              poster_url: event.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="viewer-field viewer-field--wide">
              <span>Astronauta</span>
              <div className="viewer-stack-list">
                <div className="viewer-stack-item">
                  <div className="cover-card__controls-row cover-card__controls-row--astronaut">
                    <div className="viewer-field cover-card__control cover-card__control--auto cover-card__toggle-field">
                      <span>Visible</span>
                      <label className="viewer-toggle cover-card__toggle">
                        <input
                          type="checkbox"
                          checked={editorDraft.sections.hero.astronaut?.enabled ?? true}
                          onChange={(event) =>
                            updateEditorAstronaut({
                              enabled: event.target.checked,
                            })
                          }
                        />
                        <span>{editorDraft.sections.hero.astronaut?.enabled ?? true ? "Sí" : "No"}</span>
                      </label>
                    </div>
                    <label className="viewer-field cover-card__control cover-card__control--auto">
                      <span>Posicion</span>
                      <select
                        className="cover-card__select"
                        value={editorDraft.sections.hero.astronaut?.position || "bottom-right"}
                        onChange={(event) =>
                          updateEditorAstronaut({
                            position: event.target.value as (typeof astronautPositionOptions)[number],
                          })
                        }
                      >
                        {astronautPositionOptions.map((option) => (
                          <option key={option} value={option}>
                            {getAstronautPositionLabel(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="viewer-field cover-card__control cover-card__slider-field">
                      <span>Opacidad ({(editorDraft.sections.hero.astronaut?.opacity ?? 1).toFixed(2)})</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={editorDraft.sections.hero.astronaut?.opacity ?? 1}
                        onChange={(event) =>
                          updateEditorAstronaut({
                            opacity: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="viewer-field">
                    <span>URL del astronauta</span>
                    <input
                      value={editorDraft.sections.hero.astronaut?.image_url || ""}
                      onChange={(event) =>
                        updateEditorAstronaut({
                          image_url: event.target.value,
                        })
                      }
                      placeholder="/assets/... o https://..."
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="viewer-field viewer-field--wide">
              <span>Fondo del resto de secciones</span>
              <div className="viewer-stack-list">
                <div className="viewer-stack-item">
                  <div className="cover-card__controls-row">
                    <label className="viewer-field cover-card__control cover-card__control--auto">
                      <span>Modo</span>
                      <select
                        className="cover-card__select"
                        value={editorInvitationBackground.mode}
                        onChange={(event) =>
                          updateEditorInvitationBackground({
                            mode: event.target.value as BackgroundMode,
                          })
                        }
                      >
                        {backgroundModeOptions.map((option) => (
                          <option key={option} value={option}>
                            {getBackgroundModeLabel(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="viewer-field cover-card__control cover-card__control--auto cover-card__toggle-field">
                      <span>Efecto Ken Burns</span>
                      <label className="viewer-toggle cover-card__toggle">
                        <input
                          type="checkbox"
                          checked={editorInvitationBackground.kenburns.enabled}
                          onChange={(event) =>
                            updateEditorInvitationBackground({
                              kenburns: { enabled: event.target.checked },
                            })
                          }
                        />
                        <span>{editorInvitationBackground.kenburns.enabled ? "Sí" : "No"}</span>
                      </label>
                    </div>
                    <label className="viewer-field cover-card__control cover-card__control--auto">
                      <span>Intensidad</span>
                      <select
                        className="cover-card__select"
                        value={editorInvitationBackground.kenburns.strength}
                        onChange={(event) =>
                          updateEditorInvitationBackground({
                            kenburns: { strength: event.target.value as "low" | "medium" | "high" },
                          })
                        }
                      >
                        <option value="low">Suave</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </label>
                  </div>
                  {editorInvitationBackground.mode === "custom" ? (
                    <>
                      <div className="viewer-inline-grid">
                        <label className="viewer-field">
                          <span>Tipo personalizado</span>
                          <select
                            value={editorInvitationBackground.custom.type}
                            onChange={(event) =>
                              updateEditorInvitationBackground({
                                custom: {
                                  type: event.target.value as "image" | "video",
                                },
                              })
                            }
                          >
                            {customBackgroundTypeOptions.map((option) => (
                              <option key={option} value={option}>
                                {getBackgroundMediaTypeLabel(option)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {editorInvitationBackground.custom.type === "image" ? (
                        <label className="viewer-field">
                          <span>URL de imagen</span>
                          <input
                            value={editorInvitationBackground.custom.image_url}
                            onChange={(event) =>
                              updateEditorInvitationBackground({
                                custom: { image_url: event.target.value },
                              })
                            }
                            placeholder="https://..."
                          />
                        </label>
                      ) : (
                        <div className="viewer-inline-grid">
                          <label className="viewer-field">
                            <span>URL de video</span>
                            <input
                              value={editorInvitationBackground.custom.video_url}
                              onChange={(event) =>
                                updateEditorInvitationBackground({
                                  custom: { video_url: event.target.value },
                                })
                              }
                              placeholder="https://..."
                            />
                          </label>
                          <label className="viewer-field">
                            <span>Póster de video</span>
                            <input
                              value={editorInvitationBackground.custom.poster_url}
                              onChange={(event) =>
                                updateEditorInvitationBackground({
                                  custom: { poster_url: event.target.value },
                                })
                              }
                              placeholder="https://..."
                            />
                          </label>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
              </div>
            </section>
            <section id="section-evento" className="editor-section">
              <div className="editor-card event-card">
                <EditorModuleMarker
                  title="Datos del evento"
                />
                <div className="event-row-3">
                  <label className="viewer-field event-row-3__field">
                    <span>Inicio del evento</span>
                    <input
                      type="datetime-local"
                      value={toLocalDatetimeValue(editorDraft.event_start_at)}
                      onChange={(event) =>
                        setEditorDraft({
                          ...editorDraft,
                          event_start_at: fromLocalDatetimeValue(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="viewer-field event-row-3__field event-row-3__field--grow">
                    <span>Cuenta regresiva</span>
                    <input
                      value={editorDraft.sections.countdown.label}
                      onChange={(event) =>
                        setEditorDraft({
                          ...editorDraft,
                          sections: {
                            ...editorDraft.sections,
                            countdown: {
                              ...editorDraft.sections.countdown,
                              label: event.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                  <label className="viewer-field event-row-3__field">
                    <span>Lugar</span>
                    <input
                      value={editorDraft.sections.event_info.venue_name}
                      onChange={(event) =>
                        setEditorDraft({
                          ...editorDraft,
                          sections: {
                            ...editorDraft.sections,
                            event_info: {
                              ...editorDraft.sections.event_info,
                              venue_name: event.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                </div>
                <label className="viewer-field viewer-field--wide event-card__address">
                  <span>Direccion</span>
                  <input
                    value={editorDraft.sections.event_info.address_text}
                    onChange={(event) =>
                      setEditorDraft({
                        ...editorDraft,
                        sections: {
                          ...editorDraft.sections,
                          event_info: {
                            ...editorDraft.sections.event_info,
                            address_text: event.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
              </div>
            </section>
            <section id="section-flujo" className="editor-section">
              <div className="editor-card">
                <EditorModuleMarker
                  title="Orden y visibilidad"
                />
                <div className="viewer-field viewer-field--wide viewer-section-order-field">
                  <DndContext
                    sensors={sectionOrderSensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleEditorSectionSortStart}
                    onDragCancel={handleEditorSectionSortCancel}
                    onDragEnd={handleEditorSectionSortEnd}
                  >
                    <SortableContext items={orderedSectionKeys} strategy={rectSortingStrategy}>
                      <div className="viewer-section-order-grid">
                        {orderedSectionKeys.map((key) => (
                          <SortableSectionOrderRow
                            key={key}
                            sectionKey={key}
                            label={getEditorSectionLabel(key)}
                            enabled={editorDraft.sections[key].enabled}
                            onToggle={(enabled) => updateEditorSectionEnabled(key, enabled)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {draggingSectionKey ? (
                        <SectionOrderRowOverlay
                          label={getEditorSectionLabel(draggingSectionKey)}
                          enabled={editorDraft.sections[draggingSectionKey].enabled}
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              </div>
            </section>
            <section id="section-contenido" className="editor-section">
              <div className="editor-card">
                <EditorModuleMarker
                  title="Bloques de contenido"
                />
            <div className="viewer-field viewer-field--wide">
              <span>Acciones rapidas</span>
              <div className="viewer-stack-list">
                {editorDraft.sections.quick_actions.items.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="viewer-stack-item">
                    <div className="viewer-inline-grid">
                      <label className="viewer-field">
                        <span>Tipo</span>
                        <select
                          value={item.type}
                          onChange={(event) =>
                            updateEditorQuickAction(index, {
                              type: event.target.value as QuickActionItem["type"],
                            })
                          }
                        >
                          {quickActionTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {getQuickActionTypeLabel(option)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="viewer-field">
                        <span>Texto</span>
                        <input
                          value={item.label}
                          onChange={(event) =>
                            updateEditorQuickAction(index, {
                              label: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="viewer-mini-button"
                      onClick={() => removeEditorQuickAction(index)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button type="button" className="viewer-mini-button" onClick={addEditorQuickAction}>
                  Agregar accion
                </button>
              </div>
            </div>
            <div className="viewer-field viewer-field--wide">
              <span>Archivo visual</span>
              <div className="viewer-stack-list">
                {editorDraft.sections.gallery.image_urls.map((item, index) => (
                  <div key={`gallery-${index}`} className="viewer-stack-item">
                    <label className="viewer-field">
                      <span>Imagen {index + 1}</span>
                      <input
                        value={item}
                        onChange={(event) => updateEditorGalleryItem(index, event.target.value)}
                        placeholder="https://..."
                      />
                    </label>
                    <button
                      type="button"
                      className="viewer-mini-button"
                      onClick={() => removeEditorGalleryItem(index)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button type="button" className="viewer-mini-button" onClick={addEditorGalleryItem}>
                  Agregar imagen
                </button>
              </div>
            </div>
            <div className="viewer-field viewer-field--wide">
              <span>Checklist</span>
              <div className="viewer-stack-list">
                {editorDraft.sections.notes.items.map((item, index) => (
                  <div key={`note-${index}`} className="viewer-stack-item">
                    <label className="viewer-field">
                      <span>Punto {index + 1}</span>
                      <input
                        value={item}
                        onChange={(event) => updateEditorNoteItem(index, event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className="viewer-mini-button"
                      onClick={() => removeEditorNoteItem(index)}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button type="button" className="viewer-mini-button" onClick={addEditorNoteItem}>
                  Agregar punto
                </button>
              </div>
            </div>
              </div>
            </section>
            <section id="section-atencion" className="editor-section">
              <div className="editor-card">
                <EditorModuleMarker
                  title="Mapa y asistencia"
                />
            <div className="viewer-field viewer-field--wide">
              <span>Mapa</span>
              <div className="viewer-stack-list">
                <div className="viewer-stack-item">
                  <div className="viewer-inline-grid">
                    <label className="viewer-field">
                      <span>Latitud</span>
                      <input
                        type="number"
                        step="0.000001"
                        value={editorDraft.sections.map.embed?.lat ?? 19.220703435663584}
                        onChange={(event) =>
                          updateEditorMap({
                            embed: { lat: Number(event.target.value) },
                          })
                        }
                      />
                    </label>
                    <label className="viewer-field">
                      <span>Longitud</span>
                      <input
                        type="number"
                        step="0.000001"
                        value={editorDraft.sections.map.embed?.lng ?? -99.10241678480557}
                        onChange={(event) =>
                          updateEditorMap({
                            embed: { lng: Number(event.target.value) },
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="viewer-inline-grid">
                    <label className="viewer-field">
                      <span>Zoom</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={editorDraft.sections.map.embed?.zoom ?? 16}
                        onChange={(event) =>
                          updateEditorMap({
                            embed: { zoom: Number(event.target.value) },
                          })
                        }
                      />
                    </label>
                    <label className="viewer-field">
                      <span>Mapa oscuro</span>
                      <label className="viewer-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(editorDraft.sections.map.dark)}
                          onChange={(event) =>
                            updateEditorMap({
                              dark: event.target.checked,
                            })
                          }
                        />
                        <span>{editorDraft.sections.map.dark ? "Sí" : "No"}</span>
                      </label>
                    </label>
                  </div>
                  <label className="viewer-field">
                    <span>Direccion visible</span>
                    <input
                      value={editorDraft.sections.map.address_text}
                      onChange={(event) =>
                        updateEditorMap({
                          address_text: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="viewer-field">
                    <span>URL de Google Maps</span>
                    <input
                      value={editorDraft.sections.map.maps_url}
                      onChange={(event) =>
                        updateEditorMap({
                          maps_url: event.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="viewer-field viewer-field--wide">
              <span>RSVP y canal directo</span>
              <div className="viewer-stack-list">
                <div className="viewer-stack-item">
                  <div className="viewer-inline-grid">
                    <label className="viewer-field">
                      <span>Permitir asistentes</span>
                      <label className="viewer-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(
                            editorDraft.sections.rsvp.fields.guests_count ??
                              editorDraft.sections.rsvp.fields.allow_guests_count,
                          )}
                          onChange={(event) =>
                            updateEditorRsvp({
                              fields: {
                                guests_count: event.target.checked,
                                allow_guests_count: event.target.checked,
                              },
                            })
                          }
                        />
                        <span>
                          {editorDraft.sections.rsvp.fields.guests_count ??
                          editorDraft.sections.rsvp.fields.allow_guests_count
                            ? "Sí"
                            : "No"}
                        </span>
                      </label>
                    </label>
                    <label className="viewer-field">
                      <span>Permitir mensaje</span>
                      <label className="viewer-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(
                            editorDraft.sections.rsvp.fields.message ??
                              editorDraft.sections.rsvp.fields.allow_message,
                          )}
                          onChange={(event) =>
                            updateEditorRsvp({
                              fields: {
                                message: event.target.checked,
                                allow_message: event.target.checked,
                              },
                            })
                          }
                        />
                        <span>
                          {editorDraft.sections.rsvp.fields.message ?? editorDraft.sections.rsvp.fields.allow_message
                            ? "Sí"
                            : "No"}
                        </span>
                      </label>
                    </label>
                  </div>
                  <label className="viewer-field">
                    <span>Mensaje de RSVP cerrado</span>
                    <input
                      value={editorDraft.sections.rsvp.closed_message}
                      onChange={(event) =>
                        updateEditorRsvp({
                          closed_message: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="viewer-stack-item">
                  <div className="viewer-inline-grid">
                    <label className="viewer-field">
                      <span>Nombre de contacto</span>
                      <input
                        value={editorDraft.sections.contact.name}
                        onChange={(event) =>
                          updateEditorContact({
                            name: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="viewer-field">
                      <span>Etiqueta</span>
                      <input
                        value={editorDraft.sections.contact.label}
                        onChange={(event) =>
                          updateEditorContact({
                            label: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="viewer-inline-grid">
                    <label className="viewer-field">
                      <span>WhatsApp</span>
                      <input
                        value={editorDraft.sections.contact.whatsapp_number}
                        onChange={(event) =>
                          updateEditorContact({
                            whatsapp_number: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="viewer-field">
                      <span>URL de WhatsApp</span>
                      <input
                        value={editorDraft.sections.contact.whatsapp_url}
                        onChange={(event) =>
                          updateEditorContact({
                            whatsapp_url: event.target.value,
                          })
                        }
                        placeholder="https://wa.me/..."
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
              </div>
            </section>
            <section id="section-extras" className="editor-section">
              <div className="editor-card">
                <EditorModuleMarker
                  title="Modulos opcionales"
                />
            <div className="viewer-field viewer-field--wide">
              <span>Modulos extra</span>
              <div className="viewer-stack-list">
                {extraSectionKeys.map((key) => {
                  const section = editorDraft.sections[key];
                  const items = section.items || [];

                  return (
                    <div key={key} className="viewer-stack-item">
                      <div className="viewer-inline-actions">
                        <strong>{getEditorSectionLabel(key)}</strong>
                        <label className="viewer-toggle">
                          <input
                            type="checkbox"
                            checked={section.enabled}
                            onChange={(event) => updateEditorSectionEnabled(key, event.target.checked)}
                          />
                          <span>{section.enabled ? "Sí" : "No"}</span>
                        </label>
                      </div>
                      <div className="viewer-inline-grid">
                        <label className="viewer-field">
                          <span>Titulo visible</span>
                          <input
                            value={section.title || ""}
                            onChange={(event) => updateEditorGenericSection(key, { title: event.target.value })}
                          />
                        </label>
                        <label className="viewer-field">
                          <span>URL opcional</span>
                          <input
                            value={section.url || ""}
                            onChange={(event) => updateEditorGenericSection(key, { url: event.target.value })}
                            placeholder="https://..."
                          />
                        </label>
                      </div>
                      <label className="viewer-field">
                        <span>Descripcion</span>
                        <textarea
                          value={section.text || ""}
                          onChange={(event) => updateEditorGenericSection(key, { text: event.target.value })}
                        />
                      </label>
                      <div className="viewer-stack-list">
                        {items.map((item, index) => (
                          <div key={`${key}-${index}`} className="viewer-stack-item">
                            <label className="viewer-field">
                              <span>Punto {index + 1}</span>
                              <input
                                value={item}
                                onChange={(event) => updateEditorGenericSectionItem(key, index, event.target.value)}
                              />
                            </label>
                            <button
                              type="button"
                              className="viewer-mini-button"
                              onClick={() => removeEditorGenericSectionItem(key, index)}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="viewer-mini-button"
                          onClick={() => addEditorGenericSectionItem(key)}
                        >
                          Agregar punto
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
              </div>
            </section>
            {saveStatus ? <p className="viewer-success-text">{saveStatus}</p> : null}
            {saveError ? <p className="viewer-error-text">{saveError}</p> : null}
          </div>
        </section>

        <aside className="viewer-card editor-preview preview-panel">
          <div className="viewer-preview-mode-tabs" role="tablist" aria-label="Modos de vista previa">
            <button
              type="button"
              className={`viewer-preview-mode-tab${editorPreviewMode === "live" ? " viewer-preview-mode-tab--active" : ""}`}
              aria-pressed={editorPreviewMode === "live"}
              onClick={() => setEditorPreviewMode("live")}
            >
              Vista en vivo
            </button>
            <button
              type="button"
              className={`viewer-preview-mode-tab${editorPreviewMode === "screenshot" ? " viewer-preview-mode-tab--active" : ""}`}
              aria-pressed={editorPreviewMode === "screenshot"}
              onClick={() => setEditorPreviewMode("screenshot")}
            >
              Vista real (captura)
            </button>
          </div>
          <p className="viewer-section__subtitle">
            {editorPreviewMode === "live"
              ? "Refleja cambios al instante (no requiere guardar)"
              : "Captura deterministica del estado guardado"}
          </p>
          {editorPreviewMode === "live" ? (
            <div className="viewer-preview-toolbar viewer-preview-toolbar--compact">
              <label className="viewer-field">
                <select value={previewDeviceId} onChange={(event) => setPreviewDeviceId(event.target.value)}>
                  {previewDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="viewer-preview-toolbar">
              <label className="viewer-field">
                <select value={previewDeviceId} onChange={(event) => setPreviewDeviceId(event.target.value)}>
                  {previewDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="viewer-field">
                <span>Modo</span>
                <select
                  value={previewCaptureMode}
                  onChange={(event) => setPreviewCaptureMode(event.target.value as "viewport" | "fullpage")}
                >
                  <option value="viewport">Area visible</option>
                  <option value="fullpage">Pagina completa</option>
                </select>
              </label>
              <button
                type="button"
                className="viewer-mini-button"
                onClick={() => void requestEditorPreviewScreenshot(true)}
                disabled={previewScreenshotLoading}
              >
                {previewScreenshotLoading ? "Generando..." : "Regenerar"}
              </button>
            </div>
          )}
          {previewDeviceError ? <p className="viewer-error-text">{previewDeviceError}</p> : null}
          <div className="viewer-phone-shell">
            <div className="viewer-phone-shell__scaler" style={previewDeviceShellStyle}>
              <div className="viewer-phone-device">
                <div className="viewer-phone-device__camera" />
                <div className="viewer-phone-device__viewport" style={previewViewportStyle}>
                  {editorPreviewMode === "live" ? (
                    <div
                      ref={livePreviewScrollRef}
                      className={`viewer-phone-device__canvas${isLivePreviewDragging ? " viewer-phone-device__canvas--dragging" : ""}`}
                      onPointerDown={handleLivePreviewPointerDown}
                      onPointerMove={handleLivePreviewPointerMove}
                      onPointerUp={handleLivePreviewPointerUp}
                      onPointerCancel={stopLivePreviewDrag}
                      onLostPointerCapture={stopLivePreviewDrag}
                    >
                      <div className="viewer-phone-device__canvas-scale">
                        <div className="app-viewer">
                          <div className="theme-viewer">
                            <div className="viewer-shell viewer-shell--embedded">
                              <InvitationViewerCanvas
                                invitation={editorDraft}
                                assetOrigin={assetOrigin}
                                countdown={editorLiveCountdown}
                                allowLightbox={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : hasMatchingPreviewScreenshot ? (
                    <>
                      <img
                        key={`${previewScreenshotUrl}-${editorPreviewVersion}`}
                        className={`viewer-phone-device__image${
                          previewCaptureMode === "fullpage" ? " viewer-phone-device__image--fullpage" : ""
                        }`}
                        alt={`Vista previa en ${selectedPreviewDevice.name}`}
                        src={previewScreenshotUrl}
                      />
                      {previewScreenshotLoading ? (
                        <div className="viewer-phone-device__loading-overlay">
                          Actualizando captura real...
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="viewer-phone-device__placeholder">
                      <p className="viewer-phone-device__placeholder-title">
                        {previewScreenshotLoading ? "Generando captura real..." : "Vista previa lista al regenerar"}
                      </p>
                      <p className="viewer-phone-device__placeholder-copy">
                        {previewScreenshotLoading
                          ? "El simulador espera la captura estable de Playwright para evitar brincos de escala."
                          : "Usa Regenerar para obtener una captura exacta del dispositivo seleccionado."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="viewer-admin-actions preview-actions">
            <button type="button" className="viewer-link" onClick={() => void handleSaveEditor()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <a className="viewer-link viewer-link--muted" href={`/i/${editorDraft.slug}`} target="_blank" rel="noreferrer">
              Abrir pública
            </a>
            <a className="viewer-link viewer-link--muted" href="/admin/invitations">
              Volver a lista
            </a>
          </div>
          <div className="viewer-preview-meta">
            <span>
              {selectedPreviewDevice.name}: {selectedPreviewDevice.viewport.w} x {selectedPreviewDevice.viewport.h}
            </span>
            <span>
              {editorPreviewMode === "live"
                ? "Interactivo con HMR"
                : previewCaptureMode === "fullpage"
                  ? "Pagina completa"
                  : "Solo viewport"}
            </span>
            {editorPreviewMode === "screenshot" ? <span>{previewScreenshotCached ? "Caché activa" : "Nueva captura"}</span> : null}
          </div>
          {editorPreviewMode === "screenshot" && previewScreenshotError ? (
            <div>
              <p className="viewer-error-text">{previewScreenshotError}</p>
              <button
                type="button"
                className="viewer-mini-button"
                onClick={() => void requestEditorPreviewScreenshot(true)}
                style={{ marginTop: 10 }}
              >
                Reintentar
              </button>
            </div>
          ) : null}
          {saveStatus ? <p className="viewer-success-text">{saveStatus}</p> : null}
          {saveError ? <p className="viewer-error-text">{saveError}</p> : null}
        </aside>
        </div>
      </main>
      </PublicShell>
      </RequireAuth>
    );
  }

  if (route.mode === "client-rsvp" && clientRsvpView) {
    const responseStatuses = resolveClientRsvpStatuses(clientRsvpView.summary.responses);

    return (
      <PublicShell showLogout={false} showSiteLink>
        <section className="viewer-admin-topbar viewer-admin-topbar--compact">
          <div>
            <h1>Panel cliente RSVP</h1>
            <p className="helper-text">Acceso privado para revisar respuestas registradas.</p>
          </div>
          <div className="viewer-inline-actions">
            <button type="button" className="button-secondary" onClick={() => void handleClientRsvpCopyLink()}>
              Copiar enlace
            </button>
            <button type="button" className="button-secondary" onClick={() => void handleClientRsvpSendLink()}>
              Enviar enlace
            </button>
            <button type="button" className="button-primary" onClick={() => void handleClientRsvpExportPdf()}>
              Exportar PDF
            </button>
          </div>
        </section>

        {clientRsvpActionStatus ? <p className="success-text">{clientRsvpActionStatus}</p> : null}

        <section className="admin-panel">
          <div className="inline-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="eyebrow">Vista cliente RSVP</p>
              <h2>{clientRsvpView.invitation.sections.hero.title}</h2>
              <p className="muted">Resumen privado de respuestas registradas hasta ahora.</p>
            </div>
            <span className="status-pill published">Acceso privado</span>
          </div>
        </section>

        <div className="viewer-admin-container client-rsvp-layout">
          <section className="admin-panel">
            <p className="eyebrow">Totales</p>
            <h2>Resumen RSVP</h2>
            <div className="client-rsvp-summary-grid">
              <article className="client-rsvp-summary-item">
                <span className="client-rsvp-summary-label">Asisten</span>
                <strong>{clientRsvpView.summary.attendingCount}</strong>
              </article>
              <article className="client-rsvp-summary-item">
                <span className="client-rsvp-summary-label">No asisten</span>
                <strong>{clientRsvpView.summary.notAttendingCount}</strong>
              </article>
              <article className="client-rsvp-summary-item">
                <span className="client-rsvp-summary-label">Total</span>
                <strong>{clientRsvpView.summary.totalCount}</strong>
              </article>
            </div>
          </section>

          <section className="admin-panel">
            <div className="inline-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <h2>Respuestas</h2>
              <span className="status-pill draft">{clientRsvpView.summary.responses.length}</span>
            </div>
            {clientRsvpView.summary.responses.length ? (
              <div className="client-rsvp-table-wrap">
                <table className="client-rsvp-table">
                  <thead>
                    <tr>
                      <th>Invitado / Familia</th>
                      <th>Asistentes</th>
                      <th>Mensaje</th>
                      <th>Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientRsvpView.summary.responses.map((response) => {
                      const responseStatus = responseStatuses.get(response.id) || "declined";
                      const statusMeta = getClientRsvpStatusMeta(responseStatus);
                      const attendees = response.attending
                        ? Math.max(1, Number(response.guests_count) || 1)
                        : Math.max(0, Number(response.guests_count) || 0);

                      return (
                        <tr key={response.id}>
                          <td data-label="Invitado / Familia">
                            <div className="client-rsvp-guest">
                              <strong>{response.name}</strong>
                              <span className={`status-pill ${statusMeta.className}`}>{statusMeta.label}</span>
                            </div>
                          </td>
                          <td data-label="Asistentes" className="client-rsvp-attendees">
                            <strong>{attendees}</strong>
                          </td>
                          <td data-label="Mensaje">{response.message?.trim() || "Sin mensaje"}</td>
                          <td data-label="Fecha y hora">{formatResponseDate(response.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="viewer-empty-copy">Todavia no hay respuestas registradas.</p>
            )}
          </section>
        </div>
      </PublicShell>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <main className="app-viewer viewer-shell viewer-shell--public">
      <div className="theme-viewer">
        <div className="viewer-public-frame">
          <InvitationViewerCanvas invitation={invitation} assetOrigin={assetOrigin} countdown={countdown} />
        </div>
      </div>
    </main>
  );
}
