interface SkeletonCardProps {
  lines?: number;
  className?: string;
  /** @deprecated PolyLex Web uses Playful Light exclusively. */
  light?: boolean;
}

export default function SkeletonCard({ lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`space-y-3 rounded-[var(--radius-card)] bg-[var(--color-card)] p-4 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-full bg-[var(--color-card-2)]"
          style={{
            height: i === 0 ? '18px' : '12px',
            width: i === 0 ? '60%' : `${70 + (i % 3) * 10}%`,
          }}
        />
      ))}
    </div>
  );
}
