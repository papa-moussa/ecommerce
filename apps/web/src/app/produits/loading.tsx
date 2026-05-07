export default function ProduitsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-brand-ink/5" />

      <div className="flex gap-10">
        {/* Filters skeleton */}
        <aside className="hidden w-48 shrink-0 space-y-6 lg:block">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-brand-ink/5 rounded" />
              <div className="space-y-1">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-3 w-full bg-brand-ink/5 rounded" />
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Grid skeleton */}
        <div className="flex-1 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[3/4] w-full bg-brand-ink/5 rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-2/3 bg-brand-ink/5 rounded" />
                <div className="h-4 w-full bg-brand-ink/5 rounded" />
                <div className="h-4 w-1/3 bg-brand-ink/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
