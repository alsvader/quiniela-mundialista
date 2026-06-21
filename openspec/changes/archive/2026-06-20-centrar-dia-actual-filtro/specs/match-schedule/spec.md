## ADDED Requirements

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
