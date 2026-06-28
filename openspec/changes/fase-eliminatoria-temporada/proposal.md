## Why

La fase de grupos está por terminar y queremos invitar gente nueva a la fase de
eliminatoria directa (dieciseisavos → final). El modelo actual asume **un solo
pago y un solo estado global** (`profiles.status='active'` ⇒ pronostica cualquier
partido abierto), así que un registro nuevo podría pronosticar los partidos de
grupos que aún están abiertos —partidos que no pagó— y la bolsa/ranking mezclaría
a quien jugó grupos con quien solo entra a la eliminatoria. Necesitamos que cada
temporada sea un torneo de pago independiente, con su propia bolsa y ranking.

## What Changes

- Se introduce el concepto de **temporada**: `grupos` (todos los `group_stage`) y
  `eliminatoria` (todas las fases de `round_of_32` a `final`). Un helper de dominio
  mapea `match_phase → temporada`.
- **BREAKING** (modelo de autorización): el permiso para pronosticar deja de
  derivarse de `profiles.status='active'` y pasa a derivarse de una **participación
  por temporada**. Un usuario puede pronosticar el partido M solo si pagó la
  temporada de M y el partido sigue abierto (kickoff − 1h). `profiles.status` queda
  como estado de cuenta (`pending`/`active`/`disabled`).
- Nueva tabla **participaciones** `(user_id, temporada, status)` (entitlement por
  temporada, confirmado por el admin tras el pago manual).
- **Backfill**: todo `profiles.status='active'` actual recibe automáticamente la
  participación de `grupos` — nadie pierde lo que ya pagó.
- Nueva llave **`fase_activa`** en `app_settings`: la temporada que el admin abre a
  registro/pago (mueve la leyenda, el CTA y la pestaña por defecto).
- **Entrada tardía permitida** con la regla existente: la bolsa de eliminatoria
  crece conforme se confirman pagos; quien entra tarde pierde sin recurso los
  partidos ya cerrados (mismo discurso que el banner actual de pago pendiente).
- **Bolsa y ranking por temporada**: dos bolsas acumuladas independientes y dos
  rankings (la función `ranking()` se parametriza por temporada). El conteo de
  activos y `prize.ts` se calculan por temporada.
- **UI**: segmento **"Grupos | Eliminatoria"** en `/partidos` y `/ranking`; la
  `PrizePoolCard` sigue la pestaña activa. En el header de cada jornada de grupos,
  para quien no pagó esa temporada, una leyenda ("tu quiniela arranca en los
  16vos"), y una variante del `PendingBanner` con el CTA de pago de la eliminatoria.
- **Panel admin**: la activación de cuenta pasa de "activar usuario" a **"confirmar
  pago de [temporada]"** — un control por temporada pendiente.

## Capabilities

### New Capabilities
- `season-participation`: define la temporada (`grupos`/`eliminatoria`), el mapeo
  `match_phase → temporada`, la tabla de participaciones por temporada, la llave
  `fase_activa`, la regla de entrada tardía y el backfill de participaciones de
  grupos para los activos existentes.

### Modified Capabilities
- `predictions`: el gate de guardado pasa de "cuenta activa" a "participación
  confirmada en la temporada del partido" (más partido abierto). RLS y la Server
  Action se actualizan en consecuencia.
- `scoring-ranking`: bolsa y ranking dejan de ser globales y se calculan **por
  temporada**; `ranking()`/`getActiveParticipantCount`/`prize.ts` reciben la
  temporada como parámetro.
- `account-activation`: el estado de participación deja de ser global; el banner/
  modal de pago pendiente se expresa por temporada y aparece para quien no ha
  pagado la `fase_activa`.
- `admin-panel`: el control de usuarios confirma el pago **por temporada** en lugar
  de un único toggle activo/pendiente.
- `match-schedule`: `/partidos` gana el segmento "Grupos | Eliminatoria" y la
  leyenda por jornada de grupos para quien no participa en esa temporada.

## Impact

- **DB / migración**: nueva tabla `participaciones` + enum/dominio de temporada;
  nueva llave `fase_activa` en `app_settings`; backfill de participaciones de grupos;
  reescritura de la función `ranking()` y de las políticas RLS de `predictions`
  (gate por participación en lugar de `status='active'`).
- **Dominio**: nuevo helper `temporada(phase)`; `prize.ts` y el conteo de activos
  por temporada; `lib/queries.ts` (ranking/bolsa parametrizados, participaciones del
  usuario).
- **Server Actions / schemas**: `savePick` (gate por participación), acción admin de
  confirmar pago por temporada, schemas zod nuevos en `lib/schemas.ts`.
- **UI**: `/partidos` (segmento + leyenda + banner CTA), `/ranking` (segmento),
  `PrizePoolCard`, `PendingBanner`/`PendingModal`, panel admin de usuarios. Trabajo
  visual con `impeccable` + `ui-ux-pro-max`, respetando DESIGN.md.
- **Fuera de alcance**: pasarela de pago automática (sigue siendo manual + WhatsApp);
  el alta del fixture real de eliminatoria (partidos "por definir") se maneja con el
  CRUD admin existente y no es parte de este change.
