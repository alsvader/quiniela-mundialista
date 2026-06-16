## Context

La app corre en Next.js 16 (App Router) + TypeScript. Ya existe un borrador sin
commitear `app/manifest.ts` generado a partir de un ejemplo, pero es inválido en la
práctica: referencia `/icons/icon-192x192.png` (carpeta que no existe) y usa colores
blancos. El usuario ya generó un set completo de íconos (realfavicongenerator) en
`public/favicon/`: `favicon.ico`, `favicon.svg` (~2.6 MB), `favicon-96x96.png`,
`apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`.

DESIGN.md define el tema oscuro de marca: `background: #1a0b2e`, acentos cyan
(`#00dce6`/`#00f3ff`) y secundario magenta. `app/layout.tsx` ya define `metadata`
(title/description) pero no íconos ni `appleWebApp`. `app/favicon.ico` existe pero es
el ícono genérico por defecto de Next, no el de marca.

Este es un cambio acotado de configuración/metadata, sin impacto en datos ni en la
lógica de negocio. Se documenta por las decisiones de superficie (dónde viven los
íconos, qué se declara dónde) que conviene fijar antes de codificar.

## Goals / Non-Goals

**Goals:**
- Manifest válido e instalable con identidad de marca (colores `#1a0b2e`, íconos reales).
- Íconos correctamente conectados en las tres superficies de Next: manifest (PWA),
  `metadata.icons` (favicon + iOS) y `viewport` (theme-color del navegador).
- Favicon de marca en lugar del default de Next.
- Evitar regresiones de rendimiento por el SVG pesado.

**Non-Goals:**
- Service worker, offline, caching, instalación promovida (prompt `beforeinstallprompt`).
- Notificaciones push (fuera de alcance V1).
- Rediseñar o regenerar los íconos (los assets ya existen); solo se conectan.
- Screenshots/shortcuts del manifest u otras features avanzadas de PWA.

## Decisions

### D1: Íconos en `public/favicon/` referenciados por ruta, no convenciones `app/icon.*`

El manifest obliga a declarar rutas explícitas para los íconos 192/512 de cualquier
modo. Usar las convenciones de archivo de Next (`app/icon.png`, `app/apple-icon.png`)
solo cubriría favicon/apple-touch y dejaría el set partido en dos fuentes de verdad.
Mantener todo el set generado en una sola carpeta y referenciarlo es más coherente.

**Alternativa considerada:** convenciones `app/icon.*` — descartada por fragmentar el
set y duplicar el modelo mental; la ganancia (hashing de cache-busting) es marginal
para íconos que casi no cambian.

**Excepción:** `app/favicon.ico` se mantiene como convención (Next lo auto-detecta sin
fricción); solo se reemplaza su contenido por el favicon de marca.

### D2: Reparto por superficie

| Superficie            | Qué declara                                              |
|-----------------------|----------------------------------------------------------|
| `app/manifest.ts`     | PWA: name/short_name/description, start_url, display, theme/background `#1a0b2e`, íconos 192+512 (`any`+`maskable`) |
| `app/layout.tsx` `metadata.icons` | favicon (`favicon-96x96.png`, ico) + `apple` (`apple-touch-icon.png`) |
| `app/layout.tsx` `metadata.appleWebApp` | `capable`, `title: "Quiniela"`, `statusBarStyle` |
| `app/layout.tsx` `viewport` export | `themeColor: "#1a0b2e"` |

iOS Safari **ignora** el manifest para el ícono de inicio; por eso el `apple-touch-icon`
va sí o sí en `metadata.icons.apple`.

### D3: Colores de marca, no blanco

`theme_color` y `background_color` = `#1a0b2e` (background canónico). Se prefiere el
morado oscuro sobre el cyan de acento: el cyan pintaría toda la barra del sistema y
rompería la inmersión; el morado funde barra/splash con la app (sensación nativa).
El cyan permanece como acento dentro del contenido, no en el chrome del sistema.

### D4: `purpose` `any` + `maskable` en cada ícono PWA

Declarar ambos propósitos evita que plataformas que esperan íconos de borde completo
recorten un ícono marcado solo como `maskable` (problema del borrador actual).

### D5: Resolución del `favicon.svg` de 2.6 MB

Un favicon SVG de 2.6 MB es un riesgo real de rendimiento: Chrome/Firefox prefieren el
SVG y lo descargarían en cada visita. Durante la implementación se intentará optimizar
a < 50 KB; si el SVG lleva un raster incrustado (probable, dado el peso) y no se logra,
**no se declarará** como ícono y la app usará `.ico` + PNG. Decisión a confirmar al
inspeccionar el archivo durante la implementación.

## Risks / Trade-offs

- **SVG pesado servido como favicon** → mitigación D5: optimizar u omitir el enlace.
- **Rutas de íconos mal escritas (vuelven 404)** → verificar cada `src` contra archivos
  reales en `public/favicon/` y probar las URLs tras desplegar.
- **iOS sin apple-touch-icon** → cubierto explícitamente en `metadata.icons.apple` (D2).
- **Caché de favicon/manifest agresiva** → tras deploy, validar en una sesión limpia /
  con devtools que se sirve el manifest y los íconos nuevos.
- **theme-color soportado de forma desigual** → es progresivo; degrada limpio en
  navegadores que lo ignoran.

## Migration Plan

1. Copiar `public/favicon/favicon.ico` sobre `app/favicon.ico` (reemplaza el default).
2. Corregir `app/manifest.ts` (rutas, colores, purposes).
3. Wirear `metadata.icons`, `metadata.appleWebApp` y `viewport` en `app/layout.tsx`.
4. Resolver el `favicon.svg` (optimizar u omitir enlace) según D5.
5. Verificar en local (`/manifest.webmanifest`, sin 404 de íconos) y tras deploy en
   Vercel (instalable en Android, apple-touch-icon en iOS).

**Rollback:** revertir los archivos tocados (`app/manifest.ts`, `app/layout.tsx`,
`app/favicon.ico`); no hay migraciones de datos ni estado persistente involucrado.

## Open Questions

- ¿El `favicon.svg` es vectorizable a < 50 KB o lleva raster incrustado? Se decide al
  inspeccionarlo durante la implementación (D5).
