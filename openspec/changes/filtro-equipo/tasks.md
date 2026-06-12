# Tasks — filtro-equipo

## 1. Dominio

- [x] 1.1 Crear helper puro en `lib/domain/` (`normalizeTeamText` +
      `matchesTeam(query, match)`): trim → minúsculas → NFD → strip de
      diacríticos; substring contra local o visitante; query vacío = sin
      filtro
- [x] 1.2 Tests del helper: acentos ("mexico"→México, "tunez"→Túnez),
      substring ("corea"→Corea del Sur, "unidos"→Estados Unidos), match de
      visitante, mayúsculas, query vacío/espacios

## 2. UI — usar skills `impeccable` + `ui-ux-pro-max` y DESIGN.md

- [x] 2.1 Crear `team-filter.tsx` (cliente): input con `defaultValue` desde
      la URL, debounce ~300 ms → `router.replace('?equipo=…', {scroll:
      false})` con `useTransition`, ✕ visible solo con texto (limpia y
      navega a `/partidos`), label `sr-only`, estilo de inputs del design
      system (`bg-white/6`, borde inferior cian con glow al focus), ancho
      completo móvil / `max-w-sm` desktop
- [x] 2.2 `page.tsx`: leer `searchParams` (async), filtrar el Map de
      jornadas con `matchesTeam`, omitir jornadas vacías; orden de página:
      header → vivos (sin filtrar) → `TeamFilter` → contador → jornadas
- [x] 2.3 Contador "N partidos de «X»" con `aria-live="polite"` (solo con
      filtro activo) y estado vacío neutro con query citado + botón
      "Limpiar filtro"

## 3. Verificación local y despliegue

- [x] 3.1 `npm run build` + tests verdes; prueba manual local: filtrar con y
      sin acentos, visitante, vivo exento, estado vacío + limpiar, URL
      compartida llega filtrada, móvil 390px
- [ ] 3.2 Producción: merge y deploy (sin migraciones); verificar el filtro
      en producción
