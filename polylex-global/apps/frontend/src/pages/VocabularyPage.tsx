import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { vocabularyApi, languageApi } from '@/api/client';
import type { LanguageDto } from '@polylex/shared-types';
import AppShell from '@/components/layout/AppShell';
import SearchBar from '@/components/ui/SearchBar';
import SkeletonCard from '@/components/ui/SkeletonCard';
import AddWordModal from '@/components/AddWordModal';
import WordRow from '@/components/vocab/WordRow';
import WordDetailSheet from '@/components/vocab/WordDetailSheet';
import type { VocabItem } from '@/components/vocab/WordRow';
import { LanguageBadge } from '@/components/ui/Badge';

const flagMap: Record<string, string> = {
  en: '🇬🇧', vi: '🇻🇳', ja: '🇯🇵', fr: '🇫🇷', de: '🇩🇪',
  zh: '🇨🇳', ko: '🇰🇷', es: '🇪🇸', pt: '🇵🇹', it: '🇮🇹',
};

export default function VocabularyPage() {
  const { t } = useTranslation();
  const [allItems, setAllItems] = useState<VocabItem[]>([]);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [languages, setLanguages] = useState<LanguageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<VocabItem | null>(null);

  const loadMyList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vocabularyApi.getMyList(1, 100);
      const items = (res.items as unknown[]).map((uv: unknown) => {
        const item = uv as { vocabularyBase: VocabItem };
        return item.vocabularyBase;
      });
      setAllItems(items);
    } catch {
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMyList(); }, [loadMyList]);
  useEffect(() => { languageApi.getAll().then(setLanguages).catch(() => {}); }, []);

  // Unique languages present in my list
  const availableLangs = useMemo(() => {
    const seen = new Map<string, { code: string; name: string }>();
    for (const w of allItems) {
      if (!seen.has(w.language.code)) seen.set(w.language.code, w.language);
    }
    return Array.from(seen.values());
  }, [allItems]);

  // Apply language filter then search
  const filtered = useMemo(() => {
    let list = langFilter === 'all' ? allItems : allItems.filter((w) => w.language.code === langFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.term.toLowerCase().includes(q) ||
          w.translations.some((t) => t.translation.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allItems, langFilter, search]);

  const topBarAction = (
    <button
      onClick={() => setShowModal(true)}
      className="w-9 h-9 rounded-full flex items-center justify-center bg-coral-100"
      aria-label="Add word"
    >
      <Plus size={18} className="text-coral" />
    </button>
  );

  const btnBg = 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))';

  return (
    <AppShell title={t('vocab.title')} rightAction={topBarAction} theme="light">
      <div className="px-4 pt-3 space-y-3 pb-6">

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} placeholder={t('vocab.searchPlaceholder')} light />

        {/* Language filter tabs (only when multiple languages) */}
        {availableLangs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setLangFilter('all')}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                langFilter === 'all'
                  ? 'text-white'
                  : 'bg-card text-ink-3 hover:bg-card-2'
              }`}
              style={langFilter === 'all' ? { background: btnBg } : undefined}
            >
              {t('vocab.allCount', { count: allItems.length })}
            </button>
            {availableLangs.map((lang) => {
              const count = allItems.filter((w) => w.language.code === lang.code).length;
              const flag = flagMap[lang.code] ?? '🌐';
              return (
                <button
                  key={lang.code}
                  onClick={() => setLangFilter(lang.code)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    langFilter === lang.code
                      ? 'text-white'
                      : 'bg-card text-ink-3 hover:bg-card-2'
                  }`}
                  style={langFilter === lang.code ? { background: btnBg } : undefined}
                >
                  {flag} {lang.name} · {count}
                </button>
              );
            })}
          </div>
        )}

        {/* Stats row */}
        {!loading && allItems.length > 0 && (
          <p className="text-xs text-ink-3 px-1">
            {t('vocab.wordCount', { count: filtered.length })}
            {' '}{search || langFilter !== 'all' ? t('vocab.found') : t('vocab.inYourList')}
          </p>
        )}

        {/* Word list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} light />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {allItems.length === 0 ? (
              <>
                <p className="text-5xl mb-4">📚</p>
                <p className="font-semibold text-ink">{t('vocab.noWordsTitle')}</p>
                <p className="text-sm text-ink-2 mt-1">
                  {t('vocab.noWordsSubtitle')}
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-4">🔍</p>
                <p className="font-semibold text-ink">{t('vocab.noMatchesTitle')}</p>
                <p className="text-sm text-ink-2 mt-1">{t('vocab.noMatchesSubtitle')}</p>
              </>
            )}
          </div>
        ) : langFilter === 'all' && availableLangs.length > 1 ? (
          /* Multi-language "All" view — group by language */
          <div className="space-y-3">
            {availableLangs.map((lang) => {
              const langWords = filtered.filter((w) => w.language.code === lang.code);
              if (langWords.length === 0) return null;
              return (
                <div
                  key={lang.code}
                  className="rounded-card overflow-hidden bg-card shadow-soft"
                >
                  <div
                    className="px-4 py-2.5 flex items-center gap-2 border-b border-line"
                  >
                    <LanguageBadge code={lang.code} name={lang.name} light />
                    <span className="text-xs text-ink-3 ml-auto">{t('vocab.langWordsCount', { count: langWords.length })}</span>
                  </div>
                  {langWords.map((item, idx) => (
                    <div key={item.id} className={idx > 0 ? 'border-t border-line' : ''}>
                      <WordRow item={item} onPress={setSelected} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          /* Single language tab or search — flat list */
          <div
            className="rounded-card overflow-hidden bg-card shadow-soft"
          >
            {filtered.map((item, idx) => (
              <div key={item.id} className={idx > 0 ? 'border-t border-line' : ''}>
                <WordRow item={item} onPress={setSelected} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Word detail bottom sheet */}
      <WordDetailSheet item={selected} onClose={() => setSelected(null)} />

      {/* Add word modal */}
      <AddWordModal
        isOpen={showModal}
        languages={languages}
        onSuccess={loadMyList}
        onClose={() => setShowModal(false)}
      />
    </AppShell>
  );
}
