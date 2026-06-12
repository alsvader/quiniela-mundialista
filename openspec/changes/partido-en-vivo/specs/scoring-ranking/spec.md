# scoring-ranking — delta (partido-en-vivo)

## MODIFIED Requirements

### Requirement: Puntos calculados al vuelo
Los puntos totales de cada usuario y el ranking MUST calcularse siempre a
partir de pronósticos y goles capturados, nunca almacenarse como totales
editables. Solo los partidos **finalizados** SHALL participar en la
puntuación: un marcador parcial de un partido en vivo MUST NOT sumar puntos
ni mover el ranking, en ninguna capa (cálculo en aplicación y función de
ranking en base de datos). Una corrección de marcador o de finalización SHALL
reflejarse automáticamente en puntos y ranking sin intervención adicional.

#### Scenario: Corrección de marcador recalcula puntos
- **WHEN** el administrador corrige un marcador de 2-1 a 1-1 en un partido finalizado
- **THEN** el resultado oficial pasa de "gana local" a "empate" y los puntos y ranking de todos los usuarios reflejan el cambio en la siguiente consulta

#### Scenario: Marcador parcial no puntúa
- **WHEN** el administrador captura 1-0 en un partido en vivo sin finalizarlo
- **THEN** ningún usuario suma puntos por ese partido y el ranking público no cambia

#### Scenario: La finalización habilita los puntos
- **WHEN** el administrador marca como finalizado un partido con marcador capturado
- **THEN** los puntos de ese partido aparecen en el detalle de cada usuario y en el ranking en la siguiente consulta

#### Scenario: Des-finalizar retira los puntos
- **WHEN** el administrador quita la finalización de un partido para corregirlo
- **THEN** los puntos de ese partido dejan de contar en la siguiente consulta hasta que vuelva a finalizarse

### Requirement: Detalle de puntos del participante
El usuario autenticado SHALL poder consultar su total de puntos acumulados y
el detalle por partido (pronóstico, marcador final, resultado oficial, punto
obtenido). El detalle MUST incluir únicamente partidos finalizados: un partido
en vivo con marcador parcial MUST NOT aparecer como puntuado ni contarse como
"partido con marcador".

#### Scenario: Consulta de puntos propios
- **WHEN** un usuario `activo` consulta su detalle de puntos
- **THEN** ve su total acumulado y, por cada partido finalizado, su pronóstico y el punto obtenido (1 o 0)

#### Scenario: Partido en vivo fuera del detalle
- **WHEN** un partido está en vivo con marcador parcial capturado
- **THEN** el detalle de puntos no lo incluye ni en el total ni en el conteo de partidos con marcador
