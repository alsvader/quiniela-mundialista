## 1. Migración de base de datos

- [x] 1.1 Crear `supabase/migrations/0010_temporada_participaciones.sql` con la función inmutable `temporada_de_fase(public.match_phase) returns text` (`group_stage → 'grupos'`, resto → `'eliminatoria'`).
- [x] 1.2 Crear la tabla `public.participaciones (user_id uuid references profiles(id) on delete cascade, temporada text not null check (temporada in ('grupos','eliminatoria')), status public.user_status... )` — usar un estado `active`/`disabled` (reusar enum o `text` con check), `created_at timestamptz default now()`, PK `(user_id, temporada)` e índice por `temporada`.
- [x] 1.3 Habilitar RLS en `participaciones`: select propio o admin; insert/update solo admin (`public.is_admin()`).
- [x] 1.4 Añadir helper `public.participa_en(uid uuid, temp text) returns boolean` (`security definer`, `search_path=''`, stable) que verifica fila `active` en `participaciones`.
- [x] 1.5 Insertar la llave `app_settings('fase_activa','grupos')`.
- [x] 1.6 Backfill: insertar `(id,'grupos','active')` en `participaciones` por cada `profiles` con `status='active'` y `role='user'`.
- [x] 1.7 Reescribir las políticas `predictions_upsert_own_active` y `predictions_update_own_active`: sustituir el chequeo `profiles.status='active'` por `public.participa_en(auth.uid(), public.temporada_de_fase((select phase from matches where id = match_id)))`, conservando `is_match_open(match_id)`.
- [x] 1.8 Reescribir el ranking por temporada: convertir la vista `ranking` en función `public.ranking(temp text)` (o vistas `ranking_grupos`/`ranking_eliminatoria`) que filtra participantes `active` de la temporada y cuenta aciertos solo de partidos finalizados de fases de esa temporada; mantener grants a `anon`/`authenticated`. Guardar en el archivo la definición previa para rollback.
- [x] 1.9 Aplicar la migración local (`supabase db reset` o `db push`) y verificar que el comportamiento con `fase_activa='grupos'` reproduce el actual.

## 2. Dominio y tipos

- [x] 2.1 Añadir `Temporada` y `temporada(phase)` en `lib/domain/` (mapeo `match_phase → temporada`) con test unitario (`temporada.test.ts`) cubriendo las 7 fases.
- [x] 2.2 Actualizar `lib/types.ts`: tipo `Participacion`, `Temporada`, y exponer `phase` en `Match` si no estaba tipado.
- [x] 2.3 Parametrizar `prize.ts` por temporada (la firma sigue tomando `activeCount`; documentar que el conteo es por temporada) y revisar/añadir tests de `prize.test.ts` para dos pools independientes.
- [x] 2.4 Añadir schemas zod en `lib/schemas.ts`: `temporadaSchema` y el schema de la acción admin de confirmar/retirar participación.

## 3. Queries y Server Actions

- [x] 3.1 `lib/queries.ts`: `getRanking(temporada)` y `getActiveParticipantCount(temporada)` parametrizados (RPC `ranking(temp)`); `getMyParticipations()` (temporadas del usuario autenticado); `getFaseActiva()` desde `app_settings` con default `grupos`.
- [x] 3.2 `savePick` (`app/(participante)/partidos/actions.ts`): dejar de exigir `requireActiveUser` global; cargar `phase` del partido y validar `participa_en` en la temporada antes del upsert; mensajes de error por temporada.
- [x] 3.3 Acción admin `setSeasonParticipation` en `app/admin/actions.ts` (confirmar/retirar participación por temporada vía upsert en `participaciones`) + acción/llave para mover `fase_activa`; revalidar rutas afectadas.
- [x] 3.4 Revisar `lib/auth/guards.ts`: ajustar/retirar `requireActiveUser` para que el gate de pronóstico sea por participación, no por `status='active'`.

## 4. UI de participante (skill `impeccable` + `ui-ux-pro-max`, base DESIGN.md)

- [x] 4.1 Componente segmento "Grupos | Eliminatoria" (estado en URL `?temporada=`), reutilizando el patrón de filtros existentes; default a `fase_activa`.
- [x] 4.2 `/partidos`: filtrar jornadas por temporada seleccionada; `canEdit` por partido = `participa_en(temporada del partido)` y `isMatchOpen`; `PrizePoolCard` con la bolsa de la temporada vista.
- [x] 4.3 Leyenda en el header de jornada para temporada no participada ("Fase de grupos — tu quiniela arranca en los 16vos") y cards en solo lectura.
- [x] 4.4 Variante del `PendingBanner`/`PendingModal` que invita a pagar la `fase_activa` cuando el usuario no participa en ella (nombrando la temporada, con la advertencia de pérdida de partidos cerrados).
- [x] 4.5 `/mis-puntos`: detalle de puntos por temporada (segmento o sección por temporada).

## 5. UI pública de ranking

- [x] 5.1 `/ranking`: segmento "Grupos | Eliminatoria" (default `fase_activa`), tabla y `PrizePoolCard` por temporada; accesible sin sesión.

## 6. Panel admin

- [x] 6.1 `app/admin/usuarios/page.tsx`: mostrar participación por temporada de cada usuario.
- [x] 6.2 Control por temporada para confirmar/retirar participación (sustituye el toggle único), cableado a `setSeasonParticipation`.
- [x] 6.3 Control admin para mover `fase_activa` (en usuarios o configuración) con confirmación.
- [x] 6.4 Recordatorio de pago por WhatsApp dirigido a quien no participa en la `fase_activa` (ajustar el predicado que hoy usa `status='pending'`).

## 7. Verificación

- [x] 7.1 Tests de dominio verdes (`temporada`, `prize`, `scoring`) y `npm run lint`/`build`.
- [x] 7.2 e2e/manual: un usuario sin participación en grupos ve las cards de grupos en solo lectura con leyenda y no puede guardar (UI ni RLS); confirmar pago de eliminatoria lo habilita solo en eliminatoria.
- [x] 7.3 e2e/manual: dos bolsas y dos rankings independientes (conteos correctos por temporada); entrada tardía a eliminatoria con partidos cerrados no puntúa los cerrados y la bolsa crece.
- [x] 7.4 Verificar backfill: todos los `active` previos quedan con participación `grupos` y su ranking/puntos de grupos intactos.
