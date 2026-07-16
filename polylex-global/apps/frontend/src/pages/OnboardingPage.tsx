import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { languageApi, userApi, pathApi } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';
import { LanguageDto } from '@polylex/shared-types';
import { Select } from '@polylex/shared-ui';
import Button from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const GOAL_PRESET_KEYS = [
  'onboarding.goals.dailyConversation',
  'onboarding.goals.travel',
  'onboarding.goals.work',
  'onboarding.goals.exam',
  'onboarding.goals.entertainment',
] as const;

export default function OnboardingPage() {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState<LanguageDto[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [nativeLanguageCode, setNativeLanguageCode] = useState('');
  const [targetLanguageCode, setTargetLanguageCode] = useState('');
  const [goal, setGoal] = useState('');
  const [cefrLevel, setCefrLevel] = useState('A1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    languageApi.getAll().then(setLanguages).catch(() => {});
  }, []);

  const targetOptions = useMemo(
    () => languages.filter((l) => l.code !== nativeLanguageCode),
    [languages, nativeLanguageCode],
  );

  const goToStep2 = () => {
    if (!nativeLanguageCode) {
      setError(t('onboarding.errors.nativeRequired'));
      return;
    }
    setError('');
    setStep(2);
  };

  const finish = async (createPath: boolean) => {
    if (createPath && (!targetLanguageCode || !goal.trim())) {
      setError(t('onboarding.errors.targetAndGoalRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await userApi.updateMe({ nativeLanguageCode });

      if (createPath) {
        await userApi.addLanguage({ languageCode: targetLanguageCode, targetCefrLevel: cefrLevel });
        try {
          await pathApi.generate({
            goal: goal.trim(),
            targetLanguageCode,
            nativeLanguageCode,
            targetCefrLevel: cefrLevel,
          });
          toast.success(t('onboarding.pathCreated'));
        } catch {
          toast.error(t('onboarding.pathCreateFailed'));
        }
      }

      const updated = await userApi.getMe();
      setUser(updated);
      navigate(createPath ? '/roadmap' : '/dashboard');
    } catch {
      setError(t('onboarding.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] px-4 py-8 text-[var(--color-ink)]">
      <div className="w-full max-w-2xl rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-soft sm:p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src="/icons/icon.svg" alt="PolyLex" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-h1 text-[var(--color-ink)]">
            {step === 1 ? t('onboarding.welcome') : t('onboarding.learningQuestion')}
          </h1>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">
            {step === 1
              ? t('onboarding.nativeSubtitle')
              : t('onboarding.targetSubtitle')}
          </p>
        </div>

        {error && (
          <div role="alert" className="bg-[var(--color-bad-soft)] border border-[var(--color-bad)] text-[var(--color-bad)] text-sm px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <Select
                label={t('onboarding.nativeLanguage')}
                value={nativeLanguageCode}
                onChange={(e) => setNativeLanguageCode(e.target.value)}
                required
              >
                <option value="">{t('onboarding.selectNative')}</option>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flagEmoji} {l.name} — {l.nativeName}
                  </option>
                ))}
            </Select>

            <Button
              type="button"
              onClick={goToStep2}
              disabled={!nativeLanguageCode}
              fullWidth
              size="lg"
            >
              {t('common.continue')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
                label={t('onboarding.targetLanguage')}
                value={targetLanguageCode}
                onChange={(e) => setTargetLanguageCode(e.target.value)}
                required
              >
                <option value="">{t('onboarding.selectTarget')}</option>
                {targetOptions.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flagEmoji} {l.name} — {l.nativeName}
                  </option>
                ))}
            </Select>

            <div>
              <label htmlFor="learning-goal" className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">{t('onboarding.goal')}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {GOAL_PRESET_KEYS.map((presetKey) => {
                  const preset = t(presetKey);
                  return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => setGoal(preset)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      goal === preset
                        ? 'bg-[var(--color-coral)] border-[var(--color-coral)] text-white'
                        : 'bg-[var(--color-card-2)] border-[var(--color-line)] text-[var(--color-ink-2)]'
                    }`}
                  >
                    {preset}
                  </button>
                  );
                })}
              </div>
              <textarea
                id="learning-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('onboarding.goalPlaceholder')}
                rows={2}
                className="w-full resize-none bg-[var(--color-card)] border border-[var(--color-line)] rounded-2xl px-4 py-3 text-[var(--color-ink)] text-sm focus:outline-none"
              />
            </div>

            <div>
              <p className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">{t('onboarding.currentLevel')}</p>
              <div className="grid grid-cols-6 gap-2">
                {CEFR_LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setCefrLevel(l)}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                      cefrLevel === l
                        ? 'bg-[var(--color-coral)] border-[var(--color-coral)] text-white'
                        : 'bg-[var(--color-card-2)] border-[var(--color-line)] text-[var(--color-ink-2)]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              onClick={() => finish(true)}
              disabled={loading || !targetLanguageCode || !goal.trim()}
              fullWidth
              size="lg"
            >
              {loading ? t('onboarding.creatingPath') : t('onboarding.createPath')}
            </Button>

            <button
              type="button"
              onClick={() => finish(false)}
              disabled={loading}
              className="w-full text-[var(--color-ink-3)] text-sm py-2 disabled:opacity-50"
            >
              {t('onboarding.skip')}
            </button>

            <button
              type="button"
              onClick={() => { setError(''); setStep(1); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 text-[var(--color-ink-3)] text-xs disabled:opacity-50"
            >
              <ArrowLeft size={14} /> {t('common.back')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
