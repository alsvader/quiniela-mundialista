import { formatDeadline } from "@/lib/format";

/**
 * Banner persistente de pago pendiente (spec account-activation).
 * Advierte explícitamente la pérdida de partidos cerrados y el próximo cierre
 * (kickoff − 1h del siguiente partido abierto).
 */
export function PendingBanner({
  whatsappLink,
  nextKickoff,
}: {
  whatsappLink: string | null;
  nextKickoff: string | null;
}) {
  return (
    <div
      role="status"
      className="border-b border-secondary-container/40 bg-secondary-container/15 px-5 py-2.5"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-on-surface">
          <span className="font-bold text-secondary-fixed">
            Tu cuenta está pendiente de pago.
          </span>{" "}
          No puedes guardar pronósticos todavía
          {nextKickoff ? (
            <>
              {" "}
              — el próximo partido cierra el{" "}
              <strong className="text-on-surface">
                {formatDeadline(nextKickoff)}
              </strong>
              ; actívala antes para no perderlo.{" "}
              <span className="text-on-surface-variant">
                Los partidos que cierren antes de tu activación se pierden sin
                recurso.
              </span>
            </>
          ) : (
            "."
          )}
        </p>
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded bg-tertiary-container px-4 text-sm font-bold text-on-tertiary-fixed transition-shadow duration-200 hover:shadow-(--shadow-glow-tertiary)"
          >
            Activar por WhatsApp
          </a>
        ) : (
          <span className="text-xs text-on-surface-variant">
            El administrador aún no configura su WhatsApp.
          </span>
        )}
      </div>
    </div>
  );
}
