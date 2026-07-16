import { useMemo } from 'react';
import Chip from '@/components/ui/Chip';

interface PollableNote {
  sourceLanguageCode: string;
}

const flagMap: Record<string, string> = {
  en: '🇬🇧', vi: '🇻🇳', ja: '🇯🇵', fr: '🇫🇷',
  de: '🇩🇪', zh: '🇨🇳', ko: '🇰🇷', es: '🇪🇸',
};

interface LanguageFilterChipsProps {
  notes: PollableNote[];
  selected: string;
  onSelect: (code: string) => void;
  /** @deprecated PolyLex Web uses Playful Light exclusively. */
  light?: boolean;
}

export default function LanguageFilterChips({ notes, selected, onSelect }: LanguageFilterChipsProps) {
  const langs = useMemo(() => {
    const codes = new Set(notes.map((n) => n.sourceLanguageCode));
    return Array.from(codes);
  }, [notes]);

  if (langs.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-4">
      <Chip label="All" selected={selected === ''} onClick={() => onSelect('')} />
      {langs.map((code) => (
        <Chip
          key={code}
          label={`${flagMap[code] ?? '🌐'} ${code.toUpperCase()}`}
          selected={selected === code}
          onClick={() => onSelect(code)}
        />
      ))}
    </div>
  );
}
