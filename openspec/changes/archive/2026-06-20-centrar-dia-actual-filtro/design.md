## Context

`components/day-filter.tsx` es un componente cliente (`"use client"`) que renderiza
una tira horizontal de días dentro de un contenedor `overflow-x-auto`. En desktop
las celdas son `flex-1` y llenan el ancho (sin desbordamiento); en móvil el piso
`min-w-14` (56px) las hace desbordar y la tira se vuelve scrollable. El contenedor
siempre arranca en `scrollLeft = 0`, así que cuando el día activo (hoy por defecto)
cae a la derecha del área visible, queda oculto hasta que el usuario hace scroll.

El estado de selección vive en la URL y se resuelve en servidor; el cliente solo
navega. La selección efectiva llega por `selected` y se refleja en el estado local
`active` (línea 50). Ya existe un efecto que re-sincroniza `active` cuando una
navegación externa cambia la selección (líneas 56-61).

## Goals / Non-Goals

**Goals:**
- Centrar la celda activa dentro de la tira al montar, sin acción del usuario.
- Si la selección es "Todos", centrar la celda de hoy.
- No reposicionar cuando el usuario toca una celda dentro de la tira.
- No afectar el scroll vertical de la página.
- No introducir parpadeo visible (posicionar antes del primer paint).

**Non-Goals:**
- Animar el desplazamiento (no es necesario; el objetivo es la posición inicial).
- Cambiar el modelo de selección, la preselección de hoy o el marcador de día actual.
- Reposicionar de forma continua mientras el usuario navega entre días tocando.

## Decisions

### D1 — Cálculo manual de `scrollLeft` en vez de `Element.scrollIntoView`

Se ajusta directamente `container.scrollLeft` con un cálculo que centra la celda:

```
scrollLeft = celda.offsetLeft - (container.clientWidth - celda.clientWidth) / 2
```

El navegador acota el valor al rango `[0, scrollWidth - clientWidth]`, así que una
celda en un extremo queda completamente visible pegada a su borde (cubre el escenario
"día en un extremo") sin código extra.

**Por qué no `scrollIntoView({ inline: "center", block: "nearest" })`:** busca el
ancestro scrollable más cercano en ambos ejes y puede desplazar verticalmente la
página. El resto del código cuida explícitamente no provocar saltos de scroll
(`router.replace(..., { scroll: false })`). El cálculo manual toca solo el eje
horizontal del contenedor, cumpliendo el requisito de no mover el scroll vertical.

### D2 — `useLayoutEffect` para posicionar antes del paint

El posicionamiento corre en `useLayoutEffect` (no `useEffect`) para fijar `scrollLeft`
antes de que el navegador pinte, evitando el parpadeo "ver 0 → salta al centro".
Como el componente ya es `"use client"`, el efecto solo corre en el navegador; en
SSR no se ejecuta y la tira se entrega en `scrollLeft = 0` (estado neutro hasta la
hidratación).

**Alternativa considerada:** `useEffect`. Más simple pero deja un frame visible con
la tira a la izquierda antes de saltar — justo la experiencia que se quiere evitar.

### D3 — Refs: contenedor + celda activa

- Un `ref` al `<div role="radiogroup">` (el contenedor scrollable).
- Un `ref` a la celda objetivo, asignado con un callback en el `.map` cuando la
  celda es la activa (`isSelected`), o la de hoy (`isToday`) cuando `active === null`.

No se necesitan IDs ni `querySelector`: el callback ref captura el nodo correcto en
el render. Si la celda objetivo no existe (caso degenerado: hoy sin partidos y
"Todos" activo), el efecto no hace nada.

### D4 — Disparar al montar y en re-sincronización externa, no en taps

El centrado se ejecuta:
- Al montar.
- Cuando `active` cambia por navegación externa (el mismo disparador que ya
  re-sincroniza `active` en líneas 56-61).

NO se ejecuta cuando el usuario toca una celda (`select()`), porque tocar implica
que la celda ya estaba visible y reposicionar se sentiría como un tirón. Para
distinguir un cambio "externo" de uno "propio" se reutiliza la señal existente
`lastSent` (que ya separa navegaciones propias de externas). En la práctica el
efecto de centrado se engancha al mismo punto donde hoy se hace
`setActive(selected[0] ?? null)` por cambio externo, más el montaje inicial.

## Risks / Trade-offs

- **El layout aún no está medido al correr el efecto** → `useLayoutEffect` corre
  tras el commit del DOM, cuando `offsetLeft`/`clientWidth` ya son válidos; el
  cálculo es seguro. En desktop sin overflow, `scrollWidth === clientWidth` y el
  valor acotado queda en 0 (inocuo).
- **Doble fuente de la celda objetivo (seleccionada vs hoy)** → se resuelve con una
  única prioridad clara: seleccionada primero, hoy como fallback solo cuando
  `active === null`. Un único callback ref evita ambigüedad.
- **Reposicionar en re-sincronización externa podría sorprender** → es el
  comportamiento deseado (back/forward o limpiar búsqueda de equipo debe volver a
  mostrar el día restaurado); queda acotado a cambios que NO originó la propia tira.

## Migration Plan

Cambio puramente aditivo de cliente en un componente. Sin migración de datos ni de
API. Rollback = revertir el commit.
