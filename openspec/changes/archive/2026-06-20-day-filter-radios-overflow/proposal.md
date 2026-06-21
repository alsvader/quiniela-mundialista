## Why

El fix anterior (`overflow-x-clip` en el shell) no eliminó el scroll horizontal de
página en móvil: medido en `/admin/partidos` a 390px, `html.scrollWidth` seguía en
1137px. La causa real son los radios `sr-only` del day-filter: la clase `sr-only`
los hace `position: absolute` y, al no tener ningún ancestro posicionado, su bloque
contenedor es el `html` (initial containing block). Sus posiciones estáticas viven
en las coordenadas anchas del contenido scrolleable de la tira (~1152px), así que
**escapan tanto al `overflow-x-auto` de la tira como al `overflow-x-clip` del root**
y ensanchan el documento.

## What Changes

- Cada celda (`<label>`) del day-filter recibe `position: relative` (vía `cellClass`),
  para que su radio `sr-only` quede contenido por la celda y, por ende, dentro del
  recorte del scroll de la tira. Con eso `html.scrollWidth` vuelve a igualar el
  viewport (medido: 390 = 390, overflow 0).
- El `overflow-x-clip` del shell se conserva como defensa en profundidad.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `match-schedule`: se refuerza el requisito "La tira de días no provoca scroll
  horizontal de página" con el caso de los controles de selección (radios), que no
  deben ensanchar el documento.

## Impact

- `components/day-filter.tsx`: añadir `relative` al inicio de `cellClass` (afecta
  por igual la celda "Todos" y las de día).
- Sin cambios de servidor, datos ni dependencias.
