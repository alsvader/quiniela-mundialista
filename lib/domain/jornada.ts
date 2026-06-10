/**
 * Reglas de jornada (design.md D2).
 *
 * Una jornada agrupa los partidos de una misma fecha calendario en
 * America/Mexico_City. Sus pronósticos cierran a las 23:59 del día anterior:
 * la jornada está abierta mientras la fecha actual en CDMX sea estrictamente
 * anterior a la fecha de la jornada. El estado nunca se almacena.
 */

export const TIMEZONE = "America/Mexico_City";

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
 * Abierta hasta las 23:59:59 CDMX del día anterior; cerrada desde las 00:00:00
 * del día de la jornada.
 */
export function isJornadaOpen(matchDate: string, now: Date = new Date()): boolean {
  return toMxDate(now) < matchDate;
}

/** Instante exacto del cierre: medianoche CDMX del día de la jornada (UTC-6, sin DST desde 2022). */
export function jornadaDeadline(matchDate: string): Date {
  return new Date(`${matchDate}T00:00:00-06:00`);
}
