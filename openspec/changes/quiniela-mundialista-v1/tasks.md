# Tasks: Quiniela Mundialista V1

## 1. Fundación del proyecto

- [x] 1.1 Inicializar app Next.js (App Router) con TypeScript y Tailwind CSS; repositorio git
- [ ] 1.2 Crear proyecto Supabase y configurar variables de entorno locales (`.env.local` + `.env.example` con URL, anon key, service role key, ADMIN_EMAIL, ADMIN_PASSWORD)
- [x] 1.3 Configurar clientes de Supabase para servidor (Server Components/Actions) y navegador, con manejo de sesión por cookies (`@supabase/ssr`)
- [x] 1.4 Integrar sistema de diseño: DESIGN.md (export de Google Stitch) y PRODUCT.md en la raíz; mapear tokens de DESIGN.md a la configuración de Tailwind

## 2. Esquema de base de datos y RLS

- [x] 2.1 Migración: enums (`user_status`, `user_role`, `match_phase` con las 7 fases, `pick`) y tablas `profiles`, `matches`, `predictions` (PK compuesta user_id+match_id, `updated_at`), `app_settings`
- [x] 2.2 Restricciones: alias único, FK `profiles.id` → `auth.users.id`, goles no negativos y capturados en pareja (ambos o ninguno)
- [x] 2.3 Políticas RLS: `profiles` (propio + admin), `predictions` (dueño + admin), `matches` (lectura pública, escritura admin), `app_settings` (lectura pública del número, escritura admin)

## 3. Lógica de dominio (server-only, con tests)

- [x] 3.1 Función `isJornadaOpen(matchDate, now)` con zona America/Mexico_City y tests unitarios de bordes (23:59:59 abierta, 00:00:00 cerrada)
- [x] 3.2 Funciones de derivación: resultado oficial desde goles y punto (0/1) desde pronóstico vs resultado, con tests
- [x] 3.3 Helpers de autorización: `requireSession`, `requireActiveUser`, `requireAdmin` (validan contra `profiles` en servidor)

## 4. Seeds

- [x] 4.1 Archivo estático del fixture: 72 partidos de fase de grupos del Mundial 2026 (equipos, grupo, kickoff UTC, `match_date` precalculada en America/Mexico_City) y script/migración de carga
- [x] 4.2 Script idempotente de creación del admin (Auth + perfil rol `admin` estado `activo`) usando service role key y variables de entorno
- [x] 4.3 Verificación del seed: conteo de 72 partidos, fechas de jornada correctas en días limítrofes de huso horario

## 5. Autenticación y registro

- [x] 5.1 Página de registro: email, contraseña, nombre completo, alias (obligatorio, único), teléfono; crea cuenta Auth + perfil `pendiente`
- [x] 5.2 Página de login y logout; manejo de errores con mensajes genéricos
- [x] 5.3 Redirección raíz según sesión/rol (sin sesión → login; participante → partidos; admin → panel)

## 6. Flujo de cuenta pendiente

- [x] 6.1 Banner persistente para usuarios `pendientes` con advertencia explícita de pérdida de jornadas cerradas y fecha límite de la próxima jornada
- [x] 6.2 Modal informativo al iniciar sesión para usuarios `pendientes`
- [x] 6.3 Botón de contacto WhatsApp: deep link `wa.me` al número de `app_settings` con mensaje prellenado (nombre, correo, teléfono)
- [x] 6.4 Estado `desactivado`: mismo bloqueo de guardado con mensaje propio de cuenta desactivada

## 7. Calendario y pronósticos

- [x] 7.1 Página de partidos: jornadas agrupadas por `match_date`, partidos con equipos, grupo y hora; indicador de jornada abierta/cerrada
- [x] 7.2 UI de selección L/E/V por partido (solo interactiva para usuarios `activos` en jornadas abiertas; solo lectura en caso contrario)
- [x] 7.3 Server Action de guardado por jornada completa: valida sesión, estado `activo`, jornada abierta y cobertura total de partidos del día; upsert en bloque con `updated_at`
- [x] 7.4 Mostrar pronósticos guardados, fecha/hora de última modificación y errores de validación (jornada incompleta, cerrada, cuenta no activa)

## 8. Puntuación y ranking

- [x] 8.1 Query de ranking: puntos calculados al vuelo (pick vs resultado derivado de goles), solo usuarios `activos` rol participante, orden descendente
- [x] 8.2 Página pública `/ranking` (sin sesión): posición, alias, puntos
- [x] 8.3 Página "mis puntos": total acumulado y detalle por partido (pronóstico, marcador, resultado oficial, punto 1/0)

## 9. Panel administrativo

- [x] 9.1 Layout `/admin` protegido por rol en servidor (segmento + verificación en cada action)
- [x] 9.2 Usuarios: lista con nombre, alias, correo, teléfono, estado y fecha de registro; acciones activar/desactivar
- [x] 9.3 Partidos: lista con captura/corrección de marcadores (goles local/visitante)
- [x] 9.4 Partidos: crear y editar (fase, fecha, hora, equipos)
- [x] 9.5 Configuración: ver y actualizar número de WhatsApp
- [x] 9.6 Ranking: vista de la clasificación desde el panel

## 10. Verificación y despliegue

- [x] 10.1 Prueba de flujo completo en local: registro → pendiente (banner/modal/WhatsApp) → activación → pronóstico de jornada → cierre → captura de marcador → puntos y ranking → corrección de marcador recalcula
- [x] 10.2 Verificar accesos: pendiente/desactivado no guardan (también vía request directa), participante no entra a `/admin`, ranking visible sin sesión
- [x] 10.3 Auditoría de UI con el skill `impeccable` (audit/polish) sobre los flujos principales: registro, pendiente, pronósticos, ranking público y panel admin; corregir hallazgos
- [ ] 10.4 Deploy en Vercel con variables de entorno, aplicar migraciones y seeds en Supabase de producción, ejecutar seed de admin y prueba de humo en producción

## 11. Banderas por país (ampliación V1, design.md D10)

- [x] 11.1 Columnas `home_code`/`away_code` (text, nullable) en `matches` — amendar 0001/0002 (aún sin desplegar) y `supabase db reset` local
- [x] 11.2 Mapa equipo→código ISO en `scripts/generate-fixture-seed.py` (48 equipos, incl. `gb-eng`, `gb-sct`, `cw`) y regenerar el seed con códigos en los 72 partidos
- [x] 11.3 Assets SVG de banderas (paquete `flag-icons`, solo los necesarios) y componente `TeamFlag` con desaturación-hasta-hover (DESIGN.md) y fallback sin bandera
- [x] 11.4 Banderas en todos los listados: tarjetas de jornada (form y cerradas), tabla de mis puntos y lista de partidos del admin
- [x] 11.5 Campos opcionales de código de bandera en el formulario de crear/editar partido del admin
- [x] 11.6 Verificación: regenerar seed y validar 72×2 códigos, actualizar e2e visual (banderas visibles, fallback sin código) y re-correr tests/build

## 12. Bolsa acumulada y premiación (ampliación V1, design.md D11)

- [x] 12.1 Módulo `lib/domain/prize.ts`: constantes (entrada $100 MXN, comisión 30%, 3 premiados), cálculo de bolsa desde conteo de activos y reparto con corte compartido; tests (bolsa de 10 activos = $700; caso 10,8,7,7 → 233.33/233.33/116.67/116.67; menos premiados que participantes)
- [x] 12.2 Conteo de usuarios activos en queries y componente de bolsa en `/partidos`: monto en formato MXN arriba a la derecha, junto al encabezado "Partidos"
- [x] 12.3 Verificación: tests de dominio, e2e (bolsa visible con el monto derivado del número de activos), lint y build
- [x] 12.4 Bolsa en la página pública `/ranking`: mismo `PrizePoolCard` bajo el encabezado, antes de la clasificación; check e2e de visibilidad sin sesión

## 13. Reparto ponderado 50/30/20 (revisión de D11)

- [x] 13.1 Reimplementar `prizeDistribution` en `lib/domain/prize.ts`: pesos 50/30/20, grupos de empatados comparten la suma de las porciones de las posiciones que ocupan, renormalización con menos de 3 participantes; reescribir tests con el catálogo completo (sin empates; doble y triple en 1°; cuádruple en 1°; empates en 2°; doble y triple en el corte; todos empatados; 2 participantes; monotonía y suma ≤ bolsa)
- [x] 13.2 Actualizar el texto del `PrizePoolCard` si aplica (los premios ya no son partes iguales: "1° 50% · 2° 30% · 3° 20%") y verificación completa: tests, e2e, lint y build

## 14. Validación schema-first con zod (design.md D12)

- [x] 14.1 Instalar zod y crear `lib/schemas.ts`: schemas con normalización (transforms) y tipos inferidos para registro/completar perfil (campos compartidos), guardado de jornada (fecha + picks H|D|A), marcador, partido (fase, equipos, códigos de bandera, kickoff), estado de usuario y número de WhatsApp
- [x] 14.2 Migrar las 7 Server Actions a `safeParse` con `fieldErrors` derivados del schema, eliminando las validaciones manuales duplicadas; conservar mensajes y comportamiento observable (mismos escenarios de spec)
- [x] 14.3 Verificación de no-regresión: tests de dominio, e2e completo (24 checks), lint y build
