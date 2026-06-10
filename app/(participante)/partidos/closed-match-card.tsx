import { Chip } from "@/components/ui/chip";
import { deriveResult, scorePrediction, type Pick } from "@/lib/domain/scoring";
import type { Match } from "@/lib/types";

const PICK_LABEL: Record<Pick, string> = {
  H: "L · Local",
  D: "E · Empate",
  A: "V · Visitante",
};

/** Partido en modo solo lectura: jornada cerrada o cuenta sin permiso de edición. */
export function ClosedMatchCard({
  match,
  pick,
  time,
}: {
  match: Match;
  pick: Pick | null;
  time: string;
}) {
  const scored = match.home_goals !== null && match.away_goals !== null;
  const result = scored
    ? deriveResult(match.home_goals!, match.away_goals!)
    : null;
  const point = scored ? scorePrediction(pick, match.home_goals!, match.away_goals!) : null;

  return (
    <li className="glass p-4">
      <div className="flex items-center justify-between gap-2">
        {match.group_label ? (
          <Chip tone="neutral">Grupo {match.group_label}</Chip>
        ) : (
          <span />
        )}
        {scored ? (
          <Chip tone="secondary">Final</Chip>
        ) : (
          <span className="label-data text-on-surface-variant">{time} h</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-base font-semibold text-on-surface">
        <span className="flex-1">{match.home_team}</span>
        {scored ? (
          <span className="shrink-0 font-mono text-xl font-medium tracking-wider text-primary-fixed">
            {match.home_goals}–{match.away_goals}
          </span>
        ) : (
          <span className="label-data shrink-0 text-on-surface-variant">vs</span>
        )}
        <span className="flex-1 text-right">{match.away_team}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-3 text-sm">
        <span className="text-on-surface-variant">
          Tu pronóstico:{" "}
          {pick ? (
            <strong className="text-on-surface">{PICK_LABEL[pick]}</strong>
          ) : (
            <strong className="text-on-surface-variant">sin pronóstico</strong>
          )}
        </span>
        {scored && (
          <span
            className={`label-data ${
              point === 1 ? "text-tertiary-fixed" : "text-on-surface-variant"
            }`}
          >
            {point === 1 ? "✓ +1 PT" : "✗ +0 PTS"}
          </span>
        )}
        {!scored && result === null && (
          <span className="label-data text-on-surface-variant">POR JUGARSE</span>
        )}
      </div>
    </li>
  );
}
