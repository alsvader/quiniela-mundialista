"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5">
      <div className="glass w-full max-w-md p-8 text-center">
        <p className="label-data text-error">Error</p>
        <h1 className="heading-display mt-2 text-2xl text-on-surface">
          Algo salió mal
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          Ocurrió un error inesperado. Tus pronósticos guardados están a salvo;
          intenta de nuevo.
        </p>
        {error.digest && (
          <p className="label-data mt-3 text-on-surface-variant/70">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <Button onClick={() => reset()}>Reintentar</Button>
        </div>
      </div>
    </main>
  );
}
