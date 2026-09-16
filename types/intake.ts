export type EventIntakeStatus = "new" | "reviewed" | "in_progress" | "done";

export type ToggleValue = "yes" | "no";

export interface EventDataSection {
  celebrant_name: string;
  age: string;
  event_date: string;
  start_time: string;
  venue_name: string;
  address: string;
  has_maps_link: ToggleValue;
  maps_link: string;
  contact_name: string;
  contact_whatsapp: string;
  contact_button_text: string;
}

export interface InvitationStyleSection {
  desired_theme: string;
  favorite_colors: string;
  visual_styles: string[];
  other_visual_style: string;
  wants_cover_photo: ToggleValue;
}

export interface MainTextSection {
  enabled: boolean;
  has_special_phrase: ToggleValue;
  special_phrase: string;
}

export interface RsvpIntakeSection {
  enabled: boolean;
  wants_rsvp: ToggleValue;
  has_deadline: ToggleValue;
  deadline: string;
}

export interface ItinerarySection {
  enabled: boolean;
  welcome_time: string;
  meal_time: string;
  cake_time: string;
  pinata_time: string;
  has_special_activity: ToggleValue;
  special_activity_time: string;
  special_activity_name: string;
  closing_time: string;
  activities_notes: string;
}

export interface DressCodeSection {
  enabled: boolean;
  suggested_colors: string;
  clothing_notes: string;
  party_theme: string;
  extra_notes: string;
}

export interface GiftsSection {
  enabled: boolean;
  wants_gifts_mention: ToggleValue;
  registry_or_link: string;
  gift_notes: string;
}

export interface PhotosMultimediaSection {
  enabled: boolean;
  wants_photos: ToggleValue;
  wants_cover_photo: ToggleValue;
  wants_gallery: ToggleValue;
  photo_notes: string;
}

export interface FaqNoticesSection {
  enabled: boolean;
  can_bring_guests_enabled: boolean;
  can_bring_guests: ToggleValue;
  children_allowed_enabled: boolean;
  children_allowed: ToggleValue;
  has_pool_or_special_activities_enabled: boolean;
  has_pool_or_special_activities: ToggleValue;
  has_food_for_children_enabled: boolean;
  has_food_for_children: ToggleValue;
  has_parking_enabled: boolean;
  has_parking: ToggleValue;
  venue_rules: string;
  important_notices: string;
}

export interface LiveStreamSection {
  enabled: boolean;
  wants_live_stream: ToggleValue;
  live_stream_link: string;
  start_time: string;
  instructions: string;
}

export interface LodgingTransportSection {
  enabled: boolean;
  wants_lodging_transport: ToggleValue;
  recommended_hotels: string;
  meeting_point: string;
  special_transport: string;
  out_of_town_notes: string;
}

export interface GeneralObservationsSection {
  notes: string;
}

export interface EventIntakeData {
  event_data: EventDataSection;
  invitation_style: InvitationStyleSection;
  main_text: MainTextSection;
  rsvp: RsvpIntakeSection;
  itinerary: ItinerarySection;
  dress_code: DressCodeSection;
  gifts: GiftsSection;
  photos_multimedia: PhotosMultimediaSection;
  faq_notices: FaqNoticesSection;
  live_stream: LiveStreamSection;
  lodging_transport: LodgingTransportSection;
  general_observations: GeneralObservationsSection;
}

export interface EventIntakeFormRecord extends EventIntakeData {
  id: string;
  token: string;
  status: EventIntakeStatus;
  client_name: string;
  client_whatsapp: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}
