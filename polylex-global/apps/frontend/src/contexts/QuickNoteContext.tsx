import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { quickNoteApi, vocabularyApi } from '@/api/client';
import AddQuickNoteSheet from '@/components/quick-note/AddQuickNoteSheet';
import QuickNoteResultPopup from '@/components/quick-note/QuickNoteResultPopup';
import type { QuickNote } from '@/components/quick-note/QuickNoteCard';

interface QuickNoteContextValue {
  /** Open the global quick-note bottom sheet from anywhere. */
  openSheet: () => void;
  /** Whether the sheet is currently open. */
  sheetOpen: boolean;
  /** Number of notes still being processed by the AI. */
  pendingCount: number;
}

const QuickNoteContext = createContext<QuickNoteContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useQuickNote(): QuickNoteContextValue {
  const ctx = useContext(QuickNoteContext);
  if (!ctx) throw new Error('useQuickNote must be used within QuickNoteProvider');
  return ctx;
}

const POLL_INTERVAL = 4000;

export function QuickNoteProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resultNote, setResultNote] = useState<QuickNote | null>(null);

  // IDs of notes we created this session and are waiting on AI enrichment.
  const [trackedIds, setTrackedIds] = useState<string[]>([]);
  const trackedRef = useRef<string[]>([]);
  trackedRef.current = trackedIds;

  const openSheet = useCallback(() => setSheetOpen(true), []);

  const handleAddToDeck = useCallback(
    async (vocabBaseId: string) => {
      try {
        await vocabularyApi.addToMyList(vocabBaseId);
        toast.success(t('quicknote.addedToDeck'));
      } catch {
        toast.error(t('quicknote.alreadyInDeck'));
      }
    },
    [t],
  );

  const showReadyToast = useCallback(
    (note: QuickNote) => {
      toast.custom(
        (tt) => (
          <button
            onClick={() => {
              toast.dismiss(tt.id);
              setResultNote(note);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-left"
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-line)',
              maxWidth: 360,
            }}
          >
            <span className="text-xl">✨</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                {t('quicknote.resultReady', { term: note.term })}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-coral)' }}>
                {t('quicknote.viewResult')}
              </p>
            </div>
          </button>
        ),
        { duration: 6000 },
      );
    },
    [t],
  );

  // Poll for tracked notes while any are pending/processing.
  useEffect(() => {
    if (trackedIds.length === 0) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const all = (await quickNoteApi.list()) as QuickNote[];
        if (cancelled) return;

        const stillTracking: string[] = [];
        for (const id of trackedRef.current) {
          const note = all.find((n) => n.id === id);
          if (!note) continue; // deleted elsewhere
          if (note.status === 'DONE') {
            showReadyToast(note);
          } else if (note.status === 'ERROR') {
            toast.error(t('quicknote.resultError', { term: note.term }));
          } else {
            stillTracking.push(id); // still PENDING/PROCESSING
          }
        }
        if (stillTracking.length !== trackedRef.current.length) {
          setTrackedIds(stillTracking);
        }
      } catch {
        // keep polling on transient errors
      }
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [trackedIds, showReadyToast, t]);

  const handleAdded = useCallback(
    (note: QuickNote) => {
      if (note.status === 'DONE') {
        // Rare: already enriched synchronously.
        showReadyToast(note);
      } else if (note.status === 'ERROR') {
        toast.error(t('quicknote.resultError', { term: note.term }));
      } else {
        toast(t('quicknote.submitting', { term: note.term }), { icon: '⏳' });
        setTrackedIds((prev) => [...prev, note.id]);
      }
    },
    [showReadyToast, t],
  );

  return (
    <QuickNoteContext.Provider value={{ openSheet, sheetOpen, pendingCount: trackedIds.length }}>
      {children}

      <AddQuickNoteSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdded={handleAdded}
      />

      <QuickNoteResultPopup
        note={resultNote}
        onClose={() => setResultNote(null)}
        onAddToDeck={handleAddToDeck}
        onOpenNotes={() => {
          setResultNote(null);
          navigate('/quick-notes');
        }}
      />
    </QuickNoteContext.Provider>
  );
}
