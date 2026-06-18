## Why

Hoy el flujo de WhatsApp es de un solo sentido: el usuario pendiente contacta al admin. El admin no tiene forma rápida de iniciar el contacto desde el panel para dar la bienvenida, recordar el pago y compartir los datos de transferencia. Hacerlo a mano (copiar teléfono, escribir mensaje, pegar banco/CLABE) es lento y propenso a errores, y retrasa la activación de cuentas.

## What Changes

- Nuevo botón "Recordar pago" (estilo WhatsApp) en cada fila de usuario **pendiente** en `/admin/usuarios`, junto al botón "Activar". Abre WhatsApp dirigido al teléfono del usuario con un mensaje prellenado: bienvenida personalizada con su nombre, recordatorio de pago con el monto, y datos de transferencia (banco, CLABE, titular).
- El botón se deshabilita con un aviso cuando falten los datos bancarios o el teléfono del usuario.
- Nueva sección "Datos para transferencia" en `/admin/configuracion` para capturar y editar banco, CLABE, titular y monto del boleto. Se guardan en `app_settings` con el mismo patrón que el número de WhatsApp.
- El mensaje se arma server-side en la página admin (ya protegida por `requireAdminPage`), por lo que la CLABE nunca se expone a no-admins.

Sin cambios de alcance fuera de V1: sigue sin haber pasarela de pagos ni envío automático de mensajes; el deep link `wa.me` abre WhatsApp para que el admin envíe manualmente.

## Capabilities

### New Capabilities
<!-- Ninguna capability nueva: el comportamiento extiende capabilities existentes. -->

### Modified Capabilities
- `account-activation`: nuevo requisito de recordatorio de pago iniciado por el admin (admin → usuario) vía deep link de WhatsApp con bienvenida, monto y datos de transferencia prellenados.
- `admin-panel`: la configuración deja de limitarse al número de WhatsApp e incluye los datos de transferencia (banco, CLABE, titular, monto); la gestión de usuarios incorpora la acción de recordatorio de pago para cuentas pendientes.

## Impact

- **UI**: `app/admin/usuarios/page.tsx` (nueva acción en la columna), nuevo componente de botón/enlace; `app/admin/configuracion/page.tsx` + nuevo form de datos de transferencia. Trabajo visual con `impeccable` / `ui-ux-pro-max`, respetando tokens de `DESIGN.md`.
- **Lógica**: nueva función en `lib/whatsapp.ts` (`buildPaymentReminderLink`, la actual se conserva para el flujo inverso); nueva acción `savePaymentInfo` en `app/admin/actions.ts`; getter de settings en `lib/queries.ts`; schema zod en `lib/schemas.ts`.
- **Datos**: nuevas llaves en `app_settings` (`bank_name`, `bank_clabe`, `bank_holder`, `payment_amount`) con defaults vacíos vía migración Supabase. Sin cambios de RLS (las políticas existentes ya cubren lectura autenticada y escritura admin).
- **Dependencias**: ninguna nueva.
