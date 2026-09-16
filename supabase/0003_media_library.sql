create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  original_filename text not null,
  storage_path text not null unique,
  public_path text not null unique,
  mime_type text not null,
  extension text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text not null unique,
  width integer null,
  height integer null,
  duration_seconds numeric null,
  asset_type text not null check (asset_type in ('image','video','pdf','svg','other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);
create index if not exists media_assets_type_idx on public.media_assets(asset_type);
create index if not exists media_assets_deleted_idx on public.media_assets(deleted_at);
drop trigger if exists media_assets_set_updated_at on public.media_assets;
create trigger media_assets_set_updated_at before update on public.media_assets for each row execute function public.set_updated_at();

create table if not exists public.media_usages (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  entity_type text not null check (entity_type in ('site','invitation','catalog','demo')),
  entity_id text not null,
  field_name text not null,
  created_at timestamptz not null default now(),
  unique(asset_id, entity_type, entity_id, field_name)
);
create index if not exists media_usages_asset_idx on public.media_usages(asset_id);
create index if not exists media_usages_entity_idx on public.media_usages(entity_type, entity_id);
