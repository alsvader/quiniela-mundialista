# Tasks — filtro-dia-single

## 1. UI — usar skills `impeccable` + `ui-ux-pro-max` y DESIGN.md

- [x] 1.1 `components/day-filter.tsx`: cambiar la interacción de *toggle*
      (agrega/quita) a *replace* (un día reemplaza al anterior); "Todos" navega a
      `?dia=` y un día navega a `?dia=<día>`; eliminar el manejo de "deseleccionar
      el último = Todos" (ya no hay estado cero)
- [x] 1.2 Accesibilidad de selección única: modelar la tira como
      `role="radiogroup"` con celdas `role="radio"` + `aria-checked` (una sola
      activa) en lugar de `aria-pressed` múltiple; conservar el marcador de "hoy"
      independiente, target táctil ≥44px, relleno cian + glow del activo, scroll
      horizontal en móvil y el estado `disabled` (pausa por búsqueda de equipo)
- [x] 1.3 `lib/domain/day-filter.ts`: sin cambios funcionales (las funciones ya
      operan sobre listas de 0/1 elemento); limpiar comentarios/firmas que asuman
      multi-día si aplica

## 2. Verificación local y despliegue

- [x] 2.1 `npm run build` + tests verdes; prueba manual en `/partidos` y
      `/admin/partidos`: hoy preseleccionado, tocar otro día **cambia** sin pasos
      extra, "Todos" muestra el torneo, URL con un solo `?dia=`, búsqueda de equipo
      pausa la tira y abarca todo, limpiar restaura el día, navegación por teclado
      anuncia selección única, móvil 390px
- [ ] 2.2 Producción: merge y deploy (sin migraciones); verificar el cambio en
      producción
