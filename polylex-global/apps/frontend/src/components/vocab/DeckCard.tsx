import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LanguageBadge } from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

interface VocabEntry {
  id: string;
  term: string;
  cefrLevel?: string;
  translations: { translation: string }[];
}

interface DeckCardProps {
  languageCode: string;
  languageName: string;
  words: VocabEntry[];
  dueCount?: number;
}

export default function DeckCard({ languageCode, languageName, words, dueCount = 0 }: DeckCardProps) {
  const [expanded, setExpanded] = useState(false);

  const avgMastery = 0.6; // placeholder until review data is available
  const displayWords = expanded ? words : words.slice(0, 3);

  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <LanguageBadge code={languageCode} name={languageName} />
        <div className="flex-1" />
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#A78BFA' }}
        >
          {words.length} terms
        </span>
        {dueCount > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
          >
            {dueCount} due
          </span>
        )}
      </div>

      {/* Progress */}
      <ProgressBar value={avgMastery * 100} max={100} className="mb-3" />

      {/* Word list */}
      <div className="space-y-1.5">
        {displayWords.map((w) => (
          <div key={w.id} className="flex items-center gap-2">
            <span className="text-[#F1F5F9] text-sm font-medium">{w.term}</span>
            {w.translations[0] && (
              <>
                <span className="text-[#475569] text-xs">—</span>
                <span className="text-[#94A3B8] text-xs truncate">{w.translations[0].translation}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Expand toggle */}
      {words.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 mt-3 text-[#6366F1] text-xs font-medium"
        >
          {expanded ? (
            <><ChevronUp size={14} /> Show less</>
          ) : (
            <><ChevronDown size={14} /> +{words.length - 3} more</>
          )}
        </button>
      )}
    </div>
  );
}
