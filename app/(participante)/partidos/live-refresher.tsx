"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresco automático mientras hay partidos en vivo (spec live-match):
 * re-renderiza el Server Component cada ~60 s para traer el marcador más
 * reciente. La página solo monta este componente cuando hay vivos, así que
 * sin partidos en curso no existe ningún polling. En pestañas ocultas se
 * pausa; al volver a ser visible refresca de inmediato (el usuario regresa
 * justo a ver cómo va).
 */
export function LiveRefresher({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer === null)
        timer = setInterval(() => router.refresh(), intervalMs);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh(); // datos frescos al volver, sin esperar el intervalo
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
