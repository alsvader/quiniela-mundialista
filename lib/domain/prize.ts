/**
 * Premiación (design.md D11, spec scoring-ranking).
 *
 * Bolsa = activos × entrada − comisión de plataforma; siempre derivada del
 * conteo actual, nunca almacenada. Reparto ponderado 50/30/20 entre los 3
 * primeros lugares; cada grupo de empatados ocupa posiciones consecutivas y
 * se reparte por igual la suma de las porciones de esas posiciones (más
 * puntos nunca cobra menos). Con menos participantes que lugares, los pesos
 * se renormalizan. Se acepta el "minus pool": un empate en la porción menor
 * puede pagar menos que el boleto.
 * El pago es manual fuera de la app: aquí solo se calcula y muestra.
 */

export const ENTRY_FEE_MXN = 100;
export const PLATFORM_FEE = 0.3;
export const PRIZE_WEIGHTS = [0.5, 0.3, 0.2] as const;
export const PRIZE_PLACES = PRIZE_WEIGHTS.length;

/** Bolsa acumulada en pesos (siempre entera: 100 × 0.7 = 70 por activo). */
export function prizePool(activeCount: number): number {
  return Math.round(activeCount * ENTRY_FEE_MXN * (1 - PLATFORM_FEE));
}

/**
 * Reparto por participante, alineado al orden del arreglo de entrada
 * (puntos en orden descendente, como los entrega el ranking).
 */
export function prizeDistribution(
  sortedPoints: number[],
  pool: number
): number[] {
  const n = sortedPoints.length;
  const prizes = sortedPoints.map(() => 0);
  if (n === 0 || pool <= 0) return prizes;

  // porciones por posición; con menos de PRIZE_PLACES participantes los
  // pesos se renormalizan entre los lugares existentes
  const weights = PRIZE_WEIGHTS.slice(0, Math.min(PRIZE_PLACES, n));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const slices = weights.map((w) => (pool * w) / totalWeight);
  const places = slices.length;

  // grupos de empatados en orden: cada grupo ocupa posiciones [start, end)
  let start = 0;
  while (start < places) {
    let end = start;
    while (end < n && sortedPoints[end] === sortedPoints[start]) end++;
    const groupSize = end - start;
    const groupTotal = slices
      .slice(start, Math.min(places, end))
      .reduce((a, b) => a + b, 0);
    const perMember = groupTotal / groupSize;
    for (let i = start; i < end; i++) prizes[i] = perMember;
    start = end;
  }
  return prizes;
}

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const mxnCents = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$700" — para montos enteros como la bolsa. */
export function formatMxn(amount: number): string {
  return Number.isInteger(amount) ? mxn.format(amount) : mxnCents.format(amount);
}
