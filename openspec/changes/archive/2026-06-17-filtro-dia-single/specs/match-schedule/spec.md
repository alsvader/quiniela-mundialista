# match-schedule — delta (filtro-dia-single)

## MODIFIED Requirements

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

La selección SHALL ser de **un solo día a la vez** (control segmentado): tocar
un día MUST reemplazar la selección anterior, sin requerir deseleccionar el día
activo. La tira SHALL incluir una opción "Todos" como primera celda que muestra
el calendario completo. En todo momento SHALL haber exactamente una opción
activa (un día o "Todos"); no existe un estado sin selección. Solo se SHALL
renderizar las secciones de jornada del día activo; con "Todos" activo se
muestran todas.

El filtro SHALL reflejarse en la URL como un solo valor de fecha (consultable y
compartible); la ausencia del parámetro equivale a la selección por defecto y el
parámetro presente pero vacío equivale a "Todos".

En el calendario del participante, mientras haya una búsqueda por equipo activa
el filtro por día SHALL pausarse: la búsqueda MUST abarcar todo el torneo (no se
acota al día seleccionado ni al día por defecto) y la tira de días MUST
mostrarse deshabilitada. La selección de día MUST preservarse en la URL y
restaurarse al limpiar la búsqueda por equipo. Los partidos en vivo destacados
sobre el filtro MUST NOT ser afectados por él.

#### Scenario: Día actual seleccionado por defecto
- **WHEN** un usuario abre el calendario sin parámetros de filtro y hoy hay partidos
- **THEN** la tira muestra el día de hoy seleccionado y el listado muestra únicamente las jornadas de hoy

#### Scenario: Hoy sin partidos cae al próximo día
- **WHEN** un usuario abre el calendario un día sin partidos
- **THEN** la tira preselecciona el siguiente día con partidos y el listado muestra esa jornada

#### Scenario: Cambiar de día reemplaza la selección
- **WHEN** hay un día seleccionado y el usuario toca otro día
- **THEN** el listado pasa a mostrar solo el día tocado, el día anterior deja de estar seleccionado sin acción extra, y la URL refleja únicamente el nuevo día

#### Scenario: Ver todos los días
- **WHEN** el usuario toca "Todos"
- **THEN** el listado muestra todas las jornadas, "Todos" queda como la opción activa y la URL ya no fija ningún día

#### Scenario: Filtro de día compartible por URL
- **WHEN** un usuario abre una URL del calendario que incluye una fecha en el filtro de día
- **THEN** la página carga con ese día seleccionado en la tira y el listado ya filtrado

#### Scenario: Buscar un equipo abarca todo el torneo
- **WHEN** el usuario tiene un día seleccionado y luego busca un equipo
- **THEN** el listado muestra los partidos de ese equipo en todos sus días (no solo el seleccionado) y la tira de días se muestra deshabilitada (en pausa)

#### Scenario: Limpiar el equipo restaura el día
- **WHEN** el usuario limpia la búsqueda por equipo
- **THEN** la tira vuelve a estar activa y el listado se reduce de nuevo al día que tenía seleccionado

#### Scenario: Partidos en vivo exentos del filtro de día
- **WHEN** hay un partido en vivo de un día distinto al seleccionado
- **THEN** su card destacada sigue visible sobre el filtro, mientras el listado muestra solo el día seleccionado

#### Scenario: Filtro de día en el panel del administrador
- **WHEN** el administrador abre su lista de partidos
- **THEN** ve la misma tira de días con hoy preseleccionado y el listado acotado al día que seleccione

#### Scenario: Hoy marcado aunque no esté seleccionado
- **WHEN** el usuario cambia la selección a un día distinto de hoy
- **THEN** la celda de hoy sigue mostrando su marcador de día actual sin estar seleccionada
