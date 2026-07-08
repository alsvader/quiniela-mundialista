-- Cuartos de final (quarter_final): 4 partidos, Mundial 2026.
-- Generado por scripts/generate-fixture-seed.py; NO editar a mano.
-- id = número de partido oficial FIFA (97-100). group_label NULL (eliminatoria,
-- design D1). match_date = fecha en America/Mexico_City. Estadio/ciudad inline
-- (columnas ya existen tras 0008). Equipos resueltos del cuadro tras los
-- octavos. No toca la secuencia: 0002 ya la dejó en 200.

insert into public.matches
  (id, phase, match_date, kickoff_at, home_team, away_team,
   home_code, away_code, group_label, stadium, city)
overriding system value
values
  (97, 'quarter_final', '2026-07-09', '2026-07-09 20:00:00+00', 'Francia', 'Marruecos', 'fr', 'ma', null, 'Gillette Stadium', 'Boston'),
  (98, 'quarter_final', '2026-07-10', '2026-07-10 19:00:00+00', 'España', 'Bélgica', 'es', 'be', null, 'SoFi Stadium', 'Los Ángeles'),
  (99, 'quarter_final', '2026-07-11', '2026-07-11 21:00:00+00', 'Noruega', 'Inglaterra', 'no', 'gb-eng', null, 'Hard Rock Stadium', 'Miami'),
  (100, 'quarter_final', '2026-07-11', '2026-07-12 01:00:00+00', 'Argentina', 'Suiza', 'ar', 'ch', null, 'Arrowhead Stadium', 'Kansas City')
on conflict (id) do nothing;
