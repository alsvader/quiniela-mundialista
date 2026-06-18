## ADDED Requirements

### Requirement: Configuración de datos de pago
El administrador SHALL poder consultar y actualizar los datos de transferencia usados en el recordatorio de pago: nombre del banco, CLABE, titular de la cuenta y monto del boleto. Estos datos se conservan junto al número de WhatsApp en la configuración y solo son editables por el administrador.

#### Scenario: Actualizar datos de transferencia
- **WHEN** el administrador guarda banco, CLABE, titular y monto en configuración
- **THEN** los recordatorios de pago generados a partir de ese momento incluyen esos datos

#### Scenario: Datos de pago incompletos
- **WHEN** el administrador guarda la configuración dejando vacío alguno de los datos de transferencia
- **THEN** el sistema acepta el guardado, pero el recordatorio de pago permanece deshabilitado hasta que todos los datos estén completos

## MODIFIED Requirements

### Requirement: Gestión de usuarios
El administrador SHALL poder consultar la lista de usuarios registrados (nombre, alias, correo, teléfono, estado, fecha de registro), activar o desactivar cuentas y enviar un recordatorio de pago por WhatsApp a las cuentas `pendiente`.

#### Scenario: Consulta de registrados
- **WHEN** el administrador abre la sección de usuarios
- **THEN** ve todos los usuarios registrados con sus datos de contacto y estado actual

#### Scenario: Activar usuario
- **WHEN** el administrador activa a un usuario `pendiente`
- **THEN** el estado del usuario cambia a `activo`

#### Scenario: Desactivar usuario
- **WHEN** el administrador desactiva a un usuario `activo`
- **THEN** el estado cambia a `desactivado`, conservando sus datos y pronósticos

#### Scenario: Recordar pago a un usuario pendiente
- **WHEN** el administrador pulsa el recordatorio de pago en la fila de un usuario `pendiente`
- **THEN** se abre WhatsApp dirigido al teléfono del usuario con el mensaje de bienvenida, monto y datos de transferencia prellenados
