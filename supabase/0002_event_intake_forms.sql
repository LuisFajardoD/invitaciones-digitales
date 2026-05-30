create table if not exists public.event_intake_forms (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  status text not null default 'new' check (status in ('new', 'reviewed', 'in_progress', 'done')),
  client_name text not null default '',
  client_whatsapp text not null default '',
  event_data jsonb not null default '{}'::jsonb,
  invitation_style jsonb not null default '{}'::jsonb,
  main_text jsonb not null default '{}'::jsonb,
  rsvp jsonb not null default '{}'::jsonb,
  itinerary jsonb not null default '{}'::jsonb,
  dress_code jsonb not null default '{}'::jsonb,
  gifts jsonb not null default '{}'::jsonb,
  photos_multimedia jsonb not null default '{}'::jsonb,
  faq_notices jsonb not null default '{}'::jsonb,
  live_stream jsonb not null default '{}'::jsonb,
  lodging_transport jsonb not null default '{}'::jsonb,
  general_observations jsonb not null default '{}'::jsonb,
  submitted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_intake_forms_status_idx on public.event_intake_forms (status);
create index if not exists event_intake_forms_created_at_idx on public.event_intake_forms (created_at);
create index if not exists event_intake_forms_submitted_at_idx on public.event_intake_forms (submitted_at);

drop trigger if exists event_intake_forms_set_updated_at on public.event_intake_forms;
create trigger event_intake_forms_set_updated_at
before update on public.event_intake_forms
for each row
execute function public.set_updated_at();
