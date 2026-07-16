import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Select, TextField } from '@polylex/shared-ui';
import { quickNoteApi, languageApi } from '@/api/client';
import { useUserDefaults } from '@/hooks/useUserDefaults';
import BottomSheet from '@/components/layout/BottomSheet';
import Button from '@/components/ui/Button';
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
  const [termError, setTermError] = useState('');
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
    setTermError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!term.trim()) {
      setTermError(t('addNote.placeholder'));
      inputRef.current?.focus();
      return;
    }
    setTermError('');
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

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={t('addNote.title')}>
      <div className="px-5 pt-4 pb-20 space-y-5">
        {/* Term input */}
        <TextField
          ref={inputRef}
          label={t('addNote.placeholder')}
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            if (termError) setTermError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSubmit();
          }}
          error={termError}
          required
          disabled={submitting}
        />

        {/* Language row */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <Select
            label={t('addNote.wordIn')}
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            disabled={submitting}
            options={languages.map((language) => ({
              value: language.code,
              label: `${language.flagEmoji ? `${language.flagEmoji} ` : ''}${language.name}`,
            }))}
          />
          <span className="hidden min-h-11 items-center text-[var(--color-ink-3)] sm:flex" aria-hidden="true">→</span>
          <Select
            label={t('addNote.translateTo')}
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            disabled={submitting}
            options={languages.map((language) => ({
              value: language.code,
              label: `${language.flagEmoji ? `${language.flagEmoji} ` : ''}${language.name}`,
            }))}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={() => void handleSubmit()}
          disabled={submitting || !term.trim()}
          fullWidth
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t('addNote.adding')}
            </>
          ) : (
            t('addNote.addNote')
          )}
        </Button>
      </div>
    </BottomSheet>
  );
}
