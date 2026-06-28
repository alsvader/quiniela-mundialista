import { Chip } from "@/components/ui/chip";
import { TeamFlag } from "@/components/team-flag";
import { officialResult, scorePrediction, type Pick } from "@/lib/domain/scoring";
import { isMatchFinished, isMatchLive } from "@/lib/domain/jornada";
import { temporadaDeFase } from "@/lib/domain/temporada";
import type { Match } from "@/lib/types";

const PICK_LABEL: Record<Pick, string> = {
  H: "L · Local",
  D: "E · Empate",
  A: "V · Visitante",
};

/**
 * Partido en modo solo lectura: cerrado, en vivo o cuenta sin permiso de
 * edición. Distingue tres estados (spec live-match): "En vivo" (marcador
 * parcial, sin puntos), "Final" (puntúa) y "Por jugarse". Los goles ya no
 * implican final: solo finished_at.
 */
export function ClosedMatchCard({
  match,
  pick,
  time,
}: {
  match: Match;
  pick: Pick | null;
  time: string;
}) {
  const hasScore = match.home_goals !== null && match.away_goals !== null;
  const finished = isMatchFinished(match);
  const live = isMatchLive(match);
  const temporada = temporadaDeFase(match.phase);
  const eliminatoria = temporada === "eliminatoria";
  // Resultado oficial por temporada: grupos = goles; eliminatoria = quién avanza
  // (un 1-1 por penales no se deriva de los goles). Puede ser null si no está
  // determinado (sin goles, o eliminatoria sin "avanza" definido).
  const result = officialResult(
    temporada,
    match.home_goals,
    match.away_goals,
    match.avanza
  );
  // equipo que avanza (eliminatoria resuelta), para mostrarlo como contexto
  const advancingTeam =
    eliminatoria && match.avanza
      ? match.avanza === "H"
        ? match.home_team
        : match.away_team
      : null;
  // "Estadio · Ciudad"; se omite la línea si la sede no está capturada
  const venue = [match.stadium, match.city].filter(Boolean).join(" · ");
  // tu check: solo los finalizados puntúan; un parcial jamás suma
  const point = finished ? scorePrediction(pick, result) : null;

  return (
    <li className="glass group p-4">
      <div className="flex items-center justify-between gap-2">
        {match.group_label ? (
          <Chip tone="neutral">Grupo {match.group_label}</Chip>
        ) : (
          <span />
        )}
        {finished ? (
          <Chip tone="secondary">Final</Chip>
        ) : live ? (
          <span className="label-data inline-flex items-center gap-1.5 rounded-sm border border-secondary-container/60 px-2 py-1 uppercase text-secondary-fixed">
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-secondary-container motion-safe:animate-pulse"
            />
            En vivo
          </span>
        ) : (
          <span className="label-data text-on-surface-variant">{time} h</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-base font-semibold text-on-surface">
        <span className="flex flex-1 items-center gap-2">
          <TeamFlag code={match.home_code} />
          {match.home_team}
        </span>
        {hasScore ? (
          <span className="shrink-0 font-mono text-xl font-medium tracking-wider text-primary-fixed">
            {match.home_goals}–{match.away_goals}
          </span>
        ) : (
          <span className="label-data shrink-0 text-on-surface-variant">vs</span>
        )}
        <span className="flex flex-1 items-center justify-end gap-2 text-right">
          {match.away_team}
          <TeamFlag code={match.away_code} />
        </span>
      </div>

      {venue && (
        <p className="label-data mt-2 truncate text-on-surface-variant">
          {venue}
        </p>
      )}

      {advancingTeam && (
        <p className="label-data mt-2 text-tertiary-fixed">
          Avanza {advancingTeam}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-3 text-sm">
        <span className="text-on-surface-variant">
          Tu pronóstico:{" "}
          {pick ? (
            <strong className="text-on-surface">
              {eliminatoria
                ? pick === "H"
                  ? `${match.home_team} avanza`
                  : `${match.away_team} avanza`
                : PICK_LABEL[pick]}
            </strong>
          ) : (
            <strong className="text-on-surface-variant">sin pronóstico</strong>
          )}
        </span>
        {finished && point !== null && (
          <span
            className={`label-data ${
              point === 1 ? "text-tertiary-fixed" : "text-on-surface-variant"
            }`}
          >
            {point === 1 ? "✓ +1 PT" : "✗ +0 PTS"}
          </span>
        )}
        {live && (
          <span className="label-data text-secondary-fixed">
            {hasScore ? "MARCADOR PARCIAL" : "EN JUEGO"}
          </span>
        )}
        {!live && !finished && result === null && (
          <span className="label-data text-on-surface-variant">POR JUGARSE</span>
        )}
      </div>
    </li>
  );
}
