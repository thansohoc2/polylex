import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Mic, Play, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageBadge } from '@/components/ui/Badge';
import { PhoneticDisplay } from '@/components/ui/PhoneticDisplay';
import StrengthBar from '@/components/ui/StrengthBar';
import { playAudio, speakText } from '@/utils/audio';
import { useAudioSettingsStore } from '@/store/audio-settings.store';
import { vocabularyApi } from '@/api/client';

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

interface ShadowingExerciseProps {
  item: QueueItem;
  disabled?: boolean;
  onComplete: (recallQuality: number, confidenceLevel: number) => void;
  light?: boolean;
}

type Stage = 'idle' | 'recording' | 'recorded' | 'scored';

/** Normalise text for pronunciation comparison. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,!?;:'"¿¡]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

/** Character-level similarity as a 0–100 percentage. */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return 100;
  if (!na || !nb) return 0;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.round(Math.max(0, 1 - dist / maxLen) * 100);
}

export default function ShadowingExercise({ item, disabled = false, light = false, onComplete }: ShadowingExerciseProps) {
  const { t } = useTranslation();
  const rate = useAudioSettingsStore((s) => s.rate);

  const [stage, setStage] = useState<Stage>('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [pendingRecognition, setPendingRecognition] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedUrlRef = useRef<string | null>(null);

  const term = item.vocabularyBase.term;
  const langCode = item.vocabularyBase.language.code;
  const sentence = item.vocabularyBase.exampleSentence;
  const translation = item.vocabularyBase.translations[0]?.translation ?? '';
  // The phrase the learner must shadow: prefer the example sentence for rhythm/intonation.
  const targetPhrase = sentence && sentence.trim().length > 0 ? sentence : term;
  const recordingSupported = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

  const cleanupRecordedUrl = () => {
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  // Reset everything when the word changes.
  useEffect(() => {
    setStage('idle');
    setTranscript('');
    setScore(null);
    setMicError(null);
    cleanupRecordedUrl();
    setRecordedUrl(null);
    // Play the model so the learner hears it first.
    playModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop();
      stopStream();
      cleanupRecordedUrl();
    };
  }, []);

  const playModel = () => {
    if (sentence && sentence.trim().length > 0) {
      // Speak the full sentence for shadowing rhythm; term audio if only the word.
      speakText(sentence, langCode, rate);
    } else {
      playAudio(term, langCode, item.vocabularyBase.audioUrl, rate);
    }
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1] ?? '';
          resolve(base64);
        } else {
          reject(new Error('Unable to serialize audio'));        }
      };
      reader.onerror = () => reject(new Error('Failed to encode audio'));
      reader.readAsDataURL(blob);
    });

  const recognizeRecording = async (blob: Blob) => {
    setPendingRecognition(true);
    try {
      const base64Audio = await convertBlobToBase64(blob);
      const result = await vocabularyApi.recognizeSpeech({
        languageCode: langCode,
        audioBase64: base64Audio,
        targetText: targetPhrase,
      });
      setTranscript(result.transcript);
      setScore(result.accuracyPercent);
      if (result.confidence === 0) {
        setMicError(t('review.shadowLowConfidence'));
      }
    } catch (error) {
      setMicError(t('review.shadowRecognitionFailed'));
    } finally {
      setPendingRecognition(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const playRecording = () => {
    if (!recordedUrl) return;
    const audio = new Audio(recordedUrl);
    audio.play().catch(() => undefined);
  };

  const retry = () => {
    cleanupRecordedUrl();
    setRecordedUrl(null);
    setTranscript('');
    setScore(null);
    setMicError(null);
    setStage('idle');
  };

  const startRecording = async () => {
    if (disabled || stage === 'recording') return;
    setMicError(null);
    setTranscript('');
    setScore(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        cleanupRecordedUrl();
        const url = URL.createObjectURL(blob);
        recordedUrlRef.current = url;
        setRecordedUrl(url);
        stopStream();
        setStage('recorded');
        await recognizeRecording(blob);
      };

      recorder.start();
      setStage('recording');
    } catch {
      setMicError(t('review.micDenied'));
      setStage('idle');
    }
  };

  /** Map an accuracy percentage to ACRE recallQuality + confidence. */
  const finishWithScore = () => {
    if (score === null) return;
    let quality: number;
    let confidence: number;
    if (score >= 90) {
      quality = 5;
      confidence = 5;
    } else if (score >= 75) {
      quality = 4;
      confidence = 4;
    } else if (score >= 50) {
      quality = 3;
      confidence = 3;
    } else {
      quality = 1;
      confidence = 2;
    }
    onComplete(quality, confidence);
  };

  // ── Theme tokens (mirrors ListeningExercise) ──
  const cardBg = light ? 'var(--color-card)' : '#1A1A2E';
  const cardBorder = light ? 'var(--color-line)' : 'rgba(99,102,241,0.2)';
  const textSoft = light ? 'var(--color-red-300)' : '#f27b5d';
  const textMuted = light ? 'var(--color-red-200)' : '#94A3B8';
  const accentColor = light ? 'var(--color-coral)' : '#A78BFA';
  const btnBg = light ? 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' : 'linear-gradient(135deg, #6366F1, #8B5CF6)';
  const playBg = light ? 'rgba(255,100,70,0.12)' : 'rgba(99,102,241,0.2)';

  const scoreColor = score === null ? textMuted : score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

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

        <p className="text-xs mb-3" style={{ color: textSoft }}>{t('review.shadowPrompt')}</p>

        {/* Model phrase */}
        <p className="text-2xl font-bold text-center" style={{ color: accentColor }}>{term}</p>
        <PhoneticDisplay
          phonetic={item.vocabularyBase.phonetic}
          phoneticRomaji={item.vocabularyBase.phoneticRomaji}
          languageCode={langCode}
          className="text-sm mt-1"
        />
        {sentence && sentence.trim().length > 0 && (
          <p className="text-sm italic text-center mt-2 line-clamp-3" style={{ color: textMuted }}>
            "{sentence}"
          </p>
        )}
        {translation && <p className="text-xs mt-2" style={{ color: textMuted }}>{translation}</p>}

        {/* Listen to model */}
        <button
          onClick={playModel}
          className="mt-4 w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: playBg }}
          aria-label={t('review.listenModel')}
        >
          <Volume2 size={24} style={{ color: accentColor }} />
        </button>
        <button onClick={playModel} className="mt-2 text-xs underline" style={{ color: accentColor }}>
          {t('review.listenModel')}
        </button>

        <div className="mt-3">
          <LanguageBadge code={langCode} name={item.vocabularyBase.language.name} />
        </div>

        {/* Score + transcript feedback */}
        {stage === 'recorded' && score !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 w-full flex flex-col items-center"
          >
            <span className="text-3xl font-extrabold" style={{ color: scoreColor }}>{score}%</span>
            <span className="text-xs mt-1" style={{ color: textMuted }}>{t('review.shadowAccuracy')}</span>
            {transcript && (
              <p className="text-sm mt-2 text-center" style={{ color: textMuted }}>
                {t('review.youSaid')}: <span style={{ color: scoreColor }}>"{transcript}"</span>
              </p>
            )}
          </motion.div>
        )}

        {stage === 'recorded' && score === null && (
          <p className="mt-5 text-xs text-center" style={{ color: textMuted }}>
            {t('review.shadowSelfRate')}
          </p>
        )}

        {micError && (
          <p className="mt-4 text-xs text-center" style={{ color: '#EF4444' }}>{micError}</p>
        )}
      </div>

      {/* Recording controls */}
      {stage === 'idle' && (
        <button
          onClick={startRecording}
          disabled={disabled}
          className="w-full py-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 min-h-[56px]"
          style={{ background: btnBg }}
        >
          <Mic size={18} /> {t('review.startRecording')}
        </button>
      )}

      {stage === 'recording' && (
        <button
          onClick={stopRecording}
          className="w-full py-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 min-h-[56px]"
          style={{ background: '#EF4444' }}
        >
          <Square size={16} /> {t('review.stopRecording')}
        </button>
      )}

      {stage === 'recorded' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={playRecording}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 min-h-[52px]"
              style={{ background: playBg, color: accentColor }}
            >
              <Play size={16} /> {t('review.playMyVoice')}
            </button>
            <button
              onClick={retry}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 min-h-[52px]"
              style={{ background: playBg, color: accentColor }}
            >
              <RotateCcw size={16} /> {t('review.tryAgain')}
            </button>
          </div>

          {score !== null ? (
            <button
              onClick={finishWithScore}
              disabled={disabled}
              className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-opacity disabled:opacity-50 min-h-[56px]"
              style={{ background: btnBg }}
            >
              {t('review.continue')}
            </button>
          ) : (
            /* No auto-scoring available — learner self-rates after listening back. */
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onComplete(1, 2)}
                disabled={disabled}
                className="py-3 rounded-2xl font-semibold text-sm text-white min-h-[52px]"
                style={{ background: '#EF4444' }}
              >
                {t('review.hard')}
              </button>
              <button
                onClick={() => onComplete(3, 3)}
                disabled={disabled}
                className="py-3 rounded-2xl font-semibold text-sm text-white min-h-[52px]"
                style={{ background: '#F59E0B' }}
              >
                {t('review.ok')}
              </button>
              <button
                onClick={() => onComplete(5, 5)}
                disabled={disabled}
                className="py-3 rounded-2xl font-semibold text-sm text-white min-h-[52px]"
                style={{ background: '#10B981' }}
              >
                {t('review.easy')}
              </button>
            </div>
          )}
        </div>
      )}

      {!recordingSupported && stage === 'idle' && (
        <p className="text-center text-xs" style={{ color: textMuted }}>
          {t('review.shadowNoAutoScore')}
        </p>
      )}
      {pendingRecognition && (
        <p className="text-center text-xs" style={{ color: textMuted }}>
          {t('review.shadowRecognizing')}
        </p>
      )}
    </div>
  );
}
