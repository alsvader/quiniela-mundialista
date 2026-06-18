## ADDED Requirements

### Requirement: Recordatorio de pago iniciado por el administrador
El sistema SHALL ofrecer al administrador, para cada cuenta `pendiente`, un enlace deep link de WhatsApp (`wa.me`) dirigido al **teléfono del usuario** con un mensaje prellenado que incluya: un saludo de bienvenida personalizado con el nombre del usuario, el recordatorio de que debe realizar el pago para activar su cuenta, el monto del boleto y los datos de transferencia (banco, CLABE y titular) configurados por el administrador. El enlace MUST construirse en el servidor dentro del panel admin, de modo que los datos de transferencia nunca se expongan a usuarios no administradores. El mensaje se envía manualmente desde la app de WhatsApp del administrador (no hay envío automático).

#### Scenario: Mensaje de recordatorio prellenado
- **WHEN** el administrador pulsa el botón de recordatorio de pago en una cuenta `pendiente` con teléfono y datos de transferencia configurados
- **THEN** se abre WhatsApp dirigido al teléfono del usuario con un mensaje que contiene la bienvenida con su nombre, el recordatorio de pago, el monto y los datos de transferencia (banco, CLABE y titular)

#### Scenario: Faltan datos de transferencia
- **WHEN** el administrador abre la gestión de usuarios sin haber configurado banco, CLABE, titular o monto
- **THEN** el botón de recordatorio de pago se muestra deshabilitado con un aviso de que debe completar los datos de transferencia en configuración

#### Scenario: Usuario sin teléfono
- **WHEN** una cuenta `pendiente` no tiene teléfono registrado
- **THEN** el botón de recordatorio de pago se muestra deshabilitado con un aviso de que el usuario no tiene teléfono

#### Scenario: Solo cuentas pendientes
- **WHEN** el administrador consulta una cuenta `activa` o `desactivada`
- **THEN** el botón de recordatorio de pago no se muestra para esa cuenta
