import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/layout/AppShell';
import VocabularyTab from '@/components/library/VocabularyTab';
import QuickNotesTab from '@/components/library/QuickNotesTab';

type LibraryTab = 'vocab' | 'notes';

/**
 * Unified "Library" surface hosting two tabs that share a layout but keep their
 * data boundaries intact:
 *  - Vocabulary: the curated deck used for reviews.
 *  - Quick Notes: the AI-enrichment inbox.
 *
 * The active tab is derived from the route (`/vocabulary` vs `/quick-notes`) so
 * existing deep links keep working and the URL stays shareable.
 */
export default function LibraryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab: LibraryTab = location.pathname.includes('quick-notes') ? 'notes' : 'vocab';

  const [addWordOpen, setAddWordOpen] = useState(false);

  const tabs: { id: LibraryTab; label: string; path: string }[] = [
    { id: 'vocab', label: t('library.tabVocab'), path: '/vocabulary' },
    { id: 'notes', label: t('library.tabNotes'), path: '/quick-notes' },
  ];

  const title = activeTab === 'vocab' ? t('vocab.title') : t('quicknote.title');

  const rightAction =
    activeTab === 'vocab' ? (
      <button
        type="button"
        onClick={() => setAddWordOpen(true)}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--color-coral-soft)] text-[var(--color-coral)]"
        aria-label={t('addWord.addWord')}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    ) : undefined;

  return (
    <AppShell title={title} rightAction={rightAction}>
      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label={t('library.title')}
        className="flex gap-1 rounded-full bg-[var(--color-card-2)] p-1 mx-4 mt-3 sm:mx-6 lg:mx-8"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => navigate(tab.path)}
              className={`flex-1 min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--color-card)] text-[var(--color-ink)] shadow-soft'
                  : 'text-[var(--color-ink-3)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'vocab' ? (
        <VocabularyTab addOpen={addWordOpen} onAddClose={() => setAddWordOpen(false)} />
      ) : (
        <QuickNotesTab />
      )}
    </AppShell>
  );
}
