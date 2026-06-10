"use client";

import { useActionState } from "react";
import { saveJornada, type SaveJornadaState } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Chip } from "@/components/ui/chip";
import type { Pick } from "@/lib/domain/scoring";

export interface MatchForForm {
  id: number;
  home: string;
  away: string;
  group: string | null;
  time: string;
  pick: Pick | null;
}

const OPTIONS: { value: Pick; short: string; label: (m: MatchForForm) => string }[] = [
  { value: "H", short: "L", label: (m) => `Gana ${m.home} (local)` },
  { value: "D", short: "E", label: () => "Empate" },
  { value: "A", short: "V", label: (m) => `Gana ${m.away} (visitante)` },
];

export function JornadaForm({
  matchDate,
  matches,
  lastModified,
}: {
  matchDate: string;
  matches: MatchForForm[];
  lastModified: string | null;
}) {
  const [state, action] = useActionState<SaveJornadaState, FormData>(
    saveJornada,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="match_date" value={matchDate} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {matches.map((m) => (
          <fieldset key={m.id} className="glass m-0 border-0 p-4">
            <legend className="sr-only">
              {m.home} contra {m.away}
            </legend>
            <div className="flex items-center justify-between gap-2">
              {m.group && <Chip tone="neutral">Grupo {m.group}</Chip>}
              <span className="label-data text-on-surface-variant">
                {m.time} h
              </span>
            </div>
            <p className="mt-3 mb-4 flex items-baseline justify-between gap-2 text-base font-semibold text-on-surface">
              <span className="flex-1">{m.home}</span>
              <span className="label-data shrink-0 text-on-surface-variant">vs</span>
              <span className="flex-1 text-right">{m.away}</span>
            </p>
            <div
              role="radiogroup"
              aria-label={`Pronóstico para ${m.home} contra ${m.away}`}
              className="grid grid-cols-3 gap-1.5"
            >
              {OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex h-11 cursor-pointer select-none items-center justify-center gap-1 rounded border border-outline-variant
                    font-mono text-sm font-medium text-on-surface-variant
                    transition-[background-color,border-color,color,box-shadow] duration-150 ease-(--ease-out-quart)
                    hover:border-primary-container/60
                    has-checked:border-tertiary-container has-checked:bg-tertiary-container has-checked:font-bold has-checked:text-on-tertiary-fixed
                    has-focus-visible:outline-2 has-focus-visible:outline-primary-container"
                >
                  <input
                    type="radio"
                    name={`pick-${m.id}`}
                    value={opt.value}
                    defaultChecked={m.pick === opt.value}
                    aria-label={opt.label(m)}
                    className="peer sr-only"
                  />
                  {/* marca de forma además del color (accesibilidad) */}
                  <span aria-hidden className="hidden text-[0.6rem] peer-checked:inline">
                    ◆
                  </span>
                  {opt.short}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Guardando jornada…">
          Guardar jornada
        </SubmitButton>
        {state.ok && (
          <p role="status" className="text-sm font-semibold text-tertiary-fixed">
            ✓ Jornada guardada
          </p>
        )}
        {!state.ok && lastModified && (
          <p className="label-data text-on-surface-variant">
            Última modificación: {lastModified}
          </p>
        )}
      </div>

      {state.error && (
        <div
          role="alert"
          className="mt-4 rounded bg-error-container/40 px-4 py-3 text-sm text-on-error-container"
        >
          <p className="font-semibold">{state.error}</p>
          {state.missing && (
            <ul className="mt-1 list-inside list-disc">
              {state.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
