## Why

Al arrancar la fase de eliminatoria, los participantes que ya pagaron esa temporada
deben acordarse de capturar su pronóstico, recordando que el cierre es por partido
(hasta una hora antes de cada kickoff). Hoy el panel solo ofrece el recordatorio de
**pago** (admin → usuario que NO participa). Falta el sentido complementario: avisar
del inicio de la fase a quien SÍ participa, sin escribir el mensaje a mano.

## What Changes

- Nuevo botón "Recordar eliminatoria" (estilo WhatsApp) en cada fila de usuario con
  participación **activa en `eliminatoria`** y cuenta no desactivada en `/admin/usuarios`.
  Abre WhatsApp dirigido al teléfono del usuario con un mensaje prellenado: aviso de
  inicio de la fase, regla de cierre (una hora antes de cada partido), el próximo
  partido de eliminatoria todavía abierto (equipos y hora de cierre) y el enlace a la
  página de pronósticos.
- El botón se deshabilita con un aviso cuando falta el teléfono del usuario o no hay un
  próximo partido de eliminatoria abierto.
- El próximo partido y la fecha de cierre se calculan server-side en la página admin
  (ya protegida por `requireAdminPage`).

Es el espejo de `recordatorio-pago-whatsapp` para el sentido contrario (participante,
no pendiente). Sin cambios de alcance fuera de V1: sigue sin pasarela de pagos ni envío
automático; el deep link `wa.me` abre WhatsApp para que el admin envíe manualmente.

## Capabilities

### New Capabilities
<!-- Ninguna capability nueva: el comportamiento extiende capabilities existentes. -->

### Modified Capabilities
- `admin-panel`: la gestión de usuarios incorpora la acción de recordatorio del inicio
  de la fase de eliminatoria (admin → participante) vía deep link de WhatsApp con aviso
  de inicio, regla de cierre, próximo partido y enlace a pronósticos prellenados.

## Impact

- **UI**: `app/admin/usuarios/page.tsx` (nueva acción en la columna), nuevo componente
  `eliminatoria-reminder-button.tsx` (hermano visual de `payment-reminder-button.tsx`).
  Trabajo visual con `impeccable` / `ui-ux-pro-max`, reutilizando tokens de `DESIGN.md`.
- **Lógica**: nueva función `buildEliminatoriaReminderLink` en `lib/whatsapp.ts` (las
  existentes se conservan); nuevo getter `getNextEliminatoriaMatch()` en `lib/queries.ts`.
- **Datos**: ninguno nuevo; se lee `matches` (próximo partido de eliminatoria abierto)
  y `participaciones` (ya consultadas en la página). Sin cambios de RLS ni migraciones.
- **Dependencias**: ninguna nueva.
