# Proposal: Quiniela Mundialista V1

## Why

Se necesita una aplicación web para administrar una quiniela del Mundial 2026 entre participantes que pagan su entrada: hoy no existe ninguna herramienta y el torneo arranca el 11 de junio de 2026. La V1 cubre únicamente la fase de grupos (72 partidos), con pagos validados manualmente vía WhatsApp y resultados capturados a mano por el administrador, pero con una estructura preparada para habilitar las fases eliminatorias en versiones futuras.

## What Changes

- Proyecto nuevo desde cero: app Next.js (App Router) + TypeScript + Tailwind, con Supabase (Auth + PostgreSQL) y despliegue en Vercel. Monolito con funcionalidad de usuario y admin.
- Registro e inicio de sesión con email/contraseña (Supabase Auth), con perfil propio (nombre, alias público obligatorio, teléfono, estado, rol).
- Ciclo de activación manual: cuenta nace `pendiente`, el usuario contacta al admin por WhatsApp deep link (mensaje prellenado con nombre, correo y teléfono), el admin valida el pago y activa la cuenta. Modal informativo al iniciar sesión y banner persistente mientras esté pendiente.
- Calendario de partidos agrupado por jornadas (todos los partidos de una fecha, zona horaria America/Mexico_City).
- Pronósticos L/E/V (local/empate/visitante) por jornada completa: solo usuarios `activos` pueden guardar; modificables hasta el cierre (23:59 del día anterior); se registra fecha/hora de última modificación.
- Captura manual de marcadores por el admin; el resultado oficial L/E/V se deriva de los goles; puntos (1 por acierto, 0 por error) y ranking calculados siempre al vuelo — corregir un marcador recalcula todo automáticamente.
- Ranking público sin sesión (URL compartible) que expone únicamente alias, posición y puntos. Usuarios desactivados quedan ocultos.
- Panel administrativo: gestión de usuarios (consultar, activar, desactivar), CRUD de partidos (fase, fecha, equipos, marcadores), configuración del número de WhatsApp.
- Seeds: los 72 partidos oficiales de la fase de grupos (archivo estático, sin API deportiva) y la cuenta admin (script con service role key, credenciales por variables de entorno).
- Modelo de datos preparado para todas las fases del torneo (grupos, dieciseisavos, octavos, cuartos, semifinales, tercer lugar, final); solo grupos habilitada en V1.

## Capabilities

### New Capabilities

- `auth-registration`: Registro, inicio de sesión y perfil del participante (alias obligatorio, datos de contacto); separación entre identidad (Supabase Auth) y datos de negocio (perfil).
- `account-activation`: Estados del usuario (pendiente/activo/desactivado), flujo de validación de pago vía WhatsApp, modal y banner de pago pendiente, activación/desactivación por el admin.
- `match-schedule`: Calendario de partidos agrupado por jornadas (fecha en America/Mexico_City), fases del torneo y regla de cierre de jornada.
- `predictions`: Pronósticos L/E/V por jornada completa: validación, guardado, modificación hasta el cierre y bloqueo posterior.
- `scoring-ranking`: Derivación del resultado oficial desde los goles, puntuación (1/0), cálculo de puntos al vuelo y ranking público con alias.
- `admin-panel`: Gestión de usuarios, CRUD de partidos con captura de marcadores y configuración del número de WhatsApp.
- `data-seeding`: Seed de los 72 partidos de fase de grupos y de la cuenta administradora.

### Modified Capabilities

(Ninguna — no existen specs previas; el proyecto inicia con este change.)

## Impact

- Repositorio vacío: todo el código, esquema de base de datos, migraciones y seeds son nuevos.
- Servicios externos: proyecto de Supabase (Auth + PostgreSQL) y proyecto de Vercel por crear; variables de entorno para credenciales de Supabase y del admin.
- Sin integraciones de pago, deportivas, correo ni push (fuera de alcance V1).
- Criterio de desempate del ranking: pendiente a propósito, se definirá en una versión posterior sin cambios estructurales.
