## MODIFIED Requirements

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
