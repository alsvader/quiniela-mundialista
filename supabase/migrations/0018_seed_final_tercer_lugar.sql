-- Tercer lugar (third_place) y final (final): 2 partidos, Mundial 2026.
-- Generado por scripts/generate-fixture-seed.py; NO editar a mano.
-- id = número de partido oficial FIFA (103 = 3er lugar, 104 = final). Única
-- ronda con dos fases distintas: la phase se asigna por id, no una sola para
-- todo el round. group_label NULL (eliminatoria, design D1). match_date = fecha
-- en America/Mexico_City. Estadio/ciudad inline (columnas ya existen tras 0008).
-- Equipos resueltos del cuadro tras las semifinales. No toca la secuencia: 0002
-- ya la dejó en 200.

insert into public.matches
  (id, phase, match_date, kickoff_at, home_team, away_team,
   home_code, away_code, group_label, stadium, city)
overriding system value
values
  (103, 'third_place', '2026-07-18', '2026-07-18 21:00:00+00', 'Francia', 'Inglaterra', 'fr', 'gb-eng', null, 'Hard Rock Stadium', 'Miami'),
  (104, 'final', '2026-07-19', '2026-07-19 19:00:00+00', 'España', 'Argentina', 'es', 'ar', null, 'MetLife Stadium', 'Nueva York')
on conflict (id) do nothing;
