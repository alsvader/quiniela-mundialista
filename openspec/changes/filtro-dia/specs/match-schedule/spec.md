# match-schedule — delta (filtro-dia)

## ADDED Requirements

### Requirement: Filtro por día en el calendario
El calendario de partidos SHALL ofrecer una tira horizontal de fechas reales
—una celda por cada día con partidos, mostrando la abreviatura del día de la
semana y el número— ubicada sobre el listado de jornadas, tanto en el
calendario del participante como en el del administrador. Las fechas y la
noción de "hoy" MUST calcularse en la zona horaria `America/Mexico_City`.

Al cargar la página sin una selección explícita en la URL, el sistema SHALL
preseleccionar el día actual; si el día actual no tiene partidos, SHALL
preseleccionar el siguiente día con partidos, y si ya no quedan días con
partidos SHALL mostrar el calendario completo. El día actual MUST mostrarse
marcado visualmente aunque no esté seleccionado.

La selección SHALL permitir varios días a la vez (toggle). La tira SHALL
incluir una opción "Todos" que limpia la selección y muestra el calendario
completo; deseleccionar el último día equivale a "Todos". Solo se SHALL
renderizar las secciones de jornada cuyos días estén seleccionados; con la
selección vacía ("Todos") se muestran todas.

El filtro SHALL reflejarse en la URL como lista de fechas (consultable y
compartible); la ausencia del parámetro equivale a la selección por defecto y
el parámetro presente pero vacío equivale a "Todos".

En el calendario del participante, mientras haya una búsqueda por equipo activa
el filtro por día SHALL pausarse: la búsqueda MUST abarcar todo el torneo (no se
acota a los días seleccionados ni al día por defecto) y la tira de días MUST
mostrarse deshabilitada. La selección de día MUST preservarse en la URL y
restaurarse al limpiar la búsqueda por equipo. Los partidos en vivo destacados
sobre el filtro MUST NOT ser afectados por él.

#### Scenario: Día actual seleccionado por defecto
- **WHEN** un usuario abre el calendario sin parámetros de filtro y hoy hay partidos
- **THEN** la tira muestra el día de hoy seleccionado y el listado muestra únicamente las jornadas de hoy

#### Scenario: Hoy sin partidos cae al próximo día
- **WHEN** un usuario abre el calendario un día sin partidos
- **THEN** la tira preselecciona el siguiente día con partidos y el listado muestra esa jornada

#### Scenario: Selección de varios días
- **WHEN** un usuario activa un segundo día en la tira
- **THEN** el listado muestra las jornadas de todos los días seleccionados y la URL refleja ambas fechas

#### Scenario: Ver todos los días
- **WHEN** un usuario toca "Todos" (o deselecciona el último día activo)
- **THEN** el listado muestra todas las jornadas y la URL ya no fija ningún día

#### Scenario: Filtro de día compartible por URL
- **WHEN** un usuario abre una URL del calendario que incluye una o más fechas en el filtro de día
- **THEN** la página carga con esos días seleccionados en la tira y el listado ya filtrado

#### Scenario: Buscar un equipo abarca todo el torneo
- **WHEN** el usuario tiene uno o más días seleccionados y luego busca un equipo
- **THEN** el listado muestra los partidos de ese equipo en todos sus días (no solo los seleccionados) y la tira de días se muestra deshabilitada (en pausa)

#### Scenario: Limpiar el equipo restaura el día
- **WHEN** el usuario limpia la búsqueda por equipo
- **THEN** la tira vuelve a estar activa y el listado se reduce de nuevo a los días que tenía seleccionados

#### Scenario: Partidos en vivo exentos del filtro de día
- **WHEN** hay un partido en vivo de un día distinto al seleccionado
- **THEN** su card destacada sigue visible sobre el filtro, mientras el listado muestra solo los días seleccionados

#### Scenario: Filtro de día en el panel del administrador
- **WHEN** el administrador abre su lista de partidos
- **THEN** ve la misma tira de días con hoy preseleccionado y el listado acotado a los días que seleccione

#### Scenario: Hoy marcado aunque no esté seleccionado
- **WHEN** el usuario cambia la selección a un día distinto de hoy
- **THEN** la celda de hoy sigue mostrando su marcador de día actual sin estar seleccionada
