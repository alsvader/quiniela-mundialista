import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5">
      <div className="glass w-full max-w-md p-8 text-center">
        <p className="font-mono text-6xl font-medium text-primary-container [text-shadow:0_0_24px_rgb(0_243_255/0.35)]">
          404
        </p>
        <h1 className="heading-display mt-3 text-2xl text-on-surface">
          Fuera de juego
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          Esta página no existe o fue movida. El torneo sigue: vuelve a la
          cancha.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded bg-primary-container px-5 text-sm font-semibold text-on-primary-fixed transition-shadow duration-200 hover:shadow-(--shadow-glow-primary)"
          >
            Ir al inicio
          </Link>
          <Link
            href="/ranking"
            className="inline-flex h-11 items-center rounded border border-outline-variant px-5 text-sm font-semibold text-on-surface transition-[border-color,box-shadow] duration-200 hover:border-primary-container/60 hover:shadow-(--shadow-glow-primary)"
          >
            Ver ranking
          </Link>
        </div>
      </div>
    </main>
  );
}
