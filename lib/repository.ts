import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { demoInvitation, demoResponses, demoSiteSettings, demoTheme } from "@/lib/demo-data";
import { normalizeInvitationRecord, toDatabaseInvitationRecord } from "@/lib/invitation-defaults";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";
import { hasConfiguredSupabase } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { buildRsvpSummary, createWhatsAppUrl, slugify } from "@/lib/utils";
import type {
  ClientRsvpView,
  InvitationRecord,
  InvitationTemplateRecord,
  RsvpResponse,
  RsvpSummary,
  SiteSettingsData,
  SiteSettingsRecord,
  ThemeRecord,
} from "@/types/invitations";

type CreateInvitationInput = {
  slug: string;
  theme_id: string;
  event_start_at: string;
  venue_name: string;
  address_text: string;
  lat: number;
  lng: number;
  hero_badge?: string;
  hero_accent?: string;
};

type CreateInvitationFromTemplateInput = {
  template_id: string;
  slug: string;
  theme_id?: string;
  event_start_at: string;
  venue_name: string;
  address_text: string;
  lat: number;
  lng: number;
};

type MockStore = {
  invitations: InvitationRecord[];
  rsvpResponses: RsvpResponse[];
  siteSettings: SiteSettingsRecord;
  themes: ThemeRecord[];
};

const MOCK_STORE_DIR = path.join(process.cwd(), ".mock-data");
const MOCK_STORE_PATH = path.join(MOCK_STORE_DIR, "store.json");

function buildEventWindow(eventAtIso: string) {
  const eventDate = new Date(eventAtIso);
  const rsvpUntil = new Date(eventDate);
  rsvpUntil.setHours(23, 59, 59, 999);
  const activeUntil = new Date(eventDate);
  activeUntil.setDate(activeUntil.getDate() + 1);
  activeUntil.setHours(23, 59, 59, 999);

  return {
    eventDate,
    rsvpUntil: rsvpUntil.toISOString(),
    activeUntil: activeUntil.toISOString(),
  };
}

function normalizeInvitationTemplates(rawTemplates: SiteSettingsData["invitation_templates"]) {
  if (!Array.isArray(rawTemplates)) {
    return [] as InvitationTemplateRecord[];
  }

  return rawTemplates
    .filter((template): template is InvitationTemplateRecord =>
      Boolean(
        template &&
          typeof template.id === "string" &&
          typeof template.name === "string" &&
          typeof template.source_invitation_id === "string",
      ),
    )
    .map((template) => ({
      ...template,
      description: template.description || "",
      created_at: template.created_at || new Date().toISOString(),
      updated_at: template.updated_at || new Date().toISOString(),
    }));
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createDefaultMockStore(): MockStore {
  return {
    invitations: [normalizeInvitationRecord(cloneValue(demoInvitation))],
    rsvpResponses: cloneValue(demoResponses),
    siteSettings: cloneValue(demoSiteSettings),
    themes: [cloneValue(demoTheme)],
  };
}

async function writeMockStore(store: MockStore) {
  await mkdir(MOCK_STORE_DIR, { recursive: true });
  await writeFile(MOCK_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function readMockStore(): Promise<MockStore> {
  try {
    const raw = await readFile(MOCK_STORE_PATH, "utf8");
    return JSON.parse(raw) as MockStore;
  } catch {
    const seed = createDefaultMockStore();
    await writeMockStore(seed);
    return seed;
  }
}

export function isUsingMockData() {
  return !hasConfiguredSupabase();
}

export async function listInvitations() {
  if (isUsingMockData()) {
    const store = await readMockStore();
    return [...store.invitations].map((item) => normalizeInvitationRecord(item)).sort(
      (a, b) => new Date(b.event_start_at).getTime() - new Date(a.event_start_at).getTime(),
    );
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase!.from("invitations").select("*").order("event_start_at", {
    ascending: false,
  });
  if (error) {
    throw new Error(error.message);
  }

  return ((data as InvitationRecord[]) || []).map((item) => normalizeInvitationRecord(item));
}

export async function getInvitationById(id: string) {
  if (isUsingMockData()) {
    const store = await readMockStore();
    const item = store.invitations.find((record) => record.id === id);
    return item ? normalizeInvitationRecord(item) : null;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase!.from("invitations").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? normalizeInvitationRecord(data as InvitationRecord) : null;
}

export async function getInvitationBySlug(slug: string) {
  if (isUsingMockData()) {
    const store = await readMockStore();
    const item = store.invitations.find((record) => record.slug === slug);
    return item ? normalizeInvitationRecord(item) : null;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase!
    .from("invitations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? normalizeInvitationRecord(data as InvitationRecord) : null;
}

export async function getPublicInvitationBySlug(slug: string) {
  const invitation = await getInvitationBySlug(slug);
  if (!invitation || invitation.status !== "published") {
    return null;
  }
  return invitation;
}

export async function getSiteSettings() {
  if (isUsingMockData()) {
    const store = await readMockStore();
    return {
      ...cloneValue(store.siteSettings),
      data: normalizeSiteSettingsData(store.siteSettings.data),
    };
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase!
    .from("site_settings")
    .select("*")
    .eq("id", "main")
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      ...demoSiteSettings,
      data: normalizeSiteSettingsData(demoSiteSettings.data),
    };
  }

  const record = data as SiteSettingsRecord;
  return {
    ...record,
    data: normalizeSiteSettingsData(record.data),
  };
}

export async function saveSiteSettings(data: SiteSettingsData) {
  const record: SiteSettingsRecord = {
    id: "main",
    data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isUsingMockData()) {
    const store = await readMockStore();
    store.siteSettings = record;
    await writeMockStore(store);
    return record;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!.from("site_settings").upsert(
    {
      id: "main",
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    throw new Error(error.message);
  }

  return record;
}

export async function listInvitationTemplates() {
  const siteSettings = await getSiteSettings();
  const templates = normalizeInvitationTemplates(siteSettings.data.invitation_templates);

  return templates.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export async function saveInvitationAsTemplate(input: {
  invitationId: string;
  name: string;
  description?: string;
}) {
  const invitation = await getInvitationById(input.invitationId);
  if (!invitation) {
    throw new Error("Invitación no encontrada.");
  }

  const templateName = input.name.trim();
  if (!templateName) {
    throw new Error("El nombre de la plantilla es obligatorio.");
  }

  const siteSettings = await getSiteSettings();
  const currentTemplates = normalizeInvitationTemplates(siteSettings.data.invitation_templates);
  const now = new Date().toISOString();
  const description = input.description?.trim() || "";
  const existingTemplate = currentTemplates.find(
    (template) => template.source_invitation_id === invitation.id,
  );
  const templateId = existingTemplate?.id || randomUUID();

  const nextTemplates = existingTemplate
    ? currentTemplates.map((template) =>
        template.id === existingTemplate.id
          ? {
              ...template,
              name: templateName,
              description,
              updated_at: now,
            }
          : template,
      )
    : [
        {
          id: templateId,
          name: templateName,
          description,
          source_invitation_id: invitation.id,
          created_at: now,
          updated_at: now,
        },
        ...currentTemplates,
      ];

  await saveSiteSettings({
    ...siteSettings.data,
    invitation_templates: nextTemplates,
  });

  return nextTemplates.find((template) => template.id === templateId) || null;
}

export async function listThemes() {
  if (isUsingMockData()) {
    const store = await readMockStore();
    return [...store.themes];
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase!.from("themes").select("*").order("name");
  if (error) {
    throw new Error(error.message);
  }

  const themes = (data as ThemeRecord[]) || [];
  return themes.length ? themes : [{ ...demoTheme }];
}

export async function createInvitation(input: CreateInvitationInput) {
  const slug = slugify(input.slug);
  const now = new Date();
  const { eventDate, rsvpUntil, activeUntil } = buildEventWindow(input.event_start_at);
  const defaultHeroBadge = input.hero_badge?.trim() || "Protocolo de despegue";
  const defaultHeroAccent = input.hero_accent?.trim() || "ID: LA - 07";

  const invitation: InvitationRecord = normalizeInvitationRecord({
    ...demoInvitation,
    id: randomUUID(),
    slug,
    status: "draft",
    theme_id: input.theme_id || "astronautas",
    event_start_at: eventDate.toISOString(),
    rsvp_until: rsvpUntil,
    active_until: activeUntil,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    sections: {
      ...demoInvitation.sections,
      hero: {
        ...demoInvitation.sections.hero,
        title: `Invitación ${slug}`,
        badge: defaultHeroBadge,
        accent: defaultHeroAccent,
      },
      event_info: {
        ...demoInvitation.sections.event_info,
        venue_name: input.venue_name,
        address_text: input.address_text,
      },
      map: {
        ...demoInvitation.sections.map,
        address_text: input.address_text,
        embed: {
          ...demoInvitation.sections.map.embed,
          lat: input.lat,
          lng: input.lng,
        },
        maps_url: `https://www.google.com/maps/search/?api=1&query=${input.lat},${input.lng}`,
      },
      countdown: {
        ...demoInvitation.sections.countdown,
        target_at: eventDate.toISOString(),
      },
      contact: {
        ...demoInvitation.sections.contact,
        whatsapp_url: createWhatsAppUrl(
          demoInvitation.sections.contact.whatsapp_number,
          `Hola, necesito detalles de la invitación ${slug}.`,
        ),
      },
    },
    share: {
      ...demoInvitation.share,
      og_title: `Invitación ${slug}`,
      og_description: `Te esperamos en ${input.venue_name}.`,
    },
  });

  if (isUsingMockData()) {
    const store = await readMockStore();
    store.invitations.unshift(invitation);
    await writeMockStore(store);
    return invitation;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!.from("invitations").insert(toDatabaseInvitationRecord(invitation));
  if (error) {
    throw new Error(error.message);
  }
  return invitation;
}

export async function createInvitationFromTemplate(input: CreateInvitationFromTemplateInput) {
  const templateId = input.template_id.trim();
  if (!templateId) {
    throw new Error("Plantilla inválida.");
  }

  const siteSettings = await getSiteSettings();
  const templates = normalizeInvitationTemplates(siteSettings.data.invitation_templates);
  const template = templates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error("Plantilla no encontrada.");
  }

  const sourceInvitation = await getInvitationById(template.source_invitation_id);
  if (!sourceInvitation) {
    throw new Error("La invitación de origen de la plantilla ya no existe.");
  }

  const now = new Date().toISOString();
  const slug = slugify(input.slug);
  const { eventDate, rsvpUntil, activeUntil } = buildEventWindow(input.event_start_at);

  const createdInvitation: InvitationRecord = normalizeInvitationRecord({
    ...sourceInvitation,
    id: randomUUID(),
    slug,
    status: "draft",
    theme_id: input.theme_id?.trim() || sourceInvitation.theme_id,
    event_start_at: eventDate.toISOString(),
    rsvp_until: rsvpUntil,
    active_until: activeUntil,
    client_view_token: randomUUID(),
    created_at: now,
    updated_at: now,
    sections: {
      ...sourceInvitation.sections,
      event_info: {
        ...sourceInvitation.sections.event_info,
        venue_name: input.venue_name,
        address_text: input.address_text,
      },
      map: {
        ...sourceInvitation.sections.map,
        address_text: input.address_text,
        embed: {
          ...(sourceInvitation.sections.map.embed || { zoom: 16 }),
          lat: input.lat,
          lng: input.lng,
        },
        maps_url: `https://www.google.com/maps/search/?api=1&query=${input.lat},${input.lng}`,
      },
      countdown: {
        ...sourceInvitation.sections.countdown,
        target_at: eventDate.toISOString(),
      },
    },
  });

  if (isUsingMockData()) {
    const store = await readMockStore();
    store.invitations.unshift(createdInvitation);
    await writeMockStore(store);
    return createdInvitation;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!
    .from("invitations")
    .insert(toDatabaseInvitationRecord(createdInvitation));
  if (error) {
    throw new Error(error.message);
  }

  return createdInvitation;
}

export async function updateInvitation(invitation: InvitationRecord) {
  const updated: InvitationRecord = normalizeInvitationRecord({
    ...invitation,
    slug: slugify(invitation.slug),
    updated_at: new Date().toISOString(),
  });

  if (isUsingMockData()) {
    const store = await readMockStore();
    store.invitations = store.invitations.map((item) =>
      item.id === updated.id ? updated : item,
    );
    await writeMockStore(store);
    return updated;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!
    .from("invitations")
    .update(toDatabaseInvitationRecord(updated))
    .eq("id", updated.id);
  if (error) {
    throw new Error(error.message);
  }

  return updated;
}

export async function duplicateInvitation(id: string) {
  const original = await getInvitationById(id);
  if (!original) {
    throw new Error("Invitación no encontrada.");
  }

  const duplicated: InvitationRecord = normalizeInvitationRecord({
    ...original,
    id: randomUUID(),
    slug: `${original.slug}-copy-${Date.now()}`,
    status: "draft",
    client_view_token: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (isUsingMockData()) {
    const store = await readMockStore();
    store.invitations.unshift(duplicated);
    await writeMockStore(store);
    return duplicated;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!.from("invitations").insert(toDatabaseInvitationRecord(duplicated));
  if (error) {
    throw new Error(error.message);
  }
  return duplicated;
}

export async function listRsvpResponses(invitationId: string) {
  if (isUsingMockData()) {
    const store = await readMockStore();
    return store.rsvpResponses.filter((item) => item.invitation_id === invitationId);
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase!
    .from("rsvp_responses")
    .select("*")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data as RsvpResponse[]) || [];
}

export async function getRsvpSummary(invitationId: string): Promise<RsvpSummary> {
  const responses = await listRsvpResponses(invitationId);
  return buildRsvpSummary(responses);
}

export async function createRsvpResponse(input: {
  invitationId: string;
  name: string;
  attending: boolean;
  guestsCount?: number | null;
  message?: string | null;
}) {
  const invitation = await getInvitationById(input.invitationId);
  if (!invitation) {
    throw new Error("Invitación no encontrada.");
  }

  if (!invitation.sections.rsvp.enabled) {
    throw new Error("RSVP no disponible.");
  }

  if (new Date().getTime() > new Date(invitation.rsvp_until).getTime()) {
    throw new Error("RSVP cerrado.");
  }

  const record: RsvpResponse = {
    id: randomUUID(),
    invitation_id: input.invitationId,
    name: input.name.trim(),
    attending: input.attending,
    guests_count: input.guestsCount ?? null,
    message: input.message?.trim() || null,
    created_at: new Date().toISOString(),
  };

  if (isUsingMockData()) {
    const store = await readMockStore();
    store.rsvpResponses.unshift(record);
    await writeMockStore(store);
    return record;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!.from("rsvp_responses").insert({
    invitation_id: record.invitation_id,
    name: record.name,
    attending: record.attending,
    guests_count: record.guests_count,
    message: record.message,
  });
  if (error) {
    throw new Error(error.message);
  }

  return record;
}

export async function createPublicRsvpResponse(input: {
  slug: string;
  name: string;
  attending: boolean;
  guestsCount?: number | null;
  message?: string | null;
}) {
  const invitation = await getPublicInvitationBySlug(input.slug);
  if (!invitation) {
    throw new Error("Invitación no encontrada.");
  }

  return createRsvpResponse({
    invitationId: invitation.id,
    name: input.name,
    attending: input.attending,
    guestsCount: input.guestsCount ?? null,
    message: input.message ?? null,
  });
}

export async function getClientRsvpView(slug: string, token: string): Promise<ClientRsvpView | null> {
  const invitation = await getInvitationBySlug(slug);
  if (!invitation || invitation.client_view_token !== token) {
    return null;
  }

  const summary = await getRsvpSummary(invitation.id);
  return {
    invitation,
    summary,
  };
}
