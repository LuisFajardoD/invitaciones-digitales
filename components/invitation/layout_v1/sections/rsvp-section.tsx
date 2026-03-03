"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  getButtonHoverMotion,
  getButtonTapMotion,
} from "@/components/invitation/layout_v1/motion";
import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import type { InvitationRecord, RsvpSectionData } from "@/types/invitations";

type RsvpSectionProps = {
  invitation: InvitationRecord;
  data: RsvpSectionData;
  previewMode?: boolean;
};

type CompatibleRsvpFields = RsvpSectionData["fields"] & {
  allow_guests_count?: boolean;
  allow_message?: boolean;
};

export function RsvpSection({ invitation, data, previewMode = false }: RsvpSectionProps) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState("");
  const [guestsCount, setGuestsCount] = useState("1");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  const fields = data.fields as CompatibleRsvpFields;
  const allowGuestsCount = Boolean(fields.guests_count ?? fields.allow_guests_count);
  const allowMessage = Boolean(fields.message ?? fields.allow_message);
  const isClosed = useMemo(
    () => new Date().getTime() > new Date(invitation.rsvp_until).getTime(),
    [invitation.rsvp_until],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!attending) {
      setError("Selecciona si asistes o no.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationId: invitation.id,
          name,
          attending: attending === "yes",
          guestsCount: allowGuestsCount ? Number(guestsCount || "1") : null,
          message: allowMessage ? message : null,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo enviar tu confirmación.");
      }

      setSaved(true);
      setName("");
      setAttending("");
      setGuestsCount("1");
      setMessage("");
      window.setTimeout(() => setSaved(false), 2200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo enviar tu confirmación.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InvitationSectionFrame
      id="rsvp-section"
      eyebrow="Confirmación"
      title="Confirma tu asistencia"
      subtitle="Envíanos tu respuesta para cerrar la bitácora."
      tone="aurora"
    >
      {previewMode ? (
        <p className="mission-caption">Vista previa de RSVP en admin. El envío real se hace desde /i/[slug].</p>
      ) : isClosed ? (
        <div className="mission-closed-state">
          <strong>{data.closed_message || "RSVP cerrado"}</strong>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-grid rsvp-form">
          <label className="field">
            <span className="mission-label">Nombre *</span>
            <input className="mission-input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">
            <span className="mission-label">¿Asistes? *</span>
            <select
              className="mission-input"
              value={attending}
              onChange={(event) => setAttending(event.target.value)}
            >
              <option value="">Selecciona</option>
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </label>
          {allowGuestsCount ? (
            <label className="field">
              <span className="mission-label">Acompañantes</span>
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
            <label className="field-wide">
              <span className="mission-label">Mensaje</span>
              <textarea
                className="mission-input"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
          ) : null}
          <div className="field-wide">
            <motion.button
              type="submit"
              className="mission-button"
              disabled={submitting}
              whileHover={getButtonHoverMotion(reducedMotion)}
              whileTap={getButtonTapMotion(reducedMotion)}
            >
              {submitting ? "Transmitiendo..." : "Enviar RSVP"}
            </motion.button>
          </div>
          {error ? <p className="error-text field-wide">{error}</p> : null}
        </form>
      )}
      <AnimatePresence>
        {saved ? (
          <motion.div
            className="rsvp-success rsvp-success--mission"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: reducedMotion ? 0.22 : 0.28 }}
            aria-live="polite"
          >
            <motion.div
              className="mission-launch"
              animate={reducedMotion ? undefined : { scale: [1, 1.03, 1] }}
              transition={{ duration: 2.1, ease: "easeInOut" }}
            >
              <motion.div
                className="mission-launch__trail"
                animate={reducedMotion ? undefined : { opacity: [0.35, 0.75, 0.25], scaleY: [0.92, 1.08, 0.94] }}
                transition={{ duration: 2.1, ease: "easeInOut" }}
              />
              <motion.div
                className="mission-launch__rocket"
                animate={reducedMotion ? undefined : { x: [0, 12, 26], y: [0, -8, -20], rotate: [-8, -4, -2] }}
                transition={{ duration: 2.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <MissionRocket />
              </motion.div>
            </motion.div>
            <strong>Misión completada</strong>
            <p className="mission-caption">Tu RSVP fue enviado y ya quedó registrado.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </InvitationSectionFrame>
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
