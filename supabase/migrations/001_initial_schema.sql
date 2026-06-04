-- ================================================================
-- CommOS Global 2026 — Database Schema
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================================
-- ENUMS
-- ================================================================
create type user_role as enum ('super_admin', 'country_admin', 'editor', 'viewer');
create type comm_estado as enum ('Aprobado', 'En revisión', 'Borrador', 'Publicado', 'Cancelado');
create type comm_alcance as enum ('Global', 'Local');

-- ================================================================
-- PROFILES — extends auth.users
-- ================================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        user_role not null default 'viewer',
  countries   text[] not null default '{}',  -- ['AR','MX',...] empty = all
  color       text not null default '#534AB7',
  initials    text not null default 'US',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ================================================================
-- COUNTRIES config
-- ================================================================
create table countries (
  code        text primary key,     -- 'AR','MX', etc.
  name        text not null,
  flag        text not null,        -- emoji flag
  color       text not null default '#534AB7',
  timezone    text not null default 'America/Argentina/Buenos_Aires',
  active      boolean not null default true,
  sort_order  int not null default 0
);

insert into countries (code, name, flag, color, timezone, sort_order) values
  ('AR', 'Argentina',  '🇦🇷', '#534AB7', 'America/Argentina/Buenos_Aires', 1),
  ('GL', 'Global',     '🌍', '#1D9E75', 'America/Argentina/Buenos_Aires',  2),
  ('MX', 'México',     '🇲🇽', '#D85A30', 'America/Mexico_City',            3),
  ('CL', 'Chile',      '🇨🇱', '#BA7517', 'America/Santiago',               4),
  ('PE', 'Perú',       '🇵🇪', '#639922', 'America/Lima',                   5),
  ('BR', 'Brasil',     '🇧🇷', '#185FA5', 'America/Sao_Paulo',              6),
  ('ES', 'España',     '🇪🇸', '#D4537E', 'Europe/Madrid',                  7),
  ('CN', 'China',      '🇨🇳', '#378ADD', 'Asia/Shanghai',                  8);

-- ================================================================
-- CHANNELS
-- ================================================================
create table channels (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  color      text not null default '#888',
  type       text not null default 'internal',  -- 'internal' | 'external'
  active     boolean not null default true,
  sort_order int not null default 0
);

insert into channels (name, color, type, sort_order) values
  ('Emarsys',           '#534AB7', 'internal', 1),
  ('Humand',            '#1D9E75', 'internal', 2),
  ('Cartelera Digital', '#185FA5', 'internal', 3),
  ('LinkedIn',          '#3C3489', 'external', 4),
  ('TikTok',            '#BA7517', 'external', 5),
  ('Instagram',         '#993556', 'external', 6);

-- ================================================================
-- CATEGORIES (topics) — configurable with colors
-- ================================================================
create table categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  color      text not null default '#888',
  bg_color   text not null default '#f5f5f5',
  active     boolean not null default true,
  sort_order int not null default 0
);

insert into categories (name, color, bg_color, sort_order) values
  ('Cultura',     '#185FA5', '#E6F1FB', 1),
  ('Bienestar',   '#1D9E75', '#E1F5EE', 2),
  ('Innovación',  '#534AB7', '#EEEDFE', 3),
  ('DEI',         '#993556', '#FBEAF0', 4),
  ('Campaña',     '#D85A30', '#FAECE7', 5),
  ('Org',         '#27500A', '#EAF3DE', 6),
  ('Beneficios',  '#BA7517', '#FAEEDA', 7),
  ('Talento',     '#534AB7', '#EEEDFE', 8),
  ('Escucha',     '#1D9E75', '#E1F5EE', 9),
  ('Formación',   '#185FA5', '#E6F1FB', 10),
  ('Marca',       '#993556', '#FBEAF0', 11),
  ('Operaciones', '#27500A', '#EAF3DE', 12),
  ('Gestión',     '#BA7517', '#FAEEDA', 13);

-- ================================================================
-- SEGMENTS
-- ================================================================
create table segments (
  id   uuid primary key default uuid_generate_v4(),
  name text not null unique,
  sort_order int not null default 0
);

insert into segments (name, sort_order) values
  ('Staff', 1), ('Tiendas Isadora', 2), ('TM', 3),
  ('Atelier', 4), ('TMB', 5), ('Logística', 6),
  ('Producción', 7), ('Staff Retail', 8);

-- ================================================================
-- COMMUNICATIONS — main table
-- ================================================================
create table communications (
  id          bigserial primary key,
  titulo      text not null,
  date        date not null,
  pais        text[] not null default '{}',
  canal       text[] not null default '{}',
  segmento    text[] not null default '{}',
  ubicacion   text[] not null default '{}',
  topico      text[] not null default '{}',
  formato     text[] not null default '{}',
  idioma      text[] not null default '{}',
  alcance     text[] not null default '{}',
  estado      text[] not null default '{"Borrador"}',
  destacado   boolean not null default false,
  -- Audit
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_by  uuid references profiles(id),
  updated_at  timestamptz not null default now()
);

create index idx_communications_date  on communications(date);
create index idx_communications_pais  on communications using gin(pais);
create index idx_communications_canal on communications using gin(canal);

-- ================================================================
-- APP SETTINGS (key-value store for lists & config)
-- ================================================================
create table app_settings (
  key   text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values
  ('idiomas',    '["Español","Portugués","Inglés"]'),
  ('alcances',   '["Global","Local"]'),
  ('ubicaciones','["Oficina","Operaciones"]'),
  ('formatos',   '["Email","Post","Video","Encuesta","Carrusel"]');

-- ================================================================
-- AUDIT LOG
-- ================================================================
create table audit_log (
  id          bigserial primary key,
  table_name  text not null,
  record_id   text not null,
  action      text not null,  -- 'INSERT' | 'UPDATE' | 'DELETE'
  old_data    jsonb,
  new_data    jsonb,
  user_id     uuid references profiles(id),
  user_name   text,
  created_at  timestamptz not null default now()
);

-- ================================================================
-- RLS — Row Level Security
-- ================================================================
alter table profiles       enable row level security;
alter table communications enable row level security;
alter table countries      enable row level security;
alter table channels       enable row level security;
alter table categories     enable row level security;
alter table segments       enable row level security;
alter table app_settings   enable row level security;
alter table audit_log      enable row level security;

-- Helper: get current user's role
create or replace function get_my_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper: get current user's countries
create or replace function get_my_countries()
returns text[] language sql stable security definer as $$
  select countries from profiles where id = auth.uid()
$$;

-- PROFILES: users can see all, edit only themselves (admins can see all)
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_update" on profiles for update using (
  id = auth.uid() or get_my_role() in ('super_admin', 'country_admin')
);

-- COMMUNICATIONS: everyone can read
create policy "comms_select" on communications for select using (true);

-- Insert: editors and above
create policy "comms_insert" on communications for insert with check (
  get_my_role() in ('super_admin', 'country_admin', 'editor')
);

-- Update: check country permission
create policy "comms_update" on communications for update using (
  get_my_role() = 'super_admin'
  or (
    get_my_role() in ('country_admin', 'editor')
    and (
      array_length(get_my_countries(), 1) is null
      or pais && get_my_countries()
    )
  )
);

-- Delete: super_admin only
create policy "comms_delete" on communications for delete using (
  get_my_role() = 'super_admin'
);

-- Reference tables: readable by all, writable by admins
create policy "countries_select"    on countries    for select using (true);
create policy "countries_modify"    on countries    for all    using (get_my_role() in ('super_admin','country_admin'));
create policy "channels_select"     on channels     for select using (true);
create policy "channels_modify"     on channels     for all    using (get_my_role() in ('super_admin','country_admin'));
create policy "categories_select"   on categories   for select using (true);
create policy "categories_modify"   on categories   for all    using (get_my_role() in ('super_admin','country_admin'));
create policy "segments_select"     on segments     for select using (true);
create policy "segments_modify"     on segments     for all    using (get_my_role() in ('super_admin','country_admin'));
create policy "settings_select"     on app_settings for select using (true);
create policy "settings_modify"     on app_settings for all    using (get_my_role() in ('super_admin','country_admin'));
create policy "audit_select"        on audit_log    for select using (get_my_role() in ('super_admin','country_admin'));
create policy "audit_insert"        on audit_log    for insert with check (true);

-- ================================================================
-- TRIGGERS — auto-update updated_at
-- ================================================================
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

create trigger trg_comms_updated_at
  before update on communications
  for each row execute function touch_updated_at();

-- ================================================================
-- SEED — demo profile for testing (optional, run after auth signup)
-- Insert your first user via Supabase Auth, then run:
-- insert into profiles (id, name, email, role, countries, color, initials)
-- values ('<YOUR_USER_UUID>', 'Admin Global', 'admin@example.com', 'super_admin', '{}', '#534AB7', 'AG');
-- ================================================================
