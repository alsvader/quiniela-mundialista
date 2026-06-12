# scoring-ranking Specification

## Purpose

Derivación del resultado oficial a partir de goles, puntuación por acierto de resultado, cálculo de puntos y ranking al vuelo, ranking público, bolsa acumulada con premiación y detalle de puntos del participante.

## Requirements

### Requirement: Derivación del resultado oficial
El sistema SHALL derivar automáticamente el resultado oficial de un partido (gana local, empate o gana visitante) a partir de los goles capturados por el administrador. El resultado oficial MUST NOT almacenarse de forma independiente a los goles.

#### Scenario: Victoria local
- **WHEN** el administrador captura más goles para el equipo local que para el visitante
- **THEN** el resultado oficial del partido es "gana local"

#### Scenario: Empate
- **WHEN** el administrador captura el mismo número de goles para ambos equipos
- **THEN** el resultado oficial del partido es "empate"

### Requirement: Puntuación por acierto de resultado
El sistema SHALL otorgar 1 punto cuando el pronóstico L/E/V del usuario coincide con el resultado oficial derivado, y 0 puntos en caso contrario. Los goles MUST NOT participar en la comparación: solo se compara resultado contra pronóstico.

#### Scenario: Acierto independiente del marcador
- **WHEN** un usuario pronosticó "gana local" y el partido terminó 5-0 o 1-0 a favor del local
- **THEN** obtiene exactamente 1 punto en ambos casos

#### Scenario: Error
- **WHEN** un usuario pronosticó "empate" y el partido terminó con victoria de cualquier equipo
- **THEN** obtiene 0 puntos en ese partido

#### Scenario: Partido sin pronóstico
- **WHEN** un partido con resultado capturado no tiene pronóstico de un usuario
- **THEN** ese usuario obtiene 0 puntos en ese partido

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

### Requirement: Ranking público
El sistema SHALL exponer un ranking accesible sin sesión, mostrando posición, alias y puntos acumulados en orden descendente de puntuación. Solo participan usuarios `activos` con rol de participante; los usuarios `pendientes`, `desactivados` y el administrador MUST quedar excluidos.

#### Scenario: Consulta sin sesión
- **WHEN** un visitante sin sesión abre la URL del ranking
- **THEN** ve la tabla con posición, alias y puntos de los participantes activos

#### Scenario: Desactivado oculto del ranking
- **WHEN** el administrador desactiva a un participante
- **THEN** el participante deja de aparecer en el ranking en la siguiente consulta

#### Scenario: Empate en puntos
- **WHEN** dos o más participantes tienen los mismos puntos
- **THEN** comparten posición en el ranking (posición estándar de competencia: 1, 2, 2, 4); para la premiación aplica el reparto ponderado por posiciones ocupadas definido en "Bolsa acumulada y premiación"

### Requirement: Bolsa acumulada y premiación
El sistema SHALL calcular la bolsa acumulada como: número de usuarios `activos` con rol participante × precio de entrada ($100 MXN) × 70% (el 30% restante es comisión de la plataforma). El monto MUST derivarse siempre del conteo actual de activos, nunca almacenarse. La bolsa se reparte ponderada entre los 3 primeros lugares del ranking: 50% al 1°, 30% al 2° y 20% al 3°. En caso de empate, los empatados se reparten en partes iguales la suma de las porciones de las posiciones (consecutivas) que ocupan. Si hay menos de 3 participantes, los porcentajes se renormalizan entre los lugares existentes. Se acepta que un premiado pueda cobrar menos que su boleto cuando un empate divide la porción menor (comportamiento estándar de bolsas compartidas). El pago de premios se realiza manualmente fuera de la aplicación: la app solo muestra los montos.

#### Scenario: Cálculo de la bolsa
- **WHEN** hay 10 usuarios activos con rol participante
- **THEN** la bolsa acumulada es $700 MXN (10 × $100 − 30%) y los premios son $350 (1°), $210 (2°) y $140 (3°)

#### Scenario: La activación actualiza la bolsa
- **WHEN** el administrador activa un usuario adicional
- **THEN** la bolsa mostrada refleja el nuevo total en la siguiente consulta, sin intervención manual

#### Scenario: Empate en primero absorbe las porciones que ocupa
- **WHEN** el ranking termina 10, 10 y 8 puntos con bolsa de $700
- **THEN** los dos empatados en primero se reparten 1° + 2° ($350 + $210 = $280 cada uno) y el de 8 puntos recibe el premio de 3° ($140); más puntos nunca cobra menos

#### Scenario: Empate triple en primero
- **WHEN** el ranking termina 10, 10, 10 y 8 puntos con bolsa de $700
- **THEN** los tres empatados ocupan las posiciones 1-3 y se reparten toda la bolsa ($233.33 cada uno); el de 8 puntos no recibe premio

#### Scenario: Empate en el corte de premiados
- **WHEN** el ranking termina 10, 8, 7 y 7 puntos con bolsa de $700
- **THEN** el 1° recibe $350, el 2° $210, y los dos empatados en el corte se reparten el premio de 3°: $70 cada uno

#### Scenario: Bolsa visible en partidos
- **WHEN** un usuario autenticado consulta la página de partidos
- **THEN** ve la bolsa acumulada vigente en la parte superior, al lado derecho del encabezado "Partidos", en formato de pesos mexicanos

#### Scenario: Bolsa visible en el ranking público
- **WHEN** cualquier visitante (con o sin sesión) consulta la página pública de ranking
- **THEN** ve la misma bolsa acumulada vigente, bajo el encabezado y antes de la clasificación, en formato de pesos mexicanos

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
