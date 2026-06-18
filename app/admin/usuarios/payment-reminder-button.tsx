/**
 * Enlace deep link admin → usuario para recordar el pago (spec account-activation).
 * Presentacional: el link se arma server-side en la página (no expone datos
 * bancarios fuera del panel). Cuando `link` es null se muestra deshabilitado con
 * el motivo en `disabledHint`.
 *
 * Jerarquía (ui-ux-pro-max `primary-action` / `visual-hierarchy`): "Activar" es la
 * acción consecuente y domina con relleno sólido verde; este botón es secundario,
 * así que usa estilo ghost (outline) y se diferencia por peso, no por color. El
 * icono de WhatsApp comunica el destino; el verde (tertiary) aparece solo en hover.
 */
const base =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded px-3 text-xs font-bold " +
  "transition-[color,border-color,background-color,box-shadow] duration-150";

function WhatsappIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-3.5"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.2 4.79 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.84 14.16c-.25.7-1.46 1.34-2 1.42-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07s.77-2.18 1.04-2.48c.27-.3.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.25.59.84 2.05.91 2.2.07.15.12.32.02.52-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.36.27.14.43.11.59-.07.16-.17.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.13.45.2.52.31.07.11.07.65-.18 1.35Z" />
    </svg>
  );
}

export function PaymentReminderButton({
  link,
  disabledHint,
}: {
  link: string | null;
  disabledHint: string;
}) {
  if (!link) {
    return (
      <span
        aria-disabled="true"
        title={disabledHint}
        className={`${base} cursor-not-allowed border border-outline-variant/40 text-on-surface-variant opacity-50`}
      >
        <WhatsappIcon />
        Recordar pago
      </span>
    );
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir WhatsApp con el recordatorio de pago"
      className={`${base} border border-outline-variant bg-transparent text-on-surface hover:border-tertiary-fixed/70 hover:text-tertiary-fixed hover:shadow-(--shadow-glow-tertiary)`}
    >
      <WhatsappIcon />
      Recordar pago
    </a>
  );
}
