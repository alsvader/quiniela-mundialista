## Context

V1 modela un torneo de **un solo pago y un estado global**: `profiles.status='active'`
habilita pronosticar cualquier partido abierto y aparecer en el ranking, y la bolsa
es única (`activos × $100 × 0.7`, derivada). El enum `match_phase` ya contempla las
siete fases, pero solo `group_stage` está habilitada (spec `match-schedule`, "Fases
del torneo") y las eliminatorias se habían pateado a V2 (design.md D10 del change
original).

La fase de grupos está por terminar y se invita gente nueva a la **eliminatoria
directa** como un torneo de pago aparte, con su propia bolsa acumulada y su propio
ranking. Las dos temporadas coexisten durante la transición (quedan partidos de
grupos abiertos mientras se abre el pago de eliminatoria). Restricciones heredadas
que se mantienen: cierre por partido (kickoff − 1h), puntuación L/E/V solo sobre
partidos finalizados, montos derivados nunca almacenados, lógica/autorización en
servidor con RLS como última línea, pago manual fuera de la app (WhatsApp).

## Goals / Non-Goals

**Goals:**
- Introducir **temporada** (`grupos` / `eliminatoria`) como unidad de pago, bolsa y
  ranking, derivada de `match_phase` por un helper de dominio.
- Que el permiso de pronosticar se derive de una **participación confirmada por
  temporada**, no del estado global de la cuenta. Un nuevo registro ve los partidos
  de grupos pero no puede pronosticarlos.
- Dos bolsas y dos rankings independientes, ambos derivados (sin almacenar montos ni
  totales), con `ranking()`/conteo de activos/`prize.ts` parametrizados por temporada.
- Permitir entrada tardía a una temporada con la **regla existente** (la bolsa crece;
  lo cerrado se pierde sin recurso).
- Migrar sin pérdida: los `active` actuales conservan su participación de grupos.

**Non-Goals:**
- Pasarela de pago automática: el pago sigue siendo manual y la confirmación la hace
  el admin.
- Alta del fixture real de eliminatoria (partidos "por definir"): se hace con el CRUD
  admin existente, fuera de este change.
- Subdividir la eliminatoria en sub-bolsas por ronda: la eliminatoria es **una sola
  temporada** con una sola bolsa acumulada.
- Notificaciones, correos, tiempo real (siguen fuera de alcance).

## Decisions

### D1 — Temporada como agrupación de `match_phase`, no como columna nueva en `matches`
La temporada se **deriva** de la fase: `group_stage → grupos`; todo lo demás →
`eliminatoria`. Vive como helper de dominio `temporada(phase)` (TS) y como función
SQL `temporada_de_fase(match_phase)` (`immutable`) reutilizable en RLS, la vista y la
función de ranking. No se agrega columna a `matches`: la fase ya es la fuente de
verdad y duplicarla invita a inconsistencias.
*Alternativa:* enum `temporada` materializado en `matches`. Rechazada: dato derivable,
más superficie de error y migración innecesaria.

### D2 — Participación por temporada en tabla nueva, no extendiendo `profiles.status`
Nueva tabla `participaciones (user_id, temporada, status, created_at, PK(user_id,
temporada))`, con `status` = `active`/`disabled` (la ausencia de fila = no participa).
`profiles.status` se conserva como **estado de cuenta** (`pending`/`active`/
`disabled`): `disabled` banea la cuenta entera; `pending`/`active` describen el ciclo
de vida del registro. El permiso de pronosticar una temporada se deriva de la fila de
participación, no de `profiles.status`.
*Alternativa:* columnas booleanas `participa_grupos`/`participa_eliminatoria` en
`profiles`. Rechazada: no escala si algún día se separan más temporadas y mezcla
estado de cuenta con entitlement.

### D3 — `fase_activa` en `app_settings` como puntero global de onboarding
Llave `fase_activa` (valor = `grupos` | `eliminatoria`) que el admin mueve al abrir el
pago de una temporada. **No** es el gate de autorización (eso es la participación);
gobierna: (a) la pestaña por defecto en `/partidos` y `/ranking`, (b) qué temporada
promueve el banner/CTA de pago a quien no participa en ella, (c) la leyenda sobre las
jornadas de la temporada que el usuario no juega. Sigue el patrón key-value existente
(`whatsapp_number`, datos de pago) con RLS de update solo-admin.

### D4 — Gate de predicciones por participación (RLS + Server Action), no por `status='active'`
Helper SQL `participa_en(uid, temporada) → boolean` (`security definer`, análogo a
`is_admin()`/`is_match_open()`). Las políticas `predictions_insert/update` cambian su
condición de `profiles.status='active'` a `participa_en(auth.uid(),
temporada_de_fase(<fase del partido>))` **y** `is_match_open(match_id)`. La Server
Action `savePick` deja de exigir `requireActiveUser` global y valida participación en
la temporada del partido (la consulta del partido ya trae su fase). RLS queda como
segunda línea, igual que hoy.
*Alternativa:* mantener `requireActiveUser` y filtrar en aplicación. Rechazada: dejaría
la BD permitiendo escrituras que la UI bloquea — contradice "la UI nunca es la única
defensa".

### D5 — `ranking()` y bolsa parametrizados por temporada
La función `ranking()` pasa a `ranking(temporada)`: filtra participantes por fila de
participación `active` en esa temporada y cuenta aciertos **solo de partidos
finalizados de fases de esa temporada**. La vista `ranking` (pública, sin sesión) se
reemplaza por la función parametrizada (o dos vistas `ranking_grupos`/
`ranking_eliminatoria`); se mantiene el acceso `anon`. `getActiveParticipantCount` y
la bolsa de `prize.ts` reciben la temporada: `bolsa(temporada) = activos_de_esa_
temporada × $100 × 0.7`. Las constantes (`ENTRY_FEE_MXN`, `PLATFORM_FEE`, pesos
50/30/20) **no cambian**: cada temporada usa las mismas reglas sobre su propio pool.
*Alternativa:* un ranking acumulado global con late join. Rechazada: un recién llegado
a eliminatoria competiría con 0 puntos de grupos contra quien jugó todo — injusto y
contradice "pago por temporada".

### D6 — Entrada tardía sin lógica nueva de equidad
Confirmar la participación a media temporada simplemente inserta la fila; la bolsa
crece en la siguiente consulta (derivada) y los partidos ya cerrados no son
pronosticables (gate `is_match_open`). Es exactamente la regla que ya rige a los
`pending` de grupos y que el `PendingBanner` ya comunica ("lo cerrado se pierde sin
recurso"). Cero código de fairness nuevo.

### D7 — Segmento "Grupos | Eliminatoria" en cliente, datos por temporada en servidor
`/partidos` y `/ranking` ganan un segmento (tabs) que selecciona la temporada vista;
el estado vive en la URL (`?temporada=`), consistente con los filtros existentes
(`?dia=`, `?equipo=`) que ya se resuelven en servidor. La `PrizePoolCard` y la tabla/
listado se alimentan de la temporada seleccionada. Pestaña por defecto = `fase_activa`.
Para la temporada que el usuario **no** juega: las cards de esa temporada se muestran
en solo-lectura, con leyenda en el header de jornada ("Fase de grupos — tu quiniela
arranca en los 16vos") y una variante del `PendingBanner` con el CTA de pago de la
temporada activa. Trabajo visual con `impeccable` + `ui-ux-pro-max` sobre DESIGN.md.

### D8 — Panel admin: confirmar pago **por temporada**
La gestión de usuarios muestra, por usuario, su participación en cada temporada y un
control para confirmar/retirar el pago de la temporada (insert/update de
`participaciones`), sustituyendo el toggle único activo/pendiente. El recordatorio de
pago por WhatsApp se mantiene; el mensaje puede nombrar la temporada que se invita.
`profiles.status='disabled'` sigue disponible para banear la cuenta entera.

## Risks / Trade-offs

- **[Reescritura de `ranking()` y RLS de `predictions` toca la ruta crítica]** → Los
  cambios son aditivos sobre helpers ya probados (`is_match_open`, `is_admin`); se
  cubren con los tests de dominio (`scoring`, `prize`) extendidos por temporada y con
  e2e que verifiquen que un no-participante no puede escribir (RLS) ni ve picks
  habilitados (UI).
- **[Backfill incorrecto deja a activos sin su participación de grupos]** → La
  migración inserta una fila `(id, 'grupos', 'active')` por cada `profiles` con
  `status='active'` y `role='user'` en la misma transacción que crea la tabla; test de
  migración / smoke que cuente filas antes/después.
- **[Dos pestañas pueden confundir sobre "dónde está mi dinero/ranking"]** → Copy
  explícito por temporada (bolsa y ranking etiquetados) y leyenda clara en la temporada
  no jugada; decisión de UX a refinar con `impeccable`.
- **[`profiles.status='active'` queda semánticamente ambiguo tras el cambio]** → Se
  documenta que `status` es estado de cuenta y la participación es el gate; el ranking
  ya no depende de `status` sino de `participaciones`. Riesgo de que código viejo siga
  leyendo `status='active'` como "participa": auditar usos (`requireActiveUser`,
  vista `ranking`, `getActiveParticipantCount`).
- **[`fase_activa` mal configurada muestra la pestaña/CTA equivocada]** → Default
  seguro a `grupos` si la llave falta; validación zod del valor contra el set de
  temporadas.

## Migration Plan

1. Migración `0010_temporada_participaciones.sql`:
   - `temporada_de_fase(match_phase)` (immutable) y helper `participa_en(uuid, text)`.
   - Tabla `participaciones` + RLS (select propio/admin, update/insert admin) + índice.
   - `insert into app_settings('fase_activa','grupos')`.
   - **Backfill**: una fila de participación `grupos/active` por cada activo actual.
   - Reescritura de políticas `predictions_insert/update` (gate por `participa_en`).
   - `ranking()` parametrizada por temporada (+ grants `anon`/`authenticated`); ajustar
     o reemplazar la vista pública `ranking`.
2. Dominio/queries/actions/UI (orden en tasks.md), detrás de la `fase_activa` por
   defecto en `grupos`: con `fase_activa='grupos'` el comportamiento observable es el
   de hoy (una temporada visible), así que se puede desplegar antes de abrir la
   eliminatoria.
3. Cuando todo esté verificado, el admin (a) carga los partidos de eliminatoria, (b)
   confirma pagos de eliminatoria y (c) mueve `fase_activa` a `eliminatoria`.
4. **Rollback**: revertir `fase_activa` a `grupos` oculta la eliminatoria sin tocar
   datos; revertir la migración requiere restaurar las políticas RLS y la `ranking()`
   originales (guardar su definición previa en el archivo de migración).

## Open Questions

- ¿La pestaña de la temporada que el usuario no juega debe **ocultar** la `PrizePoolCard`
  de esa temporada o mostrarla en modo informativo? (Default propuesto: mostrarla; la
  bolsa es pública.)
- ¿El ranking público sin sesión muestra ambas temporadas con tabs, o `fase_activa` por
  defecto con cambio manual? (Default propuesto: tabs, default `fase_activa`.)
- ¿El mensaje de WhatsApp del recordatorio debe variar su texto según la temporada
  invitada, o basta con el genérico actual? (Refinable; no bloquea.)
