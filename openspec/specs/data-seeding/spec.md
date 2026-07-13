# data-seeding Specification

## Purpose

Seeds estáticos del sistema: fixture completo de la fase de grupos del Mundial 2026, siembra progresiva de las rondas de eliminatoria conforme el cuadro resuelve los equipos (todo sin dependencia de APIs deportivas), y creación idempotente de la cuenta administradora.

## Requirements

### Requirement: Seed del fixture de fase de grupos
El sistema SHALL incluir un seed estático con los 72 partidos oficiales de la fase de grupos del Mundial 2026, con equipos, grupo, fecha/hora de inicio, fecha de jornada precalculada en America/Mexico_City, el código de bandera (ISO 3166-1 alfa-2, o código regional para naciones constituyentes) de cada equipo, y el estadio y la ciudad de cada partido. Las sedes SHALL derivarse del campo de ubicación del feed oficial mediante un mapeo único a nombres en es-MX (criterio coloquial aprobado: Estadio Azteca, Estadio Akron, Estadio BBVA; nombres comerciales reales en EE. UU. y Canadá; ciudad ancla simplificada). El generador MUST fallar ante una ubicación del feed no contemplada en el mapeo. El seed MUST NOT depender de APIs deportivas; las banderas se renderizan desde SVGs locales del repositorio.

#### Scenario: Aplicación del seed
- **WHEN** se aplica el seed del fixture en una base de datos vacía
- **THEN** existen exactamente 72 partidos de fase de grupos con equipos, grupo, horario, fecha de jornada, códigos de bandera y estadio y ciudad correctos

#### Scenario: Sedes con naming es-MX
- **WHEN** el feed trae una sede con nombre FIFA neutro (p. ej. "Mexico City Stadium")
- **THEN** el seed la traduce al nombre aprobado ("Estadio Azteca", "Ciudad de México"), nunca el nombre FIFA crudo

#### Scenario: Ubicación desconocida en el feed
- **WHEN** el generador encuentra una ubicación del feed sin entrada en el mapeo
- **THEN** falla con un error explícito en lugar de emitir un seed con sedes faltantes o crudas

#### Scenario: Banderas de naciones constituyentes y territorios
- **WHEN** el seed incluye equipos sin código ISO propio de país soberano (Inglaterra, Escocia) o territorios (Curazao)
- **THEN** usa el código regional correcto (`gb-eng`, `gb-sct`, `cw`) y su bandera propia, no la del estado soberano

#### Scenario: Fecha de jornada precalculada
- **WHEN** un partido del seed inicia en un horario que corresponde a otra fecha en UTC o en la hora local del estadio
- **THEN** su fecha de jornada es la fecha del partido en America/Mexico_City

### Requirement: Seed de las rondas de eliminatoria
El sistema SHALL sembrar los partidos oficiales de cada ronda de eliminatoria del Mundial 2026 (dieciseisavos `round_of_32`, ids 73–88; octavos `round_of_16`, 89–96; cuartos `quarter_final`, 97–100; semifinales `semi_final`, 101–102; tercer lugar `third_place` y final `final`, 103–104), resueltos con los equipos reales conforme el cuadro avanza. Cada partido SHALL registrarse con su número de partido oficial FIFA como id (`overriding system value`, sin alterar la secuencia reservada para partidos creados por el admin), su fase del enum `match_phase`, `group_label` en NULL, la fecha de jornada precalculada en America/Mexico_City, el horario de inicio en UTC, y los códigos de bandera y el estadio/ciudad derivados del mismo mapeo es-MX que la fase de grupos. El resultado oficial (`avanza`) SHALL quedar en NULL al sembrar; se captura después al cerrar el partido. Los seeds SHALL generarse desde el snapshot del feed mediante el generador (no editarse a mano) y SHALL ser idempotentes ante reaplicación. El generador MUST fallar ante un equipo aún sin resolver o desconocido en lugar de emitir un seed incompleto.

#### Scenario: Seed de una ronda de eliminatoria
- **WHEN** se aplica el seed de una ronda de eliminatoria con los equipos ya resueltos
- **THEN** existen los partidos de esa ronda con su id oficial FIFA, fase correcta, equipos, horario, fecha de jornada, códigos de bandera y estadio/ciudad, con `group_label` y `avanza` en NULL

#### Scenario: Resultado oficial pendiente al sembrar
- **WHEN** se siembra un partido de eliminatoria
- **THEN** `avanza` queda en NULL y el partido no puede considerarse finalizado hasta que se capture quién avanza

#### Scenario: Equipo aún sin resolver en el cuadro
- **WHEN** el generador encuentra un partido cuyo equipo sigue como placeholder del feed ("To be announced") o un nombre no contemplado en el mapeo
- **THEN** falla con un error explícito en lugar de emitir un seed con equipos faltantes

#### Scenario: Ronda que agrupa dos fases (tercer lugar y final)
- **WHEN** se siembra la última ronda del feed, que reúne el partido por el tercer lugar y la final
- **THEN** cada partido recibe su fase propia (`third_place` y `final`) según su número oficial FIFA, no una sola fase para ambos

### Requirement: Seed de la cuenta administradora
El sistema SHALL incluir un script idempotente que cree la cuenta administradora usando la service role key de Supabase, con correo y contraseña tomados de variables de entorno, creando el usuario en Supabase Auth y su perfil con rol `admin` y estado `activo`.

#### Scenario: Creación del admin
- **WHEN** se ejecuta el script de seed del admin con las variables de entorno configuradas
- **THEN** existe una cuenta capaz de iniciar sesión con esas credenciales y acceder al panel administrativo

#### Scenario: Re-ejecución idempotente
- **WHEN** el script de seed del admin se ejecuta una segunda vez
- **THEN** no se duplica la cuenta ni falla la ejecución; el resultado final es el mismo
