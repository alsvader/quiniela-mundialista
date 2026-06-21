import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/guards";
import { signOut } from "@/app/(public)/auth-actions";

const links = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/partidos", label: "Partidos" },
  { href: "/admin/configuracion", label: "Configuración" },
  { href: "/admin/ranking", label: "Ranking" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="sticky top-0 z-(--z-sticky) border-b border-outline-variant/40 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-3">
          <Link
            href="/admin/usuarios"
            className="heading-display text-base text-on-surface no-underline"
          >
            Quiniela{" "}
            <span className="text-secondary-container">Admin</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded px-3 py-2 text-sm font-semibold text-on-surface-variant transition-colors duration-150 hover:text-on-surface"
              >
                {l.label}
              </Link>
            ))}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded px-3 py-2 text-sm text-on-surface-variant/80 transition-colors duration-150 hover:text-on-surface"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 pt-8">
        {children}
      </main>
    </div>
  );
}
