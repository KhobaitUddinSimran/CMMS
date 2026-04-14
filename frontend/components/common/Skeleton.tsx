export function Skeleton({ className = '', shape = 'line' }: { className?: string; shape?: 'line' | 'circle' | 'square' }) {
  const base = 'bg-[#E5E7EB] animate-pulse rounded';
  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'aspect-square' : '';
  return <div className={`${base} ${shapeClass} ${className}`} />;
}
