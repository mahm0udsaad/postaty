"use client";

export function GallerySkeleton() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="break-inside-avoid animate-pulse">
          <div className="bg-surface-1 rounded-2xl overflow-hidden border border-card-border">
            <div
              className="w-full bg-surface-2"
              style={{ height: `${180 + (i % 3) * 60}px` }}
            />
            <div className="p-3 space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-surface-2 rounded" />
                <div className="h-3 w-16 bg-surface-2 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-5 w-20 bg-surface-2 rounded-md" />
                <div className="h-3 w-14 bg-surface-2 rounded" />
              </div>
              <div className="h-8 w-full bg-surface-2 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-surface-1/70 rounded-2xl border border-card-border p-4 flex items-center gap-4"
        >
          <div className="h-4 w-28 bg-surface-2 rounded" />
          <div className="h-6 w-24 bg-surface-2 rounded-lg" />
          <div className="h-4 w-32 bg-surface-2 rounded flex-1" />
          <div className="h-6 w-16 bg-surface-2 rounded-lg" />
          <div className="flex gap-1.5">
            <div className="w-8 h-8 bg-surface-2 rounded-lg" />
            <div className="w-8 h-8 bg-surface-2 rounded-lg" />
          </div>
          <div className="w-5 h-5 bg-surface-2 rounded" />
        </div>
      ))}
    </div>
  );
}

export function HistoryPageSkeleton() {
  return (
    <main className="min-h-screen py-12 px-4 bg-grid-pattern">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-pulse">
          <div className="h-8 w-48 bg-surface-2 rounded-full mx-auto mb-4" />
          <div className="h-10 w-64 bg-surface-2 rounded mx-auto mb-4" />
          <div className="h-4 w-80 bg-surface-2 rounded mx-auto" />
        </div>
        <div className="flex justify-center mb-8">
          <div className="h-10 w-48 bg-surface-2 rounded-xl" />
        </div>
        <div className="flex justify-center mb-4">
          <div className="h-10 w-96 bg-surface-2 rounded-xl" />
        </div>
        <div className="flex justify-center mb-8">
          <div className="h-10 w-40 bg-surface-2 rounded-xl" />
        </div>
        <GallerySkeleton />
      </div>
    </main>
  );
}
