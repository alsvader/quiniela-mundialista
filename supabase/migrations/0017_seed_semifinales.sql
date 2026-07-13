-- Semifinales (semi_final): 2 partidos, Mundial 2026.
-- Generado por scripts/generate-fixture-seed.py; NO editar a mano.
-- id = número de partido oficial FIFA (101-102). group_label NULL (eliminatoria,
-- design D1). match_date = fecha en America/Mexico_City. Estadio/ciudad inline
-- (columnas ya existen tras 0008). Equipos resueltos del cuadro tras los
-- cuartos. No toca la secuencia: 0002 ya la dejó en 200.

insert into public.matches
  (id, phase, match_date, kickoff_at, home_team, away_team,
   home_code, away_code, group_label, stadium, city)
overriding system value
values
  (101, 'semi_final', '2026-07-14', '2026-07-14 19:00:00+00', 'Francia', 'España', 'fr', 'es', null, 'AT&T Stadium', 'Dallas'),
  (102, 'semi_final', '2026-07-15', '2026-07-15 19:00:00+00', 'Inglaterra', 'Argentina', 'gb-eng', 'ar', null, 'Mercedes-Benz Stadium', 'Atlanta')
on conflict (id) do nothing;
