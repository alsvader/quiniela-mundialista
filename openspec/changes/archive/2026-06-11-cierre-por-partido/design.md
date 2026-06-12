# Design — cierre-por-partido

## Context

Hoy el cierre es por jornada: `isJornadaOpen(matchDate)` en
`lib/domain/jornada.ts` (00:00 CDMX del día de la jornada, con el mapa
`JORNADA_DEADLINE_EXCEPTIONS` para la inaugural) y su espejo SQL
`is_match_open()` (migración 0004) usado por las políticas RLS de
`predictions`. El guardado es por jornada completa: un solo `<form>`
(`jornada-form.tsx`) con todos los radiogroups y un botón "Guardar jornada";
la Server Action `saveJornada` exige pick en cada partido del día.

El torneo inició el 2026-06-11: el cambio se despliega con datos y usuarios
reales, por lo que se prioriza el camino quirúrgico sobre el rediseño.

## Goals / Non-Goals

**Goals:**
- Cierre por partido: pronosticable hasta `kickoff_at − 1 hora`, misma regla en
  dominio TS, RLS y textos de UI.
- Guardado individual: cada partido con su propio botón y feedback de guardado.
- Jornadas parcialmente cerradas representadas correctamente en /partidos y en
  el banner de cuenta pendiente.
- Eliminar la excepción inaugural (queda cubierta por la regla general).

**Non-Goals:**
- Autosave al seleccionar (queda como posible mejora futura).
- Cambiar la agrupación visual por jornadas, el esquema de datos, el scoring o
  el ranking (puntos siguen derivados; un partido sin pick no puntúa).
- Notificar a usuarios del cambio de regla (se comunica fuera de la app).

## Decisions

### D1 — Regla única `now < kickoff_at − 1h`, duplicada TS/SQL como hoy
La constante de 1 hora vive en `lib/domain/jornada.ts` y en la migración 0006
con comentarios cruzados (mismo patrón que la excepción 0004 ↔
`JORNADA_DEADLINE_EXCEPTIONS`). Alternativa rechazada: offset configurable en
`app_settings` — añade lectura de BD a un valor que no se va a cambiar;
"constantes en código" es el patrón del proyecto (ej. premiación).

La regla nueva es siempre igual o más permisiva que la vieja (todo kickoff es
posterior a la medianoche de su jornada), lo que simplifica el despliegue (D5).

### D2 — API de dominio: `isMatchOpen(kickoffAt)` y `matchDeadline(kickoffAt)`
Reemplazan a `isJornadaOpen`/`jornadaDeadline`; `JORNADA_DEADLINE_EXCEPTIONS`
se elimina. Sin capa de deprecación: el monolito es pequeño y todos los call
sites (`page.tsx`, `layout.tsx`, `actions.ts`, `format.ts`) se actualizan en el
mismo change. `toMxDate`/`TIMEZONE` permanecen: la agrupación por jornada sigue
siendo por fecha CDMX. La matemática de fechas se simplifica: `kickoff_at` es
`timestamptz`, el deadline es resta directa de milisegundos.

### D3 — Server Action `savePick(matchId, pick)` reemplaza a `saveJornada`
Valida con zod en la frontera (matchId entero positivo, pick ∈ {H,D,A}),
`requireActiveUser()`, carga el partido por id y verifica
`isMatchOpen(kickoff_at)`; upsert de una sola fila con `updated_at`. RLS sigue
siendo la segunda defensa sin tocar políticas: `is_match_open(match_id)` cambia
solo su cuerpo (D5). El mensaje de rechazo distingue "este partido ya cerró"
(carrera entre render y submit) de cuenta inactiva. Desaparece la validación de
jornada completa y el estado `missing`.

### D4 — UI: cada partido es su propio `<form>` (MatchPickCard)
`jornada-form.tsx` se descompone: el card de partido (radiogroup que ya existe)
se convierte en componente cliente con `useActionState` propio, botón "Guardar"
y estado "✓ Guardado" / "Última modificación" por partido, más su deadline
visible ("Cierra a las HH:MM"). La página renderiza por jornada una mezcla de
cards abiertos (form) y cerrados (`ClosedMatchCard`, ya existe). El chip de
jornada deja de mostrar un deadline único; comunica estado agregado (p. ej.
"N partidos abiertos"). El trabajo visual sigue DESIGN.md con los skills
`impeccable` (diseño/implementación visual) y `ui-ux-pro-max` (patrones,
tipografía y guidelines UX), ambos obligatorios por CLAUDE.md.

### D5 — Despliegue: migración primero, código después, en el mismo release
Migración 0006 (`create or replace function public.is_match_open` con
`now() < m.kickoff_at - interval '1 hour'`): firma intacta → políticas RLS no
se tocan. Como la regla nueva es un superconjunto de la vieja, aplicar la
migración antes del deploy de código es seguro: el dominio viejo sigue siendo
el gate más estricto durante la ventana. Rollback: re-aplicar el cuerpo
anterior de la función y revertir el deploy de Vercel. Todo se valida primero
en local (`supabase db reset` + pruebas manuales) en el branch
`cierre-por-partido`.

### D6 — "Próximo cierre" del banner de pendientes por partido
`nextOpenJornada()` (layout) pasa a buscar el primer partido aún abierto
(mínimo `kickoff_at` con `isMatchOpen`) consultando `kickoff_at` además de
`match_date`. `formatDeadline` pasa a formatear el instante
`matchDeadline(kickoff_at)` en CDMX; muere la rama especial de "medianoche →
23:59 del día anterior".

## Risks / Trade-offs

- [Usuario cambia radios de varios partidos y solo pulsa un botón] → cada card
  es un form independiente: los picks de otros cards no se envían. Mitigación:
  feedback de guardado por card (✓ / última modificación) hace visible qué está
  guardado y qué no; autosave queda anotado como mejora futura.
- [Submit después del cierre (form abierto en otra pestaña)] → doble rechazo
  (dominio + RLS) con mensaje específico de partido cerrado; sin efectos
  parciales porque el upsert es de una fila.
- [Desincronización TS ↔ SQL de la regla] → mismo riesgo que ya existía con la
  excepción; mitigación: comentarios cruzados obligatorios y prueba local de la
  migración antes de producción.
- [Cambio de hábito en caliente: desaparece "Guardar jornada"] → copy claro por
  card y deadline visible por partido; la regla nueva nunca cierra antes que la
  vieja, así que nadie pierde una ventana que antes tenía.
- [Tests de dominio quedan obsoletos] → reescritura completa de
  `jornada.test.ts` hacia `isMatchOpen`/`matchDeadline` (bordes exactos en
  kickoff − 1h ± 1s).

## Open Questions

- Ninguna bloqueante. (Si en pruebas locales el guardado por card se siente
  torpe en móvil, evaluar autosave en un change posterior, no en este.)
