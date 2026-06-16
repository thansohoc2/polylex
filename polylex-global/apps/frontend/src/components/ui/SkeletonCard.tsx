interface SkeletonCardProps {
  lines?: number;
  className?: string;
  light?: boolean;
}

export default function SkeletonCard({ lines = 3, className = '', light = false }: SkeletonCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 space-y-3 ${className}`}
      style={{ background: light ? 'var(--color-card)' : '#1A1A2E' }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            height: i === 0 ? '18px' : '12px',
            width: i === 0 ? '60%' : `${70 + (i % 3) * 10}%`,
            background: light
              ? 'linear-gradient(90deg, #EFE6DE 0%, #FBF6F2 50%, #EFE6DE 100%)'
              : 'linear-gradient(90deg, #1A1A2E 0%, #16213E 50%, #1A1A2E 100%)',
            backgroundSize: '200%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      ))}
    </div>
  );
}
