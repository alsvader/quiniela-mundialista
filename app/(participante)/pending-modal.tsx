"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Modal informativo al iniciar sesión con cuenta pendiente (spec
 * account-activation). Se abre cuando la URL trae ?aviso=pago (puesto por la
 * redirección raíz tras el login) y se cierra limpiando el parámetro.
 */
export function PendingModal({
  deadline,
  whatsappLink,
}: {
  deadline: string | null;
  whatsappLink: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = searchParams.get("aviso") === "pago";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  if (!open) return null;

  function close() {
    dialogRef.current?.close();
    router.replace("/partidos", { scroll: false });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      className="glass m-auto w-[min(92vw,28rem)] p-8 text-on-surface backdrop:bg-surface-container-lowest/80 backdrop:backdrop-blur-sm"
    >
      <h2 className="heading-display text-xl">Falta validar tu pago</h2>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-on-surface-variant">
        <p>
          Para entrar a la fase activa, contacta al administrador por WhatsApp,
          realiza tu pago (transferencia o efectivo) y envíale el comprobante.
          Él confirmará tu participación.
        </p>
        <p className="font-semibold text-on-surface">
          Mientras no validemos tu pago no puedes guardar pronósticos de esta
          fase.
          {deadline && (
            <> El próximo partido cierra el {deadline}.</>
          )}{" "}
          Los partidos que cierren antes de tu pago se pierden sin recurso.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded bg-tertiary-container px-5 text-sm font-bold text-on-tertiary-fixed transition-shadow duration-200 hover:shadow-(--shadow-glow-tertiary)"
          >
            Contactar por WhatsApp
          </a>
        )}
        <Button variant="ghost" onClick={close}>
          Entendido
        </Button>
      </div>
    </dialog>
  );
}
