"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TEMPORADAS, temporadaLabel, type Temporada } from "@/lib/domain/temporada";

/**
 * Control segmentado de temporada (change fase-eliminatoria-temporada): cambia
 * la vista entre Grupos y Eliminatoria. Mismo lenguaje visual que la tira de
 * días (celda h-11+, seleccionado = relleno cian + glow), pero como switch de
 * vista principal: dos opciones fijas, selección única.
 *
 * El estado vive en la URL (?temporada=); la resolución por defecto (a
 * `fase_activa`) ocurre en servidor y llega por `selected`, así que el cliente
 * solo navega. Cambiar de temporada limpia los filtros propios de otra
 * temporada (día/equipo) para no esconder partidos al cruzar de fase.
 */
export function SeasonTabs({
  selected,
  basePath,
  resetParams = [],
}: {
  selected: Temporada;
  basePath: string;
  /** Parámetros a descartar al cambiar de temporada (p. ej. dia, equipo). */
  resetParams?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function select(temporada: Temporada) {
    if (temporada === selected) return;
    const params = new URLSearchParams(searchParams);
    params.set("temporada", temporada);
    for (const p of resetParams) params.delete(p);
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Temporada"
      aria-busy={pending}
      className="inline-flex gap-1 rounded-lg border border-outline-variant/70 bg-white/4 p-1"
    >
      {TEMPORADAS.map((t) => {
        const isSelected = t === selected;
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => select(t)}
            className={`inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold
              transition-[color,background-color,box-shadow] duration-150 ease-(--ease-out-quart)
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2
              ${
                isSelected
                  ? "bg-primary-container text-on-primary-fixed shadow-(--shadow-glow-primary)"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/6"
              }`}
          >
            {temporadaLabel(t)}
          </button>
        );
      })}
    </div>
  );
}
