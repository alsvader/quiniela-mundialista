/** Skeleton de carga (registro product: skeletons, no spinners). */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-5 pt-8" aria-busy>
      <div className="h-10 w-48 animate-pulse rounded bg-surface-container-high" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-surface-container" />
      <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="glass h-40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
