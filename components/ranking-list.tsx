import type { RankingRow } from "@/lib/queries";

/** Posición estándar de competencia: empatados comparten lugar (1, 2, 2, 4). */
function positions(points: number[]): number[] {
  return points.map((p) => points.filter((other) => other > p).length + 1);
}

const PODIUM = [
  "text-primary-container [text-shadow:0_0_18px_rgb(0_243_255/0.45)]",
  "text-secondary-container [text-shadow:0_0_18px_rgb(255_36_228/0.4)]",
  "text-tertiary-container [text-shadow:0_0_18px_rgb(189_237_0/0.4)]",
];

export function RankingList({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="glass mx-auto mt-10 max-w-prose p-6 text-center text-sm text-on-surface-variant">
        Aún no hay participantes activos. El ranking aparecerá cuando el
        administrador active las primeras cuentas.
      </div>
    );
  }

  const pos = positions(rows.map((r) => r.points));

  return (
    <ol className="mt-10 flex list-none flex-col gap-2 p-0">
      {rows.map((row, i) => {
        const place = pos[i];
        const podium = place <= 3 ? PODIUM[place - 1] : null;
        return (
          <li key={row.alias} className="glass flex items-center gap-4 px-5 py-3.5">
            <span
              className={`w-10 shrink-0 text-center font-mono text-lg font-medium ${
                podium ?? "text-on-surface-variant"
              }`}
            >
              {place}
            </span>
            <span className="flex-1 truncate text-base font-semibold text-on-surface">
              {row.alias}
            </span>
            <span
              className={`shrink-0 font-mono text-lg font-medium ${
                podium ?? "text-on-surface"
              }`}
            >
              {row.points}
              <span className="label-data ml-1.5 text-on-surface-variant">PTS</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
