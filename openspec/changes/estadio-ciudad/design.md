# Design — estadio-ciudad

## Context

El feed crudo (`scripts/data/fixture-raw.json`, snapshot de
fixturedownload.com) trae `Location` con los 16 nombres FIFA neutros de
patrocinador ("Mexico City Stadium"); el generador
`generate-fixture-seed.py` ya traduce nombres de equipos con el dict `TEAMS`
y hoy descarta la sede. En producción existen 72 filas con pronósticos y
marcadores reales: el dato nuevo debe llegar por migración, no por re-seed.
El naming es-MX de las 16 sedes quedó aprobado en exploración (coloquial:
Azteca, no Banorte ni "Estadio Ciudad de México"; comerciales reales en
EE. UU./Canadá; ciudad ancla simplificada).

## Goals / Non-Goals

**Goals:**
- Estadio y ciudad visibles en las cards de partido del participante.
- Una sola fuente del mapeo FIFA→es-MX (el generador), que emita tanto el
  seed regenerado como el backfill de producción.
- Admin capaz de corregir/llenar sedes (V2: eliminatorias).

**Non-Goals:**
- Tabla `venues` normalizada (16 valores estáticos; sobre-diseño).
- Sede en `LiveMatchCard`, lista del admin o `mis-puntos` (decidido en
  exploración).
- Zona horaria local del estadio: los horarios siguen siendo CDMX
  canónico; la sede es informativa.
- Filtros o agrupación por sede.

## Decisions

### D1 — Columnas `stadium`/`city` nullable, sin tabla aparte
Mismo trato que `home_code`/`away_code`: texto nullable, repetido entre
filas, denormalizado a propósito. La UI tolera null (línea de sede omitida),
necesario para partidos creados a mano y eliminatorias V2 aunque el feed ya
traiga las 104 sedes.

### D2 — El generador es la única fuente del mapeo; emite la 0008 completa
`generate-fixture-seed.py` gana `VENUES: dict[str, tuple[str, str]]`
(Location del feed → (estadio es-MX, ciudad es-MX)) con las 16 entradas
aprobadas, y falla ruidosamente ante una Location desconocida (mismo
contrato que `TEAMS`). El script emite `0008_estadio_ciudad.sql` completa:
`add column` + `update ... from (values ...)` keyed por id oficial FIFA.
Escribir la 0008 a mano duplicaría el mapeo en dos archivos que pueden
divergir; generada, el naming vive en un solo lugar.

**Hallazgo de implementación:** el seed 0002 NO se regenera con las columnas
de sede — correría antes de que la 0008 las cree y rompería todo `db reset`
fresco. La 0008 es autosuficiente: como corre después del seed, deja las
sedes idénticas en entornos frescos y en producción con una sola migración.

### D3 — UI: línea propia bajo los equipos, `label-data`, null-safe
En `MatchPickCard` y `ClosedMatchCard`, entre la fila de equipos y el
radiogroup/pie: `Estadio Azteca · Ciudad de México` en `label-data`
(`text-on-surface-variant`), una sola línea con truncado elegante en
anchos extremos. No va en el header de la card (Grupo/hora): los nombres
largos ("Lincoln Financial Field · Filadelfia") romperían el layout móvil.
Si `stadium` o `city` son null, la línea no se renderiza (sin huecos).
Jerarquía intacta: el pick y el marcador siguen siendo los héroes.

### D4 — Admin: campos opcionales en el form existente
`matchSchema` gana `stadium` y `city` opcionales (trim; vacío → null, mismo
transform que `group_label`); `match-form.tsx` dos `Field` opcionales;
`upsertMatch` los persiste. Sin validación de catálogo: el admin puede
escribir cualquier sede (la lista de 16 es dato del seed, no constraint).

## Risks / Trade-offs

- [Orden de migraciones: el seed corre antes de que existan las columnas] →
  resuelto en D2: la 0002 queda intacta y la 0008 (posterior al seed) crea
  columnas y backfill para todos los entornos.
- [El mapeo coloquial difiere del naming FIFA oficial] → decisión de
  producto explícita (audiencia mexicana); si FIFA/patrocinios cambian un
  nombre, es un UPDATE trivial vía admin o migración.
- [Deploy con columnas nuevas antes del código] → las columnas nullable son
  invisibles para el código viejo (`select *` las trae y las ignora);
  migración primero sigue siendo seguro.

## Open Questions

- Ninguna bloqueante.
