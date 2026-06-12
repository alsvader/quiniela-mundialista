# match-schedule Specification

## Purpose

Calendario de partidos agrupado por jornadas (día calendario en America/Mexico_City), información de cada partido con banderas, fases del torneo soportadas y regla de cierre por partido.

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
Cada partido SHALL mostrar equipo local, equipo visitante, fase del torneo, grupo (cuando aplique), fecha y hora de inicio. Junto al nombre de cada equipo SHALL mostrarse la bandera de su país (SVG local), en todo listado de partidos: calendario del participante, detalle de puntos y lista de partidos del admin.

#### Scenario: Consulta de partido de fase de grupos
- **WHEN** un usuario consulta un partido de la fase de grupos
- **THEN** ve equipo local, visitante, grupo, fecha y hora de inicio, con la bandera de cada país junto a su nombre

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
