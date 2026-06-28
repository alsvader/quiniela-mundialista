"use client";

import { useActionState, useState } from "react";
import { savePick, type SavePickState } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Chip } from "@/components/ui/chip";
import { TeamFlag } from "@/components/team-flag";
import type { Pick } from "@/lib/domain/scoring";

export interface MatchForCard {
  id: number;
  home: string;
  away: string;
  homeCode: string | null;
  awayCode: string | null;
  group: string | null;
  /** Hora de inicio HH:MM CDMX */
  time: string;
  /** Hora límite HH:MM CDMX (kickoff − 1h) */
  closesAt: string;
  /** "Estadio · Ciudad" ya formateado, o null si la sede no está capturada */
  venue: string | null;
  pick: Pick | null;
  /** Última modificación formateada, o null si nunca se ha guardado */
  lastModified: string | null;
  /** Eliminatoria: sin empate, el pronóstico es "quién avanza" (L/V). */
  eliminatoria: boolean;
}

type PickOption = { value: Pick; short: string; label: string };

/**
 * Opciones del pronóstico según la temporada (change eliminatoria-quien-avanza):
 * grupos = L/E/V; eliminatoria = solo quién avanza (L/V, sin empate).
 */
function pickOptions(match: MatchForCard): PickOption[] {
  if (match.eliminatoria) {
    return [
      { value: "H", short: match.home, label: `${match.home} avanza` },
      { value: "A", short: match.away, label: `${match.away} avanza` },
    ];
  }
  return [
    { value: "H", short: "L", label: `Gana ${match.home} (local)` },
    { value: "D", short: "E", label: "Empate" },
    { value: "A", short: "V", label: `Gana ${match.away} (visitante)` },
  ];
}

/**
 * Partido abierto con guardado propio (spec predictions, guardado por
 * partido): radiogroup L/E/V + botón Guardar + estado por card. El botón se
 * habilita solo con cambios sin guardar; el estado distingue guardado,
 * sin guardar y error.
 */
export function MatchPickCard({ match }: { match: MatchForCard }) {
  const [state, action] = useActionState<SavePickState, FormData>(savePick, {});
  const [selected, setSelected] = useState<Pick | null>(match.pick);

  // El pick que el servidor conoce: el eco del último guardado o el inicial.
  const savedPick = state.savedPick ?? match.pick;
  const dirty = selected !== null && selected !== savedPick;

  return (
    <li className="glass group p-4">
      <form action={action}>
        <input type="hidden" name="match_id" value={match.id} />
        <fieldset className="m-0 border-0 p-0">
          <legend className="sr-only">
            {match.home} contra {match.away}
          </legend>
          <div className="flex items-center justify-between gap-2">
            {match.group ? <Chip tone="neutral">Grupo {match.group}</Chip> : <span />}
            <span className="label-data text-on-surface-variant">
              {match.time} h
            </span>
          </div>
          <p className="mt-3 mb-4 flex items-center justify-between gap-2 text-base font-semibold text-on-surface">
            <span className="flex flex-1 items-center gap-2">
              <TeamFlag code={match.homeCode} />
              {match.home}
            </span>
            <span className="label-data shrink-0 text-on-surface-variant">vs</span>
            <span className="flex flex-1 items-center justify-end gap-2 text-right">
              {match.away}
              <TeamFlag code={match.awayCode} />
            </span>
          </p>
          {match.venue && (
            <p className="label-data -mt-2 mb-4 truncate text-on-surface-variant">
              {match.venue}
            </p>
          )}
          {match.eliminatoria && (
            <p className="label-data mb-2 text-on-surface-variant">
              ¿Quién avanza?
            </p>
          )}
          <div
            role="radiogroup"
            aria-label={
              match.eliminatoria
                ? `¿Quién avanza? ${match.home} o ${match.away}`
                : `Pronóstico para ${match.home} contra ${match.away}`
            }
            className={`grid gap-1.5 ${
              match.eliminatoria ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {pickOptions(match).map((opt) => (
              <label
                key={opt.value}
                className="flex h-11 cursor-pointer select-none items-center justify-center gap-1 rounded border border-outline-variant px-2
                  font-mono text-sm font-medium text-on-surface-variant
                  transition-[background-color,border-color,color,box-shadow] duration-150 ease-(--ease-out-quart)
                  hover:border-primary-container/60
                  has-checked:border-tertiary-container has-checked:bg-tertiary-container has-checked:font-bold has-checked:text-on-tertiary-fixed
                  has-focus-visible:outline-2 has-focus-visible:outline-primary-container"
              >
                <input
                  type="radio"
                  name="pick"
                  value={opt.value}
                  defaultChecked={match.pick === opt.value}
                  onChange={() => setSelected(opt.value)}
                  aria-label={opt.label}
                  className="peer sr-only"
                />
                {/* marca de forma además del color (accesibilidad) */}
                <span aria-hidden className="hidden shrink-0 text-[0.6rem] peer-checked:inline">
                  ◆
                </span>
                <span className="truncate">{opt.short}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant/40 pt-3">
          <SubmitButton
            pendingLabel="Guardando…"
            className="px-4"
            {...(!dirty && { disabled: true })}
          >
            Guardar
          </SubmitButton>
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span role="status" className="text-sm font-semibold">
              {dirty ? (
                <span className="text-secondary-fixed">Sin guardar</span>
              ) : state.ok ? (
                <span className="text-tertiary-fixed">✓ Guardado</span>
              ) : match.lastModified ? (
                <span className="font-normal text-on-surface-variant">
                  Guardado · {match.lastModified}
                </span>
              ) : (
                <span className="font-normal text-on-surface-variant">
                  Sin pronóstico
                </span>
              )}
            </span>
            <span className="label-data text-on-surface-variant">
              Cierra a las {match.closesAt}
            </span>
          </div>
        </div>

        {state.error && (
          <p
            role="alert"
            className="mt-3 rounded bg-error-container/40 px-3 py-2 text-sm font-semibold text-on-error-container"
          >
            {state.error}
          </p>
        )}
      </form>
    </li>
  );
}
