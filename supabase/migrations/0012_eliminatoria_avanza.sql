-- Eliminatoria sin empate: "quién avanza" (change eliminatoria-quien-avanza,
-- specs predictions, scoring-ranking, admin-panel, match-schedule).
--
-- En eliminatoria no hay empate como desenlace: un 1-1 se define por penales y
-- AVANZA un equipo. El resultado oficial de esas fases no se puede derivar de
-- los goles, así que se captura explícitamente en matches.avanza. El pronóstico
-- de eliminatoria es L/V ("¿quién avanza?"); 'D' deja de ser válido ahí.

-- ============ 1.1 · Columna "avanza" (reusa el enum pick: solo H/A) ============

-- Significativa solo en eliminatoria; en grupos queda siempre null. Los goles se
-- siguen capturando para mostrar el marcador, pero no determinan el resultado.
alter table public.matches
  add column avanza public.pick;

alter table public.matches
  add constraint matches_avanza_valid
  check (
    avanza is null
    or (avanza in ('H', 'A') and public.temporada_de_fase(phase) = 'eliminatoria')
  );

-- ============ 1.2 · Finalización en eliminatoria exige ganador definido ============

-- temporada_de_fase es immutable: válida en un CHECK sobre la misma fila. Un 1-1
-- sin ganador no puede quedar "finalizado" y por tanto no puntúa.
alter table public.matches
  add constraint matches_elim_finished_requires_avanza
  check (
    finished_at is null
    or public.temporada_de_fase(phase) = 'grupos'
    or avanza is not null
  );

-- ============ 1.3 · Ranking por temporada: eliminatoria usa "avanza" ============

-- Definición previa (rollback): ver 0010_temporada_participaciones.sql — el CASE
-- derivaba H/D/A de los goles para todas las temporadas.
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
      where m.id is not null and pred.pick = case
        -- eliminatoria: el resultado oficial es quién avanza (no los goles)
        when temp = 'eliminatoria' then m.avanza
        -- grupos: derivado de goles (guard de m.id evita NULL → falso empate)
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
    and m.finished_at is not null
    and public.temporada_de_fase(m.phase) = temp
    -- el resultado oficial debe existir: goles en grupos, avanza en eliminatoria
    and (
      (temp = 'grupos' and m.home_goals is not null)
      or (temp = 'eliminatoria' and m.avanza is not null)
    )
  where p.role = 'user' and p.status <> 'disabled'
  group by p.id, p.alias
  order by points desc, p.alias asc;
$$;

revoke all on function public.ranking(text) from public;
grant execute on function public.ranking(text) to anon, authenticated;

-- ============ 1.4 · RLS de predictions: rechazar 'D' en eliminatoria ============

-- Reusa el subquery de fase que las políticas ya hacían para participa_en.
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
    and (
      public.temporada_de_fase(
        (select phase from public.matches where id = match_id)
      ) = 'grupos'
      or pick <> 'D'
    )
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
  with check (
    public.is_match_open(match_id)
    and (
      public.temporada_de_fase(
        (select phase from public.matches where id = match_id)
      ) = 'grupos'
      or pick <> 'D'
    )
  );
