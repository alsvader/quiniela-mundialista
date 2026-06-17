# Filtro por día: un día a la vez (control segmentado)

## Why

El filtro por día se entregó con selección múltiple (toggle): tocar un día lo
**agrega** a los ya seleccionados. Varios participantes lo encontraron confuso
porque la tira *parece* pestañas de calendario (tocar = cambiar) pero *se
comporta* como casillas (tocar = acumular). Comentario textual de un usuario:
«me costó entender que tenía que quitar el día seleccionado para que se quedara
otro día». Cambiar a **un día a la vez** alinea el comportamiento con el modelo
mental esperado y elimina los estados ambiguos.

## What Changes

- **BREAKING (UX):** la tira de días pasa de selección múltiple a **selección
  única**. Tocar un día **reemplaza** la selección actual (ya no hay que
  deseleccionar nada para cambiar de día).
- "Todos" se mantiene como **primera pestaña** (ver torneo completo); deja de
  ser "deseleccionar todo" para ser una opción más del control segmentado.
- Siempre hay **exactamente una** opción activa (un día o "Todos"): desaparece
  el estado "cero días seleccionados".
- El default sigue siendo **hoy** (o el próximo día con partidos) y "hoy" se
  sigue marcando visualmente.
- URL: `?dia=` pasa de lista (`2026-06-16,2026-06-17`) a **un solo valor**
  (`2026-06-16`); ausente = default hoy, presente vacío = "Todos" (sin cambio en
  esa semántica).
- La pausa del filtro durante la búsqueda por equipo se mantiene sin cambios.
- Sin cambios en el listado de tarjetas, en datos ni migraciones.

## Capabilities

### New Capabilities

(ninguna — se modifica una capacidad existente)

### Modified Capabilities

- `match-schedule`: el requirement "Filtro por día en el calendario" cambia de
  selección múltiple a selección única (un día o "Todos" a la vez), con la
  semántica de "Todos", default y URL ajustada en consecuencia.

## Impact

- `components/day-filter.tsx`: reemplazar la lógica de toggle (add/quita) por
  *replace*; semántica de accesibilidad de selección única (radio/pestaña en
  lugar de `aria-pressed` múltiple); se elimina el manejo de "deseleccionar el
  último = Todos".
- `lib/domain/day-filter.ts`: sin cambios funcionales (las funciones ya operan
  sobre listas; ahora la lista trae 0 o 1 elemento); posible limpieza de
  comentarios que mencionan multi-día.
- `app/(participante)/partidos/page.tsx` y `app/admin/partidos/page.tsx`: sin
  cambios (siguen pasando la selección resuelta y `disabled`).
- UI con skills `impeccable` + `ui-ux-pro-max` y tokens de DESIGN.md.
- Branch `filtro-dia-single`; pruebas locales antes de producción. Despliegue
  trivial: sin migraciones, solo deploy de código.
