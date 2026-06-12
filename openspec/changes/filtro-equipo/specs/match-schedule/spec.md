# match-schedule — delta (filtro-equipo)

## ADDED Requirements

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
