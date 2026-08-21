import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AsyncState, Select } from '@polylex/shared-ui';
import { vocabularyApi, languageApi } from '@/api/client';
import type { LanguageDto } from '@polylex/shared-types';
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

interface VocabularyTabProps {
  /** Whether the Add Word modal (opened from the shared top bar) is visible. */
  addOpen: boolean;
  /** Close the Add Word modal. */
  onAddClose: () => void;
}

export default function VocabularyTab({ addOpen, onAddClose }: VocabularyTabProps) {
  const { t } = useTranslation();
  const [allItems, setAllItems] = useState<VocabItem[]>([]);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [languages, setLanguages] = useState<LanguageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<VocabItem | null>(null);

  const loadMyList = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await vocabularyApi.getMyList(1, 100);
      const items = (res.items as unknown[]).map((uv: unknown) => {
        const item = uv as { vocabularyBase: VocabItem };
        return item.vocabularyBase;
      });
      setAllItems(items);
    } catch {
      setAllItems([]);
      setLoadFailed(true);
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
          w.translations.some((tr) => tr.translation.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allItems, langFilter, search]);

  return (
    <>
      <div className="space-y-3 px-4 pb-6 pt-3 sm:px-6 lg:px-8">
        {/* Search */}
        <SearchBar value={search} onChange={setSearch} placeholder={t('vocab.searchPlaceholder')} />

        {/* A labelled shared select remains compact at every responsive width. */}
        {availableLangs.length > 1 && (
          <div className="max-w-sm">
            <Select
              label={t('addWord.languageToLearn')}
              value={langFilter}
              onChange={(event) => setLangFilter(event.target.value)}
              options={[
                { value: 'all', label: t('vocab.allCount', { count: allItems.length }) },
                ...availableLangs.map((language) => ({
                  value: language.code,
                  label: `${flagMap[language.code] ?? '🌐'} ${language.name} · ${allItems.filter((word) => word.language.code === language.code).length}`,
                })),
              ]}
            />
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
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : loadFailed ? (
          <AsyncState
            status="error"
            errorMessage={t('addWord.failedToCreate')}
            retryLabel={t('review.tryAgain')}
            onRetry={() => void loadMyList()}
          />
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
          <div className="grid items-start gap-3 md:grid-cols-2">
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
        isOpen={addOpen}
        languages={languages}
        onSuccess={loadMyList}
        onClose={onAddClose}
      />
    </>
  );
}
