## Context

La capability `account-activation` ya define el contacto WhatsApp **usuario → admin**: `lib/whatsapp.ts#buildWhatsappLink` arma un deep link `wa.me` hacia el número del admin (guardado en `app_settings.whatsapp_number`) con un mensaje "quiero activar mi cuenta". La configuración admin (`/admin/configuracion`) usa el patrón Server Action (`saveWhatsapp`) + tabla key/value `app_settings` + getter en `lib/queries.ts`, con RLS: lectura para autenticados, escritura para admin.

Este change agrega la dirección inversa **admin → usuario**: desde `/admin/usuarios`, un botón por fila pendiente que abre WhatsApp hacia el teléfono del usuario (`profiles.phone`, 10 dígitos ya capturados en registro) con bienvenida + recordatorio de pago + datos de transferencia. Los datos bancarios no existen hoy en ninguna parte del código.

## Goals / Non-Goals

**Goals:**
- Un clic en `/admin/usuarios` para iniciar el recordatorio, sin copiar/pegar teléfono ni datos bancarios.
- Datos de transferencia editables desde la UI sin redeploy.
- No filtrar la CLABE ni el resto de datos bancarios a usuarios no admin.

**Non-Goals:**
- Envío automático de mensajes (sigue siendo manual vía deep link).
- Pasarela de pagos o validación automática del pago.
- Cambiar el flujo inverso existente (usuario → admin) ni su función.
- Recordatorios para cuentas `activa`/`desactivada`.

## Decisions

### D1: Datos de transferencia en `app_settings` (no hardcode ni env)
Cuatro llaves nuevas en `app_settings`: `bank_name`, `bank_clabe`, `bank_holder`, `payment_amount`, con defaults vacíos vía migración (`insert ... values (...)`), igual que `whatsapp_number`. Editables en `/admin/configuracion`.
- **Por qué**: consistente con el patrón ya probado; editable sin redeploy; no mete datos sensibles en git.
- **Alternativas**: hardcode en `lib/whatsapp.ts` (cambiar de banco exige redeploy, datos en git) y variables de entorno (no editable desde la UI, engorroso en Vercel). Descartadas.

### D2: Nueva función `buildPaymentReminderLink`, sin tocar `buildWhatsappLink`
`lib/whatsapp.ts` gana `buildPaymentReminderLink(userPhone, { name }, { bankName, clabe, holder, amount }): string | null`. Reutiliza la normalización `52` + 10 dígitos. Devuelve `null` si falta el teléfono o cualquier dato de transferencia (el botón usa ese `null` para deshabilitarse).
- **Por qué**: la función actual sirve a un flujo distinto (número admin, mensaje fijo); separar evita un parámetro de "modo" confuso.

### D3: El botón es un `<a>` deep link, no una Server Action
A diferencia de `UserStatusButton` (form + `useActionState` + mutación), el recordatorio no muta estado: es un `<a href={waLink} target="_blank" rel="noopener">`. Si `waLink` es `null`, se renderiza como botón deshabilitado con `title` explicando el motivo (falta de datos de pago o de teléfono).
- **Por qué**: no hay efecto de servidor que ejecutar; un enlace es más simple y accesible.

### D4: Armado server-side en la página admin
`/admin/usuarios/page.tsx` (ya tras `requireAdminPage`) hace fetch de los datos de transferencia junto a los perfiles y arma cada `waLink` en el render del servidor. La CLABE viaja al HTML solo de esa página admin.
- **Por qué**: cumple el requisito de no exponer datos bancarios a no-admin sin depender solo de RLS. Coherente con D12 (lógica/datos sensibles en servidor).

### D5: Validación schema-first del form de pago
Nuevo schema zod en `lib/schemas.ts` para `savePaymentInfo` (nueva Server Action en `app/admin/actions.ts`, gemela de `saveWhatsapp`). CLABE normalizada a dígitos; monto numérico no negativo. Permite guardar campos vacíos (D1) — la completitud se valida en el punto de uso (D2/D3), no en el guardado.

### D6: Plantilla del mensaje
Texto en español, registro cálido pero claro, personalizado con `full_name`:
```
¡Hola {nombre}! 🏆 Te damos la bienvenida a la Quiniela Mundialista.
Para activar tu cuenta realiza tu pago de ${monto} por transferencia:
• Banco: {banco}
• CLABE: {clabe}
• A nombre de: {titular}
Cuando transfieras, mándame tu comprobante por aquí y activo tu cuenta. ¡Suerte! ⚽
```
El texto vive en `lib/whatsapp.ts` y se URL-encodea en el `wa.me?text=`.

## Risks / Trade-offs

- **Fuga de datos bancarios a no-admin** → mitigado por D4 (armado server-side en página admin) + RLS existente (escritura admin, lectura autenticada). La página ya exige `requireAdminPage`.
- **Teléfono inválido o no mexicano** → la heurística `52`+10 dígitos puede fallar para números atípicos; se asume el mismo criterio ya usado por el flujo existente. Si el usuario no tiene teléfono, el botón se deshabilita (D2/D3).
- **CLABE/monto mal capturados** → validación zod en el guardado (D5); el admin ve el texto prellenado antes de enviar manualmente, así que hay una revisión humana implícita.
- **Trabajo de UI** → debe pasar por `impeccable` / `ui-ux-pro-max` y respetar `DESIGN.md` (verde WhatsApp dentro de la paleta existente, no inventar tokens).

## Migration Plan

1. Migración Supabase que inserta las 4 llaves nuevas en `app_settings` con valor `''` (idempotente con `on conflict do nothing`).
2. Desplegar código (config form, getter, función de link, botón). Con defaults vacíos, el botón nace deshabilitado hasta que el admin capture los datos.
3. Rollback: revertir el deploy; las llaves extra en `app_settings` son inertes y pueden quedarse sin efecto.

## Open Questions

- ¿El dato a compartir es CLABE (18 dígitos) o también número de tarjeta/cuenta? Se asume CLABE; si se requiere tarjeta, se añade otra llave (`bank_card`) sin cambiar la arquitectura.
- ¿El monto sale de `payment_amount` configurable o de la constante de premiación ($100 MXN del config de producto)? Se asume configurable para no acoplarlo a la bolsa de premios.
