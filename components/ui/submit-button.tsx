"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";
import type { ComponentProps } from "react";

/** Botón de envío con estado de carga automático dentro de un <form>. */
export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
