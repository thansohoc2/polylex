import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const LAST_UPDATED = 'March 4, 2026';
const CONTACT_EMAIL = 'dangdinhkhoick1@gmail.com';
const DEVELOPER = 'Đặng Đình Khởi';
const APP_NAME = 'PolyLex';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas text-ink-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-canvas/90 backdrop-blur border-b border-line px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-card hover:bg-card-2 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={20} className="text-ink-2" />
        </button>
        <h1 className="text-base font-semibold text-ink font-display">Privacy Policy</h1>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm leading-relaxed">
        <p className="text-ink-3 text-xs">Last updated: {LAST_UPDATED}</p>

        <p>
          {DEVELOPER} ("we", "us", or "our") built the <strong className="text-ink">{APP_NAME}</strong> application.
          This page informs you of our policies regarding the collection, use, and disclosure of personal data
          when you use our Service and the choices you have associated with that data.
        </p>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink font-display flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-grape/10 text-grape flex items-center justify-center text-xs font-bold">1</span>
            Information We Collect
          </h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-2 text-ink-2 pl-2">
            <li><span className="text-ink font-medium">Account information</span> — your display name and email address, provided when you register or sign in via Google or Apple.</li>
            <li><span className="text-ink font-medium">Authentication tokens</span> — OAuth tokens issued by Google or Apple are used solely for identity verification and are not stored permanently on our servers.</li>
            <li><span className="text-ink font-medium">Learning data</span> — your native language, learning languages, vocabulary lists, quick notes, review history, XP, streaks, and learning path progress.</li>
            <li><span className="text-ink font-medium">Preferences</span> — TTS voice settings, playback speed, daily goal, and timezone.</li>
            <li><span className="text-ink font-medium">Usage data</span> — in-app actions such as review sessions and learning milestones, used to power analytics features visible only to you.</li>
          </ul>
          <p>We do <strong className="text-ink">not</strong> collect precise location data, financial information, or sensitive personal information.</p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink font-display flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-grape/10 text-grape flex items-center justify-center text-xs font-bold">2</span>
            How We Use Your Information
          </h2>
          <p>We use the collected data to:</p>
          <ul className="list-disc list-inside space-y-2 text-ink-2 pl-2">
            <li>Create and manage your account.</li>
            <li>Provide, maintain, and improve the {APP_NAME} learning experience.</li>
            <li>Personalise vocabulary, review sessions, and learning paths based on your progress.</li>
            <li>Generate AI-powered enrichment for vocabulary and quick notes.</li>
            <li>Deliver text-to-speech audio for vocabulary practice.</li>
            <li>Respond to your support requests.</li>
          </ul>
          <p>We do <strong className="text-ink">not</strong> sell or share your personal data with advertisers.</p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink font-display flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-grape/10 text-grape flex items-center justify-center text-xs font-bold">3</span>
            Third-Party Services
          </h2>
          <p>
            {APP_NAME} integrates with the following third-party services, each governed by their own privacy policies:
          </p>
          <ul className="list-disc list-inside space-y-2 text-ink-2 pl-2">
            <li>
              <span className="text-ink font-medium">Google Sign-In</span> — identity verification via Google OAuth 2.0.{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-grape underline">
                Google Privacy Policy ↗
              </a>
            </li>
            <li>
              <span className="text-ink font-medium">Apple Sign In</span> — identity verification via Apple ID.{' '}
              <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="text-grape underline">
                Apple Privacy Policy ↗
              </a>
            </li>
            <li>
              <span className="text-ink font-medium">AI Language APIs</span> — anonymised text may be sent to AI providers to generate vocabulary enrichment. No personally identifiable data is included in these requests.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink font-display flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-grape/10 text-grape flex items-center justify-center text-xs font-bold">4</span>
            Data Retention
          </h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to provide the Service.
            Cached audio files (TTS) are stored server-side for performance and are not linked to identifiable individuals after generation.
          </p>
          <p>
            You may request full deletion of your account and associated data at any time by contacting us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-grape underline">{CONTACT_EMAIL}</a>.
            We will process your request within 30 days.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink font-display flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-grape/10 text-grape flex items-center justify-center text-xs font-bold">5</span>
            Data Security
          </h2>
          <p>
            We take reasonable technical measures to protect your data, including HTTPS for all API communication,
            hashed password storage (bcrypt), and short-lived JWT access tokens with refresh token rotation.
            No method of internet transmission is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink font-display flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-grape/10 text-grape flex items-center justify-center text-xs font-bold">6</span>
            Children's Privacy
          </h2>
          <p>
            {APP_NAME} is not intended for children under 13 years of age. We do not knowingly collect
            personal information from children under 13. If you become aware that a child has provided us with personal data,
            please contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-grape underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink font-display flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-grape/10 text-grape flex items-center justify-center text-xs font-bold">7</span>
            Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by updating the
            "Last updated" date at the top of this page. Continued use of the App after changes constitutes acceptance
            of the updated policy.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-ink font-display flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-grape/10 text-grape flex items-center justify-center text-xs font-bold">8</span>
            Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please contact:
          </p>
          <div className="bg-card-2 rounded-2xl px-4 py-4 space-y-1">
            <p className="text-ink font-medium">{DEVELOPER}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-grape text-sm hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </section>

        <div className="pt-4 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3.5 rounded-2xl border border-line text-ink-2 text-sm font-medium bg-card hover:bg-card-2 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
