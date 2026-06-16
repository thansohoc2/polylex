import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { quickNoteApi, languageApi } from '@/api/client';
import { useUserDefaults } from '@/hooks/useUserDefaults';
import BottomSheet from '@/components/layout/BottomSheet';
import type { QuickNote } from './QuickNoteCard';

interface Language {
  code: string;
  name: string;
  flagEmoji?: string;
}

interface AddQuickNoteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (note: QuickNote) => void;
}

export default function AddQuickNoteSheet({ isOpen, onClose, onAdded }: AddQuickNoteSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const defaults = useUserDefaults();
  const [term, setTerm] = useState('');
  const [sourceLang, setSourceLang] = useState(defaults.targetLangCode);
  const [targetLang, setTargetLang] = useState(defaults.nativeLangCode);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSourceLang(defaults.targetLangCode);
      setTargetLang(defaults.nativeLangCode);
    }
  }, [isOpen, defaults.targetLangCode, defaults.nativeLangCode]);

  useEffect(() => {
    languageApi.getAll().then((langs: Language[]) => setLanguages(langs)).catch(() => {});
  }, []);

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleClose = () => {
    setTerm('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!term.trim()) return;
    setSubmitting(true);
    try {
      const note = await quickNoteApi.create({
        term: term.trim(),
        sourceLanguageCode: sourceLang,
        targetLanguageCode: targetLang,
      });
      onAdded(note as QuickNote);
      setTerm('');
      handleClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg === 'DEMO_NOTE_LIMIT_REACHED') {
        toast.error(t('demoLimit.noteReached'));
        handleClose();
        navigate('/login');
        return;
      }
      toast.error(msg ?? t('addNote.failedToSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectCls = "w-full bg-card-2 border-transparent rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-grape/50";  const btnBg = 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))';
  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={t('addNote.title')} theme="light">
      <div className="px-5 pt-4 pb-20 space-y-5">
        {/* Term input */}
        <div>
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !submitting && handleSubmit()}
            placeholder={t('addNote.placeholder')}
            className="w-full bg-transparent text-2xl font-semibold text-ink placeholder:text-ink-3 outline-none pb-2 border-b border-line"
            disabled={submitting}
          />
        </div>

        {/* Language row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-ink-2 mb-1.5 uppercase tracking-wide">{t('addNote.wordIn')}</p>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className={selectCls}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flagEmoji ? `${l.flagEmoji} ` : ''}{l.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-ink-3 mt-5">→</span>
          <div className="flex-1">
            <p className="text-xs text-ink-2 mb-1.5 uppercase tracking-wide">{t('addNote.translateTo')}</p>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className={selectCls}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flagEmoji ? `${l.flagEmoji} ` : ''}{l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !term.trim()}
          className="w-full py-4 rounded-2xl font-semibold text-white text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: btnBg }}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t('addNote.adding')}
            </>
          ) : (
            t('addNote.addNote')
          )}
        </button>
      </div>
    </BottomSheet>
  );
}
