## 1. Lógica del deep link y datos

- [x] 1.1 `lib/queries.ts`: getter `getNextEliminatoriaMatch()` que devuelve el próximo partido de eliminatoria (fase ≠ `group_stage`) todavía ABIERTO (`kickoff > now + CLOSE_BEFORE_KICKOFF_MS`), o `null` si no hay
- [x] 1.2 `lib/whatsapp.ts`: función `buildEliminatoriaReminderLink(userPhone, { name }, nextMatch)` que devuelve `null` si falta teléfono o próximo partido, y el `wa.me?text=` con aviso de inicio, regla de cierre, próximo partido (vía `formatDeadline`) y enlace a `/partidos` en caso contrario (sin tocar las funciones existentes)

## 2. UI del recordatorio en /admin/usuarios

- [x] 2.1 Invocar `impeccable` / `ui-ux-pro-max` para el botón "Recordar eliminatoria" (hermano visual de "Recordar pago": verde WhatsApp de la paleta, estado deshabilitado con hint)
- [x] 2.2 Nuevo componente `eliminatoria-reminder-button.tsx`: `<a>` deep link cuando hay link, o botón deshabilitado con `title` (falta teléfono / sin próximo partido) cuando es `null`
- [x] 2.3 `app/admin/usuarios/page.tsx`: cargar `getNextEliminatoriaMatch()` junto a los perfiles, armar el link server-side por fila y renderizar el botón solo en filas con participación activa en `eliminatoria` y cuenta no desactivada

## 3. Verificación

- [x] 3.1 Verificar: con teléfono y próximo partido abierto, el botón abre WhatsApp al teléfono del usuario con aviso, regla de cierre, próximo partido y enlace prellenados
- [x] 3.2 Verificar: sin teléfono o sin próximo partido de eliminatoria abierto, el botón aparece deshabilitado con el aviso correcto; no se muestra para no participantes de `eliminatoria` ni cuentas desactivadas
- [x] 3.3 `tsc`, `eslint`, `vitest` y `next build` sin errores
- [x] 3.4 `openspec validate recordatorio-eliminatoria-whatsapp` sin errores
