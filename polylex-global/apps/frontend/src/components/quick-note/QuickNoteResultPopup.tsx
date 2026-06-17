import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CefrBadge, LanguageBadge } from '@/components/ui/Badge';
import { PhoneticDisplay } from '@/components/ui/PhoneticDisplay';
import { playAudio } from '@/utils/audio';
import { useAudioSettingsStore } from '@/store/audio-settings.store';
import type { QuickNote } from './QuickNoteCard';

interface QuickNoteResultPopupProps {
  note: QuickNote | null;
  onClose: () => void;
  onAddToDeck: (vocabBaseId: string) => void;
  onOpenNotes: () => void;
}

/**
 * Centered modal that shows the AI-enriched result of a quick note once it is
 * ready. Opened from the "result ready" toast so the user can review the word
 * without leaving the page they were on.
 */
export default function QuickNoteResultPopup({
  note,
  onClose,
  onOpenNotes,
}: QuickNoteResultPopupProps) {
  const { t } = useTranslation();
  const rate = useAudioSettingsStore((s) => s.rate);

  const vb = note?.vocabularyBase ?? null;
  const translation = vb?.translations?.[0]?.translation;

  return (
    <AnimatePresence>
      {note && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(34, 27, 46, 0.45)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-5 pt-5 pb-4 relative"
              style={{ background: 'linear-gradient(135deg, rgba(255,107,74,0.10), rgba(255,138,61,0.10))' }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'var(--color-card-2)' }}
                aria-label={t('quicknote.close')}
              >
                <X size={16} style={{ color: 'var(--color-ink-3)' }} />
              </button>

              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-coral)' }}>
                ✨ {t('quicknote.resultReady', { term: note.term })}
              </p>

              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--color-ink)' }}>
                  {vb?.term ?? note.term}
                </h2>
                {vb && (
                  <button
                    onClick={() => playAudio(vb.term, vb.language.code, undefined, rate)}
                    className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0"
                    style={{ background: 'rgba(255,107,74,0.12)' }}
                    aria-label={t('quicknote.listen')}
                  >
                    <Volume2 size={15} style={{ color: 'var(--color-coral)' }} />
                  </button>
                )}
              </div>

              {vb && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <LanguageBadge code={vb.language.code} name={vb.language.name} light />
                  {vb.cefrLevel && <CefrBadge level={vb.cefrLevel} light />}
                  {vb.partOfSpeech && (
                    <span className="text-xs italic" style={{ color: 'var(--color-ink-3)' }}>
                      {vb.partOfSpeech}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              {(vb?.phonetic || vb?.phoneticRomaji) && (
                <PhoneticDisplay
                  phonetic={vb?.phonetic}
                  phoneticRomaji={vb?.phoneticRomaji}
                  languageCode={vb?.language.code}
                />
              )}

              {translation && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: 'var(--color-ink-3)' }}>
                    {t('quicknote.meaning')}
                  </p>

                  <p className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {translation}
                  </p>
                </div>
              )}

              {vb?.exampleSentence && (
                <div
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--color-card-2)' }}
                >
                  <p className="text-sm italic" style={{ color: 'var(--color-ink-2)' }}>
                    “{vb.exampleSentence}”
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 pt-1 flex flex-col gap-2">
             {/*  {canAddToDeck && (
                <button
                  onClick={() => {
                    onAddToDeck(note.vocabularyBaseId!);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
                >
                  <BookPlus size={18} />
                  {t('quicknote.addToDeck')}
                </button>
              )}
 */}
              <button
                onClick={onOpenNotes}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl py-2.5 font-medium"
                style={{ color: 'var(--color-coral)' }}
              >
                {t('quicknote.openNotes')}
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
