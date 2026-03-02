"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/layout_v1/invitation-renderer";
import { safeJsonParse } from "@/lib/utils";
import type { InvitationRecord, SectionKey } from "@/types/invitations";

type InvitationEditorFormProps = {
  invitation: InvitationRecord;
};

const editableSectionKeys: SectionKey[] = [
  "hero",
  "event_info",
  "quick_actions",
  "countdown",
  "map",
  "gallery",
  "notes",
  "rsvp",
  "contact",
];

export function InvitationEditorForm({ invitation }: InvitationEditorFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<InvitationRecord>(invitation);
  const [galleryText, setGalleryText] = useState(draft.sections.gallery.image_urls.join("\n"));
  const [notesText, setNotesText] = useState(draft.sections.notes.items.join("\n"));
  const [quickActionsText, setQuickActionsText] = useState(
    JSON.stringify(draft.sections.quick_actions.items, null, 2),
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateDraft(next: InvitationRecord) {
    setDraft(next);
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

  function previewInvitation(): InvitationRecord {
    return {
      ...draft,
      sections: {
        ...draft.sections,
        gallery: {
          ...draft.sections.gallery,
          image_urls: galleryText.split("\n").map((item) => item.trim()).filter(Boolean),
        },
        notes: {
          ...draft.sections.notes,
          items: notesText.split("\n").map((item) => item.trim()).filter(Boolean),
        },
        quick_actions: {
          ...draft.sections.quick_actions,
          items: safeJsonParse(quickActionsText, draft.sections.quick_actions.items),
        },
      },
    };
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setStatus("");

    const payload = previewInvitation();

    try {
      const response = await fetch(`/api/admin/invitations/${draft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(responsePayload.error || "No se pudo guardar.");
      }
      setDraft(payload);
      setStatus("Cambios guardados.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="two-column">
      <section className="admin-panel">
        <div className="inline-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="eyebrow">Editor</p>
            <h2>{draft.sections.hero.title}</h2>
          </div>
          <span className={`status-pill ${draft.status}`}>{draft.status}</span>
        </div>
        <div className="form-grid" style={{ marginTop: 18 }}>
          <label className="field">
            <span>Slug</span>
            <input
              value={draft.slug}
              onChange={(event) => updateDraft({ ...draft, slug: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={draft.status}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  status: event.target.value as InvitationRecord["status"],
                })
              }
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <label className="field">
            <span>Tema</span>
            <input
              value={draft.theme_id}
              onChange={(event) => updateDraft({ ...draft, theme_id: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Animation profile</span>
            <select
              value={draft.animation_profile}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  animation_profile: event.target.value as InvitationRecord["animation_profile"],
                })
              }
            >
              <option value="lite">lite</option>
              <option value="pro">pro</option>
              <option value="max">max</option>
            </select>
          </label>
          <label className="field">
            <span>Timezone</span>
            <input
              value={draft.timezone}
              onChange={(event) => updateDraft({ ...draft, timezone: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Event start</span>
            <input
              type="datetime-local"
              value={draft.event_start_at.slice(0, 16)}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  event_start_at: new Date(event.target.value).toISOString(),
                })
              }
            />
          </label>
          <label className="field">
            <span>RSVP until</span>
            <input
              type="datetime-local"
              value={draft.rsvp_until.slice(0, 16)}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  rsvp_until: new Date(event.target.value).toISOString(),
                })
              }
            />
          </label>
          <label className="field">
            <span>Active until</span>
            <input
              type="datetime-local"
              value={draft.active_until.slice(0, 16)}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  active_until: new Date(event.target.value).toISOString(),
                })
              }
            />
          </label>
          <label className="field-wide">
            <span>Sections order (coma separada)</span>
            <input
              value={draft.sections_order.join(",")}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections_order: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean) as SectionKey[],
                })
              }
            />
          </label>
        </div>

        <div className="checkbox-row" style={{ marginTop: 22 }}>
          {editableSectionKeys.map((key) => (
            <label key={key} className="checkbox-tile">
              <input
                type="checkbox"
                checked={draft.sections[key].enabled}
                onChange={(event) => updateSectionEnabled(key, event.target.checked)}
              />
              <span>{key}</span>
            </label>
          ))}
        </div>

        <div className="form-grid" style={{ marginTop: 22 }}>
          <label className="field">
            <span>Hero title</span>
            <input
              value={draft.sections.hero.title}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    hero: { ...draft.sections.hero, title: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Hero subtitle</span>
            <input
              value={draft.sections.hero.subtitle}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    hero: { ...draft.sections.hero, subtitle: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Hero badge</span>
            <input
              value={draft.sections.hero.badge}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    hero: { ...draft.sections.hero, badge: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Hero image URL</span>
            <input
              value={draft.sections.hero.background_image_url}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    hero: { ...draft.sections.hero, background_image_url: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Lugar</span>
            <input
              value={draft.sections.event_info.venue_name}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    event_info: { ...draft.sections.event_info, venue_name: event.target.value },
                  },
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
            <span>Fecha visible</span>
            <input
              value={draft.sections.event_info.date_text}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    event_info: { ...draft.sections.event_info, date_text: event.target.value },
                  },
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
                  sections: {
                    ...draft.sections,
                    event_info: { ...draft.sections.event_info, time_text: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Countdown label</span>
            <input
              value={draft.sections.countdown.label}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    countdown: { ...draft.sections.countdown, label: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Map lat</span>
            <input
              value={String(draft.sections.map.embed.lat)}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    map: {
                      ...draft.sections.map,
                      embed: { ...draft.sections.map.embed, lat: Number(event.target.value) },
                    },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Map lng</span>
            <input
              value={String(draft.sections.map.embed.lng)}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    map: {
                      ...draft.sections.map,
                      embed: { ...draft.sections.map.embed, lng: Number(event.target.value) },
                    },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Google Maps URL</span>
            <input
              value={draft.sections.map.maps_url}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    map: { ...draft.sections.map, maps_url: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field-wide">
            <span>Quick actions (JSON)</span>
            <textarea value={quickActionsText} onChange={(event) => setQuickActionsText(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Gallery URLs (una por linea)</span>
            <textarea value={galleryText} onChange={(event) => setGalleryText(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Notas (una por linea)</span>
            <textarea value={notesText} onChange={(event) => setNotesText(event.target.value)} />
          </label>
          <label className="field">
            <span>RSVP closed message</span>
            <input
              value={draft.sections.rsvp.closed_message}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    rsvp: { ...draft.sections.rsvp, closed_message: event.target.value },
                  },
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
                      fields: {
                        ...draft.sections.rsvp.fields,
                        guests_count: event.target.checked,
                      },
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
                      fields: {
                        ...draft.sections.rsvp.fields,
                        message: event.target.checked,
                      },
                    },
                  },
                })
              }
            />
            <span>Permitir mensaje</span>
          </label>
          <label className="field">
            <span>Contacto</span>
            <input
              value={draft.sections.contact.name}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    contact: { ...draft.sections.contact, name: event.target.value },
                  },
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
                    contact: { ...draft.sections.contact, whatsapp_number: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>Contact label</span>
            <input
              value={draft.sections.contact.label}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  sections: {
                    ...draft.sections,
                    contact: { ...draft.sections.contact, label: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field">
            <span>OG title</span>
            <input
              value={draft.share.og_title}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  share: { ...draft.share, og_title: event.target.value },
                })
              }
            />
          </label>
          <label className="field-wide">
            <span>OG description</span>
            <input
              value={draft.share.og_description}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  share: { ...draft.share, og_description: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>OG image URL</span>
            <input
              value={draft.share.og_image_url}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  share: { ...draft.share, og_image_url: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>Expired title</span>
            <input
              value={draft.expired_page.title}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  expired_page: { ...draft.expired_page, title: event.target.value },
                })
              }
            />
          </label>
          <label className="field-wide">
            <span>Expired message</span>
            <input
              value={draft.expired_page.message}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  expired_page: { ...draft.expired_page, message: event.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>CTA primaria texto</span>
            <input
              value={draft.expired_page.primary_cta.text}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  expired_page: {
                    ...draft.expired_page,
                    primary_cta: { ...draft.expired_page.primary_cta, text: event.target.value },
                  },
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
                  expired_page: {
                    ...draft.expired_page,
                    primary_cta: { ...draft.expired_page.primary_cta, href: event.target.value },
                  },
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
                  expired_page: {
                    ...draft.expired_page,
                    secondary_cta: { ...draft.expired_page.secondary_cta, text: event.target.value },
                  },
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
                  expired_page: {
                    ...draft.expired_page,
                    secondary_cta: { ...draft.expired_page.secondary_cta, href: event.target.value },
                  },
                })
              }
            />
          </label>
        </div>
        <div className="inline-actions" style={{ marginTop: 24 }}>
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
        {status ? <p className="success-text">{status}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </section>
      <section className="admin-panel">
        <p className="eyebrow">Preview movil</p>
        <h2>Vista previa live</h2>
        <InvitationRenderer invitation={previewInvitation()} previewMode />
      </section>
    </div>
  );
}
