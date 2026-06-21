## MODIFIED Requirements

### Requirement: La tira de días no provoca scroll horizontal de página

La tira de días SHALL scrollearse internamente cuando su contenido excede el ancho del viewport, y la página MUST NOT volverse scrolleable en horizontal ni mostrar espacio vacío a la derecha. Los controles de selección de la tira (radios visualmente ocultos) MUST quedar contenidos dentro de la tira y MUST NOT ensanchar el documento, aun cuando estén posicionados de forma absoluta.

#### Scenario: Tira ancha no desborda el documento
- **WHEN** en móvil la tira de días tiene más días de los que caben en el ancho de la pantalla
- **THEN** la tira scrollea su propio contenido y el documento no permite scroll horizontal hacia espacio vacío

#### Scenario: El scroll interno de la tira se conserva
- **WHEN** el usuario arrastra horizontalmente dentro de la tira de días
- **THEN** la tira desplaza sus celdas con normalidad, sin que ello mueva el resto de la página

#### Scenario: Los radios de selección no ensanchan el documento
- **WHEN** la tira está scrolleada y sus radios ocultos (`sr-only`, posición absoluta) quedan en coordenadas más allá del viewport
- **THEN** los radios quedan contenidos por su celda y el ancho del documento (`html.scrollWidth`) no excede el del viewport
