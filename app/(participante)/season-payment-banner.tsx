import { formatDeadline } from "@/lib/format";
import { temporadaLabel, type Temporada } from "@/lib/domain/temporada";

/**
 * Banner persistente de pago de una temporada (change fase-eliminatoria-
 * temporada, spec account-activation). Se muestra a quien NO participa en la
 * temporada activa (`fase_activa`): la nombra, advierte la pérdida de partidos
 * que cierran antes del pago e indica el próximo cierre de esa temporada.
 * Variante del PendingBanner; mismo tono y vocabulario visual.
 */
export function SeasonPaymentBanner({
  temporada,
  whatsappLink,
  nextKickoff,
}: {
  temporada: Temporada;
  whatsappLink: string | null;
  nextKickoff: string | null;
}) {
  const label = temporadaLabel(temporada).toLowerCase();
  return (
    <div
      role="status"
      className="border-b border-secondary-container/40 bg-secondary-container/15 px-5 py-2.5"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-on-surface">
          <span className="font-bold text-secondary-fixed">
            Aún no entras a la fase de {label}.
          </span>{" "}
          Paga para guardar tus pronósticos de esta fase
          {nextKickoff ? (
            <>
              {" "}
              — el próximo partido cierra el{" "}
              <strong className="text-on-surface">
                {formatDeadline(nextKickoff)}
              </strong>
              ; entra antes para no perderlo.{" "}
              <span className="text-on-surface-variant">
                Los partidos que cierren antes de tu pago se pierden sin recurso.
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
            Pagar por WhatsApp
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
