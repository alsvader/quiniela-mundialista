/**
 * Reglas de jornada y cierre por partido (change cierre-por-partido).
 *
 * Una jornada agrupa los partidos de una misma fecha calendario en
 * America/Mexico_City — agrupación puramente de presentación. El cierre de
 * pronósticos es POR PARTIDO: cada partido acepta pronósticos hasta una hora
 * antes de su kickoff. El estado abierto/cerrado nunca se almacena.
 */

export const TIMEZONE = "America/Mexico_City";

/**
 * Margen de cierre antes del kickoff. DEBE coincidir con is_match_open() en
 * supabase/migrations/0006_cierre_por_partido.sql (interval '1 hour').
 */
export const CLOSE_BEFORE_KICKOFF_MS = 60 * 60 * 1000;

const mxDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha calendario (YYYY-MM-DD) de un instante, vista desde CDMX. */
export function toMxDate(instant: Date): string {
  return mxDateFormatter.format(instant);
}

/** Instante exacto del cierre de un partido: kickoff − 1 hora. */
export function matchDeadline(kickoffAt: string | Date): Date {
  const kickoff =
    typeof kickoffAt === "string" ? new Date(kickoffAt) : kickoffAt;
  return new Date(kickoff.getTime() - CLOSE_BEFORE_KICKOFF_MS);
}

/**
 * ¿El partido con inicio en `kickoffAt` sigue abierto en `now`?
 * Abierto mientras `now` sea estrictamente anterior a kickoff − 1h; cerrado
 * desde ese instante. Cada partido se evalúa de forma independiente: una
 * jornada puede estar parcialmente cerrada.
 */
export function isMatchOpen(
  kickoffAt: string | Date,
  now: Date = new Date()
): boolean {
  return now.getTime() < matchDeadline(kickoffAt).getTime();
}
