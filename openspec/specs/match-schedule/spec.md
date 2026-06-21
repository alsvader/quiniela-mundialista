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

### Requirement: Posición de scroll inicial de la tira de días

Al renderizarse, la tira de días SHALL posicionar su scroll horizontal para que
la celda activa quede visible sin acción del usuario, centrándola dentro del
contenedor cuando haya espacio y dejándola completamente visible cuando esté en
un extremo. La celda objetivo SHALL ser la del día seleccionado; cuando la
selección sea "Todos" (sin día), la celda objetivo SHALL ser la de hoy.

El reposicionamiento SHALL ocurrir al montar la tira y al re-sincronizar la
selección por navegación externa (back/forward o limpieza de búsqueda por
equipo), pero MUST NOT dispararse cuando el usuario toca una celda dentro de la
tira (una celda ya visible no debe reposicionarse). El ajuste MUST afectar
únicamente el scroll horizontal del propio contenedor y MUST NOT mover el scroll
vertical de la página.

Cuando las celdas llenan el ancho del contenedor y no hay desbordamiento
(típicamente en desktop), el comportamiento es inocuo y la tira permanece sin
desplazamiento.

#### Scenario: Hoy fuera de los primeros días aparece centrado
- **WHEN** un usuario abre el calendario en móvil y hoy (seleccionado por defecto) cae fuera de los primeros días visibles de la tira
- **THEN** la tira aparece desplazada para mostrar la celda de hoy centrada, sin que el usuario tenga que hacer scroll a la derecha

#### Scenario: Día seleccionado por URL aparece visible
- **WHEN** un usuario abre una URL del calendario con un día seleccionado que cae fuera del área visible inicial
- **THEN** la tira se posiciona para mostrar esa celda centrada o, si está en un extremo, completamente visible

#### Scenario: Día en un extremo queda visible sin centrar
- **WHEN** la celda objetivo es uno de los primeros o últimos días y no puede centrarse sin dejar espacio vacío en el contenedor
- **THEN** la tira la muestra completamente visible pegada a su extremo, sin scroll vacío

#### Scenario: Tocar un día no reposiciona la tira
- **WHEN** el usuario toca una celda ya visible dentro de la tira
- **THEN** la selección cambia pero la tira no reajusta su scroll horizontal

#### Scenario: Reposicionar no altera el scroll vertical de la página
- **WHEN** la tira ajusta su scroll horizontal al montar
- **THEN** la posición de scroll vertical de la página permanece sin cambios

### Requirement: Anclajes de scroll de la tira de días

Cada celda de la tira de días —incluida la celda "Todos"— SHALL ser un punto de
anclaje de scroll (`scroll-snap-align: start`), de modo que cualquier celda pueda
quedar como posición de reposo del scroll. El extremo izquierdo de la tira
(`scrollLeft = 0`) SHALL ser una posición de reposo válida que mantenga la celda
"Todos" completamente visible.

#### Scenario: "Todos" queda visible al hacer scroll a la izquierda
- **WHEN** en móvil el usuario hace scroll hacia la izquierda hasta el inicio de la tira y suelta
- **THEN** el scroll se detiene mostrando la celda "Todos" completamente visible, sin imantarse al primer día ni ocultarla

#### Scenario: Cualquier celda es posición de reposo
- **WHEN** el usuario hace scroll y suelta cerca de cualquier celda de la tira
- **THEN** el scroll reposa con esa celda anclada al inicio, ya sea "Todos" o un día
