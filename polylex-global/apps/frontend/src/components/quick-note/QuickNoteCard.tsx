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
  light?: boolean;
}

export default function QuickNoteCard({ note, onDelete, onAddToDeck, light = false }: QuickNoteCardProps) {
  const { t } = useTranslation();
  const cardBg = light
    ? { background: 'var(--color-card)', border: '1px solid var(--color-line)' }
    : { background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.05)' };
  const textPrimary = light ? 'var(--color-ink)' : '#F1F5F9';
  const textSecondary = light ? 'var(--color-ink-soft)' : '#94A3B8';
  const textMuted = light ? 'var(--color-ink-softer)' : '#475569';
  const shimmerLight = light
    ? 'linear-gradient(90deg, #F5F0EB 0%, #FBF6F2 50%, #F5F0EB 100%)'
    : 'linear-gradient(90deg, #16213E 0%, #1A1A2E 50%, #16213E 100%)';
  const statusConfig = {
    PENDING: { label: t('quicknote.statusPending'), bg: light ? 'bg-[#F59E0B]/10 text-[#D97706]' : 'bg-[#F59E0B]/15 text-[#F59E0B]' },
    PROCESSING: { label: t('quicknote.statusProcessing'), bg: light ? 'bg-[var(--color-coral)]/15 text-[var(--color-coral)]' : 'bg-[#6366F1]/15 text-[#6366F1]' },
    DONE: { label: t('quicknote.statusDone'), bg: light ? 'bg-[var(--color-ok)]/10 text-[#059669]' : 'bg-[#10B981]/15 text-[#10B981]' },
    ERROR: { label: t('quicknote.statusError'), bg: light ? 'bg-[#EF4444]/10 text-[#DC2626]' : 'bg-[#EF4444]/15 text-[#EF4444]' },
  };
  const vb = note.vocabularyBase;
  const translation = vb?.translations?.[0];
  const canAddToDeck = note.status === 'DONE' && !!note.vocabularyBaseId;

  return (
    <div className="relative mx-4 mb-3">
      {/* Background actions */}
      <div className="absolute inset-y-0 left-0 w-20 flex items-center justify-center rounded-2xl" style={{ background: light ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.2)' }}>
        <Trash2 size={20} style={{ color: light ? '#DC2626' : '#EF4444' }} />
      </div>
      {canAddToDeck && (
        <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center rounded-2xl" style={{ background: light ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.2)' }}>
          <BookPlus size={20} style={{ color: light ? '#059669' : '#10B981' }} />
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
        className="relative z-10 rounded-2xl p-4 cursor-grab active:cursor-grabbing"
        style={cardBg}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="text-xl font-bold truncate" style={{ color: textPrimary }}>{note.term}</span>
            <LanguageBadge code={note.sourceLanguageCode} light={light} />
            {vb?.cefrLevel && <CefrBadge level={vb.cefrLevel} light={light} />}
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
          <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2" style={{ background: light ? 'var(--color-card-2)' : 'bg-white/5', color: textMuted }}>
            {vb.partOfSpeech}
          </span>
        )}

        {/* Translation */}
        {translation && (
          <p className="text-base font-medium mb-1" style={{ color: light ? 'var(--color-grape)' : '#A78BFA' }}>{translation.translation}</p>
        )}

        {/* Example */}
        {vb?.exampleSentence && (
          <p className="text-sm italic line-clamp-2" style={{ color: textSecondary }}>" {vb.exampleSentence}"</p>
        )}

        {/* Error */}
        {note.status === 'ERROR' && note.errorMessage && (
          <p className="text-xs mt-1" style={{ color: light ? '#DC2626' : '#EF4444' }}>{note.errorMessage}</p>
        )}

        {/* Loading skeleton for pending */}
        {(note.status === 'PENDING' || note.status === 'PROCESSING') && (
          <div className="space-y-2 mt-2">
            {[80, 60].map((w, i) => (
              <div
                key={i}
                className="rounded-full h-3"
                style={{
                  width: `${w}%`,
                  background: shimmerLight,
                  backgroundSize: '200%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
