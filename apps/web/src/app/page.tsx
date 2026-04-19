export default function HomePage(): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <p className="mb-4 font-serif text-sm uppercase tracking-[0.3em] text-brand-gold">
          Maison Parfum
        </p>
        <h1 className="mb-6 font-serif text-5xl font-semibold md:text-7xl">
          Boutique bientôt disponible
        </h1>
        <p className="text-balance text-lg text-brand-ink/70">
          Sprint 0 bootstrappé — Next.js 14 + Tailwind prêts.
        </p>
      </div>
    </main>
  );
}
