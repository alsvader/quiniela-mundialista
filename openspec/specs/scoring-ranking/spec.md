# scoring-ranking Specification

## Purpose

Derivación del resultado oficial a partir de goles, puntuación por acierto de resultado, cálculo de puntos y ranking al vuelo, ranking público, bolsa acumulada con premiación y detalle de puntos del participante.

## Requirements

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

### Requirement: Ranking público
El sistema SHALL exponer, para cada temporada (`grupos` y `eliminatoria`), un
ranking accesible sin sesión, mostrando posición, alias y puntos acumulados **de esa
temporada** en orden descendente de puntuación. Solo participan los usuarios con
participación `activo` en la temporada consultada; los usuarios sin participación en
esa temporada, los `desactivados` de esa temporada y el administrador MUST quedar
excluidos. Los puntos de una temporada MUST contar únicamente los partidos
finalizados de las fases de esa temporada.

#### Scenario: Consulta sin sesión
- **WHEN** un visitante sin sesión abre la URL del ranking de una temporada
- **THEN** ve la tabla con posición, alias y puntos de esa temporada de los participantes activos en ella

#### Scenario: Ranking por temporada aislado
- **WHEN** un usuario participa solo en `eliminatoria`
- **THEN** aparece únicamente en el ranking de `eliminatoria` y no en el de `grupos`

#### Scenario: Desactivado oculto del ranking
- **WHEN** el administrador desactiva la participación de un usuario en una temporada
- **THEN** el participante deja de aparecer en el ranking de esa temporada en la siguiente consulta

#### Scenario: Empate en puntos
- **WHEN** dos o más participantes tienen los mismos puntos en una temporada
- **THEN** comparten posición en el ranking (posición estándar de competencia: 1, 2, 2, 4); para la premiación aplica el reparto ponderado por posiciones ocupadas definido en "Bolsa acumulada y premiación"

### Requirement: Bolsa acumulada y premiación
El sistema SHALL calcular una bolsa acumulada **por temporada** como: número de
usuarios con participación `activo` en esa temporada × precio de entrada ($100 MXN)
× 70% (el 30% restante es comisión de la plataforma). Cada temporada tiene su propia
bolsa, independiente de la otra. El monto MUST derivarse siempre del conteo actual de
participantes activos de esa temporada, nunca almacenarse. La bolsa de cada temporada
se reparte ponderada entre los 3 primeros lugares del ranking de esa temporada: 50%
al 1°, 30% al 2° y 20% al 3°. En caso de empate, los empatados se reparten en partes
iguales la suma de las porciones de las posiciones (consecutivas) que ocupan. Si hay
menos de 3 participantes, los porcentajes se renormalizan entre los lugares
existentes. Se acepta que un premiado pueda cobrar menos que su boleto cuando un
empate divide la porción menor (comportamiento estándar de bolsas compartidas). El
pago de premios se realiza manualmente fuera de la aplicación: la app solo muestra
los montos.

#### Scenario: Cálculo de la bolsa por temporada
- **WHEN** una temporada tiene 10 usuarios con participación activa
- **THEN** la bolsa de esa temporada es $700 MXN (10 × $100 − 30%) y los premios son $350 (1°), $210 (2°) y $140 (3°)

#### Scenario: Bolsas independientes entre temporadas
- **WHEN** `grupos` tiene 20 participantes activos y `eliminatoria` tiene 8
- **THEN** la bolsa de `grupos` es $1,400 y la de `eliminatoria` es $560, calculadas por separado

#### Scenario: La confirmación de pago actualiza la bolsa
- **WHEN** el administrador confirma la participación de un usuario adicional en una temporada
- **THEN** la bolsa de esa temporada refleja el nuevo total en la siguiente consulta, sin intervención manual

#### Scenario: Empate en primero absorbe las porciones que ocupa
- **WHEN** el ranking de una temporada termina 10, 10 y 8 puntos con bolsa de $700
- **THEN** los dos empatados en primero se reparten 1° + 2° ($350 + $210 = $280 cada uno) y el de 8 puntos recibe el premio de 3° ($140); más puntos nunca cobra menos

#### Scenario: Empate triple en primero
- **WHEN** el ranking termina 10, 10, 10 y 8 puntos con bolsa de $700
- **THEN** los tres empatados ocupan las posiciones 1-3 y se reparten toda la bolsa ($233.33 cada uno); el de 8 puntos no recibe premio

#### Scenario: Empate en el corte de premiados
- **WHEN** el ranking de una temporada termina 10, 8, 7 y 7 puntos con bolsa de $700
- **THEN** el 1° recibe $350, el 2° $210, y los dos empatados en el corte se reparten el premio de 3°: $70 cada uno

#### Scenario: Bolsa visible en partidos según la temporada vista
- **WHEN** un usuario autenticado consulta la página de partidos con una temporada seleccionada
- **THEN** ve la bolsa acumulada vigente de esa temporada en la parte superior del encabezado, en formato de pesos mexicanos

#### Scenario: Bolsa visible en el ranking público
- **WHEN** cualquier visitante consulta la página pública de ranking de una temporada
- **THEN** ve la bolsa acumulada vigente de esa temporada, bajo el encabezado y antes de la clasificación, en formato de pesos mexicanos

### Requirement: Detalle de puntos del participante
El usuario autenticado SHALL poder consultar, por cada temporada en la que participa,
su total de puntos acumulados y el detalle por partido (pronóstico, marcador final,
resultado oficial, punto obtenido). El detalle MUST incluir únicamente partidos
finalizados de las fases de esa temporada: un partido en vivo con marcador parcial
MUST NOT aparecer como puntuado ni contarse como "partido con marcador".

#### Scenario: Consulta de puntos propios por temporada
- **WHEN** un usuario que participa en una temporada consulta su detalle de puntos de esa temporada
- **THEN** ve su total acumulado y, por cada partido finalizado de esa temporada, su pronóstico y el punto obtenido (1 o 0)

#### Scenario: Partido en vivo fuera del detalle
- **WHEN** un partido está en vivo con marcador parcial capturado
- **THEN** el detalle de puntos no lo incluye ni en el total ni en el conteo de partidos con marcador
