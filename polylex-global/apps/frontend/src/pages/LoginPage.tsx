import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { authApi, userApi } from '@/api/client';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await authApi.login({ email, password });
      setTokens(tokens);
      const user = await userApi.getMe();
      setUser(user);
      navigate('/dashboard');
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnterHome = async () => {
    setError('');
    setGuestLoading(true);
    try {
      const demo = await authApi.issueDemoSession();
      setTokens(demo);
      const user = await userApi.getMe();
      setUser(user);
      navigate('/dashboard');
    } catch {
      setError(t('auth.guestEntryFailed'));
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-end sm:items-center justify-center bg-[#0F0F1A] px-4 pb-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src="/icons/icon.svg" alt="PolyLex" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">{t('auth.welcomeBack')}</h1>
          <p className="text-[#94A3B8] text-sm mt-1">{t('auth.signInSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#1A1A2E] border border-white/10 rounded-2xl px-4 py-3 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#1A1A2E] border border-white/10 rounded-2xl px-4 py-3 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6366F1] to-[#A78BFA] text-white font-semibold py-4 rounded-2xl transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <SocialLoginButtons />

        <button
          type="button"
          onClick={handleEnterHome}
          disabled={loading || guestLoading}
          className="w-full mt-3 border border-white/15 text-[#CBD5E1] font-medium py-3 rounded-2xl transition-opacity disabled:opacity-50 hover:bg-white/5"
        >
          {guestLoading ? t('auth.enteringHome') : t('auth.enterHome')}
        </button>

        <p className="text-center text-sm text-[#94A3B8] mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-[#6366F1] font-medium">
            {t('auth.register')}
          </Link>
        </p>

        <p className="text-center text-xs text-[#475569] mt-5">
          <Link to="/privacy" className="hover:text-[#94A3B8] transition-colors">Privacy Policy</Link>
          <span className="mx-2">·</span>
          <Link to="/support" className="hover:text-[#94A3B8] transition-colors">Support</Link>
        </p>
      </div>
    </div>
  );
}
