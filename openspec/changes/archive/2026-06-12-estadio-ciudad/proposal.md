# Estadio y ciudad de cada partido

## Why

Las cards de partido muestran equipos, grupo y horario, pero no dónde se juega
— contexto que los fans quieren (¿el Azteca?, ¿qué partidos tocan en
Guadalajara?). El dato ya existe gratis: el feed crudo del fixture
(`scripts/data/fixture-raw.json`) trae la sede (`Location`) de cada partido y
el generador del seed hoy la descarta. Es exponerlo, no capturarlo.

## What Changes

- Dos columnas nuevas en `matches`: `stadium text` y `city text`, nullable
  (mismo patrón que los códigos de bandera; partidos "por definir" en V2).
- El generador del fixture (`scripts/generate-fixture-seed.py`) gana un mapeo
  de los 16 nombres FIFA del feed a nombre coloquial es-MX aprobado
  (Estadio Azteca · Ciudad de México, Estadio Akron · Guadalajara, Estadio
  BBVA · Monterrey, SoFi Stadium · Los Ángeles, etc.), análogo al dict
  `TEAMS`; el seed 0002 se regenera para entornos frescos.
- Migración 0008 para producción: columnas + UPDATE de las 72 filas
  existentes, keyed por el id oficial FIFA (generada por el mismo script para
  no duplicar el mapeo a mano).
- UI: `MatchPickCard` y `ClosedMatchCard` muestran una línea "Estadio ·
  Ciudad" bajo los equipos (línea propia, no en el header de la card, por
  nombres largos en móvil). Deliberadamente fuera: `LiveMatchCard` (la card
  evento se queda con leyenda + marcador), la lista del admin (densidad) y
  `mis-puntos` (auditoría de puntos).
- Admin: el form de crear/editar partido gana dos campos opcionales
  (estadio, ciudad) en `matchSchema` y `match-form`.

## Capabilities

### New Capabilities

(ninguna — se modifican capacidades existentes)

### Modified Capabilities

- `match-schedule`: el requirement "Información del partido" gana estadio y
  ciudad en las cards del participante (con tolerancia a sede null).
- `data-seeding`: el seed del fixture incluye estadio y ciudad de cada
  partido, derivados del feed con naming es-MX.
- `admin-panel`: "Gestión de partidos" gana los campos opcionales de sede.

## Impact

- `supabase/migrations/0002_seed_fixture.sql` (regenerado) y
  `0008_estadio_ciudad.sql` (columnas + backfill de 72 filas en producción).
- `scripts/generate-fixture-seed.py` (mapeo VENUES + emisión de la 0008).
- `lib/types.ts` (`Match` gana `stadium`/`city`), `lib/schemas.ts`
  (`matchSchema` con campos opcionales).
- `app/(participante)/partidos/match-pick-card.tsx` y
  `closed-match-card.tsx` (línea de sede; UI con skills `impeccable` +
  `ui-ux-pro-max` y DESIGN.md).
- `app/admin/partidos/match-form.tsx` y `app/admin/actions.ts`
  (`upsertMatch` persiste sede).
- Branch `estadio-ciudad`; pruebas locales (reset + flujo) antes de
  producción: migración primero, deploy después, mismo release.
