# Cierre por partido y guardado individual

## Why

Los usuarios reportan que el cierre por jornada (23:59 del día anterior) les bloquea
pronósticos con demasiada anticipación: quieren poder pronosticar cada partido hasta
una hora antes de su inicio. La excepción de la jornada inaugural (abierta hasta
kickoff − 1h) demostró que esa regla es viable en las tres capas (dominio, RLS, UI);
este cambio la generaliza a todos los partidos y elimina la excepción. El torneo ya
inició (2026-06-11), por lo que el cambio se despliega en caliente y conviene
mantenerlo quirúrgico.

## What Changes

- **BREAKING (regla de negocio):** el cierre de pronósticos deja de ser por jornada
  (00:00 CDMX del día de la jornada) y pasa a ser por partido: cada partido acepta
  pronósticos mientras `now < kickoff_at − 1 hora`. El mapa
  `JORNADA_DEADLINE_EXCEPTIONS` y la rama de excepción en `is_match_open()` (migración
  0004) desaparecen: la regla nueva cubre la jornada inaugural.
- **BREAKING (modelo de guardado):** el guardado por jornada completa se reemplaza por
  guardado individual por partido, cada uno con su propio botón. Ya no se exige tener
  pick en todos los partidos del día para guardar; un partido sin pick al cierre
  simplemente no puntúa (igual que hoy, pero con granularidad de partido).
- **Decisión de producto explícita:** un usuario puede pronosticar partidos
  posteriores de una jornada después de que el primero haya iniciado o terminado
  (ver resultados tempranos antes de pronosticar los tardíos). Se acepta
  deliberadamente: es igual para todos y aumenta el engagement.
- La UI de /partidos muestra estado y fecha límite por partido (no por jornada): la
  jornada puede estar parcialmente cerrada, con partidos cerrados en solo lectura y
  abiertos editables, cada uno con su botón de guardar y confirmación de guardado.
- Los textos de fecha límite (chips de jornada, banner de cuenta pendiente) pasan de
  "la jornada cierra el X" a comunicar el cierre por partido.

## Capabilities

### New Capabilities

(ninguna — se modifican capacidades existentes)

### Modified Capabilities

- `match-schedule`: el requirement "Cierre de jornada" se reemplaza por "Cierre por
  partido" (kickoff − 1h, sin excepciones fechadas); la agrupación por jornadas se
  conserva como presentación.
- `predictions`: el requirement "Guardado por jornada completa" se reemplaza por
  "Guardado por partido" (botón individual, sin exigencia de jornada completa); la
  modificación libre aplica mientras el partido esté abierto.

## Impact

- `lib/domain/jornada.ts`: nueva lógica `isMatchOpen`/`matchDeadline` basada en
  `kickoff_at`; se elimina `JORNADA_DEADLINE_EXCEPTIONS` (y la dependencia de la
  fecha CDMX para el cierre; `toMxDate` sigue sirviendo para agrupar jornadas).
- `lib/domain/jornada.test.ts`: tests reescritos para la regla por partido.
- `supabase/migrations/0006_*.sql`: reemplaza `public.is_match_open()` con
  `now() < kickoff_at − interval '1 hour'`. La firma no cambia; las políticas RLS de
  `predictions` (que ya validan por `match_id`) quedan intactas.
- `app/(participante)/partidos/actions.ts`: `saveJornada` → action de guardado por
  partido (valida pick único, cuenta activa y partido abierto).
- `app/(participante)/partidos/jornada-form.tsx` y `closed-match-card.tsx`: form y
  estados por partido; jornadas parcialmente cerradas.
- `app/(participante)/partidos/page.tsx`, `layout.tsx` (nextOpenJornada),
  `pending-banner.tsx`, `lib/format.ts` (formatDeadline): textos y cálculo de
  "próximo cierre" por partido.
- `openspec/config.yaml`: actualizar las decisiones de producto 1 (cierre) y la nota
  de guardado por jornada completa.
- Despliegue en caliente con torneo iniciado: trabajar en branch
  `cierre-por-partido`, probar localmente (incluida la migración contra la base
  local) antes de subir a producción. La migración y el deploy del código deben ir
  juntos para no desincronizar dominio y RLS.
