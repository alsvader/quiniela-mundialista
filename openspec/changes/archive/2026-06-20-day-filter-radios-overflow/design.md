## Context

El day-filter modela la selección con radios nativos marcados `sr-only`. La utilidad
`sr-only` de Tailwind aplica `position: absolute` (entre otras). Los radios no tienen
ningún ancestro posicionado (`position: relative/absolute/...`), así que su bloque
contenedor es el initial containing block (`html`).

La tira (`role="radiogroup"`) es `overflow-x-auto`: scrollea su contenido. Pero un
descendiente con posición absoluta cuyo bloque contenedor es `html` **no** es
recortado por el `overflow` de un ancestro intermedio. Como las posiciones estáticas
de los radios caen en las coordenadas anchas del contenido scrolleable (~1152px en
móvil), los radios se proyectan hasta ~1137px en coordenadas de viewport y
`html.scrollWidth` crece, habilitando scroll horizontal de página. El
`overflow-x-clip` del shell tampoco los atrapa, por la misma razón.

Medición (Playwright, `/admin/partidos`, viewport 390): antes `html.scrollWidth=1137`;
los elementos que desbordaban eran `<input class="sr-only">` en `right` hasta 1137.

## Goals / Non-Goals

**Goals:**
- Contener los radios `sr-only` para que no ensanchen el documento.
- No alterar accesibilidad (siguen ocultos visualmente y operables) ni el layout.

**Non-Goals:**
- Quitar `sr-only` o cambiar el modelo de radios nativos.
- Quitar el `overflow-x-clip` del shell (se mantiene como defensa en profundidad).

## Decisions

### D1 — `position: relative` en cada celda (`cellClass`)

Añadir `relative` a `cellClass` hace que cada `<label>` sea el bloque contenedor de
su radio absoluto. El radio pasa a posicionarse dentro de la celda (que está en el
flujo de la tira y es recortada por su `overflow-x-auto`), así que deja de
proyectarse contra `html`. Medición posterior: `html.scrollWidth=390` (= viewport,
overflow 0).

`cellClass` la comparten la celda "Todos" y las de día, así que una sola línea cubre
ambas.

**Alternativas consideradas:**
- *`relative` en la tira (contenedor):* no basta — el bloque contenedor de un
  absoluto es el ancestro posicionado más cercano, pero recortar requiere que ese
  ancestro sea además el que tiene `overflow`; conviene posicionar en la celda, la
  unidad que efectivamente vive dentro del scroll.
- *Reemplazar `sr-only` por `appearance-none opacity-0`:* cambia el patrón de radios
  y arrastra estilos; `relative` es mínimo y local.

## Risks / Trade-offs

- **¿Afecta el foco/click del radio?** → No: `relative` no cambia el flujo; el radio
  sigue `sr-only` y operable, y el anillo de foco se refleja en la celda vía
  `has-[:focus-visible]` como antes.
- **¿Afecta el centrado o el snap?** → No: son comportamientos del scroll de la tira,
  independientes del `position` de las celdas.
