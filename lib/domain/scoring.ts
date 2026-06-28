/**
 * Puntuación (design.md D5, decisión de producto 3; change
 * eliminatoria-quien-avanza).
 *
 * El resultado oficial depende de la temporada:
 *  - grupos: se deriva de los goles (L/E/V).
 *  - eliminatoria: no hay empate; el resultado oficial es QUIÉN AVANZA (L/V),
 *    capturado por el admin, porque un 1-1 por penales no se deriva de los goles.
 * El pronóstico es L/E/V ('H'|'D'|'A'); en eliminatoria solo 'H'/'A' son válidos.
 * Acierto = 1 punto, error o sin pronóstico/resultado = 0.
 */

import type { Temporada } from "./temporada";

export type Pick = "H" | "D" | "A";

/** Resultado oficial derivado del marcador capturado (solo grupos). */
export function deriveResult(homeGoals: number, awayGoals: number): Pick {
  if (homeGoals > awayGoals) return "H";
  if (homeGoals < awayGoals) return "A";
  return "D";
}

/**
 * Resultado oficial de un partido según su temporada, o null si aún no está
 * determinado (grupos sin goles capturados; eliminatoria sin "avanza" definido).
 */
export function officialResult(
  temporada: Temporada,
  homeGoals: number | null,
  awayGoals: number | null,
  avanza: Pick | null
): Pick | null {
  if (temporada === "eliminatoria") return avanza;
  if (homeGoals === null || awayGoals === null) return null;
  return deriveResult(homeGoals, awayGoals);
}

/** Punto obtenido: 1 si el pronóstico coincide con el resultado oficial, 0 si no. */
export function scorePrediction(
  pick: Pick | null | undefined,
  official: Pick | null
): 0 | 1 {
  if (!pick || !official) return 0;
  return pick === official ? 1 : 0;
}
