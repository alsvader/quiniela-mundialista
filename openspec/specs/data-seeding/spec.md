# data-seeding Specification

## Purpose

Seeds estáticos del sistema: fixture completo de la fase de grupos del Mundial 2026 (sin dependencia de APIs deportivas) y creación idempotente de la cuenta administradora.

## Requirements

### Requirement: Seed del fixture de fase de grupos
El sistema SHALL incluir un seed estático con los 72 partidos oficiales de la fase de grupos del Mundial 2026, con equipos, grupo, fecha/hora de inicio, fecha de jornada precalculada en America/Mexico_City y el código de bandera (ISO 3166-1 alfa-2, o código regional para naciones constituyentes) de cada equipo. El seed MUST NOT depender de APIs deportivas; las banderas se renderizan desde SVGs locales del repositorio.

#### Scenario: Aplicación del seed
- **WHEN** se aplica el seed del fixture en una base de datos vacía
- **THEN** existen exactamente 72 partidos de fase de grupos con equipos, grupo, horario, fecha de jornada y códigos de bandera de ambos equipos correctos

#### Scenario: Banderas de naciones constituyentes y territorios
- **WHEN** el seed incluye equipos sin código ISO propio de país soberano (Inglaterra, Escocia) o territorios (Curazao)
- **THEN** usa el código regional correcto (`gb-eng`, `gb-sct`, `cw`) y su bandera propia, no la del estado soberano

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
