## ADDED Requirements

### Requirement: Web App Manifest instalable

La app SHALL exponer un Web App Manifest válido en `/manifest.webmanifest` (vía
`app/manifest.ts`) que permita la instalación en dispositivos móviles y de escritorio.
El manifest SHALL declarar `name`, `short_name`, `description`, `start_url`,
`display: "standalone"`, y los colores de marca en `theme_color` y `background_color`
con el morado canónico `#1a0b2e` definido en DESIGN.md (nunca blanco).

#### Scenario: Manifest servido y válido

- **WHEN** un navegador solicita `/manifest.webmanifest`
- **THEN** recibe un manifest con `name`, `short_name`, `start_url`,
  `display: "standalone"` y `theme_color`/`background_color` iguales a `#1a0b2e`

#### Scenario: App instalable en móvil

- **WHEN** una persona abre la app en un navegador móvil compatible (p. ej. Chrome Android)
- **THEN** el navegador ofrece "Agregar a pantalla de inicio" / instalar la PWA
- **AND** la app instalada arranca en `start_url` en modo `standalone` con splash de fondo `#1a0b2e`

### Requirement: Íconos PWA conectados y existentes

El manifest SHALL referenciar únicamente rutas de íconos que existen en `public/favicon/`.
SHALL incluir los íconos de `192x192` y `512x512`, y cada uno SHALL declararse tanto con
`purpose: "any"` como con `purpose: "maskable"` para evitar recortes en plataformas que
esperan íconos de borde completo.

#### Scenario: Rutas de íconos resuelven sin 404

- **WHEN** el navegador resuelve los íconos declarados en el manifest
- **THEN** cada `src` apunta a un archivo existente bajo `/favicon/` (no a `/icons/`)
- **AND** ninguna petición de ícono del manifest devuelve 404

#### Scenario: Íconos cubren maskable y any

- **WHEN** se inspeccionan los íconos del manifest
- **THEN** los tamaños `192x192` y `512x512` están presentes
- **AND** existe al menos una entrada con `purpose: "any"` y una con `purpose: "maskable"`

### Requirement: Íconos de favicon e iOS conectados en metadata

La app SHALL declarar en la metadata raíz (`app/layout.tsx`) los íconos de favicon
(`.ico`, `favicon-96x96.png` y, si aplica, el SVG) y el `apple-touch-icon` para iOS,
además de la configuración `appleWebApp`. Como iOS Safari ignora el Web App Manifest,
el `apple-touch-icon` SHALL declararse explícitamente en `metadata.icons.apple`.
El favicon principal de la app (`app/favicon.ico`) SHALL ser el favicon de marca
generado, no el ícono genérico por defecto de Next.js.

#### Scenario: Favicon de marca en lugar del default de Next

- **WHEN** se carga cualquier página
- **THEN** el favicon servido es el de marca (el de `public/favicon/favicon.ico`),
  no el ícono por defecto de Next.js

#### Scenario: iOS usa el apple-touch-icon de marca

- **WHEN** una persona usa "Agregar a pantalla de inicio" en iOS Safari
- **THEN** el ícono de la app en la pantalla de inicio es el `apple-touch-icon` de marca
  declarado en `metadata.icons.apple`

### Requirement: Color de tema del navegador

La app SHALL exponer un `viewport` export con `themeColor: "#1a0b2e"` para que la barra
del navegador en móvil adopte el color de marca y se funda con la interfaz oscura.

#### Scenario: Barra del navegador con color de marca

- **WHEN** se carga la app en un navegador móvil que respeta `theme-color`
- **THEN** la barra/chrome del navegador se muestra con el color `#1a0b2e`

### Requirement: Favicon SVG sin penalizar la carga

El asset `favicon.svg` SHALL servirse optimizado a un tamaño razonable (objetivo < 50 KB)
si se declara como ícono; de lo contrario NO SHALL declararse como ícono. La app NUNCA
SHALL enlazar un favicon SVG de varios megabytes que los navegadores descargarían por
preferencia sobre el `.ico`.

#### Scenario: No se sirve un SVG pesado como favicon

- **WHEN** se inspeccionan los íconos declarados
- **THEN** no existe un favicon SVG mayor a 50 KB enlazado
- **AND** si el SVG no fue optimizado, la app usa `.ico` + PNG y omite el enlace al SVG
