-- Fase de eliminatoria como segunda temporada de pago (change
-- fase-eliminatoria-temporada, specs season-participation, predictions,
-- scoring-ranking, account-activation, admin-panel, match-schedule).
--
-- El permiso para pronosticar deja de derivarse de profiles.status='active'
-- (un solo pago global) y pasa a derivarse de una PARTICIPACIÓN por temporada.
-- Temporada = agrupación de match_phase: group_stage -> 'grupos'; el resto de
-- las fases -> 'eliminatoria' (design.md D1). profiles.status queda como estado
-- de cuenta (disabled = baneo de toda la cuenta).

-- ============ 1.1 · Temporada derivada de la fase ============

-- Inmutable: misma fase -> misma temporada siempre; usable en RLS, vista y ranking.
create or replace function public.temporada_de_fase(p public.match_phase)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p = 'group_stage' then 'grupos' else 'eliminatoria' end;
$$;

-- ============ 1.2 · Tabla de participaciones (entitlement por temporada) ============

-- La ausencia de fila = no participa. status: active (pago confirmado) /
-- disabled (retirada por el admin, reversible). PK por (user_id, temporada).
create table public.participaciones (
  user_id uuid not null references public.profiles (id) on delete cascade,
  temporada text not null check (temporada in ('grupos', 'eliminatoria')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  primary key (user_id, temporada)
);

create index participaciones_temporada_idx on public.participaciones (temporada);

-- ============ 1.3 · RLS de participaciones ============

alter table public.participaciones enable row level security;

create policy "participaciones_select_own_or_admin" on public.participaciones
  for select using (user_id = (select auth.uid()) or public.is_admin());

create policy "participaciones_insert_admin" on public.participaciones
  for insert with check (public.is_admin());

create policy "participaciones_update_admin" on public.participaciones
  for update using (public.is_admin());

-- ============ 1.4 · Helper de autorización por temporada ============

-- security definer (como is_admin/is_match_open): lee participaciones y el
-- estado de cuenta sin depender de la RLS del llamante. Una cuenta disabled
-- queda excluida de TODAS las temporadas (spec account-activation).
create or replace function public.participa_en(uid uuid, temp text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.participaciones pa
    join public.profiles pr on pr.id = pa.user_id
    where pa.user_id = uid
      and pa.temporada = temp
      and pa.status = 'active'
      and pr.status <> 'disabled'
  );
$$;

-- ============ 1.5 · Llave fase_activa (puntero de onboarding) ============

-- No autoriza por sí sola; mueve pestaña por defecto, CTA y leyenda (design D3).
insert into public.app_settings (key, value) values ('fase_activa', 'grupos');

-- ============ 1.6 · Backfill: los activos actuales conservan grupos ============

insert into public.participaciones (user_id, temporada, status)
select id, 'grupos', 'active'
from public.profiles
where status = 'active' and role = 'user';

-- ============ 1.7 · Gate de predicciones por participación ============

-- Sustituye el chequeo profiles.status='active' por participa_en() en la
-- temporada del partido; conserva is_match_open (cierre kickoff - 1h).
drop policy "predictions_upsert_own_active" on public.predictions;
create policy "predictions_upsert_own_active" on public.predictions
  for insert with check (
    user_id = (select auth.uid())
    and public.participa_en(
      (select auth.uid()),
      public.temporada_de_fase(
        (select phase from public.matches where id = match_id)
      )
    )
    and public.is_match_open(match_id)
  );

drop policy "predictions_update_own_active" on public.predictions;
create policy "predictions_update_own_active" on public.predictions
  for update using (
    user_id = (select auth.uid())
    and public.participa_en(
      (select auth.uid()),
      public.temporada_de_fase(
        (select phase from public.matches where id = match_id)
      )
    )
    and public.is_match_open(match_id)
  )
  with check (public.is_match_open(match_id));

-- ============ 1.8 · Ranking por temporada ============

-- Definición previa (rollback): public.ranking() sin argumentos, participantes
-- por profiles.status='active', puntos sobre todos los partidos finalizados
-- (ver migración 0007_partido_en_vivo.sql).
drop function if exists public.ranking();

-- Nueva firma parametrizada por temporada: participantes = participación active
-- de esa temporada (cuenta no disabled); puntos solo de partidos finalizados
-- cuyas fases pertenecen a esa temporada.
create or replace function public.ranking(temp text)
returns table (alias text, points bigint)
language sql
security definer
set search_path = ''
stable
as $$
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
  join public.participaciones part
    on part.user_id = p.id
    and part.temporada = temp
    and part.status = 'active'
  left join public.predictions pred on pred.user_id = p.id
  left join public.matches m
    on m.id = pred.match_id
    and m.home_goals is not null
    and m.finished_at is not null
    and public.temporada_de_fase(m.phase) = temp
  where p.role = 'user' and p.status <> 'disabled'
  group by p.id, p.alias
  order by points desc, p.alias asc;
$$;

revoke all on function public.ranking(text) from public;
grant execute on function public.ranking(text) to anon, authenticated;
