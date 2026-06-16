## 1. Favicon de marca

- [x] 1.1 Copiar `public/favicon/favicon.ico` sobre `app/favicon.ico` (reemplaza el default de Next; verificar que el hash quede igual al de `public/favicon/favicon.ico`)

## 2. Web App Manifest

- [x] 2.1 Corregir las rutas de íconos en `app/manifest.ts` a `/favicon/web-app-manifest-192x192.png` y `/favicon/web-app-manifest-512x512.png`
- [x] 2.2 Declarar cada ícono del manifest con `purpose: "any"` y `purpose: "maskable"`
- [x] 2.3 Cambiar `theme_color` y `background_color` de `#ffffff` a `#1a0b2e`
- [x] 2.4 Verificar `name`, `short_name`, `description`, `start_url` y `display: "standalone"`

## 3. Metadata de íconos e iOS en el layout

- [x] 3.1 Agregar `metadata.icons` en `app/layout.tsx`: `icon` (favicon-96x96.png; el `.ico` se sirve vía la convención `app/favicon.ico` para no duplicar el link) y `apple` (apple-touch-icon.png)
- [x] 3.2 Agregar `metadata.appleWebApp` (`capable`, `title: "Quiniela"`, `statusBarStyle`)
- [x] 3.3 Agregar el `viewport` export con `themeColor: "#1a0b2e"`

## 4. Resolver el favicon.svg pesado

- [x] 4.1 Inspeccionar `public/favicon/favicon.svg`: es un PNG de 1254×1254 incrustado en base64 (raster envuelto, no vector real) → no optimizable a < 50 KB sin re-rasterizar
- [x] 4.2 Decisión D5: NO declarar el SVG como ícono; la app usa `.ico` + PNG (verificado: ningún `.svg` enlazado en `<head>`)

## 5. Verificación

- [x] 5.1 En local: `/manifest.webmanifest` se sirve HTTP 200 válido; los 5 íconos (192, 512, 96, apple-touch, favicon.ico) responden 200, ninguno 404
- [x] 5.2 Aplicar el skill `next-best-practices`: metadata/viewport conforme a Next 16 (consultada la doc oficial; `viewport` export separado de `metadata`, `tsc --noEmit` limpio)
- [ ] 5.3 Tras deploy en Vercel: instalable en Chrome Android (splash `#1a0b2e`) y apple-touch-icon visible al "Agregar a inicio" en iOS
