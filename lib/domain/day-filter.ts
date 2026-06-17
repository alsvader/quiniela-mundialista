import { toMxDate } from "./jornada";

/**
 * Filtro por día del calendario (spec match-schedule). Selección de UN día a la
 * vez: la URL lleva un solo valor (?dia=YYYY-MM-DD). El estado se resuelve
 * siempre en servidor: las fechas y la noción de "hoy" se calculan en
 * America/Mexico_City (toMxDate), nunca en el cliente, para que no haya drift
 * de zona horaria.
 *
 * Distinción clave: un parámetro AUSENTE aplica el día por defecto (hoy, o el
 * próximo con partidos); un parámetro PRESENTE pero VACÍO ("?dia=") significa
 * "Todos" (selección vacía = sin filtro). Eso hace que "Todos" sea un estado
 * representable en la URL sin valor centinela.
 *
 * Las funciones operan sobre listas (de 0 o 1 elemento) para no acoplarse a la
 * cardinalidad: así un enlace antiguo con varias fechas (?dia=14,15) se tolera
 * sin romper (se filtran los días reconocidos) en vez de fallar.
 */

/** Fecha de hoy (YYYY-MM-DD) vista desde CDMX. */
export function todayInMexicoCity(): string {
  return toMxDate(new Date());
}

/**
 * Día preseleccionado al entrar sin filtro explícito: hoy si tiene partidos;
 * si no, el primer día futuro con partidos; si ya no quedan, null (→ "Todos").
 * `matchDates` debe venir en orden ascendente (claves de getJornadas).
 */
export function defaultSelectedDay(
  matchDates: string[],
  today: string
): string | null {
  if (matchDates.includes(today)) return today;
  return matchDates.find((d) => d > today) ?? null;
}

/**
 * Parsea el parámetro `dia` a una lista de fechas válidas: separa por comas,
 * descarta tokens vacíos y los que no correspondan a un día real con partidos,
 * deduplica y preserva el orden del calendario. Defensivo: una URL manipulada
 * nunca rompe el render.
 */
export function parseDiaParam(raw: string, matchDates: string[]): string[] {
  const valid = new Set(matchDates);
  const wanted = new Set(
    raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => valid.has(t))
  );
  return matchDates.filter((d) => wanted.has(d));
}

/**
 * Selección efectiva de días:
 * - parámetro ausente (undefined) → día por defecto (vacío si no hay default).
 * - parámetro presente (aunque vacío) → los días válidos que traiga; vacío =
 *   "Todos".
 */
export function resolveSelectedDays(
  rawParam: string | undefined,
  matchDates: string[],
  today: string
): string[] {
  if (rawParam === undefined) {
    const def = defaultSelectedDay(matchDates, today);
    return def ? [def] : [];
  }
  return parseDiaParam(rawParam, matchDates);
}

/**
 * Filtra el Map de jornadas a los días seleccionados, preservando el orden.
 * Selección vacía ("Todos") = devuelve el Map completo sin tocar.
 */
export function filterJornadasByDays<T>(
  jornadas: Map<string, T>,
  selectedDays: string[]
): Map<string, T> {
  if (selectedDays.length === 0) return jornadas;
  const keep = new Set(selectedDays);
  const out = new Map<string, T>();
  for (const [date, value] of jornadas) {
    if (keep.has(date)) out.set(date, value);
  }
  return out;
}
