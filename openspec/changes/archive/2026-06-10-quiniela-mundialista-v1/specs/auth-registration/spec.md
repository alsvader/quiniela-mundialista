# Spec: auth-registration

## ADDED Requirements

### Requirement: Registro de participante
El sistema SHALL permitir crear una cuenta con correo electrónico y contraseña mediante Supabase Auth, capturando además nombre completo, alias público y teléfono en un perfil propio de la aplicación.

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

### Requirement: Inicio de sesión
El sistema SHALL permitir iniciar sesión con correo y contraseña a cualquier cuenta registrada, independientemente de su estado de activación.

#### Scenario: Login con cuenta pendiente
- **WHEN** un usuario con estado `pendiente` inicia sesión con credenciales correctas
- **THEN** el sistema permite el acceso y muestra la experiencia de cuenta pendiente

#### Scenario: Credenciales incorrectas
- **WHEN** un usuario intenta iniciar sesión con contraseña incorrecta
- **THEN** el sistema rechaza el acceso con un mensaje de error genérico

### Requirement: Separación de identidad y datos de negocio
El sistema SHALL mantener la identidad (correo, contraseña) en Supabase Auth y los datos de negocio (nombre, alias, teléfono, estado, rol) en una tabla de perfiles propia vinculada 1:1 por el id de Auth.

#### Scenario: Perfil vinculado al registrarse
- **WHEN** se completa un registro
- **THEN** existe exactamente un perfil cuyo id coincide con el id del usuario en Supabase Auth

### Requirement: Privacidad de datos personales
El sistema MUST exponer públicamente únicamente el alias del participante; nombre completo, correo y teléfono SHALL ser visibles solo para el administrador.

#### Scenario: Datos visibles en superficies públicas
- **WHEN** cualquier visitante consulta el ranking público
- **THEN** solo se muestran alias, posición y puntos, nunca nombre, correo ni teléfono
