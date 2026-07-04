-- Octavos de final (round_of_16): 8 partidos, Mundial 2026.
-- Generado por scripts/generate-fixture-seed.py; NO editar a mano.
-- id = número de partido oficial FIFA (89-96). group_label NULL (eliminatoria,
-- design D1). match_date = fecha en America/Mexico_City. Estadio/ciudad inline
-- (columnas ya existen tras 0008). Equipos resueltos del cuadro tras los
-- dieciseisavos. No toca la secuencia: 0002 ya la dejó en 200.

insert into public.matches
  (id, phase, match_date, kickoff_at, home_team, away_team,
   home_code, away_code, group_label, stadium, city)
overriding system value
values
  (89, 'round_of_16', '2026-07-04', '2026-07-04 21:00:00+00', 'Paraguay', 'Francia', 'py', 'fr', null, 'Lincoln Financial Field', 'Filadelfia'),
  (90, 'round_of_16', '2026-07-04', '2026-07-04 17:00:00+00', 'Canadá', 'Marruecos', 'ca', 'ma', null, 'NRG Stadium', 'Houston'),
  (91, 'round_of_16', '2026-07-05', '2026-07-05 20:00:00+00', 'Brasil', 'Noruega', 'br', 'no', null, 'MetLife Stadium', 'Nueva York'),
  (92, 'round_of_16', '2026-07-05', '2026-07-06 00:00:00+00', 'México', 'Inglaterra', 'mx', 'gb-eng', null, 'Estadio Azteca', 'Ciudad de México'),
  (93, 'round_of_16', '2026-07-06', '2026-07-06 19:00:00+00', 'Portugal', 'España', 'pt', 'es', null, 'AT&T Stadium', 'Dallas'),
  (94, 'round_of_16', '2026-07-06', '2026-07-07 00:00:00+00', 'Estados Unidos', 'Bélgica', 'us', 'be', null, 'Lumen Field', 'Seattle'),
  (95, 'round_of_16', '2026-07-07', '2026-07-07 16:00:00+00', 'Argentina', 'Egipto', 'ar', 'eg', null, 'Mercedes-Benz Stadium', 'Atlanta'),
  (96, 'round_of_16', '2026-07-07', '2026-07-07 20:00:00+00', 'Suiza', 'Colombia', 'ch', 'co', null, 'BC Place', 'Vancouver')
on conflict (id) do nothing;
