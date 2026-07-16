import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, MessageCircle, BookOpen, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CONTACT_EMAIL = 'dangdinhkhoick1@gmail.com';
const APP_NAME = 'PolyLex';

const FAQ_KEYS = ['addWord', 'review', 'language', 'deleteAccount', 'socialLogin', 'offline'] as const;

export default function SupportPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink-2)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-[var(--color-card)] transition-colors hover:bg-[var(--color-card-2)]"
          aria-label={t('common.back')}
        >
          <ChevronLeft size={18} className="text-[var(--color-ink-2)]" />
        </button>
        <h1 className="font-display text-base font-semibold text-[var(--color-ink)]">{t('support.title')}</h1>
      </div>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-8 sm:py-10">

        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-grape-light)]">
            <MessageCircle size={26} className="text-[var(--color-grape)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">{t('support.heroTitle')}</h2>
          <p className="text-sm text-[var(--color-ink-3)]">{t('support.heroDescription')}</p>
        </div>

        {/* Contact card */}
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('support.emailSubject', { appName: APP_NAME }))}`}
          className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-grape-bright)] bg-[var(--color-grape-light)] px-5 py-4 transition-colors hover:border-[var(--color-grape)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-card)]">
            <Mail size={18} className="text-[var(--color-grape)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-ink)]">{t('support.emailSupport')}</p>
            <p className="truncate text-xs text-[var(--color-ink-3)]">{CONTACT_EMAIL}</p>
          </div>
          <span className="text-lg text-[var(--color-ink-3)] transition-colors group-hover:text-[var(--color-grape)]">›</span>
        </a>

        {/* Quick links */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">{t('support.quickLinks')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/privacy')}
              className="flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-card-2)]"
            >
              <Shield size={16} className="shrink-0 text-[var(--color-grape)]" />
              <span className="text-sm text-[var(--color-ink-2)]">{t('legal.privacy')}</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3.5 transition-colors hover:bg-[var(--color-card-2)]"
            >
              <BookOpen size={16} className="shrink-0 text-[var(--color-grape)]" />
              <span className="text-sm text-[var(--color-ink-2)]">{t('support.deleteAccount')}</span>
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">{t('support.faqTitle')}</h3>
          <div className="space-y-2">
            {FAQ_KEYS.map((key) => (
              <details
                key={key}
                className="group overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)]"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:text-[var(--color-grape)]">
                  {t(`support.faq.${key}.question`)}
                  <span className="ml-3 shrink-0 text-base text-[var(--color-ink-3)] transition-transform group-open:rotate-180">
                    ⌄
                  </span>
                </summary>
                <div className="border-t border-[var(--color-line)] px-4 pb-4 pt-3 text-sm leading-relaxed text-[var(--color-ink-2)]">
                  {t(`support.faq.${key}.answer`, { appName: APP_NAME })}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* App info */}
        <div className="text-center pt-2 pb-8 space-y-1">
          <p className="text-xs text-[var(--color-ink-3)]">{t('support.appTagline', { appName: APP_NAME })}</p>
          <p className="text-xs text-[var(--color-ink-3)]">{t('support.developedBy', { name: 'Đặng Đình Khởi' })}</p>
        </div>
      </main>
    </div>
  );
}
