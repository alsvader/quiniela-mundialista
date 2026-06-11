# Tasks — cierre-por-partido

## 1. Dominio

- [x] 1.1 Reescribir `lib/domain/jornada.ts`: agregar `isMatchOpen(kickoffAt, now?)`
      y `matchDeadline(kickoffAt)` (cierre = kickoff − 1h, constante con comentario
      cruzado a la migración 0006); eliminar `isJornadaOpen`, `jornadaDeadline` y
      `JORNADA_DEADLINE_EXCEPTIONS`; conservar `TIMEZONE` y `toMxDate`
- [x] 1.2 Reescribir `lib/domain/jornada.test.ts` para la regla por partido:
      abierto antes de kickoff − 1h, cerrado en el instante exacto y después,
      bordes ± 1 segundo

## 2. Base de datos (RLS)

- [x] 2.1 Crear `supabase/migrations/0006_cierre_por_partido.sql`: `create or
      replace function public.is_match_open` con `now() < kickoff_at - interval
      '1 hour'` (firma intacta, comentario cruzado a `lib/domain/jornada.ts`)
- [x] 2.2 Probar la migración en local (`supabase db reset`) y verificar con SQL
      que un partido con kickoff en <1h está cerrado y uno con kickoff en >1h
      está abierto

## 3. Server Action

- [x] 3.1 Reemplazar `saveJornada` por `savePick` en
      `app/(participante)/partidos/actions.ts`: zod en la frontera (matchId
      entero positivo, pick H/D/A), `requireActiveUser()`, partido abierto por
      `isMatchOpen(kickoff_at)`, upsert de una fila con `updated_at`; mensajes
      diferenciados para partido cerrado vs cuenta inactiva
- [x] 3.2 Actualizar `lib/schemas.ts` si hace falta (schema de matchId; eliminar
      `jornadaDateSchema` si queda sin uso)

## 4. UI (/partidos) — usar skills `impeccable` + `ui-ux-pro-max` y DESIGN.md

- [x] 4.1 Extraer `MatchPickCard` (cliente) desde `jornada-form.tsx`: un `<form>`
      por partido con `useActionState` propio, radiogroup existente, botón
      "Guardar" y feedback por card ("✓ Guardado" / última modificación / error),
      con la hora límite del partido visible
- [x] 4.2 Renderizar en `page.tsx` jornadas parcialmente cerradas: por partido,
      `MatchPickCard` si está abierto y `ClosedMatchCard` si no; actualizar el
      chip de jornada a estado agregado (sin deadline único de jornada)
- [x] 4.3 Actualizar `formatDeadline` en `lib/format.ts` para formatear
      `matchDeadline(kickoff_at)` (eliminar la rama de medianoche → 23:59)
- [x] 4.4 Actualizar `nextOpenJornada` en `app/(participante)/layout.tsx` y el
      `pending-banner.tsx`: próximo cierre = primer partido aún abierto
      (consulta con `kickoff_at`), texto del banner en términos de partido
- [x] 4.5 Revisar `mis-puntos` y `pending-modal` por textos o lógica que asuman
      cierre por jornada y ajustarlos

## 5. Verificación local y despliegue

- [x] 5.1 `npm run build` + tests verdes; prueba manual local del flujo completo:
      guardar un partido suelto, modificarlo, intentar guardar uno cerrado
      (rechazo de dominio y de RLS), jornada parcialmente cerrada visible
- [x] 5.2 Actualizar `openspec/config.yaml`: decisión 1 (cierre por partido,
      kickoff − 1h) y nota de guardado (por partido, no por jornada completa)
- [ ] 5.3 Aplicar migración 0006 en producción y deploy del branch en el mismo
      release (migración primero, ver design D5); verificar en producción con
      un partido próximo
