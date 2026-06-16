# match-schedule Specification

## Purpose

Calendario de partidos agrupado por jornadas (día calendario en America/Mexico_City), información de cada partido con banderas, fases del torneo soportadas, regla de cierre por partido y filtro por equipo en el calendario del participante.

## Requirements

### Requirement: Calendario agrupado por jornadas
El sistema SHALL mostrar los partidos agrupados por jornada, donde una jornada es el conjunto de partidos cuya fecha (en zona horaria America/Mexico_City) es el mismo día calendario.

#### Scenario: Agrupación por día
- **WHEN** un usuario autenticado consulta el calendario
- **THEN** los partidos aparecen agrupados por fecha, con todos los partidos de un mismo día bajo la misma jornada

#### Scenario: Fecha de jornada en zona horaria canónica
- **WHEN** un partido tiene horario de inicio que cruza medianoche entre husos horarios
- **THEN** su jornada se determina por su fecha precalculada en America/Mexico_City, no por la fecha local del estadio ni UTC

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

### Requirement: Fases del torneo
El modelo de partidos SHALL soportar las fases: fase de grupos, dieciseisavos de final, octavos de final, cuartos de final, semifinales, tercer lugar y final. En V1 únicamente la fase de grupos MUST estar habilitada y visible.

#### Scenario: Solo fase de grupos en V1
- **WHEN** un usuario consulta el calendario en V1
- **THEN** solo se muestran partidos de la fase de grupos

### Requirement: Cierre por partido
Cada partido SHALL aceptar pronósticos hasta una hora antes de su hora de
inicio (`kickoff_at`): el partido está abierto mientras la hora actual sea
estrictamente anterior a `kickoff_at − 1 hora`, y cerrado desde ese instante.
El estado abierto/cerrado MUST calcularse a partir de `kickoff_at` y la hora
actual, sin almacenarse, y MUST aplicarse de forma coherente en la lógica de
dominio, en las políticas RLS y en los textos de fecha límite visibles
(incluido el banner de cuenta pendiente). La regla MUST NOT tener excepciones
fechadas. Una jornada puede estar parcialmente cerrada: cada partido se evalúa
de forma independiente.

#### Scenario: Partido abierto
- **WHEN** la hora actual es anterior a `kickoff_at − 1 hora` de un partido
- **THEN** el partido está abierto y acepta guardado de pronóstico

#### Scenario: Partido cerrado
- **WHEN** la hora actual es igual o posterior a `kickoff_at − 1 hora` de un partido
- **THEN** el partido está cerrado y el sistema (dominio y RLS) rechaza cualquier guardado de pronóstico para ese partido

#### Scenario: Borde exacto del cierre
- **WHEN** la hora actual es exactamente un segundo antes de `kickoff_at − 1 hora`
- **THEN** el partido sigue abierto; en el instante `kickoff_at − 1 hora` está cerrado

#### Scenario: Jornada parcialmente cerrada
- **WHEN** una jornada tiene un partido cuyo cierre ya pasó y otro cuyo cierre no ha llegado
- **THEN** el partido cerrado rechaza guardados y se muestra en solo lectura, mientras el partido abierto sigue aceptando pronósticos

#### Scenario: Fecha límite visible por partido
- **WHEN** un usuario consulta un partido abierto
- **THEN** ve la fecha límite de ese partido (una hora antes de su inicio, en America/Mexico_City), no una fecha límite de jornada

### Requirement: Filtro por equipo en el calendario
El calendario de partidos del participante SHALL permitir filtrar por nombre
de equipo mediante un campo de búsqueda ubicado entre los partidos en vivo y
el listado de jornadas. El filtrado MUST ser insensible a mayúsculas y
acentos y coincidir por subcadena contra el equipo local o el visitante. Las
jornadas sin partidos coincidentes MUST omitirse del listado. El filtro
SHALL reflejarse en la URL (consultable y compartible); un campo vacío
equivale a no filtrar. Los partidos en vivo destacados sobre el filtro MUST
NOT ser afectados por él. Mientras el filtro esté activo, el sistema SHALL
mostrar cuántos partidos coinciden.

#### Scenario: Filtrado por subcadena sin acentos
- **WHEN** un usuario escribe "mexico" en el campo de búsqueda
- **THEN** el listado muestra únicamente los partidos donde México es local o visitante, agrupados en sus jornadas, y las demás jornadas desaparecen

#### Scenario: Coincidencia contra ambos equipos
- **WHEN** un usuario filtra por un equipo que aparece como visitante en algún partido
- **THEN** esos partidos también aparecen en el resultado

#### Scenario: Filtro compartible por URL
- **WHEN** un usuario abre una URL del calendario que incluye el filtro de equipo
- **THEN** la página carga con el campo de búsqueda lleno y el listado ya filtrado

#### Scenario: Partidos en vivo exentos del filtro
- **WHEN** hay un partido en vivo de un equipo distinto al filtrado
- **THEN** su card destacada sigue visible sobre el filtro, mientras el listado muestra solo los partidos del equipo buscado

#### Scenario: Sin coincidencias
- **WHEN** el texto de búsqueda no coincide con ningún equipo
- **THEN** el listado muestra un mensaje neutro citando el texto buscado y una acción visible para limpiar el filtro y volver al calendario completo

#### Scenario: Partidos jugados también se filtran
- **WHEN** un usuario filtra por un equipo cuyos partidos ya se jugaron
- **THEN** ve esas jornadas con las cards de solo lectura y sus marcadores; tener solo partidos cerrados no es estado vacío

#### Scenario: Limpiar el filtro
- **WHEN** el usuario borra el texto o usa la acción de limpiar
- **THEN** el listado vuelve a mostrar todas las jornadas
