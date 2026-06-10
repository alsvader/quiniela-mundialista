<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Quiniela Mundialista

Quiniela del Mundial 2026 (fase de grupos en V1). Toda la planeación vive en OpenSpec:
`openspec/changes/quiniela-mundialista-v1/` (proposal, design, specs, tasks) y las
decisiones de producto/stack en `openspec/config.yaml`.

## Flujo de trabajo de UI (obligatorio)

- Toda tarea que cree o modifique interfaz (páginas, componentes, estilos, estados
  vacíos/de error, formularios) DEBE invocar el skill `impeccable` para el trabajo de
  diseño/implementación visual, y consultar `ui-ux-pro-max` para decisiones de
  patrones, paletas, tipografía y guidelines UX.
- `DESIGN.md` (raíz, formato Google Stitch) es la fuente de verdad visual: tokens,
  colores, tipografía y componentes definidos ahí NO se reinventan. `PRODUCT.md`
  define registro, audiencia y personalidad de marca.
- No inventar paletas ni fuentes nuevas si DESIGN.md ya las define.
- UI en español. Registro "product" (app/herramienta, el diseño sirve al producto),
  salvo la página pública de ranking que puede tener tratamiento más expresivo.

## Reglas técnicas

- Next.js App Router + TypeScript + Tailwind; Supabase (Auth + Postgres); Vercel.
- Server Components para lectura, Server Actions para mutaciones; lógica de negocio
  y autorización SIEMPRE en servidor (la UI nunca es la única defensa).
- Zona horaria canónica: America/Mexico_City (jornadas y cierres).
- Puntos y ranking siempre derivados (nunca almacenados); ver design.md D5.
