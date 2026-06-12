# data-seeding — delta (estadio-ciudad)

## MODIFIED Requirements

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
