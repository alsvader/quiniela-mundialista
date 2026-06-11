/**
 * Reglas de jornada (design.md D2).
 *
 * Una jornada agrupa los partidos de una misma fecha calendario en
 * America/Mexico_City. Sus pronósticos cierran a las 23:59 del día anterior:
 * la jornada está abierta mientras la fecha actual en CDMX sea estrictamente
 * anterior a la fecha de la jornada. El estado nunca se almacena.
 */

export const TIMEZONE = "America/Mexico_City";

/**
 * Excepciones fechadas a la regla general de cierre (spec match-schedule).
 * DEBE coincidir con is_match_open() en supabase/migrations/0004_*.sql.
 * Jornada inaugural 2026: abierta hasta una hora antes del primer kickoff.
 * Inerte después de su fecha; se conserva como registro de la decisión.
 */
export const JORNADA_DEADLINE_EXCEPTIONS: Record<string, string> = {
  "2026-06-11": "2026-06-11T12:00:00-06:00",
};

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

/**
 * ¿La jornada de `matchDate` (YYYY-MM-DD, fecha CDMX) sigue abierta en `now`?
 * Regla general: abierta hasta las 23:59:59 CDMX del día anterior; cerrada
 * desde las 00:00:00 del día de la jornada. Las jornadas con excepción
 * fechada cierran en el instante de su excepción.
 */
export function isJornadaOpen(matchDate: string, now: Date = new Date()): boolean {
  return now.getTime() < jornadaDeadline(matchDate).getTime();
}

/** Instante exacto del cierre (CDMX es UTC-6 fijo, sin DST desde 2022). */
export function jornadaDeadline(matchDate: string): Date {
  const exception = JORNADA_DEADLINE_EXCEPTIONS[matchDate];
  return new Date(exception ?? `${matchDate}T00:00:00-06:00`);
}
