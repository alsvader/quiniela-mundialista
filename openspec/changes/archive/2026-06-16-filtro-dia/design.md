# Design — filtro-dia

## Context

`/partidos` (participante) y `/admin/partidos` (admin) son páginas que agrupan
los partidos por fecha vía `getJornadas()` → `Map<fecha, Match[]>` (ordenado
`match_date` asc, `kickoff_at` asc). La participante ya es Server Component con
`searchParams` async, filtro de equipo (`?equipo=`) y `LiveRefresher` que hace
`router.refresh()` cada ~60 s preservando la URL. La admin es Server Component
**sin** `searchParams` ni ningún filtro. La zona horaria canónica del producto
es `America/Mexico_City`. Las decisiones de UX quedaron cerradas en exploración:
tira de fechas reales, default hoy con fallback al próximo, multi-selección con
"Todos", combinación con equipo, vivos exentos, presencia en ambas páginas.

## Goals / Non-Goals

**Goals:**
- Acotar el listado a uno o varios días con una tira tipo calendario, anclada
  al día actual al entrar, y URL compartible.
- Reutilizar una sola pieza cliente y un solo helper de dominio en ambas
  páginas; cero reestructura de las cards.
- Combinar limpiamente con el filtro de equipo existente en participante.

**Non-Goals:**
- Filtro por día de la semana abstracto (todos los martes): se filtra por
  fechas concretas (decisión de exploración).
- Calendario emergente / date-picker: la tira inline cubre el caso.
- Persistir la selección fuera de la URL (cookies/localStorage).
- Filtros adicionales (grupo, sede, estado) — fuera de alcance.

## Decisions

### D1 — Estado en `searchParams`, filtrado en servidor
Ambas páginas leen `searchParams.dia` (prop async, Next 16) y filtran el `Map`
de jornadas antes de renderizar: solo se emiten las secciones cuyo día está en
la selección efectiva. Conserva "Server Components para lectura", el costo es
nulo con 72 filas, el `router.refresh()` del polling preserva la selección y el
filtro es un link. La admin pasa a `async` y recibe `searchParams`.

### D2 — `dia` como lista de fechas ISO por comas
`?dia=2026-06-16,2026-06-17`. Cada token es una `match_date` (`YYYY-MM-DD`), el
mismo formato que las claves de `getJornadas` — el filtrado es pertenencia a un
`Set<string>`, sin parsear `Date`. Elegido sobre params repetidos (`?dia=…&dia=…`)
por brevedad y porque espeja el estilo de `?equipo=` (un solo param). El parseo
descarta tokens vacíos o que no correspondan a un día real con partidos
(defensivo: la URL nunca rompe el render).

### D3 — Selección efectiva: explícita > default; default = hoy con fallback
Helper puro en `lib/domain/day-filter.ts`:
- `todayInMexicoCity()` → `YYYY-MM-DD` (usa `Intl.DateTimeFormat` con
  `timeZone: America/Mexico_City`, como `lib/format.ts`).
- `defaultSelectedDay(matchDates, today)` → si `today` está entre las fechas con
  partidos lo devuelve; si no, el **primer día futuro** con partidos; si todos
  ya pasaron, `null` (→ se muestran todos, ver D4).
- `resolveSelectedDays(rawParam, matchDates, today)` → resuelve la selección
  efectiva: si el param trae días válidos, esos; si el param está **ausente**,
  `[defaultSelectedDay]`; si el param está **presente pero vacío** (`?dia=`),
  selección vacía = "Todos".
- `filterJornadasByDays(jornadas, selectedDays)` → si la selección está vacía,
  devuelve el `Map` completo; si no, solo las fechas seleccionadas.

La distinción "param ausente" (aplica default hoy) vs "param presente vacío"
(muestra todos) es lo que hace que **"Todos" sea un estado representable en la
URL** sin recurrir a un valor centinela: navegar a `/partidos` muestra hoy;
`/partidos?dia=` (o el botón "Todos") muestra el calendario completo.

### D4 — `DayFilter` (cliente): toggles → URL, reutilizable
Único componente cliente nuevo. Recibe por props la lista de días con partidos
(`{ date, label }[]` ya formateados en servidor con `America/Mexico_City`), el
`today`, y la ruta base (`/partidos` o `/admin/partidos`) para construir URLs
preservando `equipo` cuando exista. Sin debounce (son toggles, no texto):
`router.replace(url, { scroll: false })` dentro de `useTransition`. Render:
celda inicial **"Todos"** (activa cuando la selección está vacía) seguida de una
celda por día (abreviatura `dom`…`sáb` + número). "Hoy" lleva un marcador (punto/
anillo) independiente del estado seleccionado. Tira con scroll horizontal en
móvil. Estilo del design system (vocabulario de chips existente); UI con skills
`impeccable` + `ui-ux-pro-max` y tokens de DESIGN.md.

Toggle: al alternar un día se recalcula la lista, se ordena y se serializa al
param; deseleccionar el último día deja la selección vacía → "Todos". "Todos"
navega a la base sin `dia` salvo… ver D5.

### D5 — Equipo y día NO se combinan: buscar equipo pausa el día (solo participante)
Decisión revisada tras verificar en navegador. La combinación estricta (equipo
Y día) tiene un fallo de UX: con cualquier día puesto, buscar "Brasil" para ver
su próximo juego no encontraría nada si Brasil no juega ese día — justo lo que
el usuario busca queda oculto. Por eso **la búsqueda por equipo siempre abarca
todo el torneo** y, mientras está activa, el filtro de día se **pausa**.

En servidor (`page.tsx`): `effectiveDays = teamSearching ? [] : daySelection`;
el listado se filtra por `effectiveDays` y luego por equipo. La selección de día
real (`daySelection`) se sigue calculando y se pasa al `DayFilter` junto con
`disabled={teamSearching}`: la tira se muestra atenuada y no interactiva, pero
conserva visualmente la selección. El `TeamFilter` preserva `dia` en la URL, así
que limpiar el equipo restaura el día sin que el usuario lo vuelva a elegir.
Admin no tiene filtro de equipo: solo `dia`, siempre activo.

### D6 — Vivos exentos, jerarquía de página
Igual que el filtro de equipo: las cards en vivo del header de participante se
calculan sin filtrar. Orden en participante: header → vivos → fila de filtros
(`TeamFilter` + `DayFilter`) → contador → jornadas filtradas. En admin:
header → `DayFilter` → listado filtrado. `DayFilter` se envuelve en `Suspense`
(usa `useSearchParams`); admin pasa a tener ese `Suspense`.

## Risks / Trade-offs

- [Default "hoy" oculta el resto al entrar] → es la decisión de producto; "Todos"
  y la tira completa siempre están a un toque, y "hoy" queda marcado para
  orientarse.
- [Hoy sin partidos deja vista vacía] → mitigado por el fallback al próximo día
  con partidos (D3); si todos pasaron, se muestran todos.
- [Drift de fecha servidor/cliente] → "today" y las labels se calculan en
  servidor con `America/Mexico_City` y se pasan como props; el cliente no deriva
  fechas, solo alterna tokens. Sin riesgo de hidratación.
- [Param `dia` manipulado en la URL] → parseo defensivo contra el set real de
  fechas; tokens inválidos se descartan, el filtro nunca lanza.
- [Admin pasa a dinámica por `searchParams`] → ya era data dinámica (lee
  Supabase con sesión); sin impacto de caché real.

## Migration Plan

Sin migraciones ni cambios de datos: solo lectura y presentación. Branch
`filtro-dia`, pruebas locales, deploy de código. Rollback = revertir el deploy.

## Open Questions

- Ninguna bloqueante.
