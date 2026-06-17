"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type DayOption = {
  /** Fecha de la jornada (YYYY-MM-DD), clave de getJornadas. */
  date: string;
  /** Abreviatura del día ("dom"…"sáb"), formateada en servidor (CDMX). */
  weekday: string;
  /** Número de día del mes, formateado en servidor (CDMX). */
  day: string;
};

/**
 * Tira de días del calendario (spec match-schedule). El estado vive en la URL
 * (?dia=YYYY-MM-DD,…); la selección efectiva se resuelve SIEMPRE en servidor y
 * llega por `selected`, así que el cliente solo alterna tokens y navega —
 * nunca deriva fechas (sin drift de zona horaria).
 *
 * Selección vacía = "Todos" (se navega a `?dia=` presente-vacío, no a la base,
 * para no caer en el día por defecto; ver day-filter.ts D3). `equipo` y
 * cualquier otro parámetro se preservan al navegar.
 *
 * `disabled` pausa la tira (atenuada, no interactiva) cuando hay una búsqueda
 * de equipo activa: esa búsqueda abarca todo el torneo y el día no aplica.
 */
export function DayFilter({
  days,
  today,
  selected,
  basePath,
  disabled = false,
}: {
  days: DayOption[];
  today: string;
  selected: string[];
  basePath: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const order = days.map((d) => d.date);

  const selectedKey = selected.join(",");
  const [active, setActive] = useState(selected);
  const [pending, startTransition] = useTransition();
  // Última selección que navegó ESTE componente: distingue sus cambios de
  // navegaciones externas (back/forward, otro filtro) para re-sincronizar.
  const lastSent = useRef(selectedKey);

  useEffect(() => {
    if (selectedKey !== lastSent.current) {
      lastSent.current = selectedKey;
      setActive(selected);
    }
  }, [selectedKey, selected]);

  function apply(nextDays: string[]) {
    const key = nextDays.join(",");
    lastSent.current = key;
    setActive(nextDays);
    const params = new URLSearchParams(searchParams);
    // dia siempre presente: vacío ("Todos") es un estado distinto de ausente.
    params.set("dia", key);
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    );
  }

  function toggle(date: string) {
    const next = active.includes(date)
      ? active.filter((d) => d !== date)
      : [...active, date];
    // conserva el orden del calendario
    apply(order.filter((d) => next.includes(d)));
  }

  const showingAll = active.length === 0;

  return (
    <div
      role="group"
      aria-label="Filtrar por día"
      aria-busy={pending}
      aria-disabled={disabled || undefined}
      title={disabled ? "Filtro de día en pausa mientras buscas un equipo" : undefined}
      className={`-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2
        [scrollbar-width:thin] [scrollbar-color:var(--color-outline-variant)_transparent]
        ${disabled ? "pointer-events-none opacity-45" : ""}`}
    >
      <button
        type="button"
        aria-pressed={showingAll}
        disabled={disabled}
        onClick={() => apply([])}
        className={cellClass(showingAll)}
      >
        <span className="label-data uppercase">Todos</span>
      </button>

      {days.map((d) => {
        const isSelected = active.includes(d.date);
        const isToday = d.date === today;
        return (
          <button
            key={d.date}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${d.weekday} ${d.day}${isToday ? " (hoy)" : ""}`}
            disabled={disabled}
            onClick={() => toggle(d.date)}
            className={`${cellClass(isSelected)} snap-start flex-col gap-0.5`}
          >
            <span
              className={`label-data uppercase ${
                isSelected ? "text-on-primary-fixed-variant" : "text-on-surface-variant"
              }`}
            >
              {d.weekday}
            </span>
            <span className="text-lg font-semibold leading-none tabular-nums">
              {d.day}
            </span>
            {/* marca de "hoy", independiente de la selección */}
            <span
              aria-hidden
              className={`mt-0.5 size-1 rounded-full transition-colors duration-150 ${
                isToday
                  ? isSelected
                    ? "bg-on-primary-fixed"
                    : "bg-primary-fixed-dim"
                  : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Celda de la tira: 44px+ táctil, ghost por defecto, relleno cian + glow al
 * seleccionar. `flex-1` + `min-w-14`: en desktop las celdas crecen para llenar
 * el ancho del contenedor; en móvil el piso de 56px fuerza el scroll horizontal.
 */
function cellClass(selected: boolean): string {
  return `inline-flex h-14 min-w-14 flex-1 items-center justify-center rounded-md border px-3
    transition-[color,background-color,border-color,box-shadow] duration-150 ease-(--ease-out-quart)
    ${
      selected
        ? "border-transparent bg-primary-container text-on-primary-fixed shadow-(--shadow-glow-primary)"
        : "border-outline-variant bg-white/4 text-on-surface hover:border-primary-container/60 hover:bg-white/6"
    }`;
}
