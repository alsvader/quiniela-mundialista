# Design — filtro-equipo

## Context

`/partidos` es un Server Component que agrupa 72 partidos en jornadas
(`getJornadas()` → `Map<fecha, Match[]>`), con la fila de vivos arriba del
listado y `LiveRefresher` haciendo `router.refresh()` cada ~60 s cuando hay
partidos en curso. No existe ningún filtro. Las decisiones de UX quedaron
cerradas en exploración (URL, normalización, vivos exentos, estado vacío,
ubicación).

## Goals / Non-Goals

**Goals:**
- Filtrar el listado por nombre de equipo con sensación fluida y URL
  compartible.
- Cero reestructura: la página sigue siendo Server Component; el único
  cliente nuevo es el input.
- Tolerante a acentos/mayúsculas; estado vacío con salida clara.

**Non-Goals:**
- Diccionario de apodos/alias ("Holanda", "EUA") — mejora futura puntual si
  el uso lo pide.
- Filtros adicionales (por grupo, por sede, por estado) — este change es
  solo equipo.
- Autocomplete/sugerencias — el substring sobre 48 nombres no lo necesita.
- Persistir el filtro fuera de la URL (cookies/localStorage).

## Decisions

### D1 — Filtro en `searchParams`, filtrado en servidor
La página lee `searchParams` (prop async en Next 16) y filtra el `Map` de
jornadas antes de renderizar: jornada sin coincidencias no se emite. Con 72
filas el costo es nulo y se conserva la regla "Server Components para
lectura". Bonus operativos: el `router.refresh()` del polling en vivo
preserva la URL (el filtro sobrevive solo) y el filtro es un link.

### D2 — Matching: helper puro `matchesTeam(query, match)` en `lib/`
Normalización compartida `normalizeTeamText`: `trim` → minúsculas → NFD →
strip de diacríticos (`/\p{M}/gu`). Coincide si el query normalizado es
substring del local o del visitante normalizados. Query vacío (tras trim) →
sin filtro. Función pura con tests (acentos, substring, ambos lados, query
vacío). Misma filosofía de normalización que el alias del registro (NFC/
acentos): el proyecto ya normaliza texto en la frontera.

### D3 — `TeamFilter` (cliente): input → URL, sin estado servidor
Único componente cliente nuevo: input controlado con `defaultValue` desde la
URL, debounce ~300 ms, `router.replace('/partidos?equipo=…', {scroll:
false})` dentro de `useTransition` (sin saltos de scroll, con indicador de
pending sutil si aplica). El ✕ limpia y navega a `/partidos`. Estilo del
design system: `bg-white/6`, borde inferior cian 1px con glow al focus
(mismo vocabulario que login/admin), ancho completo en móvil y ~`max-w-sm`
en desktop. Label `sr-only` "Buscar por equipo".

### D4 — Jerarquía de la página: vivos arriba, filtro después
Orden: header (título + bolsa) → fila/card de vivos (exenta del filtro) →
`TeamFilter` → contador "N partidos de «X»" (`aria-live="polite"`, solo
cuando hay filtro activo) → jornadas filtradas. La posición del input
comunica su jurisdicción: lo que está arriba de él no se filtra.

### D5 — Estado vacío neutro con salida
Sin coincidencias → bloque `glass` con "Ningún partido coincide con «xyz»",
sugerencia de revisar el nombre, y botón "Limpiar filtro" (link a
`/partidos`). Tono neutro (no error). Jornadas cerradas que coinciden se
muestran normales con sus cards de solo lectura — filtrar ≠ ocultar lo
jugado.

## Risks / Trade-offs

- [Roundtrip por tecleo] → debounce 300 ms + `useTransition` + payload RSC
  pequeño (72 cards máx.): imperceptible en la práctica; si algún día
  molesta, B (filtrado cliente) sigue disponible sin tocar la semántica de
  URL.
- [Equipos con nombres es-MX no obvios ("Países Bajos")] → decisión
  consciente de no tener alias; los nombres visibles en pantalla educan la
  búsqueda.
- [Query con caracteres raros en la URL] → `encodeURIComponent` al escribir
  y normalización defensiva al leer; el filtro nunca lanza, en el peor caso
  devuelve vacío.

## Open Questions

- Ninguna bloqueante.
