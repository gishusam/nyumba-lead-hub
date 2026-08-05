function SkeletonCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      data-overview-skeleton-card
      className={`min-h-28 animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}
    >
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="mt-5 h-7 w-20 rounded bg-muted" />
      <div className="mt-3 h-3 w-32 rounded bg-muted/70" />
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div
      aria-label="Loading Communications overview"
      aria-busy="true"
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonCard key={index} className="min-h-36" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <div className="min-h-80 animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="mt-8 space-y-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-10 rounded bg-muted" />
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-80 animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-10 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
