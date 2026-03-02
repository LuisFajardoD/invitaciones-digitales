"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { InvitationRecord, RsvpSectionData } from "@/types/invitations";

type RsvpSectionProps = {
  invitation: InvitationRecord;
  data: RsvpSectionData;
  previewMode?: boolean;
};

export function RsvpSection({ invitation, data, previewMode = false }: RsvpSectionProps) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState("");
  const [guestsCount, setGuestsCount] = useState("1");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
          guestsCount: data.fields.guests_count ? Number(guestsCount || "1") : null,
          message: data.fields.message ? message : null,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo enviar tu confirmacion.");
      }

      setSaved(true);
      setName("");
      setAttending("");
      setGuestsCount("1");
      setMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo enviar tu confirmacion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section-shell" id="rsvp-section">
      <p className="eyebrow">RSVP</p>
      <h2>Confirma tu asistencia</h2>
      {previewMode ? (
        <p className="helper-text">Preview de RSVP en admin. El envio real se hace desde /i/[slug].</p>
      ) : isClosed ? (
        <div className="status-card" style={{ width: "100%", margin: "0", padding: "20px" }}>
          <strong>{data.closed_message || "RSVP cerrado"}</strong>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="field">
            <span>Nombre *</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">
            <span>Asistes? *</span>
            <select value={attending} onChange={(event) => setAttending(event.target.value)}>
              <option value="">Selecciona</option>
              <option value="yes">Si</option>
              <option value="no">No</option>
            </select>
          </label>
          {data.fields.guests_count ? (
            <label className="field">
              <span>Acompanantes</span>
              <input
                type="number"
                min={1}
                value={guestsCount}
                onChange={(event) => setGuestsCount(event.target.value)}
              />
            </label>
          ) : null}
          {data.fields.message ? (
            <label className="field-wide">
              <span>Mensaje</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
          ) : null}
          <div className="field-wide">
            <button type="submit" className="button-primary" disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar RSVP"}
            </button>
          </div>
          {error ? <p className="error-text field-wide">{error}</p> : null}
        </form>
      )}
      <AnimatePresence>
        {saved ? (
          <motion.div
            className="rsvp-success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="success-orbit"
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: 1, ease: "easeInOut" }}
            />
            <strong>Confirmado</strong>
            <p className="helper-text">Tu respuesta quedo registrada. Nos vemos pronto.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
