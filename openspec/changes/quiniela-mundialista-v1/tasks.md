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

- [ ] 5.1 Página de registro: email, contraseña, nombre completo, alias (obligatorio, único), teléfono; crea cuenta Auth + perfil `pendiente`
- [ ] 5.2 Página de login y logout; manejo de errores con mensajes genéricos
- [ ] 5.3 Redirección raíz según sesión/rol (sin sesión → login; participante → partidos; admin → panel)

## 6. Flujo de cuenta pendiente

- [ ] 6.1 Banner persistente para usuarios `pendientes` con advertencia explícita de pérdida de jornadas cerradas y fecha límite de la próxima jornada
- [ ] 6.2 Modal informativo al iniciar sesión para usuarios `pendientes`
- [ ] 6.3 Botón de contacto WhatsApp: deep link `wa.me` al número de `app_settings` con mensaje prellenado (nombre, correo, teléfono)
- [ ] 6.4 Estado `desactivado`: mismo bloqueo de guardado con mensaje propio de cuenta desactivada

## 7. Calendario y pronósticos

- [ ] 7.1 Página de partidos: jornadas agrupadas por `match_date`, partidos con equipos, grupo y hora; indicador de jornada abierta/cerrada
- [ ] 7.2 UI de selección L/E/V por partido (solo interactiva para usuarios `activos` en jornadas abiertas; solo lectura en caso contrario)
- [ ] 7.3 Server Action de guardado por jornada completa: valida sesión, estado `activo`, jornada abierta y cobertura total de partidos del día; upsert en bloque con `updated_at`
- [ ] 7.4 Mostrar pronósticos guardados, fecha/hora de última modificación y errores de validación (jornada incompleta, cerrada, cuenta no activa)

## 8. Puntuación y ranking

- [ ] 8.1 Query de ranking: puntos calculados al vuelo (pick vs resultado derivado de goles), solo usuarios `activos` rol participante, orden descendente
- [ ] 8.2 Página pública `/ranking` (sin sesión): posición, alias, puntos
- [ ] 8.3 Página "mis puntos": total acumulado y detalle por partido (pronóstico, marcador, resultado oficial, punto 1/0)

## 9. Panel administrativo

- [ ] 9.1 Layout `/admin` protegido por rol en servidor (segmento + verificación en cada action)
- [ ] 9.2 Usuarios: lista con nombre, alias, correo, teléfono, estado y fecha de registro; acciones activar/desactivar
- [ ] 9.3 Partidos: lista con captura/corrección de marcadores (goles local/visitante)
- [ ] 9.4 Partidos: crear y editar (fase, fecha, hora, equipos)
- [ ] 9.5 Configuración: ver y actualizar número de WhatsApp
- [ ] 9.6 Ranking: vista de la clasificación desde el panel

## 10. Verificación y despliegue

- [ ] 10.1 Prueba de flujo completo en local: registro → pendiente (banner/modal/WhatsApp) → activación → pronóstico de jornada → cierre → captura de marcador → puntos y ranking → corrección de marcador recalcula
- [ ] 10.2 Verificar accesos: pendiente/desactivado no guardan (también vía request directa), participante no entra a `/admin`, ranking visible sin sesión
- [ ] 10.3 Auditoría de UI con el skill `impeccable` (audit/polish) sobre los flujos principales: registro, pendiente, pronósticos, ranking público y panel admin; corregir hallazgos
- [ ] 10.4 Deploy en Vercel con variables de entorno, aplicar migraciones y seeds en Supabase de producción, ejecutar seed de admin y prueba de humo en producción
