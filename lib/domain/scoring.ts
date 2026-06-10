/**
 * Puntuación (design.md D5, decisión de producto 3).
 *
 * El pronóstico es únicamente L/E/V ('H' | 'D' | 'A'). El resultado oficial
 * se deriva de los goles capturados por el admin; los goles jamás participan
 * en la comparación. Acierto = 1 punto, error o sin pronóstico = 0.
 */

export type Pick = "H" | "D" | "A";

/** Resultado oficial derivado del marcador capturado. */
export function deriveResult(homeGoals: number, awayGoals: number): Pick {
  if (homeGoals > awayGoals) return "H";
  if (homeGoals < awayGoals) return "A";
  return "D";
}

/** Punto obtenido: 1 si el pronóstico coincide con el resultado oficial, 0 si no. */
export function scorePrediction(
  pick: Pick | null | undefined,
  homeGoals: number,
  awayGoals: number
): 0 | 1 {
  if (!pick) return 0;
  return pick === deriveResult(homeGoals, awayGoals) ? 1 : 0;
}
