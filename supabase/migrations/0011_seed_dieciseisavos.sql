-- Dieciseisavos de final (round_of_32): 16 partidos, Mundial 2026.
-- Generado por scripts/generate-fixture-seed.py; NO editar a mano.
-- id = número de partido oficial FIFA (73-88). group_label NULL (eliminatoria,
-- design D1). match_date = fecha en America/Mexico_City. Estadio/ciudad inline
-- (columnas ya existen tras 0008). Equipos resueltos del cuadro tras la fase
-- de grupos. No toca la secuencia: 0002 ya la dejó en 200.

insert into public.matches
  (id, phase, match_date, kickoff_at, home_team, away_team,
   home_code, away_code, group_label, stadium, city)
overriding system value
values
  (73, 'round_of_32', '2026-06-28', '2026-06-28 19:00:00+00', 'Sudáfrica', 'Canadá', 'za', 'ca', null, 'SoFi Stadium', 'Los Ángeles'),
  (74, 'round_of_32', '2026-06-29', '2026-06-29 20:30:00+00', 'Alemania', 'Paraguay', 'de', 'py', null, 'Gillette Stadium', 'Boston'),
  (75, 'round_of_32', '2026-06-29', '2026-06-30 01:00:00+00', 'Países Bajos', 'Marruecos', 'nl', 'ma', null, 'Estadio BBVA', 'Monterrey'),
  (76, 'round_of_32', '2026-06-29', '2026-06-29 17:00:00+00', 'Brasil', 'Japón', 'br', 'jp', null, 'NRG Stadium', 'Houston'),
  (77, 'round_of_32', '2026-06-30', '2026-06-30 21:00:00+00', 'Francia', 'Suecia', 'fr', 'se', null, 'MetLife Stadium', 'Nueva York'),
  (78, 'round_of_32', '2026-06-30', '2026-06-30 17:00:00+00', 'Costa de Marfil', 'Noruega', 'ci', 'no', null, 'AT&T Stadium', 'Dallas'),
  (79, 'round_of_32', '2026-06-30', '2026-07-01 01:00:00+00', 'México', 'Ecuador', 'mx', 'ec', null, 'Estadio Azteca', 'Ciudad de México'),
  (80, 'round_of_32', '2026-07-01', '2026-07-01 16:00:00+00', 'Inglaterra', 'RD del Congo', 'gb-eng', 'cd', null, 'Mercedes-Benz Stadium', 'Atlanta'),
  (81, 'round_of_32', '2026-07-01', '2026-07-02 00:00:00+00', 'Estados Unidos', 'Bosnia y Herzegovina', 'us', 'ba', null, 'Levi''s Stadium', 'San Francisco'),
  (82, 'round_of_32', '2026-07-01', '2026-07-01 20:00:00+00', 'Bélgica', 'Senegal', 'be', 'sn', null, 'Lumen Field', 'Seattle'),
  (83, 'round_of_32', '2026-07-02', '2026-07-02 23:00:00+00', 'Portugal', 'Croacia', 'pt', 'hr', null, 'BMO Field', 'Toronto'),
  (84, 'round_of_32', '2026-07-02', '2026-07-02 19:00:00+00', 'España', 'Austria', 'es', 'at', null, 'SoFi Stadium', 'Los Ángeles'),
  (85, 'round_of_32', '2026-07-02', '2026-07-03 03:00:00+00', 'Suiza', 'Argelia', 'ch', 'dz', null, 'BC Place', 'Vancouver'),
  (86, 'round_of_32', '2026-07-03', '2026-07-03 22:00:00+00', 'Argentina', 'Cabo Verde', 'ar', 'cv', null, 'Hard Rock Stadium', 'Miami'),
  (87, 'round_of_32', '2026-07-03', '2026-07-04 01:30:00+00', 'Colombia', 'Ghana', 'co', 'gh', null, 'Arrowhead Stadium', 'Kansas City'),
  (88, 'round_of_32', '2026-07-03', '2026-07-03 18:00:00+00', 'Australia', 'Egipto', 'au', 'eg', null, 'AT&T Stadium', 'Dallas')
on conflict (id) do nothing;
