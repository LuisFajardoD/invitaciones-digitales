"use client";

import { useId, useState } from "react";
import { normalizeEventIntakeData } from "@/lib/intake-defaults";
import type { EventIntakeData, EventIntakeFormRecord, ToggleValue } from "@/types/intake";
import styles from "./EventIntake.module.css";
import { IntakeThemeShell } from "./IntakeThemeShell";

type EventIntakeFormProps = {
  form: EventIntakeFormRecord;
};

type SectionKey = keyof EventIntakeData;

const visualStyleOptions = ["Tierno", "Elegante", "Caricatura", "Acuarela", "Brillante", "Pastel", "Otro"];
type TimePeriod = "AM" | "PM";

function parseTimeValue(value: string) {
  const [hourPart, minutePart] = value.split(":");
  const hour24 = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isFinite(hour24) || !Number.isFinite(minute)) {
    return { hour: 12, minute: 0, period: "PM" as TimePeriod };
  }

  return {
    hour: hour24 % 12 || 12,
    minute,
    period: hour24 < 12 ? "AM" as TimePeriod : "PM" as TimePeriod,
  };
}

function formatTimeValue(hour: number, minute: number, period: TimePeriod) {
  const hour24 = period === "AM" ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatTimeLabel(value: string) {
  if (!value) {
    return "Selecciona una hora";
  }

  const parsed = parseTimeValue(value);
  return `${parsed.hour}:${String(parsed.minute).padStart(2, "0")} ${parsed.period === "AM" ? "a.m." : "p.m."}`;
}

function getCurrentRoundedTime() {
  const now = new Date();
  const roundedMinutes = Math.round(now.getMinutes() / 15) * 15;
  now.setMinutes(roundedMinutes === 60 ? 0 : roundedMinutes, 0, 0);
  if (roundedMinutes === 60) {
    now.setHours(now.getHours() + 1);
  }

  return {
    hour: now.getHours() % 12 || 12,
    minute: now.getMinutes(),
    period: now.getHours() < 12 ? "AM" as TimePeriod : "PM" as TimePeriod,
  };
}

function isValidOptionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function YesNo({
  name,
  value,
  onChange,
}: {
  name: string;
  value: ToggleValue;
  onChange: (value: ToggleValue) => void;
}) {
  return (
    <div className={styles["intake-choice-row"]}>
      {(["yes", "no"] as ToggleValue[]).map((option) => (
        <label key={option} className={styles["intake-choice"]}>
          <input
            type="radio"
            name={name}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          {option === "yes" ? "Sí" : "No"}
        </label>
      ))}
    </div>
  );
}

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const pickerId = useId();
  const [open, setOpen] = useState(false);
  const parsedValue = parseTimeValue(value);
  const [draft, setDraft] = useState(parsedValue);

  function openPicker() {
    setDraft(parseTimeValue(value));
    setOpen((current) => !current);
  }

  function setDraftTime(nextDraft: typeof draft) {
    setDraft(nextDraft);
  }

  function commit(nextDraft = draft) {
    onChange(formatTimeValue(nextDraft.hour, nextDraft.minute, nextDraft.period));
    setOpen(false);
  }

  function shiftHour(step: number) {
    const nextHour = ((draft.hour - 1 + step + 12) % 12) + 1;
    setDraftTime({ ...draft, hour: nextHour });
  }

  function shiftMinutes(step: number) {
    const minuteOptions = [0, 15, 30, 45];
    const currentIndex = Math.max(0, minuteOptions.indexOf(draft.minute));
    const nextIndex = (currentIndex + step + minuteOptions.length) % minuteOptions.length;
    setDraftTime({ ...draft, minute: minuteOptions[nextIndex] });
  }

  return (
    <div className={styles["time-picker"]}>
      <button
        type="button"
        className={styles["time-picker-trigger"]}
        aria-expanded={open}
        aria-controls={pickerId}
        onClick={openPicker}
      >
        <span>{formatTimeLabel(value)}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className={styles["time-picker-panel"]} id={pickerId}>
          <p>Elige la hora</p>
          <div className={styles["time-picker-display"]}>
            <div className={styles["time-picker-unit"]}>
              <button type="button" onClick={() => shiftHour(1)} aria-label="Subir hora">+</button>
              <strong>{draft.hour}</strong>
              <button type="button" onClick={() => shiftHour(-1)} aria-label="Bajar hora">−</button>
            </div>
            <span className={styles["time-picker-colon"]}>:</span>
            <div className={styles["time-picker-unit"]}>
              <button type="button" onClick={() => shiftMinutes(1)} aria-label="Subir minutos">+</button>
              <strong>{String(draft.minute).padStart(2, "0")}</strong>
              <button type="button" onClick={() => shiftMinutes(-1)} aria-label="Bajar minutos">−</button>
            </div>
            <div className={styles["time-picker-period"]}>
              {(["AM", "PM"] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  className={draft.period === period ? styles["time-picker-period-active"] : ""}
                  onClick={() => setDraftTime({ ...draft, period })}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className={styles["time-picker-actions"]}>
            <button type="button" onClick={() => setDraftTime(getCurrentRoundedTime())}>Ahora</button>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}>Limpiar</button>
            <button type="button" onClick={() => commit()}>Aceptar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FaqQuestion({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles["faq-question"]} ${!enabled ? styles["faq-question-disabled"] : ""}`}>
      <label className={styles["faq-question-toggle"]}>
        <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} />
        <span>{enabled ? "Activada" : "Desactivada"}</span>
      </label>
      <div className={styles["faq-question-content"]}>
        <span>{title}</span>
        {enabled ? children : null}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  enabled,
  required,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled?: boolean;
  required?: boolean;
  onToggle?: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  const isVisible = required || enabled;

  return (
    <section className={`${styles["intake-card"]} ${!isVisible ? styles["intake-card-disabled"] : ""}`}>
      <div className={styles["intake-card-header"]}>
        {!required && onToggle ? (
          <label className={styles["intake-card-toggle"]}>
            <input
              type="checkbox"
              checked={Boolean(enabled)}
              onChange={(event) => onToggle(event.target.checked)}
            />
            <span>{enabled ? "Activada" : "Desactivada"}</span>
          </label>
        ) : (
          <span className={`${styles["intake-card-toggle"]} ${styles["intake-card-toggle-required"]}`}>
            Siempre
          </span>
        )}
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {isVisible ? <div className={styles["intake-card-body"]}>{children}</div> : null}
    </section>
  );
}

export function EventIntakeForm({ form }: EventIntakeFormProps) {
  const [data, setData] = useState<EventIntakeData>(() => normalizeEventIntakeData(form));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function patchSection<K extends SectionKey>(
    section: K,
    patch: Partial<EventIntakeData[K]>,
  ) {
    setData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch,
      },
    }));
  }

  function setSectionEnabled(section: Exclude<SectionKey, "event_data" | "invitation_style">, enabled: boolean) {
    patchSection(section, { enabled } as Partial<EventIntakeData[typeof section]>);
  }

  function validate() {
    if (data.event_data.has_maps_link === "yes" && !isValidOptionalUrl(data.event_data.maps_link)) {
      return "Revisa el link de Google Maps.";
    }

    if (data.gifts.enabled && data.gifts.wants_gifts_mention === "yes" && !isValidOptionalUrl(data.gifts.registry_or_link)) {
      return "Revisa el link de mesa de regalos.";
    }

    if (data.live_stream.enabled && data.live_stream.wants_live_stream === "yes" && !isValidOptionalUrl(data.live_stream.live_stream_link)) {
      return "Revisa el link de transmisión en vivo.";
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    setError("");
    setMessage("");

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/public/intakes/${encodeURIComponent(form.token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        form?: EventIntakeFormRecord;
      };
      if (!response.ok || !payload.form) {
        throw new Error(payload.error || "No se pudo guardar.");
      }

      setData(normalizeEventIntakeData(payload.form));
      setMessage("Cambios guardados. Gracias, ya puedo revisar esta información para armar tu invitación.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <IntakeThemeShell as="main">
      <div className={styles["intake-container"]}>
        <header className={styles["intake-header"]}>
          <p className={styles["intake-kicker"]}>Formulario de información</p>
          <h1>Datos para tu invitación digital</h1>
          <p>
            Completa sólo las secciones que quieras incluir. Esta información no publica ni modifica la invitación final;
            servirá para revisar, redactar y preparar tu diseño.
          </p>
        </header>

        <form className={styles["intake-form"]} onSubmit={handleSubmit}>
          <SectionCard title="Datos del evento" description="Información básica para ubicar la celebración." required>
            <div className={styles["intake-grid"]}>
              <label className={styles["intake-field"]}>
                <span>Nombre del festejado(a)</span>
                <input value={data.event_data.celebrant_name} onChange={(event) => patchSection("event_data", { celebrant_name: event.target.value })} />
              </label>
              <label className={styles["intake-field"]}>
                <span>Edad que cumple</span>
                <input value={data.event_data.age} onChange={(event) => patchSection("event_data", { age: event.target.value })} />
              </label>
              <label className={styles["intake-field"]}>
                <span>Fecha del evento</span>
                <input type="date" value={data.event_data.event_date} onChange={(event) => patchSection("event_data", { event_date: event.target.value })} />
              </label>
              <label className={styles["intake-field"]}>
                <span>Hora de inicio</span>
                <TimeSelect value={data.event_data.start_time} onChange={(value) => patchSection("event_data", { start_time: value })} />
              </label>
              <label className={styles["intake-field"]}>
                <span>Nombre del lugar</span>
                <input value={data.event_data.venue_name} onChange={(event) => patchSection("event_data", { venue_name: event.target.value })} />
              </label>
              <label className={styles["intake-field"]}>
                <span>WhatsApp de contacto</span>
                <input value={data.event_data.contact_whatsapp} onChange={(event) => patchSection("event_data", { contact_whatsapp: event.target.value })} />
              </label>
              <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>Dirección completa</span>
                <textarea value={data.event_data.address} onChange={(event) => patchSection("event_data", { address: event.target.value })} />
              </label>
              <label className={styles["intake-field"]}>
                <span>Nombre de contacto</span>
                <input value={data.event_data.contact_name} onChange={(event) => patchSection("event_data", { contact_name: event.target.value })} />
              </label>
              <label className={styles["intake-field"]}>
                <span>Texto para botón de contacto</span>
                <input placeholder="Confirmar con mamá" value={data.event_data.contact_button_text} onChange={(event) => patchSection("event_data", { contact_button_text: event.target.value })} />
              </label>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>¿Tienen link de Google Maps?</span>
                <YesNo name="has_maps_link" value={data.event_data.has_maps_link} onChange={(value) => patchSection("event_data", { has_maps_link: value })} />
              </div>
              {data.event_data.has_maps_link === "yes" ? (
                <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                  <span>Link de Google Maps</span>
                  <input value={data.event_data.maps_link} onChange={(event) => patchSection("event_data", { maps_link: event.target.value })} />
                </label>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Estilo de la invitación" description="Idea visual y tono que quieres para el diseño." required>
            <div className={styles["intake-grid"]}>
              <label className={styles["intake-field"]}>
                <span>Tema deseado</span>
                <input placeholder="Sirenas" value={data.invitation_style.desired_theme} onChange={(event) => patchSection("invitation_style", { desired_theme: event.target.value })} />
              </label>
              <label className={styles["intake-field"]}>
                <span>Colores favoritos</span>
                <input placeholder="Pastel, lila, aqua..." value={data.invitation_style.favorite_colors} onChange={(event) => patchSection("invitation_style", { favorite_colors: event.target.value })} />
              </label>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>Estilo visual preferido</span>
                <div className={styles["intake-style-options"]}>
                  {visualStyleOptions.map((option) => (
                    <label key={option} className={styles["intake-style-option"]}>
                      <input
                        type="checkbox"
                        checked={data.invitation_style.visual_styles.includes(option)}
                        onChange={(event) => {
                          const current = data.invitation_style.visual_styles;
                          patchSection("invitation_style", {
                            visual_styles: event.target.checked
                              ? [...current, option]
                              : current.filter((item) => item !== option),
                          });
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              {data.invitation_style.visual_styles.includes("Otro") ? (
                <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                  <span>Otro estilo visual</span>
                  <input value={data.invitation_style.other_visual_style} onChange={(event) => patchSection("invitation_style", { other_visual_style: event.target.value })} />
                </label>
              ) : null}
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>¿Quieren usar foto del festejado(a) en la portada?</span>
                <YesNo name="style_wants_cover_photo" value={data.invitation_style.wants_cover_photo} onChange={(value) => patchSection("invitation_style", { wants_cover_photo: value })} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Texto especial" description="Frase o mensaje que quieran incluir." enabled={data.main_text.enabled} onToggle={(value) => setSectionEnabled("main_text", value)}>
            <div className={styles["intake-grid"]}>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>¿Quieren incluir alguna frase especial?</span>
                <YesNo name="has_special_phrase" value={data.main_text.has_special_phrase} onChange={(value) => patchSection("main_text", { has_special_phrase: value })} />
              </div>
              {data.main_text.has_special_phrase === "yes" ? (
                <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                  <span>Frase especial</span>
                  <textarea value={data.main_text.special_phrase} onChange={(event) => patchSection("main_text", { special_phrase: event.target.value })} />
                </label>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Confirmación de asistencia RSVP" description="Sólo si quieres que los invitados confirmen." enabled={data.rsvp.enabled} onToggle={(value) => setSectionEnabled("rsvp", value)}>
            <div className={styles["intake-grid"]}>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>¿Quieren confirmar asistencia?</span>
                <YesNo name="wants_rsvp" value={data.rsvp.wants_rsvp} onChange={(value) => patchSection("rsvp", { wants_rsvp: value })} />
              </div>
              {data.rsvp.wants_rsvp === "yes" ? (
                <>
                  <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                    <span>¿Quieren poner fecha límite para confirmar?</span>
                    <YesNo name="has_deadline" value={data.rsvp.has_deadline} onChange={(value) => patchSection("rsvp", { has_deadline: value })} />
                  </div>
                  {data.rsvp.has_deadline === "yes" ? (
                    <label className={styles["intake-field"]}>
                      <span>Fecha límite</span>
                      <input type="date" value={data.rsvp.deadline} onChange={(event) => patchSection("rsvp", { deadline: event.target.value })} />
                    </label>
                  ) : null}
                </>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Itinerario" description="Horarios y actividades importantes." enabled={data.itinerary.enabled} onToggle={(value) => setSectionEnabled("itinerary", value)}>
            <div className={styles["intake-grid"]}>
              <label className={styles["intake-field"]}><span>Hora de bienvenida</span><TimeSelect value={data.itinerary.welcome_time} onChange={(value) => patchSection("itinerary", { welcome_time: value })} /></label>
              <label className={styles["intake-field"]}><span>Hora de comida</span><TimeSelect value={data.itinerary.meal_time} onChange={(value) => patchSection("itinerary", { meal_time: value })} /></label>
              <label className={styles["intake-field"]}><span>Hora de pastel</span><TimeSelect value={data.itinerary.cake_time} onChange={(value) => patchSection("itinerary", { cake_time: value })} /></label>
              <label className={styles["intake-field"]}><span>Hora de piñata</span><TimeSelect value={data.itinerary.pinata_time} onChange={(value) => patchSection("itinerary", { pinata_time: value })} /></label>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>¿Habrá show o actividad especial?</span>
                <YesNo name="has_special_activity" value={data.itinerary.has_special_activity} onChange={(value) => patchSection("itinerary", { has_special_activity: value })} />
              </div>
              {data.itinerary.has_special_activity === "yes" ? (
                <>
                  <label className={styles["intake-field"]}><span>Hora del show o actividad</span><TimeSelect value={data.itinerary.special_activity_time} onChange={(value) => patchSection("itinerary", { special_activity_time: value })} /></label>
                  <label className={styles["intake-field"]}><span>Nombre del show o actividad</span><input value={data.itinerary.special_activity_name} onChange={(event) => patchSection("itinerary", { special_activity_name: event.target.value })} /></label>
                </>
              ) : null}
              <label className={styles["intake-field"]}><span>Hora aproximada de cierre</span><TimeSelect value={data.itinerary.closing_time} onChange={(value) => patchSection("itinerary", { closing_time: value })} /></label>
              <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>Actividades que quieran mencionar</span>
                <textarea placeholder="Alberca de 3:00 p.m. a 6:00 p.m." value={data.itinerary.activities_notes} onChange={(event) => patchSection("itinerary", { activities_notes: event.target.value })} />
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Código de vestimenta" description="Ropa, colores o indicaciones especiales." enabled={data.dress_code.enabled} onToggle={(value) => setSectionEnabled("dress_code", value)}>
            <div className={styles["intake-grid"]}>
              <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>Colores sugeridos</span>
                <textarea className={styles["intake-textarea-compact"]} value={data.dress_code.suggested_colors} onChange={(event) => patchSection("dress_code", { suggested_colors: event.target.value })} />
              </label>
              <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>¿Deben llevar traje de baño, ropa cómoda, disfraz, etc.?</span><textarea placeholder="Llevar traje de baño, toalla y cambio de ropa." value={data.dress_code.clothing_notes} onChange={(event) => patchSection("dress_code", { clothing_notes: event.target.value })} /></label>
              <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Otra indicación</span><textarea value={data.dress_code.extra_notes} onChange={(event) => patchSection("dress_code", { extra_notes: event.target.value })} /></label>
            </div>
          </SectionCard>

          <SectionCard title="Regalos" description="Mesa de regalos o indicaciones." enabled={data.gifts.enabled} onToggle={(value) => setSectionEnabled("gifts", value)}>
            <div className={styles["intake-grid"]}>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>¿Quieren mencionar regalos?</span>
                <YesNo name="wants_gifts_mention" value={data.gifts.wants_gifts_mention} onChange={(value) => patchSection("gifts", { wants_gifts_mention: value })} />
              </div>
              {data.gifts.wants_gifts_mention === "yes" ? (
                <>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Mesa de regalos o link, si existe</span><input value={data.gifts.registry_or_link} onChange={(event) => patchSection("gifts", { registry_or_link: event.target.value })} /></label>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Sugerencias o indicaciones especiales</span><textarea value={data.gifts.gift_notes} onChange={(event) => patchSection("gifts", { gift_notes: event.target.value })} /></label>
                </>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Fotos y multimedia" description="Sólo dinos qué fotos planean enviar por WhatsApp." enabled={data.photos_multimedia.enabled} onToggle={(value) => setSectionEnabled("photos_multimedia", value)}>
            <div className={styles["intake-grid"]}>
              <p className={`${styles["intake-note"]} ${styles["intake-field-wide"]}`}>
                Las fotos no se cargan en este formulario. Envíamelas por WhatsApp en buena calidad, indicando cuáles son para portada y cuáles son para galería o momentos especiales.
              </p>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>¿Quieren incluir fotos o recuerdos especiales?</span>
                <YesNo name="wants_photos" value={data.photos_multimedia.wants_photos} onChange={(value) => patchSection("photos_multimedia", { wants_photos: value })} />
              </div>
              {data.photos_multimedia.wants_photos === "yes" ? (
                <>
                  <div className={styles["intake-field"]}><span>¿Foto del festejado(a) en portada?</span><YesNo name="photos_cover" value={data.photos_multimedia.wants_cover_photo} onChange={(value) => patchSection("photos_multimedia", { wants_cover_photo: value })} /></div>
                  <div className={styles["intake-field"]}><span>¿Sección de fotos o momentos?</span><YesNo name="photos_gallery" value={data.photos_multimedia.wants_gallery} onChange={(value) => patchSection("photos_multimedia", { wants_gallery: value })} /></div>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Notas sobre fotos o momentos</span><textarea placeholder="Fotos de bebé, familiares, vestido de sirena..." value={data.photos_multimedia.photo_notes} onChange={(event) => patchSection("photos_multimedia", { photo_notes: event.target.value })} /></label>
                </>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Preguntas frecuentes / avisos" description="Detalles importantes para los invitados." enabled={data.faq_notices.enabled} onToggle={(value) => setSectionEnabled("faq_notices", value)}>
            <div className={styles["intake-grid"]}>
              <FaqQuestion title="¿Pueden llevar acompañantes?" enabled={data.faq_notices.can_bring_guests_enabled} onToggle={(value) => patchSection("faq_notices", { can_bring_guests_enabled: value })}>
                <YesNo name="can_bring_guests" value={data.faq_notices.can_bring_guests} onChange={(value) => patchSection("faq_notices", { can_bring_guests: value })} />
              </FaqQuestion>
              <FaqQuestion title="¿Pueden asistir niños?" enabled={data.faq_notices.children_allowed_enabled} onToggle={(value) => patchSection("faq_notices", { children_allowed_enabled: value })}>
                <YesNo name="children_allowed" value={data.faq_notices.children_allowed} onChange={(value) => patchSection("faq_notices", { children_allowed: value })} />
              </FaqQuestion>
              <FaqQuestion title="¿Habrá alberca o actividades especiales?" enabled={data.faq_notices.has_pool_or_special_activities_enabled} onToggle={(value) => patchSection("faq_notices", { has_pool_or_special_activities_enabled: value })}>
                <YesNo name="has_pool" value={data.faq_notices.has_pool_or_special_activities} onChange={(value) => patchSection("faq_notices", { has_pool_or_special_activities: value })} />
              </FaqQuestion>
              <FaqQuestion title="¿Habrá alimentos para niños?" enabled={data.faq_notices.has_food_for_children_enabled} onToggle={(value) => patchSection("faq_notices", { has_food_for_children_enabled: value })}>
                <YesNo name="has_food" value={data.faq_notices.has_food_for_children} onChange={(value) => patchSection("faq_notices", { has_food_for_children: value })} />
              </FaqQuestion>
              <FaqQuestion title="¿Hay estacionamiento?" enabled={data.faq_notices.has_parking_enabled} onToggle={(value) => patchSection("faq_notices", { has_parking_enabled: value })}>
                <YesNo name="has_parking" value={data.faq_notices.has_parking} onChange={(value) => patchSection("faq_notices", { has_parking: value })} />
              </FaqQuestion>
              <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>Anota aquí cualquier otra pregunta con su respuesta, reglas del lugar o cualquier aviso importante</span>
                <textarea value={data.faq_notices.important_notices} onChange={(event) => patchSection("faq_notices", { important_notices: event.target.value })} />
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Transmisión en vivo" description="Sólo si quieren compartir link para ver el evento." enabled={data.live_stream.enabled} onToggle={(value) => setSectionEnabled("live_stream", value)}>
            <div className={styles["intake-grid"]}>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>¿Quieren incluir transmisión en vivo?</span><YesNo name="wants_live_stream" value={data.live_stream.wants_live_stream} onChange={(value) => patchSection("live_stream", { wants_live_stream: value })} /></div>
              {data.live_stream.wants_live_stream === "yes" ? (
                <>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Link de transmisión</span><input value={data.live_stream.live_stream_link} onChange={(event) => patchSection("live_stream", { live_stream_link: event.target.value })} /></label>
                  <label className={styles["intake-field"]}><span>Hora de inicio</span><TimeSelect value={data.live_stream.start_time} onChange={(value) => patchSection("live_stream", { start_time: value })} /></label>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Indicaciones para verla</span><textarea placeholder="La transmisión iniciará aproximadamente 10 minutos antes..." value={data.live_stream.instructions} onChange={(event) => patchSection("live_stream", { instructions: event.target.value })} /></label>
                </>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Hospedaje o transporte" description="Sólo si hay invitados de fuera o traslados especiales." enabled={data.lodging_transport.enabled} onToggle={(value) => setSectionEnabled("lodging_transport", value)}>
            <div className={styles["intake-grid"]}>
              <div className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>¿Quieren incluir hospedaje o transporte?</span><YesNo name="wants_lodging_transport" value={data.lodging_transport.wants_lodging_transport} onChange={(value) => patchSection("lodging_transport", { wants_lodging_transport: value })} /></div>
              {data.lodging_transport.wants_lodging_transport === "yes" ? (
                <>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Hoteles recomendados</span><textarea value={data.lodging_transport.recommended_hotels} onChange={(event) => patchSection("lodging_transport", { recommended_hotels: event.target.value })} /></label>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Punto de reunión</span><textarea value={data.lodging_transport.meeting_point} onChange={(event) => patchSection("lodging_transport", { meeting_point: event.target.value })} /></label>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Transporte especial</span><textarea value={data.lodging_transport.special_transport} onChange={(event) => patchSection("lodging_transport", { special_transport: event.target.value })} /></label>
                  <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}><span>Indicaciones para invitados de fuera</span><textarea value={data.lodging_transport.out_of_town_notes} onChange={(event) => patchSection("lodging_transport", { out_of_town_notes: event.target.value })} /></label>
                </>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Observaciones generales" description="Cualquier dato extra que quieras agregar." required>
            <div className={styles["intake-grid"]}>
              <label className={`${styles["intake-field"]} ${styles["intake-field-wide"]}`}>
                <span>Observaciones generales del evento</span>
                <textarea
                  placeholder="Escribe aquí cualquier detalle que no hayas incluido en las secciones anteriores."
                  value={data.general_observations.notes}
                  onChange={(event) => patchSection("general_observations", { notes: event.target.value })}
                />
              </label>
            </div>
          </SectionCard>

          {error ? <p className={styles["intake-error"]}>{error}</p> : null}
          {message ? <p className={styles["intake-success"]}>{message}</p> : null}
          <div className={styles["intake-actions"]}>
            <button className={`${styles["intake-button"]} ${styles["intake-button-primary"]}`} type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </IntakeThemeShell>
  );
}
