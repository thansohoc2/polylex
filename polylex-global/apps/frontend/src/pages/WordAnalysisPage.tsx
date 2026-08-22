import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';
import type { WordAnalysisResult, WordAnalysisSection } from '@/types/word-analysis';

const sectionOrder = [
  { key: 'nuance', label: 'Nuance & meaning' },
  { key: 'nounForms', label: 'Noun forms' },
  { key: 'verbForms', label: 'Verb forms' },
  { key: 'adjectiveForms', label: 'Adjective forms' },
  { key: 'adverbForms', label: 'Adverb forms' },
  { key: 'tenseUsage', label: 'Tense usage' },
  { key: 'prepositions', label: 'Prepositions & patterns' },
  { key: 'phrasalVerbs', label: 'Phrasal verbs' },
  { key: 'collocations', label: 'Collocations' },
] as const;

export default function WordAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [analysis, setAnalysis] = useState<WordAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const term = searchParams.get('term') ?? '';
  const languageCode = searchParams.get('language') ?? user?.learningLanguages?.[0]?.code ?? 'en';
  const nativeLanguageCode = user?.nativeLanguageCode ?? 'en';
  const cefrLevel = searchParams.get('cefrLevel') || undefined;
  const partOfSpeech = searchParams.get('partOfSpeech') || undefined;

  useEffect(() => {
    if (!term.trim()) {
      setError('Missing word to analyze.');
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post('/ai/word-analysis', {
          term,
          languageCode,
          nativeLanguageCode,
          cefrLevel,
          partOfSpeech,
        });

        if (ignore) return;
        setAnalysis(response.data as WordAnalysisResult);
      } catch (err: unknown) {
        if (ignore) return;
        const message = err instanceof Error ? err.message : 'Unable to load word analysis right now.';
        setError(message);
        setAnalysis(null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadAnalysis();

    return () => {
      ignore = true;
    };
  }, [term, languageCode, nativeLanguageCode, cefrLevel, partOfSpeech]);

  const sections = useMemo<Array<{ key: (typeof sectionOrder)[number]['key']; label: string; value: WordAnalysisSection }>>(() => {
    if (!analysis) return [];

    return sectionOrder.flatMap((section) => {
      const value = analysis[section.key];
      if (!value || typeof value !== 'object' || !('summary' in value) || !('examples' in value)) {
        return [];
      }

      return [{
        key: section.key,
        label: section.label,
        value: value as WordAnalysisSection,
      }];
    });
  }, [analysis]);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-5 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate('/review')}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-coral)] px-3 py-2 text-sm font-semibold text-white"
          >
            <Sparkles size={14} />
            Practice now
          </button>
        </div>

        <div className="rounded-[28px] bg-[var(--color-card)] p-5 shadow-soft ring-1 ring-[var(--color-line)]">
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-3)]">Word analysis</p>
            <h1 className="mt-2 text-3xl font-bold font-display text-[var(--color-ink)]">
              {term || 'Word analysis'}
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-12 text-[var(--color-ink-2)]">
              <Loader2 className="animate-spin" size={18} />
              <span>Generating a deeper breakdown…</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">We couldn’t generate the analysis.</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[var(--color-card-2)] p-4 text-sm text-[var(--color-ink-2)]">
                <p className="font-semibold text-[var(--color-ink)]">{analysis.term}</p>
                <p className="mt-1">{analysis.nuance.summary}</p>
              </div>

              {sections.map(({ key, label, value }) => (
                <section
                  key={key}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] p-4"
                >
                  <h2 className="text-base font-semibold text-[var(--color-ink)]">{label}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ink-2)]">
                    {value.summary ?? 'No summary provided.'}
                  </p>

                  {value.examples?.length ? (
                    <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink)]">
                      {value.examples.map((example: string, index: number) => (
                        <li key={`${key}-${index}`} className="flex gap-2">
                          <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[var(--color-coral)]" aria-hidden="true" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
