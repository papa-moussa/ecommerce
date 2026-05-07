export default function ProduitDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumb skeleton */}
      <div className="mb-8 flex gap-2">
        <div className="h-3 w-16 bg-brand-ink/5 rounded animate-pulse" />
        <div className="h-3 w-4 bg-brand-ink/5 rounded animate-pulse" />
        <div className="h-3 w-24 bg-brand-ink/5 rounded animate-pulse" />
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Gallery skeleton */}
        <div className="aspect-square w-full bg-brand-ink/5 rounded-2xl animate-pulse lg:sticky lg:top-8" />

        {/* Details skeleton */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-3 w-20 bg-brand-ink/5 rounded animate-pulse" />
            <div className="h-12 w-3/4 bg-brand-ink/5 rounded animate-pulse" />
            <div className="h-4 w-24 bg-brand-ink/5 rounded animate-pulse" />
          </div>

          <div className="h-8 w-32 bg-brand-ink/5 rounded animate-pulse" />

          <div className="space-y-4">
            <div className="h-3 w-24 bg-brand-ink/5 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-brand-ink/5 rounded-full animate-pulse" />
              <div className="h-10 w-24 bg-brand-ink/5 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="h-14 w-full bg-brand-ink/5 rounded-full animate-pulse" />

          <div className="space-y-2 border-t border-brand-ink/10 pt-6">
            <div className="h-4 w-full bg-brand-ink/5 rounded animate-pulse" />
            <div className="h-4 w-full bg-brand-ink/5 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-brand-ink/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
