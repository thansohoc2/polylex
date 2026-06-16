// CEFR level badge
interface CefrBadgeProps {
  level: string;
  className?: string;
  light?: boolean;
}

export function CefrBadge({ level, className = '', light = false }: CefrBadgeProps) {
  const darkMap: Record<string, string> = {
    A1: 'bg-[#10B981]/20 text-[#10B981]',
    A2: 'bg-[#10B981]/20 text-[#10B981]',
    B1: 'bg-[#F59E0B]/20 text-[#F59E0B]',
    B2: 'bg-[#F59E0B]/20 text-[#F59E0B]',
    C1: 'bg-[#6366F1]/20 text-[#6366F1]',
    C2: 'bg-[#6366F1]/20 text-[#6366F1]',
  };
  const lightMap: Record<string, string> = {
    A1: 'bg-[color-mix(in_srgb,var(--color-ok)_14%,white)] text-[var(--color-ok)]',
    A2: 'bg-[color-mix(in_srgb,var(--color-ok)_14%,white)] text-[var(--color-ok)]',
    B1: 'bg-[color-mix(in_srgb,var(--color-gold)_18%,white)] text-[#B5790A]',
    B2: 'bg-[color-mix(in_srgb,var(--color-gold)_18%,white)] text-[#B5790A]',
    C1: 'bg-[color-mix(in_srgb,var(--color-grape)_14%,white)] text-[var(--color-grape)]',
    C2: 'bg-[color-mix(in_srgb,var(--color-grape)_14%,white)] text-[var(--color-grape)]',
  };
  const map = light ? lightMap : darkMap;
  const fallback = light ? 'bg-[var(--color-card-2)] text-[var(--color-ink-3)]' : 'bg-white/10 text-[#94A3B8]';
  const color = map[level] ?? fallback;

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

export function LanguageBadge({ code, name, className = '', light = false }: LanguageBadgeProps) {
  const flag = flagMap[code] ?? '🌐';
  const tone = light
    ? 'bg-[var(--color-card-2)] text-[var(--color-ink-2)]'
    : 'bg-white/5 text-[#94A3B8]';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${tone} ${className}`}
    >
      {flag} {name ?? code.toUpperCase()}
    </span>
  );
}
