## MODIFIED Requirements

### Requirement: Gestión de usuarios
El administrador SHALL poder consultar la lista de usuarios registrados (nombre,
alias, correo, teléfono, estado de cuenta, participación por temporada, fecha de
registro), confirmar o retirar la participación de cada usuario **por temporada**
(`grupos` y `eliminatoria`), desactivar la cuenta completa y enviar un recordatorio
de pago por WhatsApp a quien no participa en la temporada activa.

#### Scenario: Consulta de registrados
- **WHEN** el administrador abre la sección de usuarios
- **THEN** ve todos los usuarios registrados con sus datos de contacto, estado de cuenta y su participación en cada temporada

#### Scenario: Confirmar pago de una temporada
- **WHEN** el administrador confirma el pago de un usuario en una temporada
- **THEN** el usuario queda con participación `activo` en esa temporada, sin afectar su participación en la otra

#### Scenario: Retirar participación de una temporada
- **WHEN** el administrador retira la participación `activo` de un usuario en una temporada
- **THEN** la participación de esa temporada pasa a `desactivado`, conservando sus datos y pronósticos

#### Scenario: Recordar pago a quien no participa en la temporada activa
- **WHEN** el administrador pulsa el recordatorio de pago en la fila de un usuario que no participa en la temporada activa
- **THEN** se abre WhatsApp dirigido al teléfono del usuario con el mensaje de bienvenida, monto y datos de transferencia prellenados
