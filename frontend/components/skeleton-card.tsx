export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="aspect-square bg-muted">
        <div className="h-full w-full animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-3 w-16 animate-shimmer rounded bg-muted bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
        <div className="h-4 w-3/4 animate-shimmer rounded bg-muted bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
        <div className="h-5 w-20 animate-shimmer rounded bg-muted bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
      </div>
    </div>
  );
}
