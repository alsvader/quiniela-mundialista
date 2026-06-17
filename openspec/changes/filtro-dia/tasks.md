# Tasks — filtro-dia

## 1. Dominio

- [x] 1.1 Crear `lib/domain/day-filter.ts` (funciones puras): `todayInMexicoCity()`
      (`YYYY-MM-DD` vía `Intl.DateTimeFormat` con `timeZone: America/Mexico_City`),
      `defaultSelectedDay(matchDates, today)` (hoy si tiene partidos → próximo día
      futuro con partidos → `null`), `parseDiaParam(raw, matchDates)` (split por
      comas, descarta tokens vacíos o ausentes del set real),
      `resolveSelectedDays(rawParam, matchDates, today)` (param ausente = default;
      param presente vacío = "Todos"; tokens válidos = esos),
      `filterJornadasByDays(jornadas, selectedDays)` (selección vacía = Map
      completo)
- [x] 1.2 Tests del helper: hoy con/sin partidos y fallback al próximo, todos los
      días pasados → null/todos, param ausente vs `?dia=` vacío vs lista válida,
      tokens inválidos descartados, multi-día, filtrado del Map

## 2. UI — usar skills `impeccable` + `ui-ux-pro-max` y DESIGN.md

- [x] 2.1 Crear `day-filter.tsx` (cliente, reutilizable): props con la lista de
      días `{ date, label }` (formateados en servidor), `today`, ruta base y
      flag de si preserva `equipo`; celda "Todos" + una celda por día (abrev.
      `dom`…`sáb` + número), "hoy" marcado independiente del seleccionado, toggle
      multi-selección → `router.replace(url, {scroll:false})` con `useTransition`
      (sin debounce), preserva `equipo` al navegar; tira con scroll horizontal en
      móvil, estilo de chips del design system
- [x] 2.2 `app/(participante)/partidos/page.tsx`: leer `dia` de `searchParams`,
      resolver selección de día; buscar equipo **pausa** el día
      (`effectiveDays = teamSearching ? [] : daySelection`), `DayFilter` recibe
      `disabled={teamSearching}` y conserva la selección; orden: header → vivos
      (sin filtrar) → `TeamFilter` + `DayFilter` (en `Suspense`) → contador →
      jornadas; `TeamFilter` preserva `dia` al navegar (restaura el día al limpiar)
- [x] 2.3 `app/admin/partidos/page.tsx`: pasar a `async` con `searchParams`,
      envolver `DayFilter` en `Suspense`, filtrar el listado por día (sin filtro
      de equipo)

## 3. Verificación local y despliegue

- [x] 3.1 `npm run build` + tests verdes (54); verificación en navegador
      (Playwright) en ambas páginas: hoy preseleccionado y marcado, multi-selección
      (?dia=...), "Todos" (?dia= vacío), buscar equipo pausa el día y abarca todo el
      torneo (tira deshabilitada; limpiar restaura el día), móvil 390px con scroll
- [ ] 3.2 Producción: merge y deploy (sin migraciones); verificar el filtro de día
      en producción en `/partidos` y `/admin/partidos`
