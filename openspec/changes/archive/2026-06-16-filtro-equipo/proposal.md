# Filtro por equipo en /partidos

## Why

Con 72 partidos en 13 jornadas, encontrar "cuándo juega mi equipo" exige
scrollear toda la página. Un filtro por nombre de equipo acorta el listado a
lo que el participante busca — misma UI, menos cards — y como vive en la URL,
"los partidos de México" se vuelve un link compartible en el grupo.

## What Changes

- Input de búsqueda por equipo entre la fila de partidos en vivo y el listado
  de jornadas (pegado a lo que controla). Client component pequeño: debounce
  ~300 ms → `router.replace('?equipo=…')` con `useTransition`, botón ✕ para
  limpiar visible solo con texto, `defaultValue` desde la URL (un link
  compartido llega con el input lleno).
- La página filtra en servidor con `searchParams` (async, Next 16): partidos
  donde el texto normalizado coincide como substring con el local **o** el
  visitante. Normalización: minúsculas + sin acentos (NFD) + trim; query
  vacío = sin filtro. Sin diccionario de alias (deliberado: "Holanda"/"EUA"
  quedan fuera; el substring sobre el nombre real cubre el resto).
- Jornadas sin coincidencias no se renderizan; contador "N partidos de «X»"
  con `aria-live` discreto sobre el listado filtrado.
- Las cards en vivo del header son independientes del filtro ("qué pasa
  ahora" no se calla por "cuándo juega mi equipo"); el listado sí se filtra
  completo, partido en vivo incluido dentro de su jornada.
- Estado vacío: mensaje neutro citando el query («xyz») + botón "Limpiar
  filtro". Jornadas cerradas que coinciden NO son estado vacío: se muestran
  sus cards con marcador.
- Sin migraciones ni cambios de datos: solo lectura y presentación.

## Capabilities

### New Capabilities

(ninguna — se modifica una capacidad existente)

### Modified Capabilities

- `match-schedule`: requirement nuevo "Filtro por equipo en el calendario"
  (normalización, filtrado por jornadas, independencia de las cards en vivo,
  estado vacío, filtro compartible por URL).

## Impact

- `lib/` helper de normalización/matching (función pura, testeable).
- `app/(participante)/partidos/page.tsx`: lee `searchParams`, filtra
  jornadas, renderiza contador y estado vacío.
- Componente nuevo `team-filter.tsx` (cliente: input + debounce + URL).
- UI con skills `impeccable` + `ui-ux-pro-max` y DESIGN.md (vocabulario de
  inputs existente: `bg-white/6`, borde inferior cian con glow al focus).
- Branch `filtro-equipo`; pruebas locales antes de producción. Despliegue
  trivial: sin migraciones, solo deploy de código.
