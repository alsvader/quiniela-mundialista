import { formatMxn, PRIZE_PLACES } from "@/lib/domain/prize";

/** Bolsa acumulada (spec scoring-ranking): monto derivado, mostrado junto al encabezado. */
export function PrizePoolCard({ pool }: { pool: number }) {
  return (
    <div className="glass flex flex-col items-end gap-0.5 px-5 py-3">
      <span className="label-data text-on-surface-variant">
        Bolsa acumulada
      </span>
      <span className="font-mono text-2xl font-medium text-tertiary-container [text-shadow:0_0_18px_rgb(189_237_0/0.35)]">
        {formatMxn(pool)}
      </span>
      <span className="text-xs text-on-surface-variant">
        para los {PRIZE_PLACES} primeros lugares
      </span>
    </div>
  );
}
