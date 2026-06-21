## Why

En móvil la página puede hacer scroll horizontal hacia la derecha, dejando un
espacio vacío, aunque el contenido se vea bien acomodado al cargar. La causa son
los dos *scrollers* horizontales del shell —la barra de navegación (`nav` con
`overflow-x-auto`) y la tira de días (`DayFilter`)— cuyo contenido ancho empuja
el ancho del documento en lugar de quedar contenido en su propio scroll.

## What Changes

- El root de los layouts con shell (`app/(participante)/layout.tsx` y
  `app/admin/layout.tsx`) recorta el desbordamiento horizontal con
  `overflow-x-clip`, de modo que el documento nunca scrollea en horizontal.
- Los scrollers internos (nav y tira de días) conservan su `overflow-x-auto` y
  siguen scrolleando su propio contenido; solo se elimina la fuga al documento.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `match-schedule`: se añade la garantía de que la tira de días, al desbordar su
  ancho, scrollea internamente y **no** provoca scroll horizontal de la página.
  (El fix de shell cubre además el `nav`, que no es una capability con spec.)

## Impact

- `app/(participante)/layout.tsx` y `app/admin/layout.tsx`: añadir `overflow-x-clip`
  al `<div>` root del shell.
- Sin cambios de servidor, datos, dependencias ni de los componentes scroller.
- Los scrollers internos (nav, tira de días) conservan su `overflow-x-auto`.
