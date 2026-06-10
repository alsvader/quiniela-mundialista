import { formatMxn, PRIZE_WEIGHTS } from "@/lib/domain/prize";

const breakdown = PRIZE_WEIGHTS.map(
  (w, i) => `${i + 1}° ${Math.round(w * 100)}%`
).join(" · ");

/** Bolsa acumulada (spec scoring-ranking): monto derivado, mostrado junto al encabezado. */
export function PrizePoolCard({
  pool,
  align = "end",
}: {
  pool: number;
  align?: "end" | "center";
}) {
  return (
    <div
      className={`glass flex flex-col gap-0.5 px-5 py-3 ${
        align === "center" ? "items-center" : "items-end"
      }`}
    >
      <span className="label-data text-on-surface-variant">
        Bolsa acumulada
      </span>
      <span className="font-mono text-2xl font-medium text-tertiary-container [text-shadow:0_0_18px_rgb(189_237_0/0.35)]">
        {formatMxn(pool)}
      </span>
      <span className="text-xs text-on-surface-variant">{breakdown}</span>
    </div>
  );
}
