## Why

En móvil, la tira de días usa scroll-snap (`snap-x`) y cada celda de día es un
punto de anclaje (`snap-start`), pero la celda **"Todos"** no lo es. Al hacer
scroll hacia la izquierda para verla, el navegador imanta al primer día y empuja
"Todos" fuera de la vista: nunca se puede dejar visible en reposo. Es un olvido,
no una decisión —"Todos" comparte la misma estructura que las celdas de día.

## What Changes

- La celda "Todos" gana `snap-start`, igual que las celdas de día, volviéndose
  un punto de anclaje válido. Así el extremo izquierdo (`scrollLeft = 0`) es una
  posición de reposo y "Todos" queda visible al hacer scroll hacia la izquierda.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `match-schedule`: la tira de días gana la garantía de que **toda** celda
  —incluida "Todos"— es un punto de anclaje de scroll, de modo que el usuario
  puede dejarla visible en reposo. No cambia la selección ni el centrado inicial.

## Impact

- `components/day-filter.tsx`: añadir `snap-start` a la celda "Todos".
- Sin cambios de servidor, datos ni dependencias. Una sola clase de Tailwind.
