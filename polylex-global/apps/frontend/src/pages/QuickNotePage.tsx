import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { quickNoteApi, vocabularyApi } from '@/api/client';
import AppShell from '@/components/layout/AppShell';
import SearchBar from '@/components/ui/SearchBar';
import SkeletonCard from '@/components/ui/SkeletonCard';
import LanguageFilterChips from '@/components/quick-note/LanguageFilterChips';
import QuickNoteCard, { type QuickNote } from '@/components/quick-note/QuickNoteCard';
import AddQuickNoteSheet from '@/components/quick-note/AddQuickNoteSheet';

const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export default function QuickNotePage() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const data = await quickNoteApi.list();
      setNotes(data as QuickNote[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // Poll while any note is PENDING or PROCESSING
  useEffect(() => {
    const hasPending = notes.some((n) => n.status === 'PENDING' || n.status === 'PROCESSING');
    if (!hasPending) return;

    const interval = setInterval(() => { loadNotes(); }, 4000);
    return () => clearInterval(interval);
  }, [notes, loadNotes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch = !search || n.term.toLowerCase().includes(search.toLowerCase());
      const matchLang = !langFilter || n.sourceLanguageCode === langFilter;
      return matchSearch && matchLang;
    });
  }, [notes, search, langFilter]);

  const handleDelete = async (id: string) => {
    try {
      await quickNoteApi.remove(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error(t('quicknote.failedToDelete'));
    }
  };

  const handleAddToDeck = async (vocabBaseId: string) => {
    try {
      await vocabularyApi.addToMyList(vocabBaseId);
      toast.success(t('quicknote.addedToDeck'));
    } catch {
      toast.error(t('quicknote.alreadyInDeck'));
    }
  };

  return (
    <AppShell title={t('quicknote.title')} theme="light">
      {/* Search + filter */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder={t('quicknote.searchPlaceholder')} light={true} />
        <LanguageFilterChips notes={notes} selected={langFilter} onSelect={setLangFilter} light={true} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} lines={3} light={true} />)}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4 opacity-30">
            <rect x="12" y="8" width="40" height="48" rx="6" stroke="var(--color-coral)" strokeWidth="2" />
            <line x1="20" y1="22" x2="44" y2="22" stroke="var(--color-coral)" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="30" x2="44" y2="30" stroke="var(--color-coral)" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="38" x2="34" y2="38" stroke="var(--color-coral)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
            {t(search || langFilter ? 'quicknote.noMatchingTitle' : 'quicknote.noNotesTitle')}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-soft)' }}>
            {t(search || langFilter ? 'quicknote.tryDifferentFilters' : 'quicknote.addFirstNote')}
          </p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="initial" animate="animate" className="pt-1">
          {filteredNotes.map((note) => (
            <motion.div key={note.id} variants={itemVariants}>
              <QuickNoteCard note={note} onDelete={handleDelete} onAddToDeck={handleAddToDeck} light={true} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))', boxShadow: 'var(--shadow-coral)' }}
        aria-label="Add quick note"
      >
        <span className="text-white text-2xl font-light leading-none">+</span>
      </button>

      <AddQuickNoteSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdded={(note) => setNotes((prev) => [note, ...prev])}
      />
    </AppShell>
  );
}
