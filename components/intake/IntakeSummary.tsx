"use client";

import { useState } from "react";
import Link from "next/link";
import type { EventIntakeFormRecord, EventIntakeStatus } from "@/types/intake";
import styles from "./EventIntake.module.css";
import { IntakeThemeShell } from "./IntakeThemeShell";

type IntakeSummaryProps = {
  form: EventIntakeFormRecord;
};

const statusLabels: Record<EventIntakeStatus, string> = {
  new: "Nuevo",
  reviewed: "Revisado",
  in_progress: "En proceso",
  done: "Terminado",
};

function yesNo(value: string) {
  return value === "yes" ? "Sí" : "No";
}

function dateTimeLabel(value: string | null) {
  if (!value) {
    return "Sin enviar";
  }
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function compact(items: Array<[string, string | string[] | undefined | null]>) {
  return items
    .map(([label, value]) => [label, Array.isArray(value) ? value.join(", ") : value] as [string, string | undefined | null])
    .filter(([, value]) => Boolean(value && value.trim()));
}

function joinNotes(...values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join("\n\n");
}

function SummaryCard({ title, items }: { title: string; items: Array<[string, string | string[] | undefined | null]> }) {
  const visibleItems = compact(items);
  if (!visibleItems.length) {
    return null;
  }

  return (
    <section className={styles["intake-summary-card"]}>
      <h2>{title}</h2>
      <div className={styles["summary-list"]}>
        {visibleItems.map(([label, value]) => (
          <div key={label} className={styles["summary-item"]}>
            <strong>{label}</strong>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function IntakeSummary({ form }: IntakeSummaryProps) {
  const [status, setStatus] = useState<EventIntakeStatus>(form.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleStatusChange(nextStatus: EventIntakeStatus) {
    setStatus(nextStatus);
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/intakes/${encodeURIComponent(form.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo actualizar.");
      }
      setMessage("Estado actualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  }

  const briefUrl = typeof window === "undefined" ? `/brief/${form.token}` : `${window.location.origin}/brief/${form.token}`;

  async function handleCopyBriefUrl() {
    try {
      await navigator.clipboard.writeText(briefUrl);
      setMessage("Link del cliente copiado.");
    } catch {
      setMessage("No se pudo copiar automaticamente. Copia el link manualmente.");
    }
  }

  return (
    <IntakeThemeShell>
      <div className={styles["intake-container"]}>
        <header className={styles["intake-header"]}>
          <p className={styles["intake-kicker"]}>Resumen administrativo</p>
          <h1>{form.event_data.celebrant_name || "Formulario sin nombre"}</h1>
          <p>Enviado: {dateTimeLabel(form.submitted_at)}</p>
          <div className={styles["client-link-panel"]}>
            <div>
              <strong>Formulario para el cliente</strong>
              <span>{briefUrl}</span>
            </div>
            <div className={styles["client-link-actions"]}>
              <button className={styles["intake-button"]} type="button" onClick={() => void handleCopyBriefUrl()}>
                Copiar link
              </button>
              <a className={`${styles["intake-button"]} ${styles["intake-button-primary"]}`} href={briefUrl} target="_blank" rel="noreferrer">
                Abrir formulario
              </a>
            </div>
          </div>
          <div className={styles["intake-actions"]}>
            <Link className={styles["intake-button"]} href="/admin/intakes">
              Volver
            </Link>
            <label className={styles["intake-field"]}>
              <span>Estado</span>
              <select value={status} onChange={(event) => void handleStatusChange(event.target.value as EventIntakeStatus)} disabled={saving}>
                {(Object.keys(statusLabels) as EventIntakeStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {statusLabels[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {message ? <p className={styles["intake-success"]}>{message}</p> : null}
        </header>

        {!form.submitted_at ? (
          <section className={styles["intake-summary-card"]}>
            <h2>Siguiente paso</h2>
            <p>
              Este formulario todavía está vacío. Comparte el enlace de arriba por WhatsApp para que el cliente lo llene.
              Cuando lo envíe, aquí aparecerá el resumen organizado por secciones.
            </p>
          </section>
        ) : null}

        <div className={styles["summary-grid"]}>
          <SummaryCard
            title="Datos del evento"
            items={[
              ["Nombre del festejado(a)", form.event_data.celebrant_name],
              ["Edad", form.event_data.age],
              ["Fecha", form.event_data.event_date],
              ["Hora de inicio", form.event_data.start_time],
              ["Lugar", form.event_data.venue_name],
              ["Dirección", form.event_data.address],
              ["Google Maps", form.event_data.has_maps_link === "yes" ? form.event_data.maps_link : ""],
              ["Contacto", form.event_data.contact_name],
              ["WhatsApp", form.event_data.contact_whatsapp],
              ["Texto del botón", form.event_data.contact_button_text],
            ]}
          />
          <SummaryCard
            title="Estilo de la invitación"
            items={[
              ["Tema", form.invitation_style.desired_theme],
              ["Colores", form.invitation_style.favorite_colors],
              ["Estilo visual", form.invitation_style.visual_styles],
              ["Otro estilo", form.invitation_style.other_visual_style],
              ["Foto en portada", yesNo(form.invitation_style.wants_cover_photo)],
            ]}
          />
          {form.main_text.enabled ? (
            <SummaryCard title="Texto especial" items={[["Frase especial", form.main_text.has_special_phrase === "yes" ? form.main_text.special_phrase : ""]]} />
          ) : null}
          {form.rsvp.enabled ? (
            <SummaryCard title="Confirmación RSVP" items={[["Confirmar asistencia", yesNo(form.rsvp.wants_rsvp)], ["Fecha límite", form.rsvp.has_deadline === "yes" ? form.rsvp.deadline : ""]]} />
          ) : null}
          {form.itinerary.enabled ? (
            <SummaryCard
              title="Itinerario"
              items={[
                ["Bienvenida", form.itinerary.welcome_time],
                ["Comida", form.itinerary.meal_time],
                ["Pastel", form.itinerary.cake_time],
                ["Piñata", form.itinerary.pinata_time],
                ["Show / actividad", form.itinerary.has_special_activity === "yes" ? `${form.itinerary.special_activity_time} ${form.itinerary.special_activity_name}`.trim() : ""],
                ["Cierre", form.itinerary.closing_time],
                ["Actividades", form.itinerary.activities_notes],
              ]}
            />
          ) : null}
          {form.dress_code.enabled ? (
            <SummaryCard title="Código de vestimenta" items={[["Colores", form.dress_code.suggested_colors], ["Ropa / indicaciones", form.dress_code.clothing_notes], ["Otra indicación", form.dress_code.extra_notes]]} />
          ) : null}
          {form.gifts.enabled ? (
            <SummaryCard title="Regalos" items={[["Mencionar regalos", yesNo(form.gifts.wants_gifts_mention)], ["Mesa o link", form.gifts.registry_or_link], ["Indicaciones", form.gifts.gift_notes]]} />
          ) : null}
          {form.photos_multimedia.enabled ? (
            <SummaryCard title="Fotos y multimedia" items={[["Incluir fotos", yesNo(form.photos_multimedia.wants_photos)], ["Foto portada", yesNo(form.photos_multimedia.wants_cover_photo)], ["Galería / momentos", yesNo(form.photos_multimedia.wants_gallery)], ["Notas", form.photos_multimedia.photo_notes]]} />
          ) : null}
          {form.faq_notices.enabled ? (
            <SummaryCard
              title="Preguntas frecuentes / avisos"
              items={[
                ["Acompañantes", form.faq_notices.can_bring_guests_enabled ? yesNo(form.faq_notices.can_bring_guests) : ""],
                ["Niños", form.faq_notices.children_allowed_enabled ? yesNo(form.faq_notices.children_allowed) : ""],
                ["Alberca / actividades", form.faq_notices.has_pool_or_special_activities_enabled ? yesNo(form.faq_notices.has_pool_or_special_activities) : ""],
                ["Alimentos para niños", form.faq_notices.has_food_for_children_enabled ? yesNo(form.faq_notices.has_food_for_children) : ""],
                ["Estacionamiento", form.faq_notices.has_parking_enabled ? yesNo(form.faq_notices.has_parking) : ""],
                ["Preguntas, reglas o avisos", joinNotes(form.faq_notices.venue_rules, form.faq_notices.important_notices)],
              ]}
            />
          ) : null}
          {form.live_stream.enabled ? (
            <SummaryCard title="Transmisión en vivo" items={[["Incluir transmisión", yesNo(form.live_stream.wants_live_stream)], ["Link", form.live_stream.live_stream_link], ["Hora", form.live_stream.start_time], ["Indicaciones", form.live_stream.instructions]]} />
          ) : null}
          {form.lodging_transport.enabled ? (
            <SummaryCard title="Hospedaje o transporte" items={[["Incluir", yesNo(form.lodging_transport.wants_lodging_transport)], ["Hoteles", form.lodging_transport.recommended_hotels], ["Punto de reunión", form.lodging_transport.meeting_point], ["Transporte", form.lodging_transport.special_transport], ["Invitados de fuera", form.lodging_transport.out_of_town_notes]]} />
          ) : null}
          <SummaryCard title="Observaciones generales" items={[["Notas", form.general_observations.notes]]} />
        </div>
      </div>
    </IntakeThemeShell>
  );
}
