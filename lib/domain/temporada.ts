/**
 * Temporada como unidad de pago, bolsa y ranking (change
 * fase-eliminatoria-temporada, design.md D1). La temporada se DERIVA de la
 * fase del partido, nunca se almacena aparte: `group_stage → grupos`; el resto
 * de las fases (dieciseisavos a final) → `eliminatoria`. Espejo en SQL de
 * `public.temporada_de_fase(match_phase)` (migración 0010).
 */

import type { Match, MatchPhase } from "@/lib/types";

export const TEMPORADAS = ["grupos", "eliminatoria"] as const;
export type Temporada = (typeof TEMPORADAS)[number];

/** Temporada por defecto cuando `fase_activa` falta o es inválida (design D3). */
export const TEMPORADA_POR_DEFECTO: Temporada = "grupos";

/** ¿El texto es una temporada válida? Útil para validar `fase_activa`/URL. */
export function isTemporada(value: string | null | undefined): value is Temporada {
  return value === "grupos" || value === "eliminatoria";
}

/** Normaliza un valor arbitrario a temporada, cayendo al default si no es válido. */
export function toTemporada(value: string | null | undefined): Temporada {
  return isTemporada(value) ? value : TEMPORADA_POR_DEFECTO;
}

/** Temporada a la que pertenece una fase del torneo. */
export function temporadaDeFase(phase: MatchPhase): Temporada {
  return phase === "group_stage" ? "grupos" : "eliminatoria";
}

/** Etiqueta de UI para el segmento y leyendas. */
export function temporadaLabel(temporada: Temporada): string {
  return temporada === "grupos" ? "Grupos" : "Eliminatoria";
}

/**
 * Acota un mapa de jornadas (fecha → partidos) a una temporada, conservando el
 * orden y descartando las fechas que quedan sin partidos. Espejo en cliente del
 * filtro por temporada del ranking en servidor.
 */
export function filterJornadasByTemporada(
  jornadas: Map<string, Match[]>,
  temporada: Temporada
): Map<string, Match[]> {
  const out = new Map<string, Match[]>();
  for (const [date, matches] of jornadas) {
    const filtered = matches.filter((m) => temporadaDeFase(m.phase) === temporada);
    if (filtered.length > 0) out.set(date, filtered);
  }
  return out;
}
