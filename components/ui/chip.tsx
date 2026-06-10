import type { ReactNode } from "react";

type Tone = "primary" | "secondary" | "success" | "neutral" | "error";

const tones: Record<Tone, string> = {
  primary: "border-primary-container/60 text-primary-fixed",
  secondary: "border-secondary-container/60 text-secondary-fixed",
  success: "border-tertiary-container/60 text-tertiary-fixed",
  neutral: "border-outline-variant text-on-surface-variant",
  error: "border-error/60 text-error",
};

/** Chip/badge (DESIGN.md): label-sm mono, borde 1px del color de acento. */
export function Chip({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`label-data inline-flex items-center rounded-sm border px-2 py-1 uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
