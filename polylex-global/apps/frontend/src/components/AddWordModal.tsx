import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { vocabularyApi } from '@/api/client';
import { useUserDefaults } from '@/hooks/useUserDefaults';
import type { LanguageDto } from '@polylex/shared-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const POS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'] as const;

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AddWordModalProps {
  isOpen: boolean;
  languages: LanguageDto[];
  onSuccess: () => void;
  onClose: () => void;
}

interface FormState {
  term: string;
  languageCode: string;
  cefrLevel: string;
  partOfSpeech: string;
  phonetic: string;
  exampleSentence: string;
  showTranslation: boolean;
  translationText: string;
  translationTargetCode: string;
}

const DEFAULT_FORM: FormState = {
  term: '',
  languageCode: '',
  cefrLevel: '',
  partOfSpeech: '',
  phonetic: '',
  exampleSentence: '',
  showTranslation: false,
  translationText: '',
  translationTargetCode: '',
};

const createDefaultForm = (defaults: {
  targetLangCode: string;
  nativeLangCode: string;
  currentCefrLevel: string;
}): FormState => ({
  ...DEFAULT_FORM,
  languageCode: defaults.targetLangCode,
  cefrLevel: defaults.currentCefrLevel,
  translationTargetCode: defaults.nativeLangCode,
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddWordModal({ isOpen, languages, onSuccess, onClose }: AddWordModalProps) {
  const { t } = useTranslation();
  const defaults = useUserDefaults();
  const [form, setForm] = useState<FormState>(() => createDefaultForm(defaults));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      setForm(createDefaultForm(defaults));
      setError('');
    }
  }, [isOpen, defaults]);

  if (!isOpen) return null;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setCheck = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.checked }));

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Guard: required fields
    if (!form.term.trim() || !form.languageCode) return;

    // Guard: translation pair validation
    if (form.showTranslation && form.translationText && !form.translationTargetCode) return;

    setIsSubmitting(true);
    try {
      // Step 1: create vocabulary entry
      const created = await vocabularyApi.create({
        term: form.term.trim(),
        languageCode: form.languageCode,
        ...(form.cefrLevel && { cefrLevel: form.cefrLevel }),
        ...(form.partOfSpeech && { partOfSpeech: form.partOfSpeech }),
        ...(form.phonetic && { phonetic: form.phonetic }),
        ...(form.exampleSentence && { exampleSentence: form.exampleSentence }),
      }) as { id: string };

      // Step 2: add translation (optional)
      if (form.showTranslation && form.translationText && form.translationTargetCode) {
        await vocabularyApi.addTranslation(created.id, {
          targetLanguageCode: form.translationTargetCode,
          translation: form.translationText,
        });
      }

      // Step 3: add to personal learning list (fire-and-forget — failure is non-blocking)
      vocabularyApi.addToMyList(created.id).catch(() => {});

      onSuccess();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string | string[] }>;
      if (axiosErr.response?.status === 409) {
        setError(t('addWord.wordAlreadyExists'));
      } else {
        const msg = axiosErr.response?.data?.message;
        setError(
          Array.isArray(msg) ? msg[0] : (msg ?? t('addWord.failedToCreate')),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Shared input classes ─────────────────────────────────────────────────

  const inputCls =
    'bg-card-2 border border-transparent rounded-xl px-3 py-2 text-sm w-full text-ink focus:outline-none focus:ring-2 focus:ring-grape focus:bg-card placeholder:text-ink-3';
  const labelCls = 'block text-sm font-medium text-ink-2 mb-1.5';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Card — stops click propagation to prevent backdrop-close when clicking inside */}
      <div
        className="bg-card rounded-card shadow-pop w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line">
          <h2 className="text-lg font-semibold text-ink">{t('addWord.title')}</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-ink-3 hover:text-ink-2 text-2xl leading-none disabled:opacity-40"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* ── Required: term ── */}
          <div>
            <label className={labelCls}>
              {t('addWord.wordPhrase')} <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={form.term}
              onChange={set('term')}
              placeholder="e.g. apple"
              className={inputCls}
              autoFocus
              required
            />
          </div>

          {/* ── Required: language ── */}
          <div>
            <label className={labelCls}>
              {t('addWord.languageToLearn')} <span className="text-coral">*</span>
            </label>
            <select
              value={form.languageCode}
              onChange={set('languageCode')}
              className={inputCls}
              required
              disabled={languages.length === 0}
            >
              <option value="" disabled>
                {languages.length === 0 ? t('addWord.loadingLanguages') : t('addWord.selectLanguage')}
              </option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flagEmoji} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Optional: CEFR + Part of speech ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('addWord.level')}</label>
              <select value={form.cefrLevel} onChange={set('cefrLevel')} className={inputCls}>
                <option value="">{t('addWord.levelOptional')}</option>
                {CEFR.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('addWord.partOfSpeech')}</label>
              <select value={form.partOfSpeech} onChange={set('partOfSpeech')} className={inputCls}>
                <option value="">{t('addWord.partOfSpeech')}</option>
                {POS.map((p) => (
                  <option key={p} value={p}>
                    {t(`pos.${p}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Optional: phonetic ── */}
          <div>
            <label className={labelCls}>{t('addWord.phonetic')}</label>
            <input
              type="text"
              value={form.phonetic}
              onChange={set('phonetic')}
              placeholder="/ˈæpəl/"
              className={inputCls}
            />
          </div>

          {/* ── Optional: example sentence ── */}
          <div>
            <label className={labelCls}>{t('addWord.exampleSentence')}</label>
            <textarea
              value={form.exampleSentence}
              onChange={set('exampleSentence')}
              placeholder="e.g. I eat an apple every day."
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* ── Translation section ── */}
          <div className="border-t border-line pt-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-ink-2">
              <input
                type="checkbox"
                checked={form.showTranslation}
                onChange={setCheck('showTranslation')}
                className="h-4 w-4 rounded border-line bg-card-2 text-grape focus:ring-grape"
              />
              {t('addWord.addTranslation')} <span className="text-ink-3">{t('addWord.optional')}</span>
            </label>

            {form.showTranslation && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className={labelCls}>{t('addWord.targetLanguage')}</label>
                  <select
                    value={form.translationTargetCode}
                    onChange={set('translationTargetCode')}
                    className={inputCls}
                  >
                    <option value="" disabled>
                      {t('addWord.selectTargetLanguage')}
                    </option>
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flagEmoji} {l.name}
                      </option>
                    ))}
                  </select>
                  {/* Inline pair validation error */}
                  {form.translationText && !form.translationTargetCode && (
                    <p className="text-xs text-bad mt-1">{t('addWord.selectTargetLangError')}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>{t('addWord.translation')}</label>
                  <input
                    type="text"
                    value={form.translationText}
                    onChange={set('translationText')}
                    placeholder="e.g. táo"
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Error banner ── */}
          {error && (
            <p className="text-sm text-bad bg-bad/10 border border-bad/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-card-2 text-ink-2 hover:bg-line disabled:opacity-40"
            >
              {t('addWord.cancel')}
            </button>
            <button
              type="submit"
              style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
              disabled={isSubmitting || !form.term.trim() || !form.languageCode}
              className="px-5 py-2 text-sm font-medium rounded-xl text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? t('addWord.saving') : t('addWord.addWord')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
