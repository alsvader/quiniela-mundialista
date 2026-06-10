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
- **THEN** comparten posición en el ranking (posición estándar de competencia: 1, 2, 2, 4); para la premiación aplica el reparto con corte compartido definido en "Bolsa acumulada y premiación"

### Requirement: Bolsa acumulada y premiación
El sistema SHALL calcular la bolsa acumulada como: número de usuarios `activos` con rol participante × precio de entrada ($100 MXN) × 70% (el 30% restante es comisión de la plataforma). El monto MUST derivarse siempre del conteo actual de activos, nunca almacenarse. La bolsa se reparte entre los 3 primeros lugares del ranking en partes iguales; si hay empate en el corte de premiados, los empatados se reparten en partes iguales la(s) porción(es) que corresponden a las posiciones que ocupan. El pago de premios se realiza manualmente fuera de la aplicación: la app solo muestra los montos.

#### Scenario: Cálculo de la bolsa
- **WHEN** hay 10 usuarios activos con rol participante
- **THEN** la bolsa acumulada es $700 MXN (10 × $100 − 30%) y cada uno de los 3 primeros lugares corresponde a $233.33

#### Scenario: La activación actualiza la bolsa
- **WHEN** el administrador activa un usuario adicional
- **THEN** la bolsa mostrada refleja el nuevo total en la siguiente consulta, sin intervención manual

#### Scenario: Empate en el corte de premiados
- **WHEN** el ranking termina 10, 8, 7 y 7 puntos con bolsa de $700
- **THEN** el 1° y el 2° reciben $233.33 cada uno, y los dos empatados en el corte se reparten la parte del 3er lugar: $116.67 cada uno

#### Scenario: Bolsa visible en partidos
- **WHEN** un usuario autenticado consulta la página de partidos
- **THEN** ve la bolsa acumulada vigente en la parte superior, al lado derecho del encabezado "Partidos", en formato de pesos mexicanos

### Requirement: Detalle de puntos del participante
El usuario autenticado SHALL poder consultar su total de puntos acumulados y el detalle por partido (pronóstico, marcador final, resultado oficial, punto obtenido).

#### Scenario: Consulta de puntos propios
- **WHEN** un usuario `activo` consulta su detalle de puntos
- **THEN** ve su total acumulado y, por cada partido con resultado, su pronóstico y el punto obtenido (1 o 0)
