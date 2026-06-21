"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
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
 * Tira de días del calendario (spec match-schedule). Selección de UN día a la
 * vez: tocar un día reemplaza al anterior (control segmentado). La celda
 * "Todos" muestra el torneo completo. Siempre hay exactamente una opción
 * activa; no existe el estado "sin selección".
 *
 * El estado vive en la URL (?dia=YYYY-MM-DD); la selección efectiva se resuelve
 * SIEMPRE en servidor y llega por `selected` (lista de 0 o 1 elemento), así que
 * el cliente solo navega — nunca deriva fechas (sin drift de zona horaria).
 * Día seleccionado → `?dia=<día>`; "Todos" → `?dia=` (presente-vacío, distinto
 * de ausente, que sería el día por defecto). `equipo` y demás parámetros se
 * preservan al navegar.
 *
 * Se modela con radios nativos (selección única, navegación por flechas y
 * anuncio de lector de pantalla sin JS extra). `disabled` pausa la tira
 * (atenuada, no interactiva) cuando hay una búsqueda de equipo activa.
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

  const selectedKey = selected.join(",");
  // null = "Todos"; un día = esa fecha.
  const [active, setActive] = useState<string | null>(selected[0] ?? null);
  const [pending, startTransition] = useTransition();
  // Última selección que navegó ESTE componente: distingue sus cambios de
  // navegaciones externas (back/forward, búsqueda de equipo) para re-sincronizar.
  const lastSent = useRef(selectedKey);

  // Tira scrollable + celda objetivo (la activa, o la de hoy si está "Todos").
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLLabelElement | null>(null);
  // Centrar solo al montar y al re-sincronizar por navegación externa; nunca en
  // los taps del usuario (la celda tocada ya estaba visible). Arranca en true
  // para posicionar al montar.
  const shouldCenter = useRef(true);

  useEffect(() => {
    if (selectedKey !== lastSent.current) {
      lastSent.current = selectedKey;
      shouldCenter.current = true;
      setActive(selected[0] ?? null);
    }
  }, [selectedKey, selected]);

  // Posiciona el scroll horizontal del contenedor para centrar la celda
  // objetivo. El navegador acota scrollLeft a [0, scrollWidth - clientWidth],
  // así que una celda en un extremo queda completamente visible sin scroll
  // vacío. Toca SOLO el eje horizontal del contenedor: no mueve el scroll
  // vertical de la página. useLayoutEffect fija la posición antes del paint
  // para evitar el parpadeo "ver 0 → salta al centro".
  useLayoutEffect(() => {
    if (!shouldCenter.current) return;
    shouldCenter.current = false;
    const container = containerRef.current;
    const cell = targetRef.current;
    if (!container || !cell) return;
    container.scrollLeft =
      cell.offsetLeft - (container.clientWidth - cell.clientWidth) / 2;
  }, [active]);

  function select(day: string | null) {
    const key = day ?? "";
    lastSent.current = key;
    setActive(day);
    const params = new URLSearchParams(searchParams);
    // dia siempre presente: vacío ("Todos") es un estado distinto de ausente.
    params.set("dia", key);
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    );
  }

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Filtrar por día"
      aria-busy={pending}
      aria-disabled={disabled || undefined}
      title={disabled ? "Filtro de día en pausa mientras buscas un equipo" : undefined}
      className={`-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2
        [scrollbar-width:thin] [scrollbar-color:var(--color-outline-variant)_transparent]
        ${disabled ? "pointer-events-none opacity-45" : ""}`}
    >
      <label className={`${cellClass(active === null)} snap-start`}>
        <input
          type="radio"
          name="dia-filter"
          className="sr-only"
          checked={active === null}
          disabled={disabled}
          onChange={() => select(null)}
        />
        <span className="label-data uppercase">Todos</span>
      </label>

      {days.map((d) => {
        const isSelected = active === d.date;
        const isToday = d.date === today;
        // Objetivo del centrado: el día seleccionado; si está "Todos", hoy.
        const isTarget = isSelected || (active === null && isToday);
        return (
          <label
            key={d.date}
            ref={(el) => {
              if (isTarget) targetRef.current = el;
            }}
            className={`${cellClass(isSelected)} snap-start flex-col gap-0.5`}
          >
            <input
              type="radio"
              name="dia-filter"
              className="sr-only"
              checked={isSelected}
              disabled={disabled}
              onChange={() => select(d.date)}
              aria-label={`${d.weekday} ${d.day}${isToday ? " (hoy)" : ""}`}
            />
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
          </label>
        );
      })}
    </div>
  );
}

/**
 * Celda de la tira: 44px+ táctil, ghost por defecto, relleno cian + glow al
 * seleccionar. `flex-1` + `min-w-14`: en desktop las celdas crecen para llenar
 * el ancho del contenedor; en móvil el piso de 56px fuerza el scroll horizontal.
 * El radio interno es `sr-only`, así que el foco se refleja en la celda con
 * `has-[:focus-visible]` (espeja el anillo de foco global).
 */
function cellClass(selected: boolean): string {
  return `relative inline-flex h-14 min-w-14 flex-1 cursor-pointer items-center justify-center rounded-md border px-3
    transition-[color,background-color,border-color,box-shadow] duration-150 ease-(--ease-out-quart)
    has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-container has-[:focus-visible]:outline-offset-2
    ${
      selected
        ? "border-transparent bg-primary-container text-on-primary-fixed shadow-(--shadow-glow-primary)"
        : "border-outline-variant bg-white/4 text-on-surface hover:border-primary-container/60 hover:bg-white/6"
    }`;
}
