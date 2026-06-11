-- Reemplaza la vista `ranking` (security definer, marcada por el advisor de
-- Supabase) por una función con la misma postura de seguridad explícita:
-- expone únicamente alias y puntos de participantes activos, saltando RLS
-- de forma deliberada y mínima (design.md D5/D11, spec scoring-ranking).

drop view if exists public.ranking;

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
    on m.id = pred.match_id and m.home_goals is not null
  where p.status = 'active' and p.role = 'user'
  group by p.id, p.alias
  order by points desc, p.alias asc;
$$;

revoke all on function public.ranking() from public;
grant execute on function public.ranking() to anon, authenticated;
