# Partido en vivo en /partidos

## Why

Durante el torneo, la página de partidos no comunica lo que está pasando *ahora*:
un partido en curso se ve igual que uno por jugarse. Mostrar el partido en vivo
con su marcador convierte /partidos en el punto de reunión durante los juegos.
Además, hoy el sistema asume que "tiene goles = terminó": si el admin capturara
un marcador parcial para alimentar un "en vivo", el chip "Final" mentiría y los
puntos sumarían a medio partido. Este change introduce la distinción explícita
entre marcador parcial y final, y sobre ella construye la visualización en vivo.

## What Changes

- **BREAKING (semántica de datos):** los goles capturados dejan de implicar
  "partido terminado". Nueva columna `finished_at timestamptz null` en
  `matches` (null = no finalizado): el admin da por finalizado el partido
  explícitamente. Migración 0007 con backfill (los partidos con goles ya
  capturados se marcan finalizados — bajo la semántica vieja eran finales) y
  CHECK de coherencia (finalizado ⇒ goles capturados).
- **Puntos solo de partidos finalizados**, en las dos capas: TypeScript
  (`/mis-puntos`, cards) y la función `ranking()` en SQL (misma migración).
  Un marcador parcial en vivo nunca mueve puntos ni ranking.
- **Estado "en vivo" derivado:** `kickoff_at ≤ ahora` y no finalizado. Sin
  excepciones ni ventanas heurísticas: el reloj solo marca el arranque (dato
  exacto), el admin marca el final.
- **Card de partido en vivo en /partidos:** componente único con leyenda
  "En vivo", equipos con bandera y marcador (guion `—` si el admin aún no
  captura; nunca 0–0 asumido). Con 1 partido en vivo, la card va al centro del
  header (entre el título y la bolsa); con 2+ (la tercera jornada de cada grupo
  es simultánea por reglamento), fila propia entre el header y el listado,
  con orden estable por kickoff y fixture.
- **Frescura por polling ligero:** `router.refresh()` cada ~60 s desde un
  client component, pausado cuando la pestaña está oculta y activo únicamente
  cuando hay partidos en vivo. Sin websockets ni Supabase Realtime (fuera de
  alcance V1).
- **Flujo del admin:** el form de marcador gana un checkbox "Marcar como
  finalizado" (desmarcado por defecto: capturar en vivo es el gesto sin
  fricción, finalizar es explícito), con reversa para correcciones. La lista
  de partidos del admin muestra un badge recordatorio en partidos con
  `kickoff + ~2.5 h` ya pasado y sin finalizar (la heurística de tiempo solo
  avisa al humano, nunca decide por el sistema).
- **Efectos en vistas existentes:** el card del listado para un partido en
  vivo muestra "En vivo" (y el marcador parcial si existe) en lugar de
  "Final"/"POR JUGARSE"; `/mis-puntos` cuenta y suma solo finalizados.

## Capabilities

### New Capabilities

- `live-match`: estado en vivo de un partido (derivación, finalización
  explícita), su visualización en /partidos (cards, posiciones, marcador o
  guion) y la frescura por polling.

### Modified Capabilities

- `scoring-ranking`: la puntuación y el ranking pasan de "goles capturados" a
  "partido finalizado" como condición para puntuar; las correcciones siguen
  recalculando todo al vuelo.
- `admin-panel`: la captura de marcadores distingue parcial de final
  (checkbox de finalización + reversa) y la lista de partidos recuerda
  finalizaciones pendientes.

## Impact

- `supabase/migrations/0007_*.sql`: columna `finished_at`, CHECK, backfill y
  `create or replace` de `ranking()` con la condición de finalizado.
- `lib/types.ts` (Match gana `finished_at`), `lib/domain/` (helpers
  `isMatchLive`/`isMatchFinished`), `lib/domain/scoring.ts` callers.
- `app/(participante)/partidos/page.tsx` (header y fila de vivos),
  componente nuevo de card en vivo + client component de polling,
  `closed-match-card.tsx` (chip "En vivo").
- `app/(participante)/mis-puntos/page.tsx` (filtra por finalizados).
- `app/admin/partidos/page.tsx` (badge recordatorio) y
  `app/admin/partidos/[id]/page.tsx` + `app/admin/actions.ts`
  (`saveScore` gana finalización; `scoreSchema` en `lib/schemas.ts`).
- `openspec/config.yaml`: decisión 3 (puntuación) gana la condición de
  finalizado.
- Branch `partido-en-vivo`; pruebas locales (migración con `supabase db
  reset` + flujo en navegador) antes de producción, donde la migración va
  primero y el deploy después, en el mismo release.
