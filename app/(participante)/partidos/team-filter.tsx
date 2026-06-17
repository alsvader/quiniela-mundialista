"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

/**
 * Filtro por equipo (spec match-schedule): el estado vive en la URL
 * (?equipo=…) para que el listado se filtre en servidor, el link sea
 * compartible y el refresh del polling en vivo lo preserve solo.
 */
export function TeamFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get("equipo") ?? "").trim();

  const [value, setValue] = useState(urlQuery);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Última query que navegó ESTE componente: distingue sus propios cambios
  // de URL de navegaciones externas (botón "Limpiar filtro", back/forward).
  const lastSent = useRef(urlQuery);

  useEffect(() => {
    if (urlQuery !== lastSent.current) {
      if (timer.current) clearTimeout(timer.current);
      lastSent.current = urlQuery;
      setValue(urlQuery);
    }
  }, [urlQuery]);

  function navigate(query: string) {
    const q = query.trim();
    lastSent.current = q;
    // Preserva el filtro de día (?dia=) y demás parámetros al navegar.
    const params = new URLSearchParams(searchParams);
    if (q) params.set("equipo", q);
    else params.delete("equipo");
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `/partidos?${qs}` : "/partidos", { scroll: false })
    );
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(next), DEBOUNCE_MS);
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    setValue("");
    navigate("");
  }

  return (
    <div className="relative w-full sm:max-w-sm">
      <label htmlFor="team-filter" className="sr-only">
        Buscar por equipo
      </label>
      <input
        id="team-filter"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Busca tu equipo…"
        autoComplete="off"
        aria-busy={pending}
        className="h-11 w-full rounded border-b border-primary-container/50 bg-white/6 pl-3 pr-10
          text-base text-on-surface placeholder:text-on-surface-variant/70
          transition-[border-color,box-shadow] duration-150 ease-(--ease-out-quart)
          focus:border-primary-container focus:outline-none focus:shadow-(--shadow-glow-primary)
          [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpiar filtro"
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded
            text-on-surface-variant transition-colors duration-150 hover:text-on-surface"
        >
          ✕
        </button>
      )}
    </div>
  );
}
