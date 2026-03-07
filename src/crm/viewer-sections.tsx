import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { BackgroundMediaConfig, GenericSection, InvitationRecord, QuickActionItem } from "./viewer-types";
import { normalizeKenBurns, resolveHeroBackground, resolveMediaUrl, splitTitle, trimList } from "./viewer-utils";

const HERO_TYPEWRITER_STEP_MS = 82;
const HERO_TYPEWRITER_LINE_GAP_STEPS = 3;
let hasPlayedAstronautTypewriter = false;

function getKenBurnsClassName(config?: BackgroundMediaConfig) {
  const kenburns = normalizeKenBurns(config?.kenburns);
  if (!kenburns.enabled) {
    return "";
  }

  return ` viewer-media--kenburns viewer-media--kenburns-${kenburns.strength}`;
}

function getAstronautClass(
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center",
) {
  switch (position) {
    case "bottom-left":
      return " hero-cinematic__astronaut-art--bottom-left";
    case "top-left":
      return " hero-cinematic__astronaut-art--top-left";
    case "top-right":
      return " hero-cinematic__astronaut-art--top-right";
    case "center":
      return " hero-cinematic__astronaut-art--center";
    default:
      return "";
  }
}

export function BackgroundMediaViewer({
  config,
  assetOrigin,
  className,
  fallbackClassName,
}: {
  config: BackgroundMediaConfig;
  assetOrigin: string;
  className: string;
  fallbackClassName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const kenBurnsClassName = getKenBurnsClassName(config);
  const imageUrl = resolveMediaUrl(config.image_url, assetOrigin);
  const posterUrl = resolveMediaUrl(config.poster_url, assetOrigin);
  const videoUrl = resolveMediaUrl(config.video_url, assetOrigin);

  if (config.type === "video" && videoUrl) {
    return (
      <div className={className} aria-hidden="true">
        <div className={`viewer-media-frame${kenBurnsClassName}`}>
          <video className="viewer-media-video" autoPlay loop muted playsInline poster={posterUrl || imageUrl || undefined}>
            <source src={videoUrl} />
          </video>
        </div>
      </div>
    );
  }

  if (config.type === "image" && imageUrl && !imageFailed) {
    return (
      <div className={className} aria-hidden="true">
        <div className={`viewer-media-frame${kenBurnsClassName}`}>
          <img
            className="viewer-media-image"
            src={imageUrl}
            alt=""
            aria-hidden="true"
            onError={() => setImageFailed(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <div className={`viewer-media-frame ${fallbackClassName}`} />
    </div>
  );
}

export function HeroSectionViewer({
  invitation,
  assetOrigin,
}: {
  invitation: InvitationRecord;
  assetOrigin: string;
}) {
  const usesAstronautTheme = invitation.theme_id === "astronautas";
  const titleLines = usesAstronautTheme
    ? buildAstronautTitleLines(invitation.sections.hero.title)
    : splitTitle(repairLegacyText(invitation.sections.hero.title));
  const moonUrl = `${assetOrigin}/assets/luna.webp`;
  const earthUrl = `${assetOrigin}/assets/tierra.webp`;
  const cloudOneUrl = `${assetOrigin}/assets/nube%201-01.webp`;
  const cloudTwoUrl = `${assetOrigin}/assets/nube2.webp`;
  const cloudThreeUrl = `${assetOrigin}/assets/nube3.webp`;
  const heroBackground = resolveHeroBackground(invitation);
  const astronautAsset =
    invitation.sections.hero.astronaut?.image_url || (usesAstronautTheme ? "/assets/astronauta.webp" : "");
  const normalizedAstronautAsset = astronautAsset.includes("/assets/astronaut-luis-arturo.webp")
    ? "/assets/astronauta.webp"
    : astronautAsset;
  const astronautUrl = resolveMediaUrl(normalizedAstronautAsset, assetOrigin);
  const astronautPosition = invitation.sections.hero.astronaut?.position;
  const astronautPositionClassName = getAstronautClass(astronautPosition);
  const telemetryLabel = repairLegacyText(invitation.sections.hero.badge?.trim() || "PROTOCOLO DE DESPEGUE");
  const telemetryDetail = repairLegacyText(invitation.sections.hero.accent?.trim() || "ID: LA-07");
  const subtitle = repairLegacyText(invitation.sections.hero.subtitle);
  const animatedTitleLines = useMemo(() => {
    let cursor = 0;

    return titleLines.map((line) => {
      const chars = Array.from(line);
      const startDelayIndex = cursor;
      cursor += chars.length + HERO_TYPEWRITER_LINE_GAP_STEPS;
      return { line, chars, startDelayIndex };
    });
  }, [titleLines]);
  const totalTypewriterMs = useMemo(() => {
    const lastLine = animatedTitleLines[animatedTitleLines.length - 1];
    if (!lastLine) {
      return 0;
    }

    return (lastLine.startDelayIndex + Math.max(lastLine.chars.length, 1) + 1) * HERO_TYPEWRITER_STEP_MS;
  }, [animatedTitleLines]);
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(
    () => !usesAstronautTheme || hasPlayedAstronautTypewriter,
  );

  useEffect(() => {
    if (!usesAstronautTheme) {
      setIsTypewriterComplete(true);
      return;
    }

    if (hasPlayedAstronautTypewriter) {
      setIsTypewriterComplete(true);
      return;
    }

    setIsTypewriterComplete(false);
    const timer = window.setTimeout(() => {
      hasPlayedAstronautTypewriter = true;
      setIsTypewriterComplete(true);
    }, totalTypewriterMs + 120);

    return () => window.clearTimeout(timer);
  }, [totalTypewriterMs, usesAstronautTheme, invitation.sections.hero.title]);

  return (
    <section className={`hero-cinematic${usesAstronautTheme ? " hero-cinematic--astronautas" : ""}`}>
      <BackgroundMediaViewer
        config={heroBackground}
        assetOrigin={assetOrigin}
        className="hero-cinematic__media"
        fallbackClassName="hero-cinematic__media--default"
      />
      <div className="hero-cinematic__drift hero-cinematic__drift--one" aria-hidden="true" />
      <div className="hero-cinematic__drift hero-cinematic__drift--two" aria-hidden="true" />
      {usesAstronautTheme ? (
        <>
          <div className="hero-cinematic__cloud hero-cinematic__cloud--three" aria-hidden="true">
            <img src={cloudThreeUrl} alt="" aria-hidden="true" />
          </div>
          <div className="hero-cinematic__cloud hero-cinematic__cloud--two" aria-hidden="true">
            <img src={cloudTwoUrl} alt="" aria-hidden="true" />
          </div>
          <div className="hero-cinematic__cloud hero-cinematic__cloud--one" aria-hidden="true">
            <img src={cloudOneUrl} alt="" aria-hidden="true" />
          </div>
        </>
      ) : (
        <>
          <div className="hero-cinematic__orb hero-cinematic__orb--moon" aria-hidden="true">
            <img src={moonUrl} alt="" aria-hidden="true" />
          </div>
          <div className="hero-cinematic__orb hero-cinematic__orb--earth" aria-hidden="true">
            <img src={earthUrl} alt="" aria-hidden="true" />
          </div>
        </>
      )}
      <div className="hero-cinematic__comet hero-cinematic__comet--one" aria-hidden="true" />
      <div className="hero-cinematic__comet hero-cinematic__comet--two" aria-hidden="true" />
      {usesAstronautTheme ? <div className="hero-cinematic__comet hero-cinematic__comet--three" aria-hidden="true" /> : null}
      {usesAstronautTheme ? (
        <div className="watercolor-hero-decor" aria-hidden="true">
          <div className="watercolor-hero-decor__rocket">
            <MissionRocket />
          </div>
          <span className="watercolor-hero-decor__item watercolor-hero-decor__item--star">⭐</span>
          <span className="watercolor-hero-decor__item watercolor-hero-decor__item--planet">🪐</span>
          <span className="watercolor-hero-decor__item watercolor-hero-decor__item--moon">🌙</span>
          <span className="watercolor-hero-decor__item watercolor-hero-decor__item--satellite">🛰️</span>
          <span className="watercolor-hero-decor__item watercolor-hero-decor__item--cloud">☁️</span>
        </div>
      ) : null}
      <div className="hero-cinematic__content">
        <div className="hero-cinematic__copy">
          <div className="hero-cinematic__telemetry-wrap">
            <p className="hero-cinematic__telemetry">{telemetryLabel}</p>
            <div className="hero-cinematic__telemetry-detail">
              <span>{telemetryDetail}</span>
            </div>
            <div className="hero-cinematic__telemetry-line" aria-hidden="true" />
          </div>
          <div className="hero-typewriter" aria-label={repairLegacyText(invitation.sections.hero.title)}>
            {animatedTitleLines.map((lineData, index) => (
              <div key={`${lineData.line}-${index}`} className="hero-typewriter__row">
                <span className={`hero-typewriter__line ${index === 0 ? "hero-typewriter__line--lead" : "hero-typewriter__line--main"}`}>
                  {usesAstronautTheme ? (
                    <>
                      {isTypewriterComplete ? (
                        <span className="hero-typewriter__line-text hero-typewriter__line-text--complete" aria-hidden="true">
                          {lineData.line}
                          {index === animatedTitleLines.length - 1 ? (
                            <span className="hero-typewriter__caret hero-typewriter__caret--steady" aria-hidden="true" />
                          ) : null}
                        </span>
                      ) : (
                        <>
                          <span
                            className="hero-typewriter__line-text"
                            aria-hidden="true"
                            style={
                              {
                                "--line-delay": `${lineData.startDelayIndex * HERO_TYPEWRITER_STEP_MS}ms`,
                                "--line-duration": `${Math.max(lineData.chars.length, 1) * HERO_TYPEWRITER_STEP_MS}ms`,
                                "--line-active-duration": `${(Math.max(lineData.chars.length, 1) + 1) * HERO_TYPEWRITER_STEP_MS}ms`,
                                "--line-steps": String(Math.max(lineData.chars.length, 1)),
                              } as CSSProperties
                            }
                          >
                            {lineData.chars.map((char, charIndex) => {
                              const delayMs = (lineData.startDelayIndex + charIndex) * HERO_TYPEWRITER_STEP_MS;
                              return (
                                <span
                                  key={`${lineData.line}-${charIndex}-${char}`}
                                  className="hero-typewriter__glyph"
                                  style={{ "--char-delay": `${delayMs}ms` } as CSSProperties}
                                >
                                  {char === " " ? "\u00A0" : char}
                                </span>
                              );
                            })}
                            <span
                              className={`hero-typewriter__caret ${
                                index === animatedTitleLines.length - 1 ? "hero-typewriter__caret--persist" : ""
                              }`}
                              aria-hidden="true"
                            />
                          </span>
                          <span className="hero-typewriter__sr-only">{lineData.line}</span>
                        </>
                      )}
                    </>
                  ) : (
                    lineData.line
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="hero-cinematic__subtitle">{subtitle}</p>
        </div>
      </div>
      {invitation.sections.hero.astronaut?.enabled && astronautUrl ? (
        <div
          className={`hero-cinematic__astronaut-art${astronautPositionClassName}`}
          style={{ opacity: invitation.sections.hero.astronaut?.opacity ?? 1 }}
          aria-hidden="true"
        >
          <img src={astronautUrl} alt="" aria-hidden="true" loading="eager" />
        </div>
      ) : null}
    </section>
  );
}

function repairLegacyText(input: string) {
  if (!input || !/[ÃÂ]/.test(input)) {
    return input;
  }

  try {
    const bytes = Uint8Array.from(Array.from(input, (char) => char.charCodeAt(0)));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return input;
  }
}

function buildAstronautTitleLines(title: string) {
  const cleanedTitle = repairLegacyText(title).trim();
  const words = cleanedTitle.split(/\s+/).filter(Boolean);

  if (
    words.length >= 4 &&
    /^cumple$/i.test(words[0]) &&
    /^\d+$/.test(words[1]) &&
    /^de$/i.test(words[2])
  ) {
    const tail = words.slice(2);
    if (tail.length >= 3) {
      return [`${words[0]} ${words[1]}`, tail.slice(0, 2).join(" "), tail.slice(2).join(" ")];
    }
    return [`${words[0]} ${words[1]}`, tail.join(" ")];
  }

  if (words.length === 5) {
    return [words[0], words.slice(1, 4).join(" "), words[4]];
  }

  if (words.length === 4) {
    return [words[0], words.slice(1, 3).join(" "), words[3]];
  }

  return splitTitle(cleanedTitle);
}

function InvitationSectionFrameViewer({
  id,
  eyebrow,
  title,
  subtitle,
  tone = "default",
  surface = "default",
  sectionClassName = "",
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: "default" | "aurora" | "gold";
  surface?: "default" | "bare";
  sectionClassName?: string;
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [hasEnteredOnce, setHasEnteredOnce] = useState(false);
  const [enterDirection, setEnterDirection] = useState<"up" | "down">("up");
  const [exitDirection, setExitDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.14;
        if (isVisible) {
          // top >= 0 usually means the section is entering from below (scrolling down).
          setEnterDirection(entry.boundingClientRect.top >= 0 ? "up" : "down");
          setIsInViewport(true);
          setHasEnteredOnce(true);
          return;
        }

        // top < 0 means it left through the top edge (scrolling down).
        setExitDirection(entry.boundingClientRect.top < 0 ? "up" : "down");
        setIsInViewport(false);
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: [0.08, 0.14, 0.26, 0.4],
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`invitation-section invitation-section--${tone}${
        surface === "bare" ? " invitation-section--bare" : ""
      }${
        isInViewport
          ? ` invitation-section--entered invitation-section--enter-${enterDirection}`
          : hasEnteredOnce
            ? ` invitation-section--exiting invitation-section--exit-${exitDirection}`
            : ""
      }${sectionClassName ? ` ${sectionClassName}` : ""}`}
    >
      {surface === "bare" ? null : (
        <>
          <div className="invitation-section__curve invitation-section__curve--top" />
          <div className="invitation-section__curve invitation-section__curve--bottom" />
        </>
      )}
      <div className={`invitation-section__inner${surface === "bare" ? " invitation-section__inner--bare" : ""}`}>
        <div className="watercolor-section-decor" aria-hidden="true">
          <span className="watercolor-section-decor__item watercolor-section-decor__item--one">⭐</span>
          <span className="watercolor-section-decor__item watercolor-section-decor__item--two">🪐</span>
          <span className="watercolor-section-decor__item watercolor-section-decor__item--three">🚀</span>
        </div>
        <p className="mission-eyebrow">{eyebrow}</p>
        <h2 className="mission-title">{title}</h2>
        {subtitle ? <p className="mission-subtitle">{subtitle}</p> : null}
        <div className="invitation-section__body">{children}</div>
      </div>
    </section>
  );
}

export function EventInfoSectionViewer({ invitation }: { invitation: InvitationRecord }) {
  const eventDateLabel = buildEventDateLabel(invitation);
  const arrivalTimeLabel = buildArrivalTimeLabel(invitation);
  const addressLines = splitAddressLines(invitation.sections.event_info.address_text);

  return (
    <InvitationSectionFrameViewer
      eyebrow="Bitácora de misión"
      title={invitation.sections.event_info.venue_name}
      subtitle="Todo listo para el punto de encuentro."
      tone="aurora"
      surface="bare"
    >
      <div className="mission-log mission-log--hud">
        <div className="mission-log__frame">
          <div className="mission-log__status" aria-label="Estado de enlace">
            <span className="mission-log__status-dot" />
            <span className="mission-log__status-label">SYNC OK</span>
          </div>
          <div className="mission-log__rows">
            <div className="mission-log__row">
              <span className="mission-log__icon" aria-hidden="true">
                <CalendarGlyph />
              </span>
              <div className="mission-log__content">
                <strong className="mission-log__value">{eventDateLabel}</strong>
                <span className="mission-log__label">Fecha de despegue</span>
              </div>
            </div>
            <div className="mission-log__row">
              <span className="mission-log__icon" aria-hidden="true">
                <ClockGlyph />
              </span>
              <div className="mission-log__content">
                <strong className="mission-log__value">{arrivalTimeLabel}</strong>
                <span className="mission-log__label">Hora de llegada</span>
              </div>
            </div>
            <div className="mission-log__row mission-log__row--address">
              <span className="mission-log__icon" aria-hidden="true">
                <PinGlyph />
              </span>
              <div className="mission-log__content">
                <strong className="mission-log__value mission-log__value--address">
                  {addressLines[0]}
                  {addressLines[1] ? <span className="mission-log__value-line">{addressLines[1]}</span> : null}
                </strong>
                <span className="mission-log__label">Punto de encuentro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InvitationSectionFrameViewer>
  );
}

export function QuickActionsSectionViewer({
  items,
  onAction,
}: {
  items: QuickActionItem[];
  onAction: (type: QuickActionItem["type"]) => void;
}) {
  const primaryItems = useMemo(
    () =>
      items.filter((item) => {
        const actionType = String(item.type);
        return actionType === "confirm" || actionType === "rsvp" || actionType === "location" || actionType === "map";
      }),
    [items],
  );
  const primaryDockItems = primaryItems.slice(0, 2);
  const primaryKeys = new Set(primaryDockItems.map((item) => `${item.type}-${item.label}`));
  const secondaryItems = items.filter((item) => !primaryKeys.has(`${item.type}-${item.label}`));
  const gridItems = secondaryItems.length ? secondaryItems : primaryDockItems.length ? [] : items;

  return (
    <InvitationSectionFrameViewer
      eyebrow="Control de misión"
      title="Acciones rápidas"
      subtitle="Selecciona un comando y continúa la secuencia."
      tone="gold"
      surface="bare"
    >
      {primaryDockItems.length ? (
        <div className="command-dock" role="group" aria-label="Comandos principales">
          {primaryDockItems.map((item, index) =>
            renderActionChip({
              item,
              key: `${item.type}-${index}-primary`,
              onAction,
              emphasis: "primary",
            }),
          )}
        </div>
      ) : null}
      <div className="command-grid" role="group" aria-label="Comandos disponibles">
        {gridItems.map((item, index) =>
          renderActionChip({
            item,
            key: `${item.type}-${index}-secondary`,
            onAction,
            emphasis: "secondary",
          }),
        )}
      </div>
    </InvitationSectionFrameViewer>
  );
}

function renderActionChip({
  item,
  key,
  onAction,
  emphasis,
}: {
  item: QuickActionItem;
  key: string;
  onAction: (type: QuickActionItem["type"]) => void;
  emphasis: "primary" | "secondary";
}) {
  return (
    <button type="button" key={key} className={`command-chip command-chip--${emphasis}`} onClick={() => onAction(item.type)}>
      <span className="command-chip__icon" aria-hidden="true">
        {getActionGlyph(String(item.type))}
      </span>
      <span className="command-chip__body">
        <span className="command-chip__label">{item.label}</span>
        <span className="command-chip__code">{getActionCode(String(item.type))}</span>
      </span>
    </button>
  );
}

export function CountdownSectionViewer({
  label,
  countdown,
}: {
  label: string;
  countdown: Array<{ label: string; value: number }>;
}) {
  return (
    <InvitationSectionFrameViewer eyebrow="Cuenta regresiva" title={label} tone="default">
      <div className="countdown-grid-shell">
        <div className="countdown-grid countdown-grid--mission">
          {countdown.map((item) => (
            <div key={item.label} className="countdown-cell countdown-cell--mission">
              <strong>{item.value}</strong>
              <span className="mission-caption">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mission-caption">Cada segundo nos acerca al despegue.</p>
    </InvitationSectionFrameViewer>
  );
}

export function MapSectionViewer({
  invitation,
  mapsUrl,
}: {
  invitation: InvitationRecord;
  mapsUrl: string;
}) {
  const mapEmbed = invitation.sections.map.embed;
  const mapEmbedUrl = mapEmbed
    ? `https://www.google.com/maps?q=${mapEmbed.lat},${mapEmbed.lng}&z=${mapEmbed.zoom}&output=embed`
    : "";
  const shouldUseDarkMap = invitation.theme_id === "astronautas"
    ? false
    : Boolean(invitation.sections.map.dark);

  return (
    <InvitationSectionFrameViewer
      id="viewer-map-section"
      eyebrow="Ruta estelar"
      title="Ubicación"
      subtitle={invitation.sections.map.address_text}
      tone="aurora"
    >
      {mapEmbedUrl ? (
        <div className="mission-map-shell">
          <iframe
            title="Mapa del evento"
            src={mapEmbedUrl}
            className={`map-frame map-frame--mission${shouldUseDarkMap ? " map-frame--dark" : ""}`}
            loading="lazy"
          />
        </div>
      ) : null}
      <a className="mission-button mission-button--ghost" href={mapsUrl} target="_blank" rel="noreferrer">
        Abrir en Google Maps
      </a>
    </InvitationSectionFrameViewer>
  );
}

export function GallerySectionViewer({
  images,
  maxImages,
  assetOrigin,
  onOpen,
}: {
  images: string[];
  maxImages: number;
  assetOrigin: string;
  onOpen: (url: string) => void;
}) {
  const totalSlots = Math.max(1, Math.trunc(maxImages) || 1);

  return (
    <InvitationSectionFrameViewer
      eyebrow="Archivo visual"
      title="Momentos especiales"
      subtitle="Espacio reservado para tus fotos favoritas."
      tone="gold"
    >
      <div className="gallery-grid gallery-grid--mission">
        {Array.from({ length: totalSlots }).map((_, index) => {
          const imageUrl = images[index] || "";
          const src = resolveMediaUrl(imageUrl, assetOrigin);

          if (!src) {
            return (
              <div key={`placeholder-${index}`} className="gallery-tile gallery-tile--placeholder">
                <span>Espacio {index + 1}</span>
              </div>
            );
          }

          return (
            <GalleryTileViewer
              key={`${src}-${index}`}
              imageUrl={src}
              index={index}
              onOpen={() => onOpen(src)}
            />
          );
        })}
      </div>
      {!images.length ? (
        <p className="mission-caption">
          Espacio temporal activo: reemplaza estos bloques con el arte final cuando cargues recursos reales.
        </p>
      ) : null}
    </InvitationSectionFrameViewer>
  );
}

function GalleryTileViewer({
  imageUrl,
  index,
  onOpen,
}: {
  imageUrl: string;
  index: number;
  onOpen: () => void;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="gallery-tile gallery-tile--placeholder">
        <span>Imagen {index + 1} no disponible</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="gallery-tile gallery-tile--mission gallery-tile-button"
      onClick={onOpen}
      aria-label={`Abrir imagen ${index + 1}`}
    >
      <img
        src={imageUrl}
        alt=""
        className="gallery-tile__media"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </button>
  );
}

export function NotesSectionViewer({ items }: { items: string[] }) {
  return (
    <InvitationSectionFrameViewer
      eyebrow="Checklist"
      title="Antes del despegue"
      subtitle="Detalles clave para que la misión salga perfecta."
      tone="default"
    >
      <div className="notes-list notes-list--mission">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="note-card note-card--mission">
            <span className="note-card__index">{String(index + 1).padStart(2, "0")}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </InvitationSectionFrameViewer>
  );
}

export function RsvpSectionViewer({ invitation }: { invitation: InvitationRecord }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState("yes");
  const [guestsCount, setGuestsCount] = useState("1");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Tu RSVP fue enviado y ya quedó registrado.");
  const fields = invitation.sections.rsvp.fields || {};
  const allowGuestsCount = Boolean(fields.guests_count ?? fields.allow_guests_count);
  const allowMessage = Boolean(fields.message ?? fields.allow_message);
  const isClosed = useMemo(
    () => new Date().getTime() > new Date(invitation.rsvp_until).getTime(),
    [invitation.rsvp_until],
  );

  async function submitRsvp({ forceCancel = false }: { forceCancel?: boolean } = {}) {
    setError("");
    setSaved(false);

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!forceCancel && !attending) {
      setError("Selecciona si asistes o no.");
      return;
    }

    const attendingValue = forceCancel ? false : attending === "yes";
    const normalizedGuestsCount = allowGuestsCount
      ? Math.max(1, Math.trunc(Number(guestsCount || "1") || 1))
      : null;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/public/invitations/${encodeURIComponent(invitation.slug)}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          attending: attendingValue,
          guestsCount: normalizedGuestsCount,
          message: allowMessage ? message : null,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo enviar tu confirmación.");
      }

      setSaved(true);
      setSavedMessage(
        forceCancel
          ? "Se registró la cancelación de asistencia. Si cambian de plan, puedes reenviar el formulario."
          : "Tu RSVP fue enviado y ya quedó registrado.",
      );
      setName("");
      setAttending("yes");
      setGuestsCount("1");
      setMessage("");
      window.setTimeout(() => setSaved(false), 2400);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo enviar tu confirmación.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitRsvp();
  }

  return (
    <InvitationSectionFrameViewer
      id="viewer-rsvp-section"
      eyebrow="Confirmación"
      title="Confirma tu asistencia"
      subtitle="Envíanos tu respuesta para cerrar la bitácora."
      tone="aurora"
    >
      {isClosed ? (
        <div className="mission-closed-state">
          <strong>{invitation.sections.rsvp.closed_message || "RSVP cerrado"}</strong>
        </div>
      ) : (
        <form className="form-grid rsvp-form" onSubmit={handleSubmit}>
          <label className="mission-field rsvp-form__field rsvp-form__field--name">
            <span className="mission-label">Nombre *</span>
            <input className="mission-input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="mission-field rsvp-form__field rsvp-form__field--attending">
            <span className="mission-label">
              ¿Asistes?<span aria-hidden="true">&nbsp;*</span>
            </span>
            <select className="mission-input" value={attending} onChange={(event) => setAttending(event.target.value)}>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </label>
          {allowGuestsCount ? (
            <label className="mission-field rsvp-form__field rsvp-form__field--guests">
              <span className="mission-label">Asistentes (total)</span>
              <input
                className="mission-input"
                type="number"
                min={1}
                value={guestsCount}
                onChange={(event) => setGuestsCount(event.target.value)}
              />
            </label>
          ) : null}
          {allowMessage ? (
            <label className="mission-field mission-field--wide rsvp-form__field rsvp-form__field--message">
              <span className="mission-label">Mensaje</span>
              <textarea className="mission-input" value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
          ) : null}
          <div className="mission-field mission-field--wide rsvp-form__actions">
            <button type="submit" className="mission-button quick-button" disabled={submitting}>
              {submitting ? "Transmitiendo..." : attending === "no" ? "Registrar no asistencia" : "Enviar confirmación"}
            </button>
            <button
              type="button"
              className="mission-button mission-button--ghost quick-button"
              disabled={submitting}
              onClick={() => void submitRsvp({ forceCancel: true })}
            >
              {submitting ? "Transmitiendo..." : "Cancelar asistencia"}
            </button>
            <p className="mission-caption mission-caption--wide">
              Si ya habías confirmado y ahora no podrás asistir, usa "Cancelar asistencia".
            </p>
          </div>
          {error ? <p className="viewer-error-text">{error}</p> : null}
        </form>
      )}
      {saved ? (
        <div className="rsvp-success rsvp-success--mission" aria-live="polite">
          <div className="mission-launch" aria-hidden="true">
            <div className="mission-launch__trail" />
            <div className="mission-launch__rocket">
              <MissionRocket />
            </div>
          </div>
          <strong>Misión completada</strong>
          <p className="mission-caption">{savedMessage}</p>
        </div>
      ) : null}
    </InvitationSectionFrameViewer>
  );
}

export function ContactSectionViewer({ invitation }: { invitation: InvitationRecord }) {
  const avatarImageUrl = invitation.sections.contact.avatar_image_url?.trim();

  return (
    <InvitationSectionFrameViewer
      eyebrow="Canal directo"
      title={invitation.sections.contact.name}
      subtitle={invitation.sections.contact.label}
      tone="gold"
    >
      <div className="contact-command">
        {avatarImageUrl ? (
          <img className="contact-command__avatar" src={avatarImageUrl} alt={invitation.sections.contact.name} />
        ) : (
          <div className="contact-command__badge">COMMS</div>
        )}
        <div>
          <strong>{invitation.sections.contact.whatsapp_number}</strong>
          <p className="mission-caption">Si necesitas ayuda antes del evento, escríbenos aquí.</p>
        </div>
      </div>
      <a className="mission-button" href={invitation.sections.contact.whatsapp_url} target="_blank" rel="noreferrer">
        Abrir WhatsApp
      </a>
    </InvitationSectionFrameViewer>
  );
}

export function GenericBlockViewer({
  title,
  data,
}: {
  title: string;
  data: GenericSection;
}) {
  const items = trimList(data.items);
  const text = data.text?.trim() || "Información adicional para la misión.";
  const visibleTitle = data.title?.trim() || title;
  const normalizedTitle = visibleTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const eyebrow =
    normalizedTitle === "transmisión en vivo" || normalizedTitle === "transmisión"
      ? "Enlace remoto"
      : normalizedTitle === "transporte"
        ? "Ruta recomendada"
        : normalizedTitle === "hospedaje" || normalizedTitle === "alojamiento"
          ? "Base sugerida"
          : normalizedTitle === "itinerario" || normalizedTitle === "itinerario de vuelo" || normalizedTitle === "agenda"
            ? "Plan de misión"
            : normalizedTitle === "código de vestimenta" || normalizedTitle === "dress code"
              ? "Código de abordaje"
              : normalizedTitle === "regalos"
                ? "Carga sugerida"
                : normalizedTitle === "preguntas frecuentes"
                  ? "Centro de ayuda"
                  : "Información";

  return (
    <InvitationSectionFrameViewer
      eyebrow={eyebrow}
      title={visibleTitle}
      subtitle={text}
      tone="default"
      sectionClassName="invitation-section--generic-block"
    >
      {items.length ? (
        <div className="notes-list notes-list--mission">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="note-card note-card--mission">
              <span className="note-card__index">{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}
      {data.url?.trim() ? (
        <a
          className="mission-button mission-button--ghost mission-button--link-action"
          href={data.url.trim()}
          target="_blank"
          rel="noreferrer"
        >
          Abrir enlace
        </a>
      ) : null}
    </InvitationSectionFrameViewer>
  );
}

function buildEventDateLabel(invitation: InvitationRecord) {
  const eventInfo = invitation.sections.event_info;
  const eventDate = new Date(invitation.event_start_at);
  const baseDateText = (eventInfo.date_text || "").trim();
  const weekday = (eventInfo.weekday_text || "").trim();
  const hasExplicitYear = /\b\d{4}\b/.test(baseDateText);
  const year = Number.isNaN(eventDate.getTime()) || hasExplicitYear ? "" : ` de ${eventDate.getFullYear()}`;

  return [weekday, `${baseDateText}${year}`.trim()].filter(Boolean).join(" ").trim();
}

function buildArrivalTimeLabel(invitation: InvitationRecord) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: invitation.timezone || "America/Mexico_City",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(invitation.event_start_at));
  } catch {
    return invitation.sections.event_info.time_text;
  }
}

function splitAddressLines(address: string) {
  const clean = address.trim();
  const splitIndex = clean.indexOf(",");

  if (splitIndex === -1) {
    return [clean];
  }

  return [clean.slice(0, splitIndex + 1).trim(), clean.slice(splitIndex + 1).trim()];
}

function getActionCode(type: string) {
  switch (type) {
    case "confirm":
    case "rsvp":
      return "CMD-RSVP";
    case "location":
    case "map":
      return "CMD-MAP";
    case "calendar":
      return "CMD-ICAL";
    case "share":
      return "CMD-LINK";
    default:
      return "CMD-ALT";
  }
}

function getActionGlyph(type: string) {
  switch (type) {
    case "confirm":
    case "rsvp":
      return <RsvpGlyph />;
    case "location":
    case "map":
      return <PinGlyph />;
    case "calendar":
      return <CalendarGlyph />;
    case "share":
      return <ShareGlyph />;
    default:
      return <CommandGlyph />;
  }
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function PinGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Zm0-8.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z" />
    </svg>
  );
}

function RsvpGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M8 12.5l2.4 2.4L16 9.3M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M8 12l8-4M8 12l8 4M8 12a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Zm13-4a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Zm0 8a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Z" />
    </svg>
  );
}

function CommandGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M8 8h8M8 12h8M8 16h5M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function MissionRocket() {
  return (
    <svg viewBox="0 0 84 84" aria-hidden="true">
      <path d="M22 58 C18 48, 22 38, 32 31 L52 12 C57 19, 60 26, 60 32 L41 52 C34 60, 24 62, 22 58 Z" fill="#f3f8ff" />
      <path d="M52 12 C62 13, 70 21, 72 31 C65 32, 58 30, 52 24 Z" fill="#76f7ff" />
      <circle cx="47" cy="30" r="6" fill="#0b2350" />
      <path d="M29 55 L18 66 L16 56 L26 47 Z" fill="#f8c94b" />
      <path d="M38 63 L49 74 L39 72 L30 61 Z" fill="#ff9b50" />
      <path d="M14 60 C7 62, 7 72, 15 72 C23 72, 25 61, 20 57 Z" fill="rgba(248,201,75,0.65)" />
    </svg>
  );
}

export function LightboxViewer({
  image,
  onClose,
}: {
  image: string;
  onClose: () => void;
}) {
  return (
    <div
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Vista completa de imagen"
      onClick={onClose}
    >
      <button
        type="button"
        className="gallery-lightbox__close"
        aria-label="Cerrar imagen"
        onClick={onClose}
      >
        Cerrar
      </button>
      <div className="gallery-lightbox__panel" onClick={(event) => event.stopPropagation()}>
        <img className="gallery-lightbox__image" src={image} alt="" />
      </div>
    </div>
  );
}
