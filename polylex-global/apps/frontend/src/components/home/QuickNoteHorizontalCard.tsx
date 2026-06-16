import { LanguageBadge } from '@/components/ui/Badge';

interface MiniNote {
  id: string;
  term: string;
  sourceLanguageCode: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  vocabularyBase?: {
    translations: { translation: string }[];
  } | null;
}

interface QuickNoteHorizontalCardProps {
  note: MiniNote;
  onClick: () => void;
}

const langAccent: Record<string, string> = {
  en: '#6366F1', vi: '#10B981', ja: '#EF4444',
  fr: '#3B82F6', de: '#F59E0B', zh: '#EC4899',
  ko: '#8B5CF6', es: '#F97316',
};

export default function QuickNoteHorizontalCard({ note, onClick }: QuickNoteHorizontalCardProps) {
  const translation = note.vocabularyBase?.translations?.[0]?.translation;
  const accent = langAccent[note.sourceLanguageCode] ?? '#6366F1';

  return (
    <button
      onClick={onClick}
      className="w-40 flex-shrink-0 rounded-2xl p-3 text-left"
      style={{
        background: '#1A1A2E',
        borderLeft: `3px solid ${accent}`,
        height: '112px',
      }}
    >
      <p className="font-bold text-[#F1F5F9] text-sm truncate mb-1">{note.term}</p>
      <LanguageBadge code={note.sourceLanguageCode} />
      {translation ? (
        <p className="text-[#94A3B8] text-xs mt-2 line-clamp-2">{translation}</p>
      ) : (
        <div
          className="mt-2 h-3 rounded-full"
          style={{
            width: '70%',
            background: 'linear-gradient(90deg, #16213E, #1A1A2E, #16213E)',
            backgroundSize: '200%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}
    </button>
  );
}
