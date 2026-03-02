create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null check (status in ('draft', 'published')),
  theme_id text not null,
  layout_id text not null,
  animation_profile text not null check (animation_profile in ('lite', 'pro', 'max')),
  timezone text not null,
  event_start_at timestamptz not null,
  rsvp_until timestamptz not null,
  active_until timestamptz not null,
  sections_order jsonb not null,
  sections jsonb not null,
  share jsonb not null,
  expired_page jsonb not null,
  client_view_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitations_status_idx on public.invitations (status);
create index if not exists invitations_event_start_at_idx on public.invitations (event_start_at);
create index if not exists invitations_active_until_idx on public.invitations (active_until);

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at
before update on public.invitations
for each row
execute function public.set_updated_at();

create table if not exists public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  name text not null,
  attending boolean not null,
  guests_count integer null check (guests_count is null or guests_count >= 1),
  message text null,
  created_at timestamptz not null default now()
);

create index if not exists rsvp_responses_invitation_id_idx on public.rsvp_responses (invitation_id);
create index if not exists rsvp_responses_created_at_idx on public.rsvp_responses (created_at);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid null references public.invitations(id) on delete cascade,
  type text not null,
  url text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assets_invitation_id_idx on public.assets (invitation_id);
create index if not exists assets_type_idx on public.assets (type);

create table if not exists public.site_settings (
  id text primary key,
  data jsonb not null,
  draft_data jsonb null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

create table if not exists public.themes (
  id text primary key,
  name text not null,
  preview_url text not null,
  defaults jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists themes_set_updated_at on public.themes;
create trigger themes_set_updated_at
before update on public.themes
for each row
execute function public.set_updated_at();
