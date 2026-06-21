## ADDED Requirements

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
