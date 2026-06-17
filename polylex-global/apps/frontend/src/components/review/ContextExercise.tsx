import { useState, useRef, useEffect } from 'react';
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

interface ContextExerciseProps {
  item: QueueItem;
  disabled?: boolean;
  /** Called once the user has graded their answer and pressed Continue. */
  onComplete: (recallQuality: number, confidenceLevel: number) => void;
  light?: boolean;
}

const FAST_RESPONSE_MS = 8_000;
const BLANK = '_____';

/** Normalise an answer for comparison: trim, lowercase, collapse whitespace. */
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Levenshtein distance — used to tolerate a single typo. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

type Grade = 'correct' | 'close' | 'wrong';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replace the target term inside the sentence with a blank placeholder. */
function blankOut(sentence: string, term: string): string {
  if (!term) return sentence;
  const re = new RegExp(escapeRegExp(term), 'gi');
  return sentence.replace(re, BLANK);
}

/** Grade the typed word against the expected term (tolerating one typo). */
function gradeAnswer(input: string, term: string): Grade {
  const guess = normalize(input);
  const target = normalize(term);
  if (!guess) return 'wrong';
  if (guess === target) return 'correct';
  const dist = levenshtein(guess, target);
  if (dist <= 1 && target.length > 2) return 'close';
  return 'wrong';
}

export default function ContextExercise({ item, disabled = false, light = false, onComplete }: ContextExerciseProps) {
  const { t } = useTranslation();
  const rate = useAudioSettingsStore((s) => s.rate);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const startRef = useRef(Date.now());

  const sentence = item.vocabularyBase.exampleSentence ?? '';
  const blanked = blankOut(sentence, item.vocabularyBase.term);
  const translation = item.vocabularyBase.translations[0]?.translation ?? '';

  useEffect(() => {
    setValue('');
    setGrade(null);
    startRef.current = Date.now();
    inputRef.current?.focus();
  }, [item.id]);

  const handleCheck = () => {
    if (grade !== null || disabled) return;
    const result = gradeAnswer(value, item.vocabularyBase.term);
    setGrade(result);
    playAudio(
      item.vocabularyBase.term,
      item.vocabularyBase.language.code,
      item.vocabularyBase.audioUrl,
      rate,
    );
  };

  const handleContinue = () => {
    if (grade === null) return;
    const elapsed = Date.now() - startRef.current;
    let recallQuality: number;
    let confidenceLevel: number;
    if (grade === 'correct') {
      recallQuality = elapsed <= FAST_RESPONSE_MS ? 5 : 4;
      confidenceLevel = elapsed <= FAST_RESPONSE_MS ? 5 : 4;
    } else if (grade === 'close') {
      recallQuality = 3;
      confidenceLevel = 3;
    } else {
      recallQuality = 0;
      confidenceLevel = 1;
    }
    onComplete(recallQuality, confidenceLevel);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (grade === null) handleCheck();
    else handleContinue();
  };

  const gradeColor =
    grade === 'correct' ? '#10B981' : grade === 'close' ? '#F59E0B' : '#EF4444';

  const cardBg = light ? 'var(--color-card)' : '#1A1A2E';
  const cardBorder = light ? 'var(--color-line)' : 'rgba(99,102,241,0.2)';
  const textPrimary = light ? 'var(--color-ink)' : '#F1F5F9';
  const textSoft = light ? 'var(--color-red-400)' : '#ffc9c9';
  const textMuted = light ? 'var(--color-red-300)' : '#ffc9c9';
  const accentColor = light ? 'var(--color-coral)' : '#A78BFA';
  const inputBg = light ? 'var(--color-card-2)' : '#12121F';
  const btnBg = light ? 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' : 'linear-gradient(135deg, #6366F1, #8B5CF6)';

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Prompt card */}
      <div
        className="relative rounded-3xl p-6 flex flex-col items-center justify-center"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, minHeight: '30vh' }}
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

        <p className="text-xs mb-3" style={{ color: textSoft }}>{t('review.contextPrompt')}</p>

        {/* Sentence with blank (or revealed term) */}
        <div className="flex items-start gap-2">
          <p className="text-xl font-semibold text-center leading-relaxed" style={{ color: textPrimary }}>
            {grade === null
              ? blanked
              : sentence.split(new RegExp(`(${escapeRegExp(item.vocabularyBase.term)})`, 'gi')).map((part, i) =>
                  part.toLowerCase() === item.vocabularyBase.term.toLowerCase() ? (
                    <span key={i} style={{ color: gradeColor }} className="font-bold">
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
          </p>
          {grade !== null && (
            <button
              onClick={() => speakText(sentence, item.vocabularyBase.language.code, rate)}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1"
              style={{ background: 'rgba(99,102,241,0.15)' }}
              aria-label="Pronounce sentence"
            >
              <Volume2 size={13} className="text-[#6366F1]" />
            </button>
          )}
        </div>

        <div className="mt-3">
          <LanguageBadge
            code={item.vocabularyBase.language.code}
            name={item.vocabularyBase.language.name}
          />
        </div>

        {grade !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 w-full flex flex-col items-center"
          >
            <span className="text-sm font-semibold mb-1" style={{ color: gradeColor }}>
              {grade === 'correct'
                ? t('review.answerCorrect')
                : grade === 'close'
                  ? t('review.answerClose')
                  : t('review.answerWrong')}
            </span>
            <p className="text-2xl font-bold text-center" style={{ color: accentColor }}>
              {item.vocabularyBase.term}
            </p>
            <PhoneticDisplay
              phonetic={item.vocabularyBase.phonetic}
              phoneticRomaji={item.vocabularyBase.phoneticRomaji}
              languageCode={item.vocabularyBase.language.code}
              className="text-sm mt-1"
            />
            {translation && (
              <p className="text-sm mt-2" style={{ color: textMuted }}>{translation}</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={grade !== null || disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={t('review.contextPlaceholder')}
        className="w-full rounded-2xl px-4 py-4 text-base outline-none disabled:opacity-60"
        style={{
          background: inputBg,
          border: `1px solid ${grade !== null ? gradeColor : cardBorder}`,
          color: textPrimary,
        }}
      />

      {/* Action button */}
      {grade === null ? (
        <button
          onClick={handleCheck}
          disabled={disabled || value.trim().length === 0}
          className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-opacity disabled:opacity-40 min-h-[56px]"
          style={{ background: btnBg }}
        >
          {t('review.check')}
        </button>
      ) : (
        <button
          onClick={handleContinue}
          disabled={disabled}
          className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-opacity disabled:opacity-50 min-h-[56px]"
          style={{ background: btnBg }}
        >
          {t('review.continue')}
        </button>
      )}

      {(grade === 'correct' || grade === 'close') && (
        <button
          onClick={() => onComplete(0, 1)}
          className="w-full text-center text-xs underline" style={{ color: textMuted }}
        >
          {t('review.markWrong')}
        </button>
      )}
    </div>
  );
}
