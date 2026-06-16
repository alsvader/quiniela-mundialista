## Why

La app se consulta principalmente desde el móvil (revisar partidos, pronosticar, ver
ranking), pero hoy no es "instalable": no hay un Web App Manifest válido ni los íconos
están conectados. Existe un borrador `app/manifest.ts` sin commitear que apunta a rutas
de íconos inexistentes (`/icons/icon-192x192.png`) y usa colores blancos que chocan con
el tema oscuro de la marca. Habilitar la instalación PWA da acceso desde la pantalla de
inicio, splash y barra de estado con identidad propia, sin costo de infraestructura.

## What Changes

- Corregir y completar `app/manifest.ts` para que sea un manifest válido e instalable:
  rutas reales de íconos en `/favicon/`, cada ícono con `purpose` `any` **y** `maskable`,
  y `theme_color`/`background_color` con el morado de marca `#1a0b2e` (hoy `#ffffff`).
- Conectar la metadata de íconos e iOS en `app/layout.tsx` (`metadata.icons` y
  `appleWebApp`): iOS Safari ignora el manifest, así que el `apple-touch-icon` debe
  declararse aquí explícitamente.
- Agregar el `viewport` export con `themeColor: #1a0b2e` para la barra del navegador.
- Reemplazar `app/favicon.ico` (actualmente el default genérico de Next) por el favicon
  de marca generado por el usuario en `public/favicon/favicon.ico`.
- Resolver el `favicon.svg` de 2.6 MB: optimizarlo a un tamaño razonable o no declararlo
  como ícono, para no penalizar la carga (los navegadores modernos prefieren el SVG y lo
  descargarían en cada visita).

## Capabilities

### New Capabilities
- `pwa-manifest`: La app expone un Web App Manifest válido y un set de íconos conectado
  (favicon, apple-touch-icon, íconos PWA 192/512) que la hace instalable en móvil y
  escritorio con identidad visual de marca (nombre, colores, splash).

### Modified Capabilities
<!-- Ninguna: no cambian requisitos de capabilities existentes. -->

## Impact

- **Código**: `app/manifest.ts` (corregir), `app/layout.tsx` (metadata `icons` +
  `appleWebApp` + `viewport`), `app/favicon.ico` (reemplazar asset).
- **Assets**: `public/favicon/` (set ya generado; posible optimización de `favicon.svg`).
- **Dependencias**: ninguna nueva. Solo APIs nativas de metadata de Next.js 16.
- **Sin impacto** en datos, Supabase, auth, scoring ni Server Actions.
