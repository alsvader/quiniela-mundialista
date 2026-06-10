/**
 * Premiación (design.md D11, spec scoring-ranking).
 *
 * Bolsa = activos × entrada − comisión de plataforma; siempre derivada del
 * conteo actual, nunca almacenada. Se reparte en partes iguales entre los
 * PRIZE_PLACES primeros lugares; en empate en el corte, los empatados se
 * reparten por igual las porciones de las posiciones que ocupan.
 * El pago es manual fuera de la app: aquí solo se calcula y muestra.
 */

export const ENTRY_FEE_MXN = 100;
export const PLATFORM_FEE = 0.3;
export const PRIZE_PLACES = 3;

/** Bolsa acumulada en pesos (siempre entera: 100 × 0.7 = 70 por activo). */
export function prizePool(activeCount: number): number {
  return Math.round(activeCount * ENTRY_FEE_MXN * (1 - PLATFORM_FEE));
}

/**
 * Reparto por participante, alineado al orden del arreglo de entrada
 * (puntos en orden descendente, como los entrega el ranking).
 *
 * Si hay menos participantes que lugares premiados, la bolsa se reparte
 * entre los que haya.
 */
export function prizeDistribution(
  sortedPoints: number[],
  pool: number
): number[] {
  const n = sortedPoints.length;
  if (n === 0 || pool <= 0) return sortedPoints.map(() => 0);

  const places = Math.min(PRIZE_PLACES, n);
  const slice = pool / places;
  const prizes = sortedPoints.map(() => 0);

  // grupos de empatados en orden: cada grupo ocupa posiciones [start, start+size)
  let start = 0;
  while (start < n && start < places) {
    let end = start;
    while (end < n && sortedPoints[end] === sortedPoints[start]) end++;
    const groupSize = end - start;
    // porciones premiadas que caen dentro de las posiciones del grupo
    const slicesForGroup = Math.min(places, end) - start;
    const perMember = (slicesForGroup * slice) / groupSize;
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
