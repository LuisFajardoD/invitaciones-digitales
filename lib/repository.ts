import { randomUUID } from "crypto";
import { demoInvitation, demoResponses, demoSiteSettings, demoTheme } from "@/lib/demo-data";
import { hasConfiguredSupabase } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { buildRsvpSummary, createWhatsAppUrl, slugify } from "@/lib/utils";
import type {
  ClientRsvpView,
  InvitationRecord,
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
};

type MockStore = {
  invitations: InvitationRecord[];
  rsvpResponses: RsvpResponse[];
  siteSettings: SiteSettingsRecord;
  themes: ThemeRecord[];
};

const mockStore: MockStore = {
  invitations: [{ ...demoInvitation }],
  rsvpResponses: [...demoResponses],
  siteSettings: { ...demoSiteSettings },
  themes: [{ ...demoTheme }],
};

export function isUsingMockData() {
  return !hasConfiguredSupabase();
}

export async function listInvitations() {
  if (isUsingMockData()) {
    return [...mockStore.invitations].sort(
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

  return data as InvitationRecord[];
}

export async function getInvitationById(id: string) {
  if (isUsingMockData()) {
    return mockStore.invitations.find((item) => item.id === id) || null;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase!.from("invitations").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as InvitationRecord | null) || null;
}

export async function getInvitationBySlug(slug: string) {
  if (isUsingMockData()) {
    return mockStore.invitations.find((item) => item.slug === slug) || null;
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
  return (data as InvitationRecord | null) || null;
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
    return { ...mockStore.siteSettings };
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
    return { ...demoSiteSettings };
  }

  return data as SiteSettingsRecord;
}

export async function saveSiteSettings(data: SiteSettingsData) {
  const record: SiteSettingsRecord = {
    id: "main",
    data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isUsingMockData()) {
    mockStore.siteSettings = record;
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

export async function listThemes() {
  if (isUsingMockData()) {
    return [...mockStore.themes];
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
  const eventDate = new Date(input.event_start_at);
  const rsvpUntil = new Date(eventDate);
  rsvpUntil.setHours(23, 59, 59, 999);
  const activeUntil = new Date(eventDate);
  activeUntil.setDate(activeUntil.getDate() + 1);
  activeUntil.setHours(23, 59, 59, 999);

  const invitation: InvitationRecord = {
    ...demoInvitation,
    id: randomUUID(),
    slug,
    status: "draft",
    theme_id: input.theme_id || "astronautas",
    event_start_at: eventDate.toISOString(),
    rsvp_until: rsvpUntil.toISOString(),
    active_until: activeUntil.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    sections: {
      ...demoInvitation.sections,
      hero: {
        ...demoInvitation.sections.hero,
        title: `Invitacion ${slug}`,
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
          `Hola, necesito detalles de la invitacion ${slug}.`,
        ),
      },
    },
    share: {
      ...demoInvitation.share,
      og_title: `Invitacion ${slug}`,
      og_description: `Te esperamos en ${input.venue_name}.`,
    },
  };

  if (isUsingMockData()) {
    mockStore.invitations.unshift(invitation);
    return invitation;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!.from("invitations").insert(invitation);
  if (error) {
    throw new Error(error.message);
  }
  return invitation;
}

export async function updateInvitation(invitation: InvitationRecord) {
  const updated: InvitationRecord = {
    ...invitation,
    slug: slugify(invitation.slug),
    updated_at: new Date().toISOString(),
  };

  if (isUsingMockData()) {
    mockStore.invitations = mockStore.invitations.map((item) =>
      item.id === updated.id ? updated : item,
    );
    return updated;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!.from("invitations").update(updated).eq("id", updated.id);
  if (error) {
    throw new Error(error.message);
  }

  return updated;
}

export async function duplicateInvitation(id: string) {
  const original = await getInvitationById(id);
  if (!original) {
    throw new Error("Invitacion no encontrada.");
  }

  const duplicated: InvitationRecord = {
    ...original,
    id: randomUUID(),
    slug: `${original.slug}-copy-${Date.now()}`,
    status: "draft",
    client_view_token: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isUsingMockData()) {
    mockStore.invitations.unshift(duplicated);
    return duplicated;
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase!.from("invitations").insert(duplicated);
  if (error) {
    throw new Error(error.message);
  }
  return duplicated;
}

export async function listRsvpResponses(invitationId: string) {
  if (isUsingMockData()) {
    return mockStore.rsvpResponses.filter((item) => item.invitation_id === invitationId);
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
    throw new Error("Invitacion no encontrada.");
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
    mockStore.rsvpResponses.unshift(record);
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
