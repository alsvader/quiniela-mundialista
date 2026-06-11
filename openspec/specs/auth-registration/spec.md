# auth-registration Specification

## Purpose

Registro e inicio de sesión de participantes con Supabase Auth, manteniendo la identidad separada de los datos de negocio (perfil) y protegiendo la privacidad de los datos personales.

## Requirements

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
