export default function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/50 animate-pulse">
      {/* Avatar/Poster placeholder */}
      <div className="w-10 h-10 rounded bg-surface-2 flex-shrink-0" />
      
      {/* Main text placeholder */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-2 rounded w-1/3" />
        <div className="h-3 bg-surface-2 rounded w-1/4" />
      </div>
      
      {/* Additional columns placeholders */}
      <div className="hidden md:block w-24 h-4 bg-surface-2 rounded" />
      <div className="hidden lg:block w-32 h-4 bg-surface-2 rounded" />
      
      {/* Actions placeholder */}
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded bg-surface-2" />
        <div className="w-8 h-8 rounded bg-surface-2" />
      </div>
    </div>
  );
}
