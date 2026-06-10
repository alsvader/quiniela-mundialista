"use client";

import { useActionState } from "react";
import { upsertMatch, type AdminState } from "../actions";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Match, MatchPhase } from "@/lib/types";

const PHASE_LABEL: Record<MatchPhase, string> = {
  group_stage: "Fase de grupos",
  round_of_32: "Dieciseisavos de final",
  round_of_16: "Octavos de final",
  quarter_final: "Cuartos de final",
  semi_final: "Semifinales",
  third_place: "Tercer lugar",
  final: "Final",
};

export function MatchForm({
  match,
  kickoffLocal,
}: {
  match: Match | null;
  /** kickoff existente en hora CDMX, formato datetime-local */
  kickoffLocal: string | null;
}) {
  const [state, action] = useActionState<AdminState, FormData>(upsertMatch, {});

  return (
    <form action={action} className="mt-6 flex max-w-md flex-col gap-4">
      {match && <input type="hidden" name="match_id" value={match.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phase" className="text-sm font-semibold text-on-surface">
          Fase
        </label>
        <select
          id="phase"
          name="phase"
          defaultValue={match?.phase ?? "group_stage"}
          className="h-11 rounded border-b border-primary-container/50 bg-white/6 px-3 text-base text-on-surface focus:border-primary-container focus:outline-none [&>option]:bg-surface-container"
        >
          {Object.entries(PHASE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-xs text-on-surface-variant">
          En V1 solo la fase de grupos es visible para los participantes.
        </p>
      </div>

      <Field
        label="Equipo local"
        name="home_team"
        required
        defaultValue={match?.home_team ?? ""}
      />
      <Field
        label="Bandera local (opcional)"
        name="home_code"
        maxLength={6}
        defaultValue={match?.home_code ?? ""}
        hint="Código ISO en minúsculas: mx, za, gb-eng. Vacío = sin bandera."
      />
      <Field
        label="Equipo visitante"
        name="away_team"
        required
        defaultValue={match?.away_team ?? ""}
      />
      <Field
        label="Bandera visitante (opcional)"
        name="away_code"
        maxLength={6}
        defaultValue={match?.away_code ?? ""}
        hint="Código ISO en minúsculas: mx, za, gb-eng. Vacío = sin bandera."
      />
      <Field
        label="Grupo (opcional)"
        name="group_label"
        maxLength={2}
        defaultValue={match?.group_label ?? ""}
        hint="A–L para fase de grupos; vacío en eliminatorias."
      />
      <Field
        label="Fecha y hora (CDMX)"
        name="kickoff_local"
        type="datetime-local"
        required
        defaultValue={kickoffLocal ?? ""}
        hint="La jornada se calcula con esta fecha (hora de Ciudad de México)."
      />

      {state.error && (
        <p role="alert" className="rounded-sm bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
          {state.error}
        </p>
      )}
      <SubmitButton pendingLabel="Guardando…">
        {match ? "Guardar cambios" : "Crear partido"}
      </SubmitButton>
    </form>
  );
}
