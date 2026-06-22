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
  light?: boolean;
}

export default function FlashCard({ item, isFlipped = false, light = false, onFlip }: FlashCardProps) {
  const { t } = useTranslation();
  const rate = useAudioSettingsStore((s) => s.rate);
  const translation = item.vocabularyBase.translations[0];
 const textPrimary = light ? 'var(--color-red-400)' : '#F1F5F9';
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
          background: light ? 'var(--color-card)' : '#1A1A2E',
          border: `1px solid ${light ? 'var(--color-line)' : 'rgba(99,102,241,0.2)'}`,
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
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
          >
            {t('review.leech')}
          </span>
        )}
        <p className="text-3xl font-bold  text-center mb-6 mt-10" style={{ color: textPrimary }}>
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
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.15)' }}
        >
          <Volume2 size={14} className="text-[#6366F1]" />
        </button>
        
        <LanguageBadge code={item.vocabularyBase.language.code} name={item.vocabularyBase.language.name} />
        <p className="text-[#475569] text-xs mt-auto pt-4">{t('review.tapToReveal')}</p>
      </motion.div>

      {/* Back */}
      <motion.div
        className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center"
        style={{
          background: light ? 'var(--color-card)' : '#1A1A2E',
          border: `1px solid ${light ? 'var(--color-line)' : 'rgba(99,102,241,0.3)'}`,
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
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.15)' }}
        >
          <Volume2 size={14} className="text-[#6366F1]" />
        </button>

        {translation && (
          <p className="text-2xl font-bold text-[#A78BFA] text-center mb-2">
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
            <p className="text-sm text-[#94A3B8] italic text-center line-clamp-3 flex-1">
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
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: 'rgba(148,163,184,0.12)' }}
              aria-label="Pronounce example sentence"
            >
              <Volume2 size={11} className="text-[#94A3B8]" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
    </div>
  );
}
