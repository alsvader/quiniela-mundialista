import { TeamFlag } from "@/components/team-flag";
import type { Match } from "@/lib/types";

/**
 * Card de partido en vivo (spec live-match): la única superficie magenta de
 * la página (DESIGN.md reserva el secundario para live matches) con el
 * marcador como héroe tipográfico — mono, 3x y glow magenta. Marcador parcial
 * o guion si el admin no ha capturado; el indicador lleva forma (punto)
 * además de color y el pulso respeta prefers-reduced-motion.
 */
export function LiveMatchCard({ match }: { match: Match }) {
  const hasScore = match.home_goals !== null && match.away_goals !== null;

  return (
    <div className="glass glass-live flex flex-col gap-2 px-6 py-4">
      <span className="label-data inline-flex items-center gap-2 uppercase text-secondary-fixed">
        <span
          aria-hidden
          className="size-2 rounded-full bg-secondary-container shadow-(--shadow-glow-secondary) motion-safe:animate-pulse"
        />
        En vivo
        {match.group_label && (
          <span className="text-on-surface-variant">
            · Grupo {match.group_label}
          </span>
        )}
      </span>
      <p className="m-0 flex items-center gap-4 text-base font-semibold text-on-surface">
        <span className="flex items-center gap-2">
          <TeamFlag code={match.home_code} />
          {match.home_team}
        </span>
        <span className="shrink-0 font-mono text-4xl font-medium tracking-wider text-on-surface [text-shadow:0_0_24px_rgb(255_36_228/0.45)]">
          {hasScore ? (
            <>
              {match.home_goals}–{match.away_goals}
            </>
          ) : (
            // sin captura del admin: el sistema no afirma 0–0
            <span aria-label="marcador no capturado">–</span>
          )}
        </span>
        <span className="flex items-center gap-2">
          {match.away_team}
          <TeamFlag code={match.away_code} />
        </span>
      </p>
    </div>
  );
}
