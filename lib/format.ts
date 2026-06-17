import { matchDeadline, TIMEZONE } from "@/lib/domain/jornada";

const dayFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: TIMEZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "Jueves, 11 de junio" a partir de una fecha de jornada YYYY-MM-DD. */
export function formatJornadaDate(matchDate: string): string {
  const s = dayFormatter.format(new Date(`${matchDate}T12:00:00-06:00`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "19:00" hora CDMX de un kickoff. */
export function formatKickoffTime(kickoffAt: string): string {
  return timeFormatter.format(new Date(kickoffAt));
}

const dayChipWeekdayFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: TIMEZONE,
  weekday: "short",
});
const dayChipDayFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: TIMEZONE,
  day: "numeric",
});

/**
 * Etiqueta de la celda de la tira de días (filtro por día, spec
 * match-schedule): abreviatura del día ("dom"…"sáb", sin punto) y número, en
 * CDMX, a partir de una fecha de jornada YYYY-MM-DD. Se calcula en servidor
 * para que el cliente no derive fechas (sin drift de zona horaria).
 */
export function formatDayChip(matchDate: string): {
  weekday: string;
  day: string;
} {
  const d = new Date(`${matchDate}T12:00:00-06:00`);
  return {
    weekday: dayChipWeekdayFormatter.format(d).replace(".", ""),
    day: dayChipDayFormatter.format(d),
  };
}

/** "10 jun, 23:59" para fechas con hora (cierres, última modificación). */
export function formatDateTime(iso: string | Date): string {
  return dateTimeFormatter.format(typeof iso === "string" ? new Date(iso) : iso);
}

const deadlineDayFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: TIMEZONE,
  day: "numeric",
  month: "long",
});

/**
 * Fecha límite legible de un partido (kickoff − 1h, spec match-schedule):
 * "11 de junio a las 12:00".
 */
export function formatDeadline(kickoffAt: string): string {
  const deadline = matchDeadline(kickoffAt);
  return `${deadlineDayFormatter.format(deadline)} a las ${timeFormatter.format(deadline)}`;
}

/** Solo la hora del cierre de un partido, "12:00" (CDMX). */
export function formatDeadlineTime(kickoffAt: string): string {
  return timeFormatter.format(matchDeadline(kickoffAt));
}
