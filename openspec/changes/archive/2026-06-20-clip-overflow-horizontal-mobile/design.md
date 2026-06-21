## Context

Los layouts con shell (`app/(participante)/layout.tsx` y `app/admin/layout.tsx`)
tienen la misma estructura: un root `<div className="flex min-h-dvh flex-col">`,
un `<header>` sticky con un `<nav>` `overflow-x-auto`, y un `<main>` que contiene
la tira de días (`DayFilter`, también `overflow-x-auto`). En móvil el contenido
ancho de esos dos scrollers empuja el ancho del documento, así que la página
entera scrollea en horizontal hacia espacio vacío, aunque cada scroller tenga su
propio scroll interno.

## Goals / Non-Goals

**Goals:**
- El documento nunca scrollea en horizontal en móvil.
- Los scrollers internos (nav, tira de días) siguen scrolleando su contenido.
- El header sticky sigue funcionando.

**Non-Goals:**
- Cambiar el markup o el comportamiento de nav y `DayFilter`.
- Tocar el layout público (no tiene estos scrollers).

## Decisions

### D1 — `overflow-x-clip` en el root del shell

Se añade `overflow-x-clip` al `<div className="flex min-h-dvh flex-col">` root de
ambos layouts. Recorta el desbordamiento horizontal del documento en el borde del
viewport, eliminando el scroll a espacio vacío.

**Por qué `clip` y no `hidden`:**

| | `overflow-x: clip` | `overflow-x: hidden` |
|---|---|---|
| Mata el scroll horizontal de página | ✅ | ✅ |
| Crea contenedor de scroll | no | sí |
| Rompe el `position: sticky` del header | no | sí (al forzar `overflow-y: auto`) |

Por el spec de CSS Overflow, cuando un eje es `clip` y el otro `visible`, el eje
`visible` **no** se muta a `auto` (la regla de mutación solo aplica si el primero
es "ni visible ni clip"). Así `overflow-x: clip` + `overflow-y: visible` conserva
el documento como contenedor de scroll vertical y el header sticky intacto.
`hidden`, en cambio, forzaría `overflow-y: auto` y crearía un scroll-container que
descoloca el sticky.

**Alternativas consideradas:**
- *`overflow-x-hidden` en `body`:* rompe el sticky del header y es menos preciso.
- *Arreglar cada scroller (min-w-0, quitar `-mx-1`, etc.):* más cirugía, frágil, y
  no garantiza que un futuro scroller no reintroduzca la fuga; el clip en el root
  es la red de seguridad correcta a nivel de shell.

## Risks / Trade-offs

- **¿Recorta el bleed intencional del `-mx-1`/glow de la tira?** → No. El clip está
  en el borde del viewport; ese bleed (4px) vive dentro del `px-5` (20px) de
  `main`, lejos del borde. Los anillos de foco/glow de las celdas siguen visibles.
- **¿Afecta el sticky del header?** → No, por la razón de D1.
- **Layout público** → fuera de alcance; no tiene nav scroller ni tira de días.
