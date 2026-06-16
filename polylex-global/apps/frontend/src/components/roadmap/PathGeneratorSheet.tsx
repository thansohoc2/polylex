import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { pathApi, languageApi } from '@/api/client';
import { useUserDefaults } from '@/hooks/useUserDefaults';
import type { PathDto } from './PathCard';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flagEmoji?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (path: PathDto) => void;
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function PathGeneratorSheet({ isOpen, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const defaults = useUserDefaults();
  const [goal, setGoal] = useState('');
  const [targetLangCode, setTargetLangCode] = useState(defaults.targetLangCode);
  const [nativeLangCode, setNativeLangCode] = useState(defaults.nativeLangCode);
  const [cefrLevel, setCefrLevel] = useState(defaults.currentCefrLevel);
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTargetLangCode(defaults.targetLangCode);
      setNativeLangCode(defaults.nativeLangCode);
      setCefrLevel(defaults.currentCefrLevel);
    }
  }, [isOpen, defaults.targetLangCode, defaults.nativeLangCode, defaults.currentCefrLevel]);

  useEffect(() => {
    if (isOpen) {
      languageApi.getAll().then(setLanguages).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsLoading(true);
    try {
      const result = await pathApi.generate({
        goal: goal.trim(),
        targetLanguageCode: targetLangCode,
        nativeLanguageCode: nativeLangCode || undefined,
        targetCefrLevel: cefrLevel,
      });
      onCreated(result as PathDto);
      onClose();
      setGoal('');
      toast.success(t('generator.created'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg === 'DEMO_PATH_LIMIT_REACHED') {
        toast.error(t('demoLimit.pathReached'));
        navigate('/login');
        return;
      }
      toast.error(msg ?? t('generator.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-ink bg-card-2 placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-grape focus:bg-card disabled:opacity-50";
  const btnBg = 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-card p-6 pb-20 shadow-pop"
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-line" />

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <span className="text-xl">🤖</span>
            {t('generator.title')}
          </h2>
          {!isLoading && (
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-card-2">
              <X size={18} className="text-ink-3" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-2">
              {t('generator.goalLabel')}
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t('generator.goalPlaceholder')}
              rows={3}
              disabled={isLoading}
              className={`${inputCls} resize-none px-4 py-3`}
            />
          </div>

          {/* Language selects */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-2">{t('generator.targetLang')}</label>
              <select
                value={targetLangCode}
                onChange={(e) => setTargetLangCode(e.target.value)}
                disabled={isLoading}
                className={inputCls}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flagEmoji ?? ''} {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-2">{t('generator.targetLevel')}</label>
              <select
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value)}
                disabled={isLoading}
                className={inputCls}
              >
                {CEFR_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Native language */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-2">{t('generator.nativeLang')}</label>
            <select
              value={nativeLangCode}
              onChange={(e) => setNativeLangCode(e.target.value)}
              disabled={isLoading}
              className={inputCls}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flagEmoji ?? ''} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !goal.trim()}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: btnBg }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('generator.generating')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🤖 {t('generator.generate')}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
