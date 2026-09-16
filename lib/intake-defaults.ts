import type {
  EventDataSection,
  EventIntakeData,
  EventIntakeFormRecord,
  EventIntakeStatus,
  FaqNoticesSection,
  GiftsSection,
  GeneralObservationsSection,
  InvitationStyleSection,
  ItinerarySection,
  LiveStreamSection,
  LodgingTransportSection,
  MainTextSection,
  PhotosMultimediaSection,
  RsvpIntakeSection,
  DressCodeSection,
  ToggleValue,
} from "@/types/intake";

const toggleValues = new Set(["yes", "no"]);

function toggle(value: unknown, fallback: ToggleValue = "no"): ToggleValue {
  return typeof value === "string" && toggleValues.has(value) ? (value as ToggleValue) : fallback;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function enabled(value: unknown) {
  return Boolean(value);
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function createDefaultEventIntakeData(): EventIntakeData {
  return {
    event_data: {
      celebrant_name: "",
      age: "",
      event_date: "",
      start_time: "",
      venue_name: "",
      address: "",
      has_maps_link: "no",
      maps_link: "",
      contact_name: "",
      contact_whatsapp: "",
      contact_button_text: "",
    },
    invitation_style: {
      desired_theme: "Sirenas",
      favorite_colors: "",
      visual_styles: [],
      other_visual_style: "",
      wants_cover_photo: "no",
    },
    main_text: {
      enabled: false,
      has_special_phrase: "no",
      special_phrase: "",
    },
    rsvp: {
      enabled: false,
      wants_rsvp: "no",
      has_deadline: "no",
      deadline: "",
    },
    itinerary: {
      enabled: false,
      welcome_time: "",
      meal_time: "",
      cake_time: "",
      pinata_time: "",
      has_special_activity: "no",
      special_activity_time: "",
      special_activity_name: "",
      closing_time: "",
      activities_notes: "",
    },
    dress_code: {
      enabled: false,
      suggested_colors: "",
      clothing_notes: "",
      party_theme: "",
      extra_notes: "",
    },
    gifts: {
      enabled: false,
      wants_gifts_mention: "no",
      registry_or_link: "",
      gift_notes: "",
    },
    photos_multimedia: {
      enabled: false,
      wants_photos: "no",
      wants_cover_photo: "no",
      wants_gallery: "no",
      photo_notes: "",
    },
    faq_notices: {
      enabled: false,
      can_bring_guests_enabled: false,
      can_bring_guests: "no",
      children_allowed_enabled: false,
      children_allowed: "yes",
      has_pool_or_special_activities_enabled: false,
      has_pool_or_special_activities: "no",
      has_food_for_children_enabled: false,
      has_food_for_children: "no",
      has_parking_enabled: false,
      has_parking: "no",
      venue_rules: "",
      important_notices: "",
    },
    live_stream: {
      enabled: false,
      wants_live_stream: "no",
      live_stream_link: "",
      start_time: "",
      instructions: "",
    },
    lodging_transport: {
      enabled: false,
      wants_lodging_transport: "no",
      recommended_hotels: "",
      meeting_point: "",
      special_transport: "",
      out_of_town_notes: "",
    },
    general_observations: {
      notes: "",
    },
  };
}

export function normalizeEventIntakeData(input?: Partial<EventIntakeData> | null): EventIntakeData {
  const defaults = createDefaultEventIntakeData();
  const source = input || {};
  const eventData = (source.event_data || {}) as Partial<EventDataSection>;
  const invitationStyle = (source.invitation_style || {}) as Partial<InvitationStyleSection>;
  const mainText = (source.main_text || {}) as Partial<MainTextSection>;
  const rsvp = (source.rsvp || {}) as Partial<RsvpIntakeSection>;
  const itinerary = (source.itinerary || {}) as Partial<ItinerarySection>;
  const dressCode = (source.dress_code || {}) as Partial<DressCodeSection>;
  const gifts = (source.gifts || {}) as Partial<GiftsSection>;
  const photos = (source.photos_multimedia || {}) as Partial<PhotosMultimediaSection>;
  const faq = (source.faq_notices || {}) as Partial<FaqNoticesSection>;
  const liveStream = (source.live_stream || {}) as Partial<LiveStreamSection>;
  const lodgingTransport = (source.lodging_transport || {}) as Partial<LodgingTransportSection>;
  const generalObservations = (source.general_observations || {}) as Partial<GeneralObservationsSection>;

  return {
    event_data: {
      ...defaults.event_data,
      ...eventData,
      celebrant_name: text(eventData.celebrant_name),
      age: text(eventData.age),
      event_date: text(eventData.event_date),
      start_time: text(eventData.start_time),
      venue_name: text(eventData.venue_name),
      address: text(eventData.address),
      has_maps_link: toggle(eventData.has_maps_link),
      maps_link: text(eventData.maps_link),
      contact_name: text(eventData.contact_name),
      contact_whatsapp: text(eventData.contact_whatsapp),
      contact_button_text: text(eventData.contact_button_text),
    },
    invitation_style: {
      ...defaults.invitation_style,
      ...invitationStyle,
      desired_theme: text(invitationStyle.desired_theme) || defaults.invitation_style.desired_theme,
      favorite_colors: text(invitationStyle.favorite_colors),
      visual_styles: stringList(invitationStyle.visual_styles),
      other_visual_style: text(invitationStyle.other_visual_style),
      wants_cover_photo: toggle(invitationStyle.wants_cover_photo),
    },
    main_text: {
      ...defaults.main_text,
      ...mainText,
      enabled: enabled(mainText.enabled),
      has_special_phrase: toggle(mainText.has_special_phrase),
      special_phrase: text(mainText.special_phrase),
    },
    rsvp: {
      ...defaults.rsvp,
      ...rsvp,
      enabled: enabled(rsvp.enabled),
      wants_rsvp: toggle(rsvp.wants_rsvp),
      has_deadline: toggle(rsvp.has_deadline),
      deadline: text(rsvp.deadline),
    },
    itinerary: {
      ...defaults.itinerary,
      ...itinerary,
      enabled: enabled(itinerary.enabled),
      welcome_time: text(itinerary.welcome_time),
      meal_time: text(itinerary.meal_time),
      cake_time: text(itinerary.cake_time),
      pinata_time: text(itinerary.pinata_time),
      has_special_activity: toggle(itinerary.has_special_activity),
      special_activity_time: text(itinerary.special_activity_time),
      special_activity_name: text(itinerary.special_activity_name),
      closing_time: text(itinerary.closing_time),
      activities_notes: text(itinerary.activities_notes),
    },
    dress_code: {
      ...defaults.dress_code,
      ...dressCode,
      enabled: enabled(dressCode.enabled),
      suggested_colors: text(dressCode.suggested_colors),
      clothing_notes: text(dressCode.clothing_notes),
      party_theme: text(dressCode.party_theme),
      extra_notes: text(dressCode.extra_notes),
    },
    gifts: {
      ...defaults.gifts,
      ...gifts,
      enabled: enabled(gifts.enabled),
      wants_gifts_mention: toggle(gifts.wants_gifts_mention),
      registry_or_link: text(gifts.registry_or_link),
      gift_notes: text(gifts.gift_notes),
    },
    photos_multimedia: {
      ...defaults.photos_multimedia,
      ...photos,
      enabled: enabled(photos.enabled),
      wants_photos: toggle(photos.wants_photos),
      wants_cover_photo: toggle(photos.wants_cover_photo),
      wants_gallery: toggle(photos.wants_gallery),
      photo_notes: text(photos.photo_notes),
    },
    faq_notices: {
      ...defaults.faq_notices,
      ...faq,
      enabled: enabled(faq.enabled),
      can_bring_guests_enabled: enabled(faq.can_bring_guests_enabled ?? faq.enabled),
      can_bring_guests: toggle(faq.can_bring_guests),
      children_allowed_enabled: enabled(faq.children_allowed_enabled ?? faq.enabled),
      children_allowed: toggle(faq.children_allowed, "yes"),
      has_pool_or_special_activities_enabled: enabled(faq.has_pool_or_special_activities_enabled ?? faq.enabled),
      has_pool_or_special_activities: toggle(faq.has_pool_or_special_activities),
      has_food_for_children_enabled: enabled(faq.has_food_for_children_enabled ?? faq.enabled),
      has_food_for_children: toggle(faq.has_food_for_children),
      has_parking_enabled: enabled(faq.has_parking_enabled ?? faq.enabled),
      has_parking: toggle(faq.has_parking),
      venue_rules: text(faq.venue_rules),
      important_notices: text(faq.important_notices),
    },
    live_stream: {
      ...defaults.live_stream,
      ...liveStream,
      enabled: enabled(liveStream.enabled),
      wants_live_stream: toggle(liveStream.wants_live_stream),
      live_stream_link: text(liveStream.live_stream_link),
      start_time: text(liveStream.start_time),
      instructions: text(liveStream.instructions),
    },
    lodging_transport: {
      ...defaults.lodging_transport,
      ...lodgingTransport,
      enabled: enabled(lodgingTransport.enabled),
      wants_lodging_transport: toggle(lodgingTransport.wants_lodging_transport),
      recommended_hotels: text(lodgingTransport.recommended_hotels),
      meeting_point: text(lodgingTransport.meeting_point),
      special_transport: text(lodgingTransport.special_transport),
      out_of_town_notes: text(lodgingTransport.out_of_town_notes),
    },
    general_observations: {
      ...defaults.general_observations,
      ...generalObservations,
      notes: text(generalObservations.notes),
    },
  };
}

export function normalizeEventIntakeRecord(record: EventIntakeFormRecord): EventIntakeFormRecord {
  const data = normalizeEventIntakeData(record);
  const statusValues = new Set(["new", "reviewed", "in_progress", "done"]);
  const status = statusValues.has(record.status) ? record.status : "new";

  return {
    ...record,
    ...data,
    status: status as EventIntakeStatus,
    client_name: record.client_name || data.event_data.contact_name || "",
    client_whatsapp: record.client_whatsapp || data.event_data.contact_whatsapp || "",
    submitted_at: record.submitted_at || null,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString(),
  };
}
