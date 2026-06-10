import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "success";

const base =
  "inline-flex h-11 items-center justify-center gap-2 rounded px-5 font-sans text-sm font-semibold " +
  "transition-[background-color,box-shadow,border-color,opacity] duration-200 ease-(--ease-out-quart) " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none";

const variants: Record<Variant, string> = {
  // DESIGN.md: botón primario = relleno cian neón con texto casi negro
  primary:
    "bg-primary-container text-on-primary-fixed " +
    "hover:shadow-(--shadow-glow-primary) active:bg-primary-fixed-dim",
  // DESIGN.md: secundario = "ghost" con borde que brilla al hover
  ghost:
    "border border-outline-variant bg-transparent text-on-surface " +
    "hover:border-primary-container/60 hover:shadow-(--shadow-glow-primary) " +
    "active:bg-primary-container/10",
  danger:
    "bg-error-container text-on-error-container " +
    "hover:shadow-[0_0_15px_rgb(147_0_10/0.5)] active:opacity-90",
  success:
    "bg-tertiary-container text-on-tertiary-fixed " +
    "hover:shadow-(--shadow-glow-tertiary) active:bg-tertiary-fixed-dim",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
