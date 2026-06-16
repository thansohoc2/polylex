import { useNavigate } from 'react-router-dom';
import { RotateCcw, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/layout/BottomSheet';
import { CefrBadge, LanguageBadge } from '@/components/ui/Badge';
import { PhoneticDisplay } from '@/components/ui/PhoneticDisplay';
import type { VocabItem } from './WordRow';
import { playAudio, speakText } from '@/utils/audio';
import { useAudioSettingsStore } from '@/store/audio-settings.store';

interface WordDetailSheetProps {
  item: VocabItem | null;
  onClose: () => void;
}

export default function WordDetailSheet({ item, onClose }: WordDetailSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rate = useAudioSettingsStore((s) => s.rate);
  const btnBg = 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))';

  return (
    <BottomSheet isOpen={!!item} onClose={onClose} theme="light">
      {item && (
        <div className="px-5 pt-2 pb-20 space-y-5">

          {/* ── Term header ─────────────────────────────── */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-ink leading-tight font-display">{item.term}</h2>
                <button
                  onClick={() => playAudio(item.term, item.language.code, item.audioUrl, rate)}
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-grape/10 hover:bg-grape/15"
                  aria-label="Pronounce word"
                >
                  <Volume2 size={16} className="text-grape" />
                </button>
              </div>
              <LanguageBadge code={item.language.code} name={item.language.name} light />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <PhoneticDisplay
                phonetic={item.phonetic}
                phoneticRomaji={item.phoneticRomaji}
                languageCode={item.language.code}
                className="text-sm text-ink-2"
              />
              {item.cefrLevel && <CefrBadge level={item.cefrLevel} light />}
              {item.partOfSpeech && (
                <span className="text-xs px-2.5 py-0.5 rounded-full italic bg-card-2 text-ink-2">
                  {item.partOfSpeech}
                </span>
              )}
            </div>
          </div>

          {/* ── Example sentence ────────────────────────── */}
          {item.exampleSentence && (
            <div className="rounded-xl px-4 py-3 bg-grape-light border-l-[3px] border-grape">
              <p className="text-[10px] uppercase tracking-widest text-grape mb-1.5 font-semibold">
                {t('wordDetail.example')}
              </p>
              <div className="flex items-start gap-2">
                <p className="text-ink-2 text-sm leading-relaxed italic flex-1">
                  "{item.exampleSentence}"
                </p>
                <button
                  onClick={() => speakText(item.exampleSentence!, item.language.code, rate)}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 bg-grape/10 hover:bg-grape/15"
                  aria-label="Pronounce example sentence"
                >
                  <Volume2 size={12} className="text-grape" />
                </button>
              </div>
            </div>
          )}

          {/* ── Translations ────────────────────────────── */}
          {item.translations.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-3 mb-2.5 font-semibold">
                {t('wordDetail.translations')}
              </p>
              <div className="space-y-2">
                {item.translations.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-card-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-ink text-sm font-medium">{t.translation}</span>
                      {t.targetLanguage && (
                        <button
                          onClick={() => speakText(t.translation, t.targetLanguage!.code, rate)}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-grape/10 hover:bg-grape/15"
                          aria-label="Pronounce translation"
                        >
                          <Volume2 size={12} className="text-grape" />
                        </button>
                      )}
                    </div>
                    {t.targetLanguage && (
                      <LanguageBadge
                        code={t.targetLanguage.code}
                        name={t.targetLanguage.name}
                        light
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Practice CTA ────────────────────────────── */}
          <button
            onClick={() => { onClose(); navigate('/review'); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white hover:opacity-90 transition-opacity"
            style={{ background: btnBg }}
          >
            <RotateCcw size={16} />
            {t('wordDetail.practice')}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
