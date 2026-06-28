# account-activation Specification

## Purpose

Ciclo de vida de la cuenta del participante (pendiente, activo, desactivado), avisos de pago pendiente, contacto con el administrador vía WhatsApp y activación/desactivación manual por el administrador.

## Requirements

### Requirement: Estados del usuario
El sistema SHALL manejar tres estados de cuenta: `pendiente` (recién registrada, sin
participación confirmada), `activo` (cuenta habilitada) y `desactivado` (cuenta
suspendida por el admin). El estado de cuenta describe el ciclo de vida del registro;
el permiso para **guardar pronósticos y aparecer en el ranking de una temporada** se
deriva de la participación `activo` del usuario en esa temporada, no del estado de
cuenta. Una cuenta `desactivado` MUST NOT poder guardar pronósticos en ninguna
temporada.

#### Scenario: Estado inicial al registrarse
- **WHEN** un usuario completa su registro
- **THEN** su cuenta queda en estado `pendiente` y sin participación en ninguna temporada

#### Scenario: Sin participación no puede guardar pronósticos
- **WHEN** un usuario sin participación confirmada en la temporada de un partido intenta guardar su pronóstico
- **THEN** el sistema rechaza el guardado indicando que debe pagar/activar esa temporada

#### Scenario: Desactivado no puede guardar pronósticos
- **WHEN** una cuenta `desactivado` intenta guardar pronósticos de cualquier partido abierto
- **THEN** el sistema rechaza el guardado indicando que la cuenta está desactivada

### Requirement: Aviso de pago pendiente
El sistema SHALL mostrar a quien no participa en la temporada activa (`fase_activa`),
en cada inicio de sesión, un modal informativo y un banner persistente en la parte
superior que expliquen que debe validar su pago para participar **en esa temporada**,
nombrándola, advirtiendo explícitamente que los partidos cerrados antes de la
confirmación se pierden sin recurso e indicando la fecha límite del próximo partido
abierto de esa temporada.

#### Scenario: Modal al iniciar sesión
- **WHEN** un usuario que no participa en la temporada activa inicia sesión
- **THEN** se muestra un modal informativo con las instrucciones de pago de esa temporada y la advertencia de pérdida de partidos cerrados

#### Scenario: Banner persistente
- **WHEN** un usuario que no participa en la temporada activa navega por cualquier página autenticada
- **THEN** se muestra un banner fijo en la parte superior con el aviso de pago pendiente de esa temporada y el acceso al contacto por WhatsApp

#### Scenario: Banner desaparece al confirmar la participación
- **WHEN** el administrador confirma la participación del usuario en la temporada activa y el usuario recarga o navega
- **THEN** el modal y el banner de pago pendiente de esa temporada dejan de mostrarse

### Requirement: Contacto con el administrador vía WhatsApp
El sistema SHALL ofrecer al usuario `pendiente` un enlace deep link de WhatsApp (`wa.me`) hacia el número configurado por el administrador, con un mensaje prellenado que incluya nombre, correo electrónico y teléfono del usuario.

#### Scenario: Mensaje prellenado
- **WHEN** un usuario `pendiente` pulsa el botón de contacto por WhatsApp
- **THEN** se abre WhatsApp dirigido al número configurado con un mensaje que contiene su nombre, correo y teléfono

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

### Requirement: Activación y desactivación manual
El administrador SHALL poder confirmar (activar) o retirar (desactivar) la
participación de un usuario **por temporada**, de forma independiente para `grupos` y
`eliminatoria`. La desactivación de una participación MUST ser reversible: los
pronósticos y datos del usuario se conservan intactos. El administrador SHALL también
poder desactivar la cuenta completa (`profiles.status='desactivado'`) para banear al
usuario de todas las temporadas.

#### Scenario: Confirmación de pago por temporada
- **WHEN** el administrador confirma el pago de un usuario en una temporada
- **THEN** el usuario queda con participación `activo` en esa temporada y puede guardar pronósticos de sus partidos abiertos

#### Scenario: Reactivación conserva datos
- **WHEN** el administrador reactiva una participación `desactivado` de una temporada
- **THEN** la participación vuelve a `activo` con todos los pronósticos y puntos previos de esa temporada intactos

#### Scenario: Partidos cerrados antes de la confirmación
- **WHEN** la participación en una temporada se confirma después del cierre de uno o más partidos de esa temporada
- **THEN** el usuario no puede capturar pronósticos de esos partidos cerrados y no obtiene puntos por ellos
