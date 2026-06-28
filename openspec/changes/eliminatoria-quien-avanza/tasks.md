## 1. Migración de base de datos

- [x] 1.1 Crear `supabase/migrations/0012_eliminatoria_avanza.sql` con `alter table public.matches add column avanza public.pick` + CHECK `avanza is null or avanza in ('H','A')`.
- [x] 1.2 Añadir CHECK de finalización en `matches`: `finished_at is null or public.temporada_de_fase(phase) = 'grupos' or avanza is not null` (eliminatoria finalizada ⇒ ganador definido).
- [x] 1.3 Reescribir `public.ranking(temp text)`: el resultado oficial de eliminatoria usa `m.avanza`; el join exige `m.avanza is not null` en eliminatoria y `m.home_goals is not null` en grupos (ambos con `finished_at not null`). Guardar la definición previa para rollback.
- [x] 1.4 Reescribir las políticas `predictions_upsert_own_active` y `predictions_update_own_active` añadiendo el rechazo de `pick='D'` en eliminatoria: `... and (public.temporada_de_fase((select phase from matches where id = match_id)) = 'grupos' or pick <> 'D')`.
- [x] 1.5 Aplicar la migración local (`supabase db reset`) y verificar: con solo partidos de grupos el ranking de grupos no cambia; un partido de eliminatoria 1-1 con `avanza` puntúa correctamente.

## 2. Dominio y tipos

- [x] 2.1 `lib/types.ts`: añadir `avanza: Pick | null` a `Match`.
- [x] 2.2 `lib/domain/scoring.ts`: introducir `officialResult(match)` que ramifica por temporada (grupos → `deriveResult(goles)`; eliminatoria → `avanza`); `scorePrediction` compara el pick contra `officialResult`. Mantener `deriveResult` para grupos.
- [x] 2.3 Tests de `scoring.test.ts`: cubrir eliminatoria (empate 1-1 con `avanza`, acierto/error por quién avanza, finalizado sin `avanza` no puntúa) y verificar que grupos no cambia.
- [x] 2.4 `lib/schemas.ts`: el schema de marcador (`scoreSchema`) acepta `avanza` opcional (`H`/`A`); validación de coherencia goles↔avanza se hace en la acción.

## 3. Server Actions

- [x] 3.1 `savePick` (`app/(participante)/partidos/actions.ts`): rechazar `pick='D'` cuando la temporada del partido es eliminatoria, con mensaje claro; la RLS es la última línea.
- [x] 3.2 `saveScore` (`app/admin/actions.ts`): aceptar/persistir `avanza` en eliminatoria; auto-deducir del marcador cuando los goles difieren (y validar que el admin no lo contradiga); exigir `avanza` para finalizar un empate; rechazar finalizar eliminatoria sin ganador. Grupos: sin cambios, `avanza` queda null.

## 4. UI de participante (skill `impeccable` + `ui-ux-pro-max`, base DESIGN.md)

- [x] 4.1 `MatchPickCard`: para partidos de eliminatoria, ocultar la opción "E", reetiquetar el encabezado a "¿Quién avanza?" y las opciones a "{local} avanza" / "{visitante} avanza"; grupos conserva L/E/V. Pasar la fase/temporada del partido a la card.
- [x] 4.2 `ClosedMatchCard` y vistas de solo lectura: mostrar el resultado oficial de eliminatoria como el equipo que avanza (marcador como contexto).
- [x] 4.3 `/mis-puntos`: el detalle usa `officialResult` (quién avanza en eliminatoria); la columna "Resultado" refleja el equipo que pasa, no L/E/V por goles.

## 5. UI admin

- [x] 5.1 `app/admin/partidos/score-form.tsx`: mostrar el selector "quién avanza" (local/visitante) solo en fases de eliminatoria; pre-seleccionar/auto-deducir desde el marcador cuando los goles difieren; estado e hints de validación coherentes con el form actual.

## 6. Verificación

- [x] 6.1 Tests de dominio verdes (`scoring`, `temporada`, `prize`) y `npm run lint` / `build`.
- [x] 6.2 e2e/manual: en una card de eliminatoria abierta solo aparecen "{local} avanza" / "{visitante} avanza" bajo "¿Quién avanza?"; intentar guardar empate se rechaza (UI y servidor/RLS).
- [x] 6.3 e2e/manual: el admin captura 1-1 en eliminatoria, elige ganador, finaliza; el pick de quién avanza puntúa y el ranking de eliminatoria lo refleja; un empate finalizado sin ganador no puntúa.
- [x] 6.4 Verificar que la fase de grupos no cambia (L/E/V por goles, ranking de grupos idéntico).
