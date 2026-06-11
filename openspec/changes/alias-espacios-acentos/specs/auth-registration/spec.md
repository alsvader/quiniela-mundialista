# auth-registration — Delta

## MODIFIED Requirements

### Requirement: Registro de participante
El sistema SHALL permitir crear una cuenta con correo electrónico y contraseña mediante Supabase Auth, capturando además nombre completo, alias público y teléfono en un perfil propio de la aplicación. El alias SHALL aceptar letras latinas (incluyendo acentos españoles y ñ), números, punto, guion, guion bajo y espacios internos sencillos, con longitud de 3 a 20 caracteres; el sistema MUST rechazar espacios al inicio o al final y espacios consecutivos, y la misma regla de formato SHALL aplicarse en el formulario, en la validación del servidor y en la base de datos.

#### Scenario: Registro exitoso
- **WHEN** un visitante completa el formulario con correo, contraseña, nombre completo, alias y teléfono válidos
- **THEN** el sistema crea la cuenta en Supabase Auth y un perfil con estado `pendiente` y rol `user`

#### Scenario: Alias obligatorio
- **WHEN** un visitante intenta registrarse sin alias o con un alias vacío
- **THEN** el sistema rechaza el registro indicando que el alias es obligatorio

#### Scenario: Alias duplicado
- **WHEN** un visitante intenta registrarse con un alias ya usado por otro participante
- **THEN** el sistema rechaza el registro indicando que el alias no está disponible

#### Scenario: Correo duplicado
- **WHEN** un visitante intenta registrarse con un correo ya registrado
- **THEN** el sistema rechaza el registro indicando que el correo ya está en uso

#### Scenario: Alias con espacios internos y acentos
- **WHEN** un visitante se registra con un alias como "Don Linux" o "Ramón"
- **THEN** el sistema acepta el alias y completa el registro

#### Scenario: Alias con espacios inválidos
- **WHEN** un visitante intenta registrarse con un alias con espacios al inicio o final, o con espacios consecutivos (p. ej. "Don  Linux")
- **THEN** el sistema rechaza el alias indicando el formato permitido
