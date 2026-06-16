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
      className="w-full flex items-center gap-3 py-3 px-4 text-left active:bg-white/5 transition-colors"
    >
      {/* Left content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[#084685] font-semibold text-sm">{item.term}</span>
          <PhoneticDisplay
            phonetic={item.phonetic}
            phoneticRomaji={item.phoneticRomaji}
            languageCode={item.language.code}
            className="text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {item.partOfSpeech && (
            <span className="text-[#475569] text-xs italic">{item.partOfSpeech}</span>
          )}
          {item.partOfSpeech && firstTranslation && (
            <span className="text-[#334155] text-xs">·</span>
          )}
          {firstTranslation && (
            <span className="text-[#64748B] text-xs truncate">{firstTranslation}</span>
          )}
        </div>
      </div>

      {/* Right: CEFR + chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.cefrLevel && <CefrBadge level={item.cefrLevel} />}
        <ChevronRight size={14} className="text-[#334155]" />
      </div>
    </button>
  );
}
