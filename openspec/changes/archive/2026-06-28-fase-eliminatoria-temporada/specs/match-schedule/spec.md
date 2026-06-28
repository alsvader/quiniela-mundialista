## MODIFIED Requirements

### Requirement: Fases del torneo
El modelo de partidos SHALL soportar las fases: fase de grupos, dieciseisavos de
final, octavos de final, cuartos de final, semifinales, tercer lugar y final,
agrupadas en dos temporadas: `grupos` (fase de grupos) y `eliminatoria` (las seis
fases restantes). Las fases de la temporada `eliminatoria` MUST poder habilitarse y
mostrarse cuando el administrador abre esa temporada; las fases sin partidos
capturados simplemente no muestran jornadas.

#### Scenario: Solo fase de grupos antes de abrir la eliminatoria
- **WHEN** un usuario consulta el calendario y no hay partidos de eliminatoria capturados
- **THEN** solo se muestran partidos de la fase de grupos

#### Scenario: Eliminatoria visible tras su apertura
- **WHEN** el administrador ha capturado partidos de eliminatoria y abierto esa temporada
- **THEN** el calendario muestra los partidos de eliminatoria en su propia temporada

## ADDED Requirements

### Requirement: Segmento de temporada en el calendario
La página de partidos SHALL ofrecer un segmento "Grupos | Eliminatoria" que filtra el
calendario a la temporada seleccionada, con la temporada `fase_activa` seleccionada
por defecto. La selección de temporada MUST preservarse en la URL. La bolsa mostrada
y los controles de pronóstico MUST corresponder a la temporada seleccionada.

#### Scenario: Cambio de temporada
- **WHEN** un usuario selecciona "Eliminatoria" en el segmento
- **THEN** el calendario muestra solo los partidos de eliminatoria y la bolsa mostrada es la de esa temporada

#### Scenario: Temporada por defecto
- **WHEN** un usuario abre la página de partidos sin temporada en la URL
- **THEN** se muestra la temporada indicada por `fase_activa`

### Requirement: Leyenda de temporada no participada
La página de partidos SHALL mostrar, en el header de cada jornada de una temporada en
la que el usuario no participa, una leyenda que indique que no participa en esa
temporada y oriente hacia la temporada activa. Los partidos de una temporada no
participada MUST presentarse en modo solo lectura (sin acción de pronóstico).

#### Scenario: Nuevo registro ve grupos en solo lectura
- **WHEN** un usuario que solo participa en `eliminatoria` consulta las jornadas de `grupos`
- **THEN** ve los partidos de grupos sin la acción de pronóstico y una leyenda indicando que su quiniela arranca en la eliminatoria

#### Scenario: Sin leyenda en la temporada participada
- **WHEN** un usuario consulta las jornadas de una temporada en la que sí participa
- **THEN** no se muestra la leyenda y los partidos abiertos presentan su acción de pronóstico
