## Why

En móvil la tira de días (`day-filter.tsx`) siempre arranca pegada a la izquierda
(`scrollLeft = 0`). Cuando el día seleccionado por defecto —hoy— cae fuera de los
primeros días visibles, queda oculto a la derecha y el usuario tiene que hacer
scroll manual para encontrarlo. La selección efectiva existe, pero no se ve: el
calendario aparenta no tener nada destacado al abrir.

## What Changes

- Al montar, la tira de días posiciona su scroll horizontal para que la celda
  activa quede **centrada** (o, si no cabe centrada por estar en un extremo,
  al menos completamente visible).
- La celda objetivo es la **seleccionada**; si la selección es "Todos"
  (sin día), la celda objetivo es la de **hoy**.
- El centrado ocurre solo al montar y al re-sincronizar por navegación externa
  (back/forward), **no** en cada toque del usuario dentro de la tira (tocar una
  celda ya visible no debe "patear" el scroll).
- El reposicionamiento afecta únicamente el scroll horizontal del propio
  contenedor; nunca mueve el scroll vertical de la página.
- En desktop, donde las celdas llenan el ancho y no hay desbordamiento, el
  comportamiento es inocuo (el scroll se queda en 0).

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `match-schedule`: la tira de días gana un requisito sobre la **posición de
  scroll inicial** (centrar la celda activa / hoy al cargar). El comportamiento
  de selección, preselección de hoy y marcador de día actual no cambia.

## Impact

- `components/day-filter.tsx`: agregar un `ref` al contenedor scrollable y a la
  celda activa, y un efecto de layout que ajusta `scrollLeft` al montar y al
  cambiar la selección por navegación externa.
- Sin cambios de servidor, datos, ni dependencias nuevas. Solo lógica de cliente
  en un componente ya marcado `"use client"`.
