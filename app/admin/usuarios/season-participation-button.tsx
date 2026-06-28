"use client";

import { useActionState } from "react";
import { setSeasonParticipation, type AdminState } from "../actions";
import { temporadaLabel, type Temporada } from "@/lib/domain/temporada";

/**
 * Confirma o retira el pago de un usuario en UNA temporada (change
 * fase-eliminatoria-temporada). Toggle: si participa, el botón la retira;
 * si no, la confirma. La participación es independiente entre temporadas.
 */
export function SeasonParticipationButton({
  userId,
  temporada,
  active,
}: {
  userId: string;
  temporada: Temporada;
  active: boolean;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    setSeasonParticipation,
    {}
  );
  const next = active ? "disabled" : "active";
  const label = temporadaLabel(temporada);

  return (
    <form action={action} className="inline">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="temporada" value={temporada} />
      <input type="hidden" name="status" value={next} />
      <button
        type="submit"
        disabled={pending}
        title={
          state.error ??
          (active
            ? `Quitar la participación de ${label}`
            : `Confirmar el pago de ${label}`)
        }
        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-[color,background-color,border-color,box-shadow] duration-150 disabled:opacity-50 ${
          active
            ? "border-transparent bg-tertiary-container text-on-tertiary-fixed hover:shadow-(--shadow-glow-tertiary)"
            : "border-outline-variant text-on-surface-variant hover:border-tertiary-container/60 hover:text-on-surface"
        }`}
      >
        <span aria-hidden>{active ? "✓" : "+"}</span>
        {pending ? "…" : state.error ? "Error" : label}
      </button>
    </form>
  );
}
