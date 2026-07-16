import { motion } from 'framer-motion';
import { Trash2, BookPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CefrBadge, LanguageBadge } from '@/components/ui/Badge';
import { PhoneticDisplay } from '@/components/ui/PhoneticDisplay';

export interface QuickNote {
  id: string;
  term: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  errorMessage: string | null;
  vocabularyBaseId: string | null;
  createdAt: string;
  vocabularyBase?: {
    term: string;
    phonetic?: string;
    phoneticRomaji?: string | null;
    cefrLevel?: string;
    partOfSpeech?: string;
    exampleSentence?: string;
    language: { code: string; name: string };
    translations: { translation: string; targetLanguage: { code: string; name: string } }[];
  } | null;
}

interface QuickNoteCardProps {
  note: QuickNote;
  onDelete: (id: string) => void;
  onAddToDeck: (vocabBaseId: string) => void;
  /** @deprecated PolyLex Web uses Playful Light exclusively. */
  light?: boolean;
}

export default function QuickNoteCard({ note, onDelete, onAddToDeck }: QuickNoteCardProps) {
  const { t } = useTranslation();
  const statusConfig = {
    PENDING: { label: t('quicknote.statusPending'), bg: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]' },
    PROCESSING: { label: t('quicknote.statusProcessing'), bg: 'bg-[var(--color-info-soft)] text-[var(--color-info)]' },
    DONE: { label: t('quicknote.statusDone'), bg: 'bg-[var(--color-ok-soft)] text-[var(--color-ok)]' },
    ERROR: { label: t('quicknote.statusError'), bg: 'bg-[var(--color-bad-soft)] text-[var(--color-bad)]' },
  };
  const vb = note.vocabularyBase;
  const translation = vb?.translations?.[0];
  const canAddToDeck = note.status === 'DONE' && !!note.vocabularyBaseId;

  return (
    <div className="relative">
      {/* Background actions */}
      <div className="absolute inset-y-0 left-0 flex w-20 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-bad-soft)]">
        <Trash2 size={20} className="text-[var(--color-bad)]" aria-hidden="true" />
      </div>
      {canAddToDeck && (
        <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-ok-soft)]">
          <BookPlus size={20} className="text-[var(--color-ok)]" aria-hidden="true" />
        </div>
      )}

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: canAddToDeck ? -80 : -80, right: canAddToDeck ? 80 : 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            onDelete(note.id);
          } else if (info.offset.x > 60 && canAddToDeck && note.vocabularyBaseId) {
            onAddToDeck(note.vocabularyBaseId);
          }
        }}
        className="relative z-10 cursor-grab rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-card)] p-4 shadow-soft active:cursor-grabbing"
        whileTap={{ scale: 0.98 }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="truncate text-xl font-bold text-[var(--color-ink)]">{note.term}</span>
            <LanguageBadge code={note.sourceLanguageCode} light />
            {vb?.cefrLevel && <CefrBadge level={vb.cefrLevel} light />}
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusConfig[note.status].bg}`}
          >
            {statusConfig[note.status].label}
          </span>
        </div>

        {/* Phonetic */}
        <PhoneticDisplay
          phonetic={vb?.phonetic}
          phoneticRomaji={vb?.phoneticRomaji}
          className="text-sm mb-1"
        />

        {/* Part of speech */}
        {vb?.partOfSpeech && (
          <span className="mb-2 inline-block rounded-full bg-[var(--color-card-2)] px-2 py-0.5 text-xs text-[var(--color-ink-3)]">
            {vb.partOfSpeech}
          </span>
        )}

        {/* Translation */}
        {translation && (
          <p className="mb-1 text-base font-medium text-[var(--color-grape)]">{translation.translation}</p>
        )}

        {/* Example */}
        {vb?.exampleSentence && (
          <p className="line-clamp-2 text-sm italic text-[var(--color-ink-2)]">&quot; {vb.exampleSentence}&quot;</p>
        )}

        {/* Error */}
        {note.status === 'ERROR' && note.errorMessage && (
          <p className="mt-1 text-xs text-[var(--color-bad)]" role="alert">{note.errorMessage}</p>
        )}

        {/* Loading skeleton for pending */}
        {(note.status === 'PENDING' || note.status === 'PROCESSING') && (
          <div className="space-y-2 mt-2">
            {[80, 60].map((w, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded-full bg-[var(--color-card-2)]"
                style={{
                  width: `${w}%`,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
