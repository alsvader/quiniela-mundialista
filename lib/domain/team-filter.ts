/**
 * Filtro por equipo del calendario (spec match-schedule). Normalización
 * insensible a mayúsculas y acentos, coincidencia por subcadena contra
 * local o visitante. Misma filosofía que la normalización del alias en el
 * registro: el texto se normaliza en la frontera, nunca se almacena.
 */

/** trim → minúsculas → NFD → sin diacríticos ("México" → "mexico"). */
export function normalizeTeamText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * ¿El partido coincide con el texto buscado? Query vacío (tras trim) = sin
 * filtro: todo coincide. Nunca lanza; en el peor caso devuelve false.
 */
export function matchesTeam(
  query: string,
  match: { home_team: string; away_team: string }
): boolean {
  const q = normalizeTeamText(query);
  if (!q) return true;
  return (
    normalizeTeamText(match.home_team).includes(q) ||
    normalizeTeamText(match.away_team).includes(q)
  );
}
