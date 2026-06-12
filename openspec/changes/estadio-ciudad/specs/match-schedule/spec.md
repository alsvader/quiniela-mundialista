# match-schedule — delta (estadio-ciudad)

## MODIFIED Requirements

### Requirement: Información del partido
Cada partido SHALL mostrar equipo local, equipo visitante, fase del torneo, grupo (cuando aplique), fecha y hora de inicio. Junto al nombre de cada equipo SHALL mostrarse la bandera de su país (SVG local), en todo listado de partidos: calendario del participante, detalle de puntos y lista de partidos del admin. En las cards de partido del calendario del participante (abiertas y de solo lectura) SHALL mostrarse además el estadio y la ciudad donde se juega, cuando estén capturados; si la sede no está capturada, la card MUST omitir esa línea sin romper el diseño.

#### Scenario: Consulta de partido de fase de grupos
- **WHEN** un usuario consulta un partido de la fase de grupos
- **THEN** ve equipo local, visitante, grupo, fecha y hora de inicio, con la bandera de cada país junto a su nombre

#### Scenario: Sede visible en la card
- **WHEN** un usuario consulta la card de un partido con estadio y ciudad capturados
- **THEN** ve "estadio · ciudad" (p. ej. "Estadio Azteca · Ciudad de México") como línea informativa, sin competir con el pronóstico ni el marcador

#### Scenario: Partido sin sede capturada
- **WHEN** un partido no tiene estadio o ciudad capturados (p. ej. creado a mano o eliminatoria por definir)
- **THEN** la card se muestra sin la línea de sede, sin huecos ni errores

#### Scenario: Equipo sin código de bandera
- **WHEN** un partido tiene un equipo sin código de bandera asignado (p. ej. eliminatorias "por definir" en V2)
- **THEN** el listado muestra el nombre del equipo sin bandera, sin romper el diseño
