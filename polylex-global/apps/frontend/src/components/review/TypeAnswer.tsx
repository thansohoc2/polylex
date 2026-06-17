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

interface TypeAnswerProps {
  item: QueueItem;
  disabled?: boolean;
  light?: boolean;
  /** Called once the user has graded their answer and pressed Continue. */
  onComplete: (recallQuality: number, confidenceLevel: number) => void;

}
const FAST_RESPONSE_MS = 6_000;

/** Remove diacritics/accents from a string for fuzzy matching. */
function removeDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Remove parenthetical annotations like "(nam/nữ)", "(formal)", "[plural]". */
function stripAnnotations(s: string): string {
  return s
    .replace(/\([^)]*\)/g, '') // Remove (...) content
    .replace(/\[[^\]]*\]/g, '') // Remove [...] content
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalise an answer for comparison: trim, lowercase, collapse whitespace, remove punctuation. */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, '') // Remove common punctuation
    .replace(/\s+/g, ' ');
}

/** Remove common articles from the beginning of a string. */
function stripArticles(s: string): string {
  return s.replace(/^(a|an|the|un|une|des|le|la|les|el|la|los|las|der|die|das|il|lo|i|gli)\s+/i, '');
}

/** 
 * Expand variants from patterns like "Obrigado/a" → ["Obrigado", "Obrigada"]
 * Also handles patterns like "he/she", "Mr./Ms.", comma-separated variants,
 * and parenthetical annotations like "Cảm ơn (nam/nữ)" → ["Cảm ơn"]
 */
function expandVariants(text: string): string[] {
  const variants: string[] = [];
  
  // Strip parenthetical/bracket annotations first: "Cảm ơn (nam/nữ)" → "Cảm ơn"
  const cleaned = stripAnnotations(text);
  
  // Split by comma for patterns like "hóa đơn, biên lai"
  const commaSplit = cleaned.split(/\s*,\s+/);
  
  for (const part of commaSplit) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Check for slash patterns like "Obrigado/a", "he/she", "Meu / Minha"
    const slashMatch = trimmed.match(/^(.+?)\s*\/\s*(.+?)$/);
    
    if (slashMatch) {
      const [, base, suffix] = slashMatch;
      const baseTrim = base.trim();
      const suffixTrim = suffix.trim();
      
      // Handle patterns like "Obrigado/a" → ["Obrigado", "Obrigada"]
      // The suffix might be a single char to append, or a full word
      if (suffixTrim.length <= 2 && /^[a-zA-ZÀ-ỹ]+$/.test(suffixTrim) && !suffixTrim.includes(' ')) {
        // Single character or two-char suffix: append to base
        variants.push(baseTrim);
        variants.push(baseTrim + suffixTrim);
      } else {
        // Full alternative words: "he/she" → ["he", "she"], "Meu / Minha" → ["Meu", "Minha"]
        variants.push(baseTrim);
        variants.push(suffixTrim);
      }
    } else {
      // No slash pattern, use as-is
      variants.push(trimmed);
    }
  }
  
  return variants.length > 0 ? variants : [stripAnnotations(text) || text];
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

/** Grade a typed answer against all accepted translations. */
function gradeAnswer(input: string, translations: string[]): Grade {
  const guess = normalize(input);
  if (!guess) return 'wrong';
  
  let best: Grade = 'wrong';
  
  // Expand all translations into variants (e.g., "Obrigado/a" → ["Obrigado", "Obrigada"])
  const allVariants: string[] = [];
  for (const t of translations) {
    const variants = expandVariants(t);
    allVariants.push(...variants);
  }
  
  for (const variant of allVariants) {
    const target = normalize(variant);
    
    // 1. Exact match
    if (guess === target) return 'correct';
    
    // 2. Match without articles (a/an/the, etc.)
    const guessNoArticle = stripArticles(guess);
    const targetNoArticle = stripArticles(target);
    if (guessNoArticle === targetNoArticle && guessNoArticle.length > 0) {
      return 'correct';
    }
    
    // 3. Match ignoring diacritics (hóa đơn vs hoa don)
    const guessNoDiacritic = removeDiacritics(guess);
    const targetNoDiacritic = removeDiacritics(target);
    if (guessNoDiacritic === targetNoDiacritic) {
      return 'correct';
    }
    
    // 4. Fuzzy match with Levenshtein distance
    // Scale threshold with word length: longer words get more tolerance
    const dist = levenshtein(guess, target);
    const threshold = target.length <= 4 ? 1 : target.length <= 8 ? 2 : 3;
    
    if (dist <= threshold && target.length > 2) {
      if (dist === 1 || (dist === 2 && target.length > 6)) {
        best = 'close';
      } else if (best !== 'close') {
        // Only update if we haven't found a closer match
        best = 'close';
      }
    }
    
    // 5. Partial match for compound words (if guess contains target or vice versa)
    if (target.length > 4 && (guess.includes(target) || target.includes(guess))) {
      const longerLength = Math.max(guess.length, target.length);
      const shorterLength = Math.min(guess.length, target.length);
      // If one is at least 70% of the other, consider it close
      if (shorterLength / longerLength >= 0.7) {
        best = 'close';
      }
    }
  }
  
  return best;
}

/** Check if user is typing something close to any target (for real-time hint). */
function isTypingClose(input: string, translations: string[]): boolean {
  const guess = normalize(input);
  if (guess.length < 2) return false; // Too short to judge
  
  // Expand all translations into variants
  const allVariants: string[] = [];
  for (const t of translations) {
    const variants = expandVariants(t);
    allVariants.push(...variants);
  }
  
  for (const variant of allVariants) {
    const target = normalize(variant);
    const targetNoArticle = stripArticles(target);
    
    // Check if it's a prefix match
    if (target.startsWith(guess) || targetNoArticle.startsWith(guess)) {
      return true;
    }
    
    // Check if typing without diacritics matches
    const guessNoDiacritic = removeDiacritics(guess);
    const targetNoDiacritic = removeDiacritics(target);
    if (targetNoDiacritic.startsWith(guessNoDiacritic)) {
      return true;
    }
    
    // Check fuzzy proximity
    if (guess.length >= 3) {
      const dist = levenshtein(guess, target.slice(0, guess.length));
      if (dist <= 1) return true;
    }
  }
  
  return false;
}

export default function TypeAnswer({ item, disabled = false, light = false, onComplete }: TypeAnswerProps) {
  const { t } = useTranslation();
  const rate = useAudioSettingsStore((s) => s.rate);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const startRef = useRef(Date.now());

  const cardBg = light ? 'var(--color-card)' : '#1A1A2E';
  const cardBorder = light ? 'var(--color-line)' : 'rgba(99,102,241,0.2)';
  const textPrimary = light ? 'var(--color-ink)' : '#F1F5F9';
  const textMuted = light ? 'var(--color-red-400)' : '#ffc9c9';
  const textSecondary = light ? 'var(--color-red-300)' : '#ffc9c9';
  const inputBg = light ? 'var(--color-card-2)' : '#12121F';
  const buttonBg = light ? 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' : 'linear-gradient(135deg, #6366F1, #8B5CF6)';

  const translations = item.vocabularyBase.translations.map((tr) => tr.translation);
  const primary = translations[0] ?? '';
  
  // Check if user is typing in the right direction
  const typingClose = grade === null && value.length > 0 && isTypingClose(value, translations);

  useEffect(() => {
    // Reset state + refocus whenever the word changes.
    setValue('');
    setGrade(null);
    startRef.current = Date.now();
    inputRef.current?.focus();
  }, [item.id]);

  const handleCheck = () => {
    if (grade !== null || disabled) return;
    const result = gradeAnswer(value, translations);
    setGrade(result);
    // Play the term audio on reveal so the learner hears correct pronunciation.
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
        <p className="text-3xl font-bold text-center mb-2" style={{ color: textPrimary }}>
          {item.vocabularyBase.term}
        </p>
        <LanguageBadge
          code={item.vocabularyBase.language.code}
          name={item.vocabularyBase.language.name}
          light={light}
        />
        <p className="text-xs mt-4" style={{ color: textMuted }}>{t('review.typePrompt')}</p>

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
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-center" style={{ color: light ? 'var(--color-grape)' : '#A78BFA' }}>{primary}</p>
              <button
                onClick={() =>
                  playAudio(
                    item.vocabularyBase.term,
                    item.vocabularyBase.language.code,
                    item.vocabularyBase.audioUrl,
                    rate,
                  )
                }
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: light ? 'rgba(161,98,255,0.1)' : 'rgba(99,102,241,0.15)' }}
                aria-label="Pronounce term"
              >
                <Volume2 size={13} style={{ color: light ? 'var(--color-grape)' : '#6366F1' }} />
              </button>
            </div>
            <PhoneticDisplay
              phonetic={item.vocabularyBase.phonetic}
              phoneticRomaji={item.vocabularyBase.phoneticRomaji}
              languageCode={item.vocabularyBase.language.code}
              className="text-sm mt-1"
            />
            {item.vocabularyBase.exampleSentence && (
              <div className="flex items-start gap-1.5 mt-3">
                <p className="text-sm italic text-center line-clamp-3 flex-1" style={{ color: textSecondary }}>
                  "{item.vocabularyBase.exampleSentence}"
                </p>
                <button
                  onClick={() =>
                    speakText(
                      item.vocabularyBase.exampleSentence!,
                      item.vocabularyBase.language.code,
                      rate,
                    )
                  }
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: light ? 'rgba(99,99,99,0.1)' : 'rgba(148,163,184,0.12)' }}
                  aria-label="Pronounce example sentence"
                >
                  <Volume2 size={11} style={{ color: textSecondary }} />
                </button>
              </div>
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
        placeholder={t('review.typePlaceholder')}
        className="w-full rounded-2xl px-4 py-4 text-base outline-none disabled:opacity-60 transition-all"
        style={{
          background: inputBg,
          color: textPrimary,
          border: `2px solid ${
            grade !== null 
              ? gradeColor 
              : typingClose 
                ? (light ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.5)') // Green hint when typing close
                : (light ? 'var(--color-line)' : 'rgba(99,102,241,0.3)')
          }`,
          boxShadow: typingClose && grade === null
            ? (light ? '0 0 0 3px rgba(16,185,129,0.1)' : '0 0 0 3px rgba(16,185,129,0.15)')
            : 'none'
        }}
      />

      {/* Action button */}
      {grade === null ? (
        <button
          onClick={handleCheck}
          disabled={disabled || value.trim().length === 0}
          className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-opacity disabled:opacity-40 min-h-[56px]"
          style={{ background: buttonBg }}
        >
          {t('review.check')}
        </button>
      ) : (
        <button
          onClick={handleContinue}
          disabled={disabled}
          className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-opacity disabled:opacity-50 min-h-[56px]"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          {t('review.continue')}
        </button>
      )}

      {(grade === 'correct' || grade === 'close') && (
        <button
          onClick={() => onComplete(0, 1)}
          className="w-full text-center text-xs text-[#94A3B8] underline"
        >
          {t('review.markWrong')}
        </button>
      )}
    </div>
  );
}
