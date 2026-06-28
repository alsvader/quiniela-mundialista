## Why

En la fase de eliminatoria no existe el empate como desenlace: siempre avanza un
equipo (por prórroga o penales). Hoy el pronóstico es L/E/V y el resultado oficial
se deriva *solo* de los goles, así que un partido que termina 1-1 y se define por
penales derivaría "empate" y **nadie acertaría** un pronóstico de quién pasa. El
pronóstico de eliminatoria debe ofrecer únicamente Local/Visitante ("¿Quién
avanza?") y la puntuación debe compararse contra **quién avanzó realmente**, no
contra el marcador a 90'.

## What Changes

- En partidos de **eliminatoria**, el pronóstico ofrece solo **Local / Visitante**
  bajo el encabezado **"¿Quién avanza?"** (opciones "{Local} avanza" / "{Visitante}
  avanza"). El empate (`D`) deja de ser una opción válida en esas fases.
- **BREAKING** (derivación del resultado): el resultado oficial se ramifica por
  temporada. **Grupos** sigue derivando L/E/V de los goles. **Eliminatoria** usa un
  dato nuevo **"quién avanza"** capturado por el admin (un 1-1 por penales no se
  puede derivar de los goles).
- Nueva columna nullable en `matches` (`avanza`/`winner`, valores Local/Visitante)
  usada **solo** en eliminatoria; los goles se siguen capturando para mostrar el
  marcador.
- **Puntuación por temporada**: en eliminatoria, 1 punto si el pick L/V coincide con
  quién avanzó; en grupos, sin cambios. Toca las tres capas espejo:
  `lib/domain/scoring.ts`, la función SQL `ranking(temp)` (su `CASE` usa "quién
  avanza" para fases de eliminatoria) y el detalle de `/mis-puntos`.
- **Finalización en eliminatoria** exige además que "quién avanza" esté definido: un
  partido empatado a 90' sin ganador aún **no puntúa**.
- **Admin**: el formulario de captura de marcador gana un selector "quién avanza"
  para fases de eliminatoria; cuando los goles son distintos se valida/auto-deduce,
  cuando hay empate el admin elige al ganador (penales).
- **Validación**: `savePick` rechaza un pick `D` en fases de eliminatoria; CHECK por
  fase en BD como última línea.

## Capabilities

### New Capabilities
<!-- Ninguna: todo es modificación de comportamiento existente -->

### Modified Capabilities
- `predictions`: en eliminatoria el pronóstico es L/V ("¿Quién avanza?"), no L/E/V;
  el guardado rechaza `D` en esas fases.
- `scoring-ranking`: la derivación del resultado y la puntuación se ramifican por
  temporada — eliminatoria usa "quién avanza" en lugar de derivar de goles; la
  finalización que puntúa exige el ganador definido.
- `admin-panel`: la captura/corrección de marcadores incorpora "quién avanza" para
  partidos de eliminatoria.
- `match-schedule`: la información del partido contempla el dato "quién avanza" para
  eliminatoria (resultado oficial mostrado como el equipo que pasa).

## Impact

- **DB / migración**: nueva columna `matches.avanza` (nullable, Local/Visitante);
  CHECK que impide `pick='D'` en predicciones de fases eliminatorias; CHECK que en
  eliminatoria un partido `finished_at` exija `avanza`; reescritura de la función
  `ranking(temp)` para que el resultado de fases eliminatorias use `avanza`.
- **Dominio**: `lib/domain/scoring.ts` (`deriveResult`/`scorePrediction` reciben la
  temporada / el campo "avanza"); helpers en `lib/domain/temporada.ts` si aplica.
- **Server Actions / schemas**: `savePick` (rechazo de `D` en eliminatoria), acción
  admin de marcador (`saveScore`) con "quién avanza", schemas zod en `lib/schemas.ts`.
- **UI**: `MatchPickCard` (L/V + encabezado "¿Quién avanza?" en eliminatoria),
  `/mis-puntos` (resultado oficial = quién avanzó), `score-form` admin (selector
  ganador). Trabajo visual con `impeccable` + `ui-ux-pro-max`, base DESIGN.md.
- **Fuera de alcance**: mostrar el marcador de penales (`home_pens`/`away_pens`) —
  mejora futura (sería la "opción B"); aquí solo se registra quién avanza.
