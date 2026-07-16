import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageBadge } from '@/components/ui/Badge';
import { PhoneticDisplay } from '@/components/ui/PhoneticDisplay';
import StrengthBar from '@/components/ui/StrengthBar';
import { playAudio, speakText } from '@/utils/audio';
import { useAudioSettingsStore } from '@/store/audio-settings.store';

interface QueueItem {
  id: string;
  memoryStrength: number;
  isLeech: boolean;
  vocabularyBase: {
    term: string;
    phonetic?: string;
    phoneticRomaji?: string | null;
    exampleSentence?: string;
    audioUrl?: string | null;
    language: { code: string; name: string };
    translations: { translation: string; targetLanguage: { code: string; name: string } }[];
  };
}

interface FlashCardProps {
  item: QueueItem;
  isFlipped: boolean;
  onFlip: () => void;
  /** @deprecated Playful Light is now the only Web theme. */
  light?: boolean;
}

export default function FlashCard({ item, isFlipped = false, onFlip }: FlashCardProps) {
  const { t } = useTranslation();
  const rate = useAudioSettingsStore((s) => s.rate);
  const translation = item.vocabularyBase.translations[0];
  return (
    <div className="w-full flex flex-col gap-4">  
    <div
      className=" relative rounded-3xl p-6 flex flex-col items-center justify-center"
      style={{  minHeight: '30vh'}}
      onClick={onFlip}
    >
      {/* Front */}
      <motion.div
        className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-line)',
          backfaceVisibility: 'hidden',
        }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <StrengthBar value={item.memoryStrength} className="absolute top-4 left-4" />
        {item.isLeech && (
          <span
            className="text-xs px-2 py-0.5 rounded-full mb-3"
            style={{ background: 'var(--color-bad-soft)', color: 'var(--color-bad)' }}
          >
            {t('review.leech')}
          </span>
        )}
        <p className="text-3xl font-bold text-[var(--color-ink)] text-center mb-6 mt-10">
          {item.vocabularyBase.term}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            playAudio(
              item.vocabularyBase.term,
              item.vocabularyBase.language.code,
              item.vocabularyBase.audioUrl,
              rate,
            );
          }}
          className="absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-card-2)] text-[var(--color-grape)]"
          aria-label={t('review.pronounceTerm')}
        >
          <Volume2 size={18} />
        </button>
        
        <LanguageBadge light code={item.vocabularyBase.language.code} name={item.vocabularyBase.language.name} />
        <p className="text-[var(--color-ink-3)] text-xs mt-auto pt-4">{t('review.tapToReveal')}</p>
      </motion.div>

      {/* Back */}
      <motion.div
        className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-line)',
          backfaceVisibility: 'hidden',
          rotateY: 180,
        }}
        initial={{ rotateY: -180 }}
        animate={{ rotateY: isFlipped ? 0 : -180 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* TTS button — term */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playAudio(
              item.vocabularyBase.term,
              item.vocabularyBase.language.code,
              item.vocabularyBase.audioUrl,
              rate,
            );
          }}
          className="absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-card-2)] text-[var(--color-grape)]"
          aria-label={t('review.pronounceTerm')}
        >
          <Volume2 size={18} />
        </button>

        {translation && (
          <p className="text-2xl font-bold text-[var(--color-grape)] text-center mb-2">
            {translation.translation}
          </p>
        )}
        <PhoneticDisplay
          phonetic={item.vocabularyBase.phonetic}
          phoneticRomaji={item.vocabularyBase.phoneticRomaji}
          languageCode={item.vocabularyBase.language.code}
          className="text-sm mb-3"
        />
        {item.vocabularyBase.exampleSentence && (
          <div className="flex items-start gap-1.5 mt-1">
            <p className="text-sm text-[var(--color-ink-3)] italic text-center line-clamp-3 flex-1">
              "{item.vocabularyBase.exampleSentence}"
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakText(
                  item.vocabularyBase.exampleSentence!,
                  item.vocabularyBase.language.code,
                  rate,
                );
              }}
              className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-card-2)] text-[var(--color-ink-3)]"
              aria-label={t('review.pronounceExample')}
            >
              <Volume2 size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
    </div>
  );
}
