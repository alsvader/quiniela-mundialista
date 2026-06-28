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
  finished,
  eliminatoria = false,
  homeTeam,
  awayTeam,
  avanza = null,
}: {
  matchId: number;
  homeGoals: number | null;
  awayGoals: number | null;
  /** Estado actual: inicializa el checkbox para no des-finalizar por accidente */
  finished: boolean;
  /** Eliminatoria: además del marcador, se captura quién avanza (sin empate). */
  eliminatoria?: boolean;
  homeTeam?: string;
  awayTeam?: string;
  /** Quién avanza actual (H/A) o null si aún sin definir. */
  avanza?: "H" | "A" | null;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    saveScore,
    {}
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
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
      {eliminatoria && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
          Avanza
          <select
            name="avanza"
            defaultValue={avanza ?? ""}
            className="h-9 rounded bg-white/6 px-2 text-sm text-on-surface border-b border-primary-container/50 focus:border-primary-container focus:outline-none"
          >
            <option value="">—</option>
            <option value="H">{homeTeam ?? "Local"}</option>
            <option value="A">{awayTeam ?? "Visitante"}</option>
          </select>
        </label>
      )}
      <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
        <input
          type="checkbox"
          name="finished"
          defaultChecked={finished}
          className="size-4 accent-(--color-tertiary-container)"
        />
        Finalizado
      </label>
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
