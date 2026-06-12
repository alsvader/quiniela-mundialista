-- Partido en vivo (change partido-en-vivo, specs live-match, scoring-ranking,
-- admin-panel): los goles capturados dejan de implicar "partido terminado".
-- La finalización es un dato explícito que captura el admin (finished_at;
-- null = no finalizado) y SOLO los partidos finalizados puntúan. El estado
-- "en vivo" se deriva en la app: kickoff_at <= now() y finished_at IS NULL
-- (ver isMatchLive/isMatchFinished en lib/domain/jornada.ts).

-- 1) Columna de finalización explícita
alter table public.matches
  add column finished_at timestamptz;

-- 2) Coherencia: un partido finalizado siempre tiene marcador (última línea
--    de defensa; el form del admin y la action validan primero)
alter table public.matches
  add constraint matches_finished_requires_score
  check (finished_at is null or home_goals is not null);

-- 3) Backfill: los marcadores capturados hasta hoy se registraron bajo la
--    semántica vieja "goles = final"; sin esto el ranking público se vaciaría
update public.matches
  set finished_at = now()
  where home_goals is not null;

-- 4) ranking(): puntúan únicamente partidos finalizados; un marcador parcial
--    de un partido en vivo no mueve el ranking (espejo del filtro de
--    finalizados en /mis-puntos y closed-match-card)
create or replace function public.ranking()
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
  left join public.predictions pred on pred.user_id = p.id
  left join public.matches m
    on m.id = pred.match_id
    and m.home_goals is not null
    and m.finished_at is not null
  where p.status = 'active' and p.role = 'user'
  group by p.id, p.alias
  order by points desc, p.alias asc;
$$;
