## MODIFIED Requirements

### Requirement: Derivación del resultado oficial
El sistema SHALL determinar el resultado oficial de un partido según su temporada. En
**grupos** lo SHALL derivar automáticamente de los goles capturados por el
administrador (gana local, empate o gana visitante) y MUST NOT almacenarlo de forma
independiente a los goles. En **eliminatoria** no existe el empate como desenlace: el resultado oficial
es **quién avanza** a la siguiente ronda (gana local o gana visitante), un dato
capturado explícitamente por el administrador, porque un empate a 90'/prórroga
definido por penales no puede derivarse de los goles. Los goles de un partido de
eliminatoria se conservan para mostrar el marcador, pero NO determinan el resultado
oficial.

#### Scenario: Victoria local en grupos
- **WHEN** el administrador captura más goles para el equipo local que para el visitante en un partido de grupos
- **THEN** el resultado oficial del partido es "gana local"

#### Scenario: Empate en grupos
- **WHEN** el administrador captura el mismo número de goles para ambos equipos en un partido de grupos
- **THEN** el resultado oficial del partido es "empate"

#### Scenario: Quién avanza en eliminatoria con empate a 90'
- **WHEN** un partido de eliminatoria termina 1-1 y el administrador marca que avanza el visitante (penales)
- **THEN** el resultado oficial del partido es "gana visitante" (quién avanza), sin importar que los goles estén empatados

#### Scenario: Quién avanza en eliminatoria con marcador definido
- **WHEN** un partido de eliminatoria termina 2-0 a favor del local
- **THEN** el resultado oficial es "gana local" (avanza el local), coherente con el marcador

### Requirement: Puntuación por acierto de resultado
El sistema SHALL otorgar 1 punto cuando el pronóstico del usuario coincide con el
resultado oficial, y 0 puntos en caso contrario. En **grupos** se compara el
pronóstico L/E/V contra el resultado derivado de los goles. En **eliminatoria** se
compara el pronóstico L/V contra **quién avanzó**. Los goles MUST NOT participar en
la comparación de eliminatoria: solo cuenta quién avanza.

#### Scenario: Acierto independiente del marcador en grupos
- **WHEN** un usuario pronosticó "gana local" y el partido de grupos terminó 5-0 o 1-0 a favor del local
- **THEN** obtiene exactamente 1 punto en ambos casos

#### Scenario: Acierto por quién avanza en eliminatoria
- **WHEN** un usuario pronosticó que avanza el visitante y el partido de eliminatoria terminó 1-1 con el visitante avanzando por penales
- **THEN** obtiene 1 punto, aunque el marcador haya sido empate

#### Scenario: Error en eliminatoria
- **WHEN** un usuario pronosticó que avanza el local y avanzó el visitante
- **THEN** obtiene 0 puntos en ese partido

#### Scenario: Partido sin pronóstico
- **WHEN** un partido con resultado oficial no tiene pronóstico de un usuario
- **THEN** ese usuario obtiene 0 puntos en ese partido

### Requirement: Puntos calculados al vuelo
Los puntos totales de cada usuario y el ranking MUST calcularse siempre a partir de
pronósticos y del resultado oficial de cada partido, nunca almacenarse como totales
editables. Solo los partidos **finalizados** SHALL participar en la puntuación. En
**eliminatoria**, además de estar finalizado, un partido MUST tener definido quién
avanza para puntuar: un partido empatado a 90' aún sin ganador definido MUST NOT
sumar puntos ni mover el ranking. Una corrección del marcador, de quién avanza o de
la finalización SHALL reflejarse automáticamente en puntos y ranking sin
intervención adicional.

#### Scenario: Corrección de quién avanza recalcula puntos
- **WHEN** el administrador corrige un partido de eliminatoria para que avance el otro equipo
- **THEN** el resultado oficial cambia y los puntos y el ranking de todos los usuarios reflejan el cambio en la siguiente consulta

#### Scenario: Eliminatoria finalizada sin ganador no puntúa
- **WHEN** un partido de eliminatoria está finalizado con marcador empatado pero sin que el administrador haya definido quién avanza
- **THEN** ningún usuario suma puntos por ese partido y el ranking no cambia hasta que se defina quién avanza

#### Scenario: Marcador parcial no puntúa
- **WHEN** el administrador captura un marcador en un partido en vivo sin finalizarlo
- **THEN** ningún usuario suma puntos por ese partido y el ranking público no cambia
