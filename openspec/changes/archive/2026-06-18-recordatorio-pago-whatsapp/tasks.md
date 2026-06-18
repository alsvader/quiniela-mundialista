## 1. Datos y configuración (backend)

- [x] 1.1 Migración Supabase: insertar llaves `bank_name`, `bank_clabe`, `bank_holder`, `payment_amount` en `app_settings` con default `''` (idempotente, `on conflict do nothing`)
- [x] 1.2 `lib/schemas.ts`: schema zod `paymentInfoSchema` (banco, CLABE normalizada a dígitos, titular, monto numérico ≥ 0; campos vacíos permitidos)
- [x] 1.3 `app/admin/actions.ts`: Server Action `savePaymentInfo` (gemela de `saveWhatsapp`: guard admin, `safeParse`, update en `app_settings`, `revalidatePath`)
- [x] 1.4 `lib/queries.ts`: getter `getPaymentInfo()` que lee las 4 llaves de `app_settings` y devuelve `{ bankName, clabe, holder, amount }`

## 2. Lógica del deep link

- [x] 2.1 `lib/whatsapp.ts`: función `buildPaymentReminderLink(userPhone, { name }, { bankName, clabe, holder, amount })` que devuelve `null` si falta teléfono o cualquier dato de transferencia, y el `wa.me?text=` con la plantilla de D6 en caso contrario (sin tocar `buildWhatsappLink`)

## 3. UI de configuración

- [x] 3.1 Invocar `impeccable` / `ui-ux-pro-max` para el diseño de la sección "Datos para transferencia" respetando `DESIGN.md`
- [x] 3.2 Nuevo form client component `payment-form.tsx` en `app/admin/configuracion/` (patrón de `whatsapp-form.tsx`: `useActionState` + `Field` + `SubmitButton`)
- [x] 3.3 `app/admin/configuracion/page.tsx`: cargar `getPaymentInfo()` y renderizar la sección "Datos para transferencia" debajo de la de WhatsApp

## 4. UI del recordatorio en /admin/usuarios

- [x] 4.1 Invocar `impeccable` / `ui-ux-pro-max` para el botón "Recordar pago" (verde WhatsApp dentro de la paleta, estado deshabilitado con hint)
- [x] 4.2 Nuevo componente de botón/enlace: `<a>` deep link cuando hay link, o botón deshabilitado con `title` (falta de datos de pago / de teléfono) cuando es `null`
- [x] 4.3 `app/admin/usuarios/page.tsx`: cargar `getPaymentInfo()` junto a los perfiles, armar el link server-side por fila y renderizar el botón solo en filas `pending`, junto a "Activar"

## 5. Verificación

- [x] 5.1 Verificar: con datos de pago completos, el botón abre WhatsApp al teléfono del usuario con bienvenida + monto + banco/CLABE/titular prellenados
- [x] 5.2 Verificar: sin datos de pago o sin teléfono, el botón aparece deshabilitado con el aviso correcto; no se muestra en filas `active`/`disabled`
- [x] 5.3 Verificar que la CLABE no aparece en el HTML de páginas no admin (solo se arma en `/admin/usuarios`)
- [x] 5.4 `openspec validate recordatorio-pago-whatsapp` sin errores
