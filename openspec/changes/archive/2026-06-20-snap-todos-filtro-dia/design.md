## Context

`components/day-filter.tsx` (Tailwind v4.3.0) tiene un contenedor con `snap-x`
(strictness `proximity` por defecto). Las celdas de día llevan `snap-start`, pero
la celda "Todos" (la primera) no. Con scroll-snap por proximidad, al soltar cerca
del extremo izquierdo el navegador imanta al anclaje más cercano —el primer día—
y "Todos" se sale de la vista. No hay forma de dejar "Todos" en reposo.

## Goals / Non-Goals

**Goals:**
- "Todos" se puede dejar visible al hacer scroll hacia la izquierda.
- Mantener el comportamiento de imán en las celdas de día (que se siente bien).

**Non-Goals:**
- Cambiar el modelo de selección, el centrado inicial (fix previo) o el estilo visual.
- Quitar el scroll-snap.

## Decisions

### D1 — Añadir `snap-start` a la celda "Todos"

"Todos" comparte la misma `cellClass` que las celdas de día; solo le falta el
anclaje. Agregar `snap-start` la vuelve un punto de reposo válido y hace que
`scrollLeft = 0` sea una posición estable que la mantiene visible.

**Alternativas consideradas:**
- *Quitar `snap-x`/`snap-start` por completo:* elimina el rebote pero también el
  imán agradable en las celdas de día; es una regresión de UX, no un arreglo.
- *`scroll-padding` / `snap-align` custom:* control fino innecesario para un caso
  que se resuelve con el anclaje que ya usan las demás celdas.

## Risks / Trade-offs

- **¿Interfiere con el centrado inicial del fix previo?** → No. El centrado fija
  `scrollLeft` programáticamente y el snap es `proximity` (solo imanta cerca de un
  anclaje); añadir un anclaje en el extremo izquierdo no afecta posiciones
  centradas lejanas a él.
- **Consistencia visual** → Ninguna; `snap-start` no altera el render, solo el
  comportamiento de reposo del scroll.
