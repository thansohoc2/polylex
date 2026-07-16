import { ChevronRight } from 'lucide-react';
import { CefrBadge } from '@/components/ui/Badge';
import { PhoneticDisplay } from '@/components/ui/PhoneticDisplay';

export interface VocabItem {
  id: string;
  term: string;
  phonetic?: string;
  phoneticRomaji?: string | null;
  cefrLevel?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  audioUrl?: string | null;
  language: { code: string; name: string };
  translations: { translation: string; targetLanguage?: { code: string; name: string } }[];
}

interface WordRowProps {
  item: VocabItem;
  onPress: (item: VocabItem) => void;
}

export default function WordRow({ item, onPress }: WordRowProps) {
  const firstTranslation = item.translations[0]?.translation;

  return (
    <button
      onClick={() => onPress(item)}
      className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-card-2)]"
    >
      {/* Left content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-[var(--color-ink)]">{item.term}</span>
          <PhoneticDisplay
            phonetic={item.phonetic}
            phoneticRomaji={item.phoneticRomaji}
            languageCode={item.language.code}
            className="text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {item.partOfSpeech && (
            <span className="text-xs italic text-[var(--color-ink-2)]">{item.partOfSpeech}</span>
          )}
          {item.partOfSpeech && firstTranslation && (
            <span className="text-xs text-[var(--color-ink-3)]">·</span>
          )}
          {firstTranslation && (
            <span className="truncate text-xs text-[var(--color-ink-3)]">{firstTranslation}</span>
          )}
        </div>
      </div>

      {/* Right: CEFR + chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.cefrLevel && <CefrBadge level={item.cefrLevel} />}
        <ChevronRight size={14} className="text-[var(--color-ink-3)]" aria-hidden="true" />
      </div>
    </button>
  );
}
