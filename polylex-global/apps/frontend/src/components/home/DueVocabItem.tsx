const flagMap: Record<string, string> = {
  en: '🇬🇧', vi: '🇻🇳', ja: '🇯🇵', fr: '🇫🇷',
  de: '🇩🇪', zh: '🇨🇳', ko: '🇰🇷', es: '🇪🇸',
};

interface DueVocabItemProps {
  term: string;
  languageCode: string;
  languageName: string;
  memoryStrength: number;
}

export default function DueVocabItem({ term, languageCode, languageName, memoryStrength }: DueVocabItemProps) {
  const strengthColor =
    memoryStrength > 0.7 ? 'var(--color-ok)' : memoryStrength > 0.4 ? 'var(--color-warn)' : 'var(--color-bad)';

  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
      {/* Flag circle */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{ background: 'var(--color-card-2)' }}
      >
        {flagMap[languageCode] ?? '🌐'}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--color-ink)] text-sm truncate">{term}</p>
        <p className="text-[var(--color-ink-3)] text-xs">{languageName}</p>
      </div>

      {/* Memory strength bar */}
      <div className="w-16 h-1.5 bg-[var(--color-line)] rounded-full overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.round(memoryStrength * 100)}%`,
            background: strengthColor,
          }}
        />
      </div>
    </div>
  );
}
