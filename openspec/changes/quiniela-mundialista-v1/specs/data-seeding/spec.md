# Spec: data-seeding

## ADDED Requirements

### Requirement: Seed del fixture de fase de grupos
El sistema SHALL incluir un seed estático con los 72 partidos oficiales de la fase de grupos del Mundial 2026, con equipos, grupo, fecha/hora de inicio y fecha de jornada precalculada en America/Mexico_City. El seed MUST NOT depender de APIs deportivas.

#### Scenario: Aplicación del seed
- **WHEN** se aplica el seed del fixture en una base de datos vacía
- **THEN** existen exactamente 72 partidos de fase de grupos con equipos, grupo, horario y fecha de jornada correctos

#### Scenario: Fecha de jornada precalculada
- **WHEN** un partido del seed inicia en un horario que corresponde a otra fecha en UTC o en la hora local del estadio
- **THEN** su fecha de jornada es la fecha del partido en America/Mexico_City

### Requirement: Seed de la cuenta administradora
El sistema SHALL incluir un script idempotente que cree la cuenta administradora usando la service role key de Supabase, con correo y contraseña tomados de variables de entorno, creando el usuario en Supabase Auth y su perfil con rol `admin` y estado `activo`.

#### Scenario: Creación del admin
- **WHEN** se ejecuta el script de seed del admin con las variables de entorno configuradas
- **THEN** existe una cuenta capaz de iniciar sesión con esas credenciales y acceder al panel administrativo

#### Scenario: Re-ejecución idempotente
- **WHEN** el script de seed del admin se ejecuta una segunda vez
- **THEN** no se duplica la cuenta ni falla la ejecución; el resultado final es el mismo
