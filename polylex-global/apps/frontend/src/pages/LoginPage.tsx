import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { authApi, userApi } from '@/api/client';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import Button from '@/components/ui/Button';
import { TextField } from '@polylex/shared-ui';
import { validateEmail, validateRequired } from '@/utils/formValidation';

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
    const validationKey = validateRequired(email) ?? validateEmail(email) ?? validateRequired(password);
    if (validationKey) {
      setError(t(validationKey));
      return;
    }
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
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] px-4 py-8 text-[var(--color-ink)]">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-soft sm:p-8">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src="/icons/icon.svg" alt="PolyLex" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-h1 text-[var(--color-ink)]">{t('auth.welcomeBack')}</h1>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">{t('auth.signInSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="bg-[var(--color-bad-soft)] border border-[var(--color-bad)] text-[var(--color-bad)] text-sm px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <TextField
            type="email"
            label={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          <TextField
            type="password"
            label={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <Button type="submit" disabled={loading || guestLoading} fullWidth size="lg">
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>

        <SocialLoginButtons />

        <Button
          type="button"
          onClick={handleEnterHome}
          disabled={loading || guestLoading}
          variant="secondary"
          fullWidth
          className="mt-3"
        >
          {guestLoading ? t('auth.enteringHome') : t('auth.enterHome')}
        </Button>

        <p className="text-center text-sm text-[var(--color-ink-3)] mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-[var(--color-coral)] font-medium">
            {t('auth.register')}
          </Link>
        </p>

        <p className="text-center text-xs text-[var(--color-ink-3)] mt-5">
          <Link to="/privacy" className="hover:text-[var(--color-ink)] transition-colors">{t('legal.privacy', { defaultValue: 'Privacy Policy' })}</Link>
          <span className="mx-2">·</span>
          <Link to="/support" className="hover:text-[var(--color-ink)] transition-colors">{t('legal.support', { defaultValue: 'Support' })}</Link>
        </p>
      </div>
    </main>
  );
}
