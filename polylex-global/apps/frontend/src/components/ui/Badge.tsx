// CEFR level badge
interface CefrBadgeProps {
  level: string;
  className?: string;
  light?: boolean;
}

export function CefrBadge({ level, className = '' }: CefrBadgeProps) {
  const toneMap: Record<string, string> = {
    A1: 'bg-[var(--color-ok-soft)] text-[var(--color-ok)]',
    A2: 'bg-[var(--color-ok-soft)] text-[var(--color-ok)]',
    B1: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
    B2: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
    C1: 'bg-[var(--color-grape-light)] text-[var(--color-grape-dark)]',
    C2: 'bg-[var(--color-grape-light)] text-[var(--color-grape-dark)]',
  };
  const color = toneMap[level] ?? 'bg-[var(--color-card-2)] text-[var(--color-ink-3)]';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}
    >
      {level}
    </span>
  );
}

// Language badge with flag emoji
const flagMap: Record<string, string> = {
  en: '🇬🇧',
  vi: '🇻🇳',
  ja: '🇯🇵',
  fr: '🇫🇷',
  de: '🇩🇪',
  zh: '🇨🇳',
  ko: '🇰🇷',
  es: '🇪🇸',
  pt: '🇵🇹',
  it: '🇮🇹',
};

interface LanguageBadgeProps {
  code: string;
  name?: string;
  className?: string;
  light?: boolean;
}

export function LanguageBadge({ code, name, className = '' }: LanguageBadgeProps) {
  const flag = flagMap[code] ?? '🌐';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--color-card-2)] text-[var(--color-ink-2)] ${className}`}
    >
      {flag} {name ?? code.toUpperCase()}
    </span>
  );
}
