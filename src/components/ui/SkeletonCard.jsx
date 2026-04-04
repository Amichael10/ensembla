export default function SkeletonCard({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-32 h-48 min-w-[8rem]',
    md: 'w-48 h-72 min-w-[12rem]',
    lg: 'w-64 h-96 min-w-[16rem]'
  };

  return (
    <div className={`rounded-2xl overflow-hidden bg-surface animate-shimmer ${sizeClasses[size]}`}>
      <div className="w-full h-full"></div>
    </div>
  );
}
