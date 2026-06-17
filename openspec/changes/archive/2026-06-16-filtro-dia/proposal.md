# Filtro por día en /partidos y /admin/partidos

## Why

Con 72 partidos repartidos en ~17 días que cruzan tres semanas, "qué se juega
hoy" se pierde dentro de un listado largo que hay que scrollear entero. Una
tira de fechas con estética de calendario, anclada al día actual al entrar,
deja a la vista solo la jornada relevante sin tocar las cards — y como vive en
la URL, "los partidos del 16 de junio" se vuelve un link compartible.

## What Changes

- Tira horizontal de **fechas reales** (no días de la semana abstractos) sobre
  el listado, una celda por cada día con partidos (las claves de
  `getJornadas`). Cada celda muestra la abreviatura del día (dom…sáb) y el
  número; "hoy" queda marcado visualmente aunque no esté seleccionado.
- **Selección múltiple por toggle.** Al entrar se preselecciona **hoy**
  (`America/Mexico_City`); si hoy no tiene partidos, cae al **próximo día con
  partidos**. Una celda inicial **"Todos"** limpia la selección y muestra el
  calendario completo; deseleccionar el último día equivale a "Todos".
- Estado en la **URL** como lista por comas (`?dia=2026-06-16,2026-06-17`),
  consultable, compartible y preservado por el polling en vivo. Client
  component que escribe la URL con `router.replace` + `useTransition` (sin
  debounce: son toggles, no texto).
- La página **filtra en servidor** con `searchParams` (async, Next 16):
  solo se renderizan las secciones de jornada cuyos días están seleccionados;
  sin selección explícita aplica el día por defecto.
- En `/partidos`, buscar un equipo (`?equipo=`) **pausa** el filtro de día: la
  búsqueda abarca todo el torneo (no se acota al día seleccionado) y la tira se
  muestra deshabilitada; al limpiar el equipo, el día seleccionado se restaura.
- En `/admin/partidos`, que hoy no tiene ningún filtro, se añade la misma tira;
  la página pasa a leer `searchParams` y el filtro se envuelve en `Suspense`
  (lo exige `useSearchParams`). Admin no tiene filtro de equipo.
- Las cards en vivo del header de `/partidos` siguen **exentas del filtro**
  ("qué pasa ahora" no se calla por "qué día miro"), consistente con el filtro
  de equipo.
- **Las cards no cambian.** Sin migraciones ni cambios de datos: solo lectura
  y presentación.

## Capabilities

### New Capabilities

(ninguna — se modifica una capacidad existente)

### Modified Capabilities

- `match-schedule`: requirement nuevo "Filtro por día en el calendario"
  (tira de fechas reales, default hoy con fallback al próximo, multi-selección
  con "Todos", combinación con el filtro de equipo, presencia en participante y
  admin, independencia de las cards en vivo, filtro compartible por URL).

## Impact

- `lib/domain/day-filter.ts` (nuevo): funciones puras y testeables — "hoy" en
  `America/Mexico_City`, día por defecto con fallback al próximo, parseo/
  serialización del parámetro `dia`, filtrado de jornadas por conjunto de días.
- `app/(participante)/partidos/page.tsx`: lee `dia` de `searchParams`, lo
  aplica junto a `equipo`, renderiza la tira y respeta el default.
- `app/admin/partidos/page.tsx`: pasa a `async` con `searchParams`, envuelve el
  filtro en `Suspense`, filtra por día.
- Componente nuevo `day-filter.tsx` (cliente: toggles + "Todos" + URL),
  reutilizado por ambas páginas y parametrizado por la ruta base.
- UI con skills `impeccable` + `ui-ux-pro-max` y tokens de DESIGN.md
  (vocabulario de chips/celdas existente).
- Branch `filtro-dia`; pruebas locales antes de producción. Despliegue trivial:
  sin migraciones, solo deploy de código.
