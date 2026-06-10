# Spec: match-schedule

## ADDED Requirements

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

### Requirement: Cierre de jornada
Los pronósticos de una jornada SHALL cerrar a las 23:59 (America/Mexico_City) del día anterior a la fecha de la jornada. El estado abierto/cerrado MUST calcularse a partir de la fecha de la jornada y la hora actual, sin almacenarse.

#### Scenario: Jornada abierta
- **WHEN** la hora actual es anterior a las 00:00 del día de la jornada en America/Mexico_City
- **THEN** la jornada está abierta y acepta guardado de pronósticos

#### Scenario: Jornada cerrada
- **WHEN** la hora actual es igual o posterior a las 00:00 del día de la jornada en America/Mexico_City
- **THEN** la jornada está cerrada y el sistema rechaza cualquier guardado de pronósticos

#### Scenario: Borde exacto del cierre
- **WHEN** la hora actual es exactamente 23:59:59 del día anterior a la jornada
- **THEN** la jornada sigue abierta; a partir de las 00:00:00 está cerrada
