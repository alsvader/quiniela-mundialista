# Spec: scoring-ranking

## ADDED Requirements

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
Los puntos totales de cada usuario y el ranking MUST calcularse siempre a partir de pronósticos y goles capturados, nunca almacenarse como totales editables. Una corrección de marcador SHALL reflejarse automáticamente en puntos y ranking sin intervención adicional.

#### Scenario: Corrección de marcador recalcula puntos
- **WHEN** el administrador corrige un marcador de 2-1 a 1-1
- **THEN** el resultado oficial pasa de "gana local" a "empate" y los puntos y ranking de todos los usuarios reflejan el cambio en la siguiente consulta

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
- **THEN** se muestran con la misma puntuación sin criterio de desempate definido (pendiente para versiones futuras)

### Requirement: Detalle de puntos del participante
El usuario autenticado SHALL poder consultar su total de puntos acumulados y el detalle por partido (pronóstico, marcador final, resultado oficial, punto obtenido).

#### Scenario: Consulta de puntos propios
- **WHEN** un usuario `activo` consulta su detalle de puntos
- **THEN** ve su total acumulado y, por cada partido con resultado, su pronóstico y el punto obtenido (1 o 0)
