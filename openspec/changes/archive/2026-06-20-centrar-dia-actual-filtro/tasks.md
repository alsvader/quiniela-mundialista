## 1. Refs y selección de la celda objetivo

- [x] 1.1 Agregar un `useRef` al contenedor scrollable (`<div role="radiogroup">`) en `components/day-filter.tsx`.
- [x] 1.2 Agregar un `useRef` para la celda objetivo y asignarlo con un callback ref en el `.map`: cuando la celda es la activa (`isSelected`) o, si `active === null`, cuando es la de hoy (`isToday`).

## 2. Centrado de scroll

- [x] 2.1 Implementar un helper que calcule y fije `container.scrollLeft = celda.offsetLeft - (container.clientWidth - celda.clientWidth) / 2` (el navegador acota a `[0, scrollWidth - clientWidth]`), sin tocar el scroll vertical.
- [x] 2.2 Llamar al helper desde un `useLayoutEffect` al montar, posicionando antes del primer paint.
- [x] 2.3 Disparar el centrado también en la re-sincronización por navegación externa (junto al `setActive(selected[0] ?? null)` existente, líneas 56-61), y NO en `select()` (taps del usuario).
- [x] 2.4 Manejar el caso degenerado: si no hay celda objetivo (p. ej. "Todos" activo y hoy sin partidos), el efecto no hace nada.

## 3. Verificación

- [x] 3.1 Móvil con hoy fuera de los primeros días: la celda de hoy aparece centrada al cargar, sin scroll manual.
- [x] 3.2 URL con día seleccionado lejano: esa celda aparece centrada o, en un extremo, completamente visible sin scroll vacío.
- [x] 3.3 Tocar una celda visible no reajusta el scroll de la tira.
- [x] 3.4 El scroll vertical de la página no cambia al montar la tira; desktop (sin overflow) se mantiene en `scrollLeft = 0`.
- [x] 3.5 Verificar que aplica igual en `/partidos` (participante) y en el panel admin `/admin/partidos`.
