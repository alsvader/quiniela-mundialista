# Spec: account-activation

## ADDED Requirements

### Requirement: Estados del usuario
El sistema SHALL manejar tres estados de cuenta: `pendiente` (recién registrada, sin pago validado), `activo` (pago validado por el admin) y `desactivado` (suspendida por el admin). Solo el estado `activo` permite guardar pronósticos y aparecer en el ranking.

#### Scenario: Estado inicial al registrarse
- **WHEN** un usuario completa su registro
- **THEN** su cuenta queda en estado `pendiente`

#### Scenario: Pendiente no puede guardar pronósticos
- **WHEN** un usuario `pendiente` intenta guardar pronósticos de una jornada abierta
- **THEN** el sistema rechaza el guardado indicando que la cuenta debe ser activada

#### Scenario: Desactivado no puede guardar pronósticos
- **WHEN** un usuario `desactivado` intenta guardar pronósticos de una jornada abierta
- **THEN** el sistema rechaza el guardado indicando que la cuenta está desactivada

### Requirement: Aviso de pago pendiente
El sistema SHALL mostrar al usuario `pendiente`, en cada inicio de sesión, un modal informativo y un banner persistente en la parte superior que expliquen que debe validar su pago para participar, advirtiendo explícitamente que las jornadas cerradas antes de la activación se pierden sin recurso e indicando la fecha límite de la próxima jornada.

#### Scenario: Modal al iniciar sesión
- **WHEN** un usuario `pendiente` inicia sesión
- **THEN** se muestra un modal informativo con las instrucciones de pago y la advertencia de pérdida de jornadas cerradas

#### Scenario: Banner persistente
- **WHEN** un usuario `pendiente` navega por cualquier página autenticada
- **THEN** se muestra un banner fijo en la parte superior con el aviso de pago pendiente y el acceso al contacto por WhatsApp

#### Scenario: Banner desaparece al activarse
- **WHEN** el administrador activa la cuenta y el usuario recarga o navega
- **THEN** el modal y el banner de pago pendiente dejan de mostrarse

### Requirement: Contacto con el administrador vía WhatsApp
El sistema SHALL ofrecer al usuario `pendiente` un enlace deep link de WhatsApp (`wa.me`) hacia el número configurado por el administrador, con un mensaje prellenado que incluya nombre, correo electrónico y teléfono del usuario.

#### Scenario: Mensaje prellenado
- **WHEN** un usuario `pendiente` pulsa el botón de contacto por WhatsApp
- **THEN** se abre WhatsApp dirigido al número configurado con un mensaje que contiene su nombre, correo y teléfono

### Requirement: Activación y desactivación manual
El administrador SHALL poder activar una cuenta `pendiente` o `desactivada` y desactivar una cuenta `activa`. La desactivación MUST ser reversible: los pronósticos y datos del usuario se conservan intactos.

#### Scenario: Activación tras validar pago
- **WHEN** el administrador activa una cuenta `pendiente`
- **THEN** la cuenta pasa a estado `activo` y el usuario puede guardar pronósticos de jornadas abiertas

#### Scenario: Reactivación conserva datos
- **WHEN** el administrador reactiva una cuenta `desactivada`
- **THEN** la cuenta vuelve a `activo` con todos sus pronósticos y puntos previos intactos

#### Scenario: Jornadas cerradas antes de la activación
- **WHEN** una cuenta es activada después del cierre de una o más jornadas
- **THEN** el usuario no puede capturar pronósticos de esas jornadas cerradas y no obtiene puntos por ellas
