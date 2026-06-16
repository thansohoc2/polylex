import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageBadge } from '@/components/ui/Badge';
import StrengthBar from '@/components/ui/StrengthBar';
import { playAudio } from '@/utils/audio';
import { useAudioSettingsStore } from '@/store/audio-settings.store';

interface QueueItem {
  id: string;
  memoryStrength: number;
  isLeech: boolean;
  vocabularyBase: {
    term: string;
    audioUrl?: string | null;
    language: { code: string; name: string };
    translations: { translation: string; targetLanguage: { code: string; name: string } }[];
  };
}

interface MultipleChoiceExerciseProps {
  item: QueueItem;
  allItems: QueueItem[];
  disabled?: boolean;
  onComplete: (recallQuality: number, confidenceLevel: number) => void;
  light?: boolean;
}

const FAST_RESPONSE_MS = 6_000;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildOptions(item: QueueItem, allItems: QueueItem[]): string[] {
  const correct = item.vocabularyBase.translations[0]?.translation ?? '';
  if (!correct) return [];

  const distractorPool = allItems
    .flatMap((q) => q.vocabularyBase.translations.map((tr) => tr.translation))
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .filter((t) => normalize(t) !== normalize(correct));

  const unique: string[] = [];
  for (const d of distractorPool) {
    if (!unique.some((x) => normalize(x) === normalize(d))) {
      unique.push(d);
    }
    if (unique.length >= 3) break;
  }

  while (unique.length < 3) {
    unique.push(`${correct} ·`);
  }

  const options = [correct, ...unique.slice(0, 3)];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

export default function MultipleChoiceExercise({
  item,
  allItems,
  disabled = false,
  onComplete,
  light = false,
}: MultipleChoiceExerciseProps) {
  const { t } = useTranslation();
  const rate = useAudioSettingsStore((s) => s.rate);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startAt, setStartAt] = useState(Date.now());

  const correct = item.vocabularyBase.translations[0]?.translation ?? '';
  const options = useMemo(() => buildOptions(item, allItems), [item.id, allItems.length]);

  const cardBg = light ? 'var(--color-card)' : '#1A1A2E';
  const cardBorder = light ? 'var(--color-line)' : 'rgba(99,102,241,0.2)';
  const textPrimary = light ? 'var(--color-ink)' : '#F1F5F9';
  const textSoft = light ? 'var(--color-ink-soft)' : '#475569';
  const optionBg = light ? 'var(--color-card-2)' : '#12121F';
  const optionBorder = light ? 'var(--color-line)' : 'rgba(99,102,241,0.3)';
  const btnBg = light ? 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' : 'linear-gradient(135deg, #6366F1, #8B5CF6)';

  useEffect(() => {
    setSelected(null);
    setRevealed(false);
    setIsCorrect(false);
    setStartAt(Date.now());
  }, [item.id]);

  const reveal = (option: string) => {
    if (revealed || disabled) return;
    const correctNow = normalize(option) === normalize(correct);
    setSelected(option);
    setRevealed(true);
    setIsCorrect(correctNow);
    playAudio(
      item.vocabularyBase.term,
      item.vocabularyBase.language.code,
      item.vocabularyBase.audioUrl,
      rate,
    );
  };

  const handleContinue = () => {
    if (!revealed) return;
    if (isCorrect) {
      const elapsed = Date.now() - startAt;
      onComplete(elapsed <= FAST_RESPONSE_MS ? 5 : 4, elapsed <= FAST_RESPONSE_MS ? 5 : 4);
      return;
    }
    onComplete(0, 1);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        className="relative rounded-3xl p-6 flex flex-col items-center justify-center"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, minHeight: '40vh' }}
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

        <p className="text-xs mb-2" style={{ color: textSoft }}>{t('review.multipleChoicePrompt')}</p>
        <p className="text-3xl font-bold text-center mb-2" style={{ color: textPrimary }}>
          {item.vocabularyBase.term}
        </p>
        <button
          onClick={() =>
            playAudio(
              item.vocabularyBase.term,
              item.vocabularyBase.language.code,
              item.vocabularyBase.audioUrl,
              rate,
            )
          }
          className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'rgba(99,102,241,0.15)' }}
          aria-label={t('review.replay')}
        >
          <Volume2 size={14} className="text-[#6366F1]" />
        </button>

        <LanguageBadge
          code={item.vocabularyBase.language.code}
          name={item.vocabularyBase.language.name}
        />

        {revealed && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold mt-4"
            style={{ color: isCorrect ? '#10B981' : '#EF4444' }}
          >
            {isCorrect ? t('review.answerCorrect') : t('review.answerWrong')}
          </motion.p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => {
          const isSelected = selected === option;
          const isRight = normalize(option) === normalize(correct);
          const showRight = revealed && isRight;
          const showWrong = revealed && isSelected && !isRight;
          const border = showRight
            ? '1px solid #10B981'
            : showWrong
              ? '1px solid #EF4444'
              : `1px solid ${optionBorder}`;
          const bg = showRight
            ? 'rgba(16,185,129,0.12)'
            : showWrong
              ? 'rgba(239,68,68,0.12)'
              : optionBg;

          return (
            <button
              key={option}
              onClick={() => reveal(option)}
              disabled={disabled || revealed}
              className="w-full rounded-2xl px-4 py-3 text-left text-sm disabled:opacity-90"
              style={{ background: bg, border, color: textPrimary }}
            >
              {option}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={disabled || !revealed}
        className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-opacity disabled:opacity-40 min-h-[56px]"
        style={{ background: btnBg }}
      >
        {t('review.continue')}
      </button>
    </div>
  );
}
