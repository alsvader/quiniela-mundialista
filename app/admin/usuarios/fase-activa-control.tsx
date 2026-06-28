"use client";

import { useActionState } from "react";
import { setFaseActiva, type AdminState } from "../actions";
import { TEMPORADAS, temporadaLabel, type Temporada } from "@/lib/domain/temporada";

/**
 * Mueve la temporada activa (change fase-eliminatoria-temporada): la fase a la
 * que se invita a pagar (pestaña por defecto, CTA y leyenda). No autoriza por
 * sí sola; el gate es la participación.
 */
export function FaseActivaControl({ current }: { current: Temporada }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    setFaseActiva,
    {}
  );

  return (
    <form
      action={action}
      className="glass flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
    >
      <span className="label-data text-on-surface-variant">Fase activa</span>
      <div className="inline-flex gap-1 rounded-lg border border-outline-variant/70 bg-white/4 p-1">
        {TEMPORADAS.map((t) => {
          const selected = t === current;
          return (
            <button
              key={t}
              type="submit"
              name="fase_activa"
              value={t}
              disabled={pending || selected}
              className={`inline-flex h-8 items-center rounded-md px-3 text-xs font-bold transition-[color,background-color,box-shadow] duration-150 disabled:cursor-default ${
                selected
                  ? "bg-primary-container text-on-primary-fixed shadow-(--shadow-glow-primary)"
                  : "text-on-surface-variant hover:bg-white/6 hover:text-on-surface"
              }`}
            >
              {temporadaLabel(t)}
            </button>
          );
        })}
      </div>
      {state.error && (
        <span className="text-xs font-semibold text-error">{state.error}</span>
      )}
      <span className="text-xs text-on-surface-variant">
        Es la fase a la que se invita a pagar; mueve la pestaña por defecto y el
        aviso de pago.
      </span>
    </form>
  );
}
