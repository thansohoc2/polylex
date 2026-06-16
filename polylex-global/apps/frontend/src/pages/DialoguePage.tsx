import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pathApi, DialogueLine, StageDialogueDto } from '@/api/client';
import AppShell from '@/components/layout/AppShell';
import { loadVoices, pickVoice } from '@/utils/audio';
import { useAudioSettingsStore } from '@/store/audio-settings.store';

export default function DialoguePage() {
  const { pathStageId } = useParams<{ pathStageId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [dialogue, setDialogue] = useState<StageDialogueDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});
  const [playingLineIdx, setPlayingLineIdx] = useState<number | null>(null);
  const [highlightRange, setHighlightRange] = useState<{ charIndex: number; charLength: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playingRef = useRef(false);
  const rate = useAudioSettingsStore((s) => s.rate);

  useEffect(() => {
    if (!pathStageId) return;
    pathApi
      .getStageDialogue(pathStageId)
      .then(setDialogue)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [pathStageId]);

  // Cancel TTS on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const toggleTranslation = (idx: number) => {
    setShowTranslation((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const speakLine = useCallback(
    (line: DialogueLine, lang: string): Promise<void> =>
      new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        loadVoices().then((voices) => {
          const u = new SpeechSynthesisUtterance(line.text);
          u.lang = lang;
          const voice = pickVoice(voices, lang);
          if (voice) u.voice = voice;
          u.onboundary = (e) => {
            if (e.name === 'word') {
              setHighlightRange({ charIndex: e.charIndex, charLength: (e as SpeechSynthesisEvent & { charLength?: number }).charLength ?? line.text.indexOf(' ', e.charIndex) - e.charIndex });
            }
          };
          u.onend = () => {
            setHighlightRange(null);
            resolve();
          };
          u.onerror = () => {
            setHighlightRange(null);
            resolve();
          };
          u.rate = rate;
          window.speechSynthesis.speak(u);
        });
      }),
    [],
  );

  const playAll = useCallback(async () => {
    if (!dialogue) return;
    playingRef.current = true;
    setIsPlaying(true);
    for (let i = 0; i < dialogue.lines.length; i++) {
      if (!playingRef.current) break;
      setPlayingLineIdx(i);
      await speakLine(dialogue.lines[i], dialogue.targetLanguageCode);
      if (!playingRef.current) break;
      await new Promise<void>((r) => setTimeout(r, 400));
    }
    setPlayingLineIdx(null);
    setIsPlaying(false);
    playingRef.current = false;
  }, [dialogue, speakLine]);

  const stopAll = useCallback(() => {
    playingRef.current = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlayingLineIdx(null);
    setHighlightRange(null);
    setIsPlaying(false);
  }, []);

  /** Render line text with active-word boundary highlight or vocab term highlights */
  const renderText = (line: DialogueLine, lineIdx: number): React.ReactNode => {
    const text = line.text;
    const isActive = playingLineIdx === lineIdx;

    // Word-boundary highlight during TTS playback
    if (isActive && highlightRange) {
      const { charIndex, charLength } = highlightRange;
      const end = charIndex + charLength;
      return (
        <>
          {text.slice(0, charIndex)}
          <span
            style={{
              background: 'rgba(99,102,241,0.45)',
              borderRadius: '3px',
              padding: '0 2px',
            }}
          >
            {text.slice(charIndex, end)}
          </span>
          {text.slice(end)}
        </>
      );
    }

    // Vocab term highlights
    if (line.vocabTerms.length > 0) {
      const escaped = line.vocabTerms.map((v) =>
        v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      );
      const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
      const parts = text.split(pattern);
      const lowerTerms = line.vocabTerms.map((v) => v.toLowerCase());
      return (
        <>
          {parts.map((part, i) =>
            lowerTerms.includes(part.toLowerCase()) ? (
              <span key={i} style={{ color: '#A78BFA', fontWeight: 600 }}>
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </>
      );
    }

    return <>{text}</>;
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell title={t('dialogue.title')}>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]" />
          <span className="ml-3 text-sm text-[#94A3B8]">{t('dialogue.loading')}</span>
        </div>
      </AppShell>
    );
  }

  // ── Error / empty ────────────────────────────────────────────────────────────
  if (error || !dialogue) {
    return (
      <AppShell title={t('dialogue.title')}>
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-[#94A3B8]">
            {error ? t('dialogue.loadError') : t('dialogue.noDialogue')}
          </p>
          <button onClick={() => navigate(-1)} className="mt-6 text-sm text-[#6366F1]">
            {t('dialogue.backBtn')}
          </button>
        </div>
      </AppShell>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <AppShell title={dialogue.stageTitle || t('dialogue.title')}>
      {/* Sticky toolbar */}
      <div
        className="px-4 pt-2 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
        >
          {t('dialogue.backBtn')}
        </button>
        <span className="flex-1" />
        {isPlaying ? (
          <button
            onClick={stopAll}
            className="rounded-xl px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#FCA5A5',
            }}
          >
            {t('dialogue.stopAll')}
          </button>
        ) : (
          <button
            onClick={playAll}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            {t('dialogue.playAll')}
          </button>
        )}
      </div>

      {/* Dialogue bubbles */}
      <div className="px-4 py-4 flex flex-col gap-4 pb-16">
        {dialogue.lines.map((line, idx) => {
          const isA = line.speaker === 'A';
          const isActive = playingLineIdx === idx;
          const translationVisible = showTranslation[idx] ?? false;

          return (
            <div key={idx} className={`flex flex-col gap-1 ${isA ? 'items-start' : 'items-end'}`}>
              {/* Speaker label */}
              <span className="text-xs text-[#64748B] px-2">
                {line.speaker === 'A' ? t('dialogue.speaker_A') : t('dialogue.speaker_B')}
              </span>

              {/* Bubble — tap to toggle translation */}
              <button
                onClick={() => toggleTranslation(idx)}
                className={`text-left max-w-[85%] rounded-2xl px-4 py-3 transition-all duration-200 ${
                  isActive ? 'ring-2 ring-[#6366F1] ring-offset-1 ring-offset-[#0F172A]' : ''
                }`}
                style={{
                  background: isA
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(139,92,246,0.12)',
                  border: isA
                    ? '1px solid rgba(99,102,241,0.3)'
                    : '1px solid rgba(139,92,246,0.25)',
                }}
              >
                <p className="text-sm text-[#F1F5F9] leading-relaxed">
                  {renderText(line, idx)}
                </p>
                {translationVisible && (
                  <p
                    className="mt-2 text-xs text-[#94A3B8] italic"
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      paddingTop: '6px',
                    }}
                  >
                    {line.translation}
                  </p>
                )}
              </button>

              {/* Translation toggle hint */}
              <span className="text-xs text-[#475569] px-2">
                {translationVisible
                  ? t('dialogue.hideTranslation')
                  : t('dialogue.showTranslation')}
              </span>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
