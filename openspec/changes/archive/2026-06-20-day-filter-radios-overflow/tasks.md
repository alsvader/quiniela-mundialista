## 1. Implementación

- [x] 1.1 Añadir `relative` al inicio de la cadena de clases en `cellClass` (`components/day-filter.tsx`), de modo que cada celda contenga su radio `sr-only`.

## 2. Verificación

- [x] 2.1 Medir en móvil (viewport ~390): `html.scrollWidth` iguala el viewport (sin overflow horizontal de página) en `/partidos` y `/admin/partidos`.
- [x] 2.2 La tira sigue scrolleando internamente; el centrado inicial y el snap de "Todos" se conservan.
- [x] 2.3 Los radios siguen ocultos visualmente y la selección por teclado/lector de pantalla funciona; el anillo de foco se refleja en la celda.