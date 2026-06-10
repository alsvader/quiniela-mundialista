/** Skeleton de carga del panel (registro product: skeletons, no spinners). */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-5 pt-8" aria-busy>
      <div className="h-10 w-56 animate-pulse rounded bg-surface-container-high" />
      <div className="glass mt-8 flex flex-col gap-1 p-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded bg-surface-container-low"
          />
        ))}
      </div>
    </div>
  );
}
