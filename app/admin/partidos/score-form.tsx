"use client";

import { useActionState } from "react";
import { saveScore, type AdminState } from "../actions";

const scoreInput =
  "h-9 w-14 rounded bg-white/6 px-2 text-center font-mono text-base text-on-surface " +
  "border-b border-primary-container/50 focus:border-primary-container focus:outline-none";

export function ScoreForm({
  matchId,
  homeGoals,
  awayGoals,
}: {
  matchId: number;
  homeGoals: number | null;
  awayGoals: number | null;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    saveScore,
    {}
  );

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="match_id" value={matchId} />
      <label className="sr-only" htmlFor={`hg-${matchId}`}>
        Goles del local
      </label>
      <input
        id={`hg-${matchId}`}
        name="home_goals"
        type="number"
        min={0}
        max={99}
        required
        defaultValue={homeGoals ?? ""}
        className={scoreInput}
      />
      <span className="text-on-surface-variant">–</span>
      <label className="sr-only" htmlFor={`ag-${matchId}`}>
        Goles del visitante
      </label>
      <input
        id={`ag-${matchId}`}
        name="away_goals"
        type="number"
        min={0}
        max={99}
        required
        defaultValue={awayGoals ?? ""}
        className={scoreInput}
      />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded bg-primary-container px-3 text-xs font-bold text-on-primary-fixed transition-shadow duration-150 hover:shadow-(--shadow-glow-primary) disabled:opacity-50"
      >
        {pending ? "…" : homeGoals !== null ? "Corregir" : "Guardar"}
      </button>
      {state.ok && (
        <span role="status" className="text-xs font-semibold text-tertiary-fixed">
          ✓
        </span>
      )}
      {state.error && (
        <span role="alert" className="text-xs text-error">
          {state.error}
        </span>
      )}
    </form>
  );
}
