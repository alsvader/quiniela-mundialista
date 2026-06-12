# Design — partido-en-vivo

## Context

Hoy las tres capas asumen "goles capturados = partido terminado":
`ClosedMatchCard` pinta "Final" cuando `home_goals !== null`, `scorePrediction`
puntúa con solo tener goles, y `ranking()` (migración 0003) hace join con
`m.home_goals is not null`. No hay APIs deportivas ni tiempo real en V1: la
única fuente posible de un marcador en vivo es el admin capturando goles
durante el partido — lo que hoy provocaría chips "Final" falsos y puntos
provisionales. `saveScore` ya permite capturar en cualquier momento; falta la
semántica para distinguir parcial de final.

Decisiones tomadas en exploración con el usuario (todas cerradas): flag
explícito sobre heurística de tiempo; puntos solo de finalizados; cards
individuales con posición según cantidad; guion sobre 0–0 asumido; polling
ligero; checkbox + badge recordatorio en admin.

## Goals / Non-Goals

**Goals:**
- Distinguir marcador parcial de final con un dato explícito (`finished_at`).
- Mostrar el/los partidos en vivo en /partidos con marcador y leyenda "En vivo".
- Puntos y ranking inmunes a marcadores parciales, en TS y en SQL.
- Captura en vivo sin fricción para el admin y finalización explícita con
  recordatorio y reversa.

**Non-Goals:**
- Tiempo real (websockets/Supabase Realtime), minuto de juego, eventos del
  partido o cronómetro.
- Mostrar el partido en vivo fuera de /partidos (p. ej. /ranking) en este change.
- Notificaciones de goles.

## Decisions

### D1 — `finished_at timestamptz null` en `matches`, no boolean ni enum
`null` = no finalizado, mismo patrón que los goles; de regalo registra cuándo
se finalizó (auditable) y la reversa es `set null`. Un enum `status` sería
sobre-diseño: no hay más estados que los derivables. CHECK de coherencia
`finished_at is null or home_goals is not null` (un partido finalizado sin
marcador no debe existir); la esquina "goles antes del kickoff" se deja al
buen uso del admin, como hoy. Backfill en la migración: `update matches set
finished_at = now() where home_goals is not null` — bajo la semántica vieja
esos marcadores eran finales; sin backfill el ranking público se vaciaría.

### D2 — "Finalizado" es dato, no regla: las dos capas solo leen la columna
A diferencia del cierre por partido (regla de reloj duplicada TS ↔ SQL), aquí
no hay matemática que sincronizar: TypeScript lee `match.finished_at` y
`ranking()` agrega `and m.finished_at is not null` a su join (misma migración
0007, `create or replace`). El estado "en vivo" sí es derivado pero trivial:
`isMatchLive = kickoff_at ≤ now && finished_at === null` — el reloj solo marca
el arranque, que es dato exacto. Helpers en `lib/domain/jornada.ts` (que ya
alberga las reglas de tiempo de partido): `isMatchLive(match, now?)` e
`isMatchFinished(match)`.

### D3 — Puntuación condicionada en los callers, no en `scorePrediction`
`scorePrediction(pick, homeGoals, awayGoals)` es una función pura de
comparación y se queda igual; la condición "solo finalizados" se aplica donde
se decide QUÉ partidos puntúan: `/mis-puntos` filtra `scoredMatches` por
finalizado y `ClosedMatchCard` solo muestra "✓ +1 PT"/"✗" en finalizados.
Cambiar la firma de `scorePrediction` acoplaría la función pura al modelo de
datos sin necesidad.

### D4 — LiveMatchCard único, posicionado por cantidad
Un solo componente (server) con leyenda "En vivo" (chip magenta secundario:
DESIGN.md lo reserva para live matches; indicador con forma además de color y
animación de pulso respetando `prefers-reduced-motion`), banderas, equipos y
marcador — guion `—` si `home_goals === null`: el sistema solo afirma lo que
el admin capturó, y el guion es además señal operativa de captura pendiente.
La página calcula `liveMatches` (orden por `kickoff_at`, empate por orden de
fixture/id — estable entre refreshes):
- 1 en vivo → la card se renderiza como tercer hijo del header actual
  (`flex flex-wrap justify-between`), entre título y `PrizePoolCard`.
- 2+ en vivo → fila propia (`flex flex-wrap`) entre el header y el listado de
  jornadas. El salto de posición entre estados ocurre entre renders, sin
  animación de transición.

### D5 — Polling: client component sin UI propia
`LiveRefresher` (client): `setInterval` de ~60 s que llama `router.refresh()`;
se monta solo cuando la página renderiza con partidos en vivo (cero costo el
resto del torneo), y pausa/reanuda con `document.visibilityState` para no
quemar requests en pestañas ocultas. Re-render de Server Component puro: sin
estado cliente que sincronizar. `saveScore` ya hace `revalidatePath`, así que
cada refresh trae el marcador más reciente. 60 s es suficiente para goles; un
cronómetro en vivo es non-goal.

### D6 — Admin: checkbox desmarcado por defecto + badge recordatorio + reversa
`saveScore` gana el campo `finished` (checkbox en el form de
`admin/partidos/[id]`, vía `scoreSchema`): un solo submit captura goles y
finaliza. Desmarcado por defecto porque el error barato (olvidar finalizar:
puntos retrasados, corregible) debe ser el default y el error caro (finalizar
por accidente al minuto 40) debe requerir acción explícita. Guardar con el
checkbox desmarcado sobre un partido finalizado lo des-finaliza
(`finished_at = null`) — la reversa es el mismo gesto, sin action nueva. En
`admin/partidos`, badge "Falta finalizar" en partidos con
`kickoff_at + 2.5 h < now` y `finished_at` null: la heurística de tiempo
degradada a recordatorio para el humano; nunca decide por el sistema.

## Risks / Trade-offs

- [El admin olvida finalizar → partido "En vivo" eterno, puntos retenidos] →
  badge recordatorio en su lista + el guion/marcador visible en /partidos como
  señal social (los participantes preguntarán); riesgo aceptado al elegir
  exactitud sobre automatismo.
- [El admin des-finaliza por accidente al corregir un marcador (checkbox
  desmarcado por defecto en un partido ya finalizado)] → el form debe
  inicializar el checkbox con el estado actual del partido, no siempre
  desmarcado: corregir goles de un partido finalizado mantiene la finalización
  salvo que el admin la quite a propósito.
- [Marcador parcial visible cambia pronósticos de partidos posteriores] →
  decisión de producto ya aceptada en el change cierre-por-partido (igual para
  todos); el marcador parcial solo lo hace más visible.
- [Polling × usuarios concurrentes durante partidos] → ~decenas de usuarios ×
  1 request/min solo en pestañas visibles: trivial; sin partidos en vivo el
  componente ni se monta.
- [Backfill marca finalizados partidos cuyo marcador era parcial al migrar] →
  ventana de despliegue: aplicar la migración en un momento sin partido en
  curso, o verificar/corregir ese partido tras el deploy (la reversa existe).

## Open Questions

- Ninguna bloqueante. (El umbral del badge —2.5 h— y el intervalo de polling
  —60 s— son constantes ajustables sin efecto en el modelo.)
