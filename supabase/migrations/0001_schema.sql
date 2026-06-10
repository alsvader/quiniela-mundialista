-- Quiniela Mundialista V1 · Esquema base
-- Ver openspec/changes/quiniela-mundialista-v1/design.md (D1, D3)

-- ============ Enums ============

create type public.user_status as enum ('pending', 'active', 'disabled');
create type public.user_role as enum ('user', 'admin');
create type public.match_phase as enum (
  'group_stage',
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place',
  'final'
);
-- H = gana local, D = empate, A = gana visitante
create type public.pick as enum ('H', 'D', 'A');

-- ============ Tablas ============

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  alias text not null,
  phone text not null,
  status public.user_status not null default 'pending',
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  constraint profiles_alias_unique unique (alias),
  constraint profiles_alias_length check (char_length(alias) between 3 and 20),
  constraint profiles_alias_format check (alias ~ '^[A-Za-z0-9_.-]+$')
);

create table public.matches (
  id bigint generated always as identity primary key,
  phase public.match_phase not null default 'group_stage',
  -- Fecha de jornada, precalculada en America/Mexico_City (design.md D1)
  match_date date not null,
  kickoff_at timestamptz not null,
  home_team text not null,
  away_team text not null,
  group_label text,
  home_goals smallint,
  away_goals smallint,
  constraint matches_goals_non_negative
    check (home_goals >= 0 and away_goals >= 0),
  -- Goles capturados en pareja: ambos o ninguno
  constraint matches_goals_in_pairs
    check ((home_goals is null) = (away_goals is null))
);

create index matches_match_date_idx on public.matches (match_date);

create table public.predictions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id bigint not null references public.matches (id) on delete cascade,
  pick public.pick not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index predictions_match_id_idx on public.predictions (match_id);

create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values ('whatsapp_number', '');

-- ============ Helper de autorización ============

-- security definer para consultar el rol sin recursión en políticas RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Correos de los usuarios para el panel admin (auth.users no es accesible vía RLS)
create or replace function public.admin_user_emails()
returns table (id uuid, email text)
language sql
security definer
set search_path = ''
stable
as $$
  select u.id, u.email::text
  from auth.users u
  where public.is_admin();
$$;

grant execute on function public.admin_user_emails() to authenticated;

-- Disponibilidad de alias durante el registro (RLS impide leer perfiles ajenos)
create or replace function public.alias_is_available(candidate text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select not exists (
    select 1 from public.profiles where lower(alias) = lower(candidate)
  );
$$;

grant execute on function public.alias_is_available(text) to anon, authenticated;

-- Jornada abierta = fecha actual en CDMX anterior a la fecha del partido
-- (equivale a "cierra 23:59 del día anterior", design.md D2)
create or replace function public.is_match_open(mid bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.matches
    where id = mid
      and (now() at time zone 'America/Mexico_City')::date < match_date
  );
$$;

-- ============ RLS ============

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.app_settings enable row level security;

-- profiles: cada quien el suyo; admin ve y edita todos
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = (select auth.uid()) or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (
    id = (select auth.uid())
    -- el registro nunca auto-otorga privilegios
    and role = 'user'
    and status = 'pending'
  );

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- matches: lectura pública (calendario y ranking sin sesión); escritura admin
create policy "matches_select_public" on public.matches
  for select using (true);

create policy "matches_insert_admin" on public.matches
  for insert with check (public.is_admin());

create policy "matches_update_admin" on public.matches
  for update using (public.is_admin());

create policy "matches_delete_admin" on public.matches
  for delete using (public.is_admin());

-- predictions: dueño (solo cuenta activa puede escribir) + admin lee
create policy "predictions_select_own_or_admin" on public.predictions
  for select using (user_id = (select auth.uid()) or public.is_admin());

create policy "predictions_upsert_own_active" on public.predictions
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and status = 'active'
    )
    and public.is_match_open(match_id)
  );

create policy "predictions_update_own_active" on public.predictions
  for update using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and status = 'active'
    )
    and public.is_match_open(match_id)
  )
  with check (public.is_match_open(match_id));

-- app_settings: lectura pública (deep link de WhatsApp); escritura admin
create policy "app_settings_select_public" on public.app_settings
  for select using (true);

create policy "app_settings_update_admin" on public.app_settings
  for update using (public.is_admin());

-- ============ Vista pública de ranking ============

-- Puntos siempre derivados (design.md D5). security_invoker apagado a propósito:
-- la vista expone únicamente alias y puntos de usuarios activos.
create view public.ranking
with (security_invoker = off)
as
select
  p.alias,
  count(*) filter (
    -- el guard de m.id evita que goles NULL caigan al ELSE y regalen empates
    where m.id is not null and pred.pick = case
      when m.home_goals > m.away_goals then 'H'::public.pick
      when m.home_goals < m.away_goals then 'A'::public.pick
      else 'D'::public.pick
    end
  ) as points
from public.profiles p
left join public.predictions pred on pred.user_id = p.id
left join public.matches m
  on m.id = pred.match_id and m.home_goals is not null
where p.status = 'active' and p.role = 'user'
group by p.id, p.alias
order by points desc, p.alias asc;

grant select on public.ranking to anon, authenticated;
