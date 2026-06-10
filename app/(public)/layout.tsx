import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 py-4">
        <Link
          href="/"
          className="heading-display text-lg text-on-surface no-underline"
        >
          Quiniela <span className="text-primary-fixed-dim">Mundialista</span>
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center px-5 pb-16">
        {children}
      </main>
    </div>
  );
}
