## 1. Implementación

- [x] 1.1 Añadir `overflow-x-clip` al `<div className="flex min-h-dvh flex-col">` root en `app/(participante)/layout.tsx`.
- [x] 1.2 Añadir `overflow-x-clip` al `<div className="flex min-h-dvh flex-col">` root en `app/admin/layout.tsx`.

## 2. Verificación

- [x] 2.1 Móvil: ya no se puede hacer scroll horizontal de la página hacia espacio vacío en `/partidos`.
- [x] 2.2 La tira de días sigue scrolleando su contenido internamente (incluido el centrado inicial y el snap de "Todos").
- [x] 2.3 El nav del header sigue scrolleando sus enlaces y el header sticky se mantiene fijo al hacer scroll vertical.
- [x] 2.4 Verificar lo mismo en el panel admin `/admin/partidos`.
- [x] 2.5 El bleed/glow de la tira no queda recortado en los bordes.