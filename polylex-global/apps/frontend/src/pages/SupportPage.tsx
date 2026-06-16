import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, MessageCircle, BookOpen, Shield } from 'lucide-react';

const CONTACT_EMAIL = 'dangdinhkhoick1@gmail.com';
const APP_NAME = 'PolyLex';

const faqs = [
  {
    q: 'How do I add a new vocabulary word?',
    a: 'Tap the + button on the Vocabulary page, enter the word and optionally select an AI enrichment option to auto-fill the definition and example.',
  },
  {
    q: 'How does the review system work?',
    a: `${APP_NAME} uses a spaced-repetition algorithm. Words are due for review based on how well you recalled them last time — sooner if hard, later if easy.`,
  },
  {
    q: 'How do I change my native language?',
    a: 'Go to Profile → tap "Edit" → select your native language from the dropdown, then save.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Open Profile and tap "Delete Account" to permanently remove your account and data from the app.',
  },
  {
    q: 'Sign in with Google or Apple is not working',
    a: 'Ensure you have a stable internet connection. On iOS, make sure iCloud Keychain is enabled for Sign in with Apple. If the issue persists, please contact us.',
  },
  {
    q: 'Can I use PolyLex offline?',
    a: 'Some features like reviewing saved vocabulary work with a cached dataset. AI enrichment and TTS audio require an internet connection.',
  },
];

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-[#F1F5F9]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0F0F1A]/90 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={18} className="text-[#94A3B8]" />
        </button>
        <h1 className="text-base font-semibold text-[#F1F5F9]">Support</h1>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/15 flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={26} className="text-[#6366F1]" />
          </div>
          <h2 className="text-xl font-bold text-[#F1F5F9]">How can we help?</h2>
          <p className="text-sm text-[#94A3B8]">Browse the FAQ below or reach out directly — we usually reply within 48 hours.</p>
        </div>

        {/* Contact card */}
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[${APP_NAME}] Support Request`)}`}
          className="flex items-center gap-4 bg-gradient-to-r from-[#6366F1]/15 to-[#A78BFA]/10 border border-[#6366F1]/20 rounded-2xl px-5 py-4 hover:border-[#6366F1]/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#6366F1]/20 flex items-center justify-center shrink-0">
            <Mail size={18} className="text-[#6366F1]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F1F5F9]">Email Support</p>
            <p className="text-xs text-[#94A3B8] truncate">{CONTACT_EMAIL}</p>
          </div>
          <span className="text-[#94A3B8] group-hover:text-[#6366F1] transition-colors text-lg">›</span>
        </a>

        {/* Quick links */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/privacy')}
              className="flex items-center gap-3 bg-[#1A1A2E] rounded-2xl px-4 py-3.5 border border-white/5 hover:border-white/10 transition-colors text-left"
            >
              <Shield size={16} className="text-[#94A3B8] shrink-0" />
              <span className="text-sm text-[#CBD5E1]">Privacy Policy</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 bg-[#1A1A2E] rounded-2xl px-4 py-3.5 border border-white/5 hover:border-white/10 transition-colors"
            >
              <BookOpen size={16} className="text-[#94A3B8] shrink-0" />
              <span className="text-sm text-[#CBD5E1]">Delete Account</span>
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="group bg-[#1A1A2E] rounded-2xl border border-white/5 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none text-sm font-medium text-[#F1F5F9] hover:text-[#6366F1] transition-colors">
                  {item.q}
                  <span className="ml-3 shrink-0 text-[#94A3B8] transition-transform group-open:rotate-180 text-base">
                    ⌄
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-1 text-sm text-[#94A3B8] leading-relaxed border-t border-white/5">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* App info */}
        <div className="text-center pt-2 pb-8 space-y-1">
          <p className="text-xs text-[#475569]">{APP_NAME} · Language Learning</p>
          <p className="text-xs text-[#475569]">Developed by Đặng Đình Khởi</p>
        </div>
      </div>
    </div>
  );
}
