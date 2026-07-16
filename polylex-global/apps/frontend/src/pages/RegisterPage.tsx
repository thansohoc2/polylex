import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { authApi, languageApi, userApi } from '@/api/client';
import { LanguageDto } from '@polylex/shared-types';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import Button from '@/components/ui/Button';
import { Select, TextField } from '@polylex/shared-ui';
import { validateEmail, validateMinLength, validateRequired } from '@/utils/formValidation';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    nativeLanguageCode: '',
  });
  const [languages, setLanguages] = useState<LanguageDto[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    languageApi.getAll().then(setLanguages).catch(() => {});
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationKey =
      validateRequired(form.displayName) ??
      validateEmail(form.email) ??
      validateMinLength(form.password, 8) ??
      validateRequired(form.nativeLanguageCode);
    if (validationKey) { setError(t(validationKey, { minimum: 8 })); return; }
    setError('');
    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tokens = await authApi.register({ ...form, timezone });
      setTokens(tokens);
      const user = await userApi.getMe();
      setUser(user);
      navigate('/roadmap');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : t('auth.registrationFailed'));
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

  const fieldDefs = [
    { field: 'displayName', labelKey: 'auth.displayName', type: 'text', placeholderKey: 'auth.namePlaceholder' },
    { field: 'email', labelKey: 'auth.email', type: 'email', placeholder: 'you@example.com' },
    { field: 'password', labelKey: 'auth.password', type: 'password', placeholderKey: 'auth.passPlaceholder' },
  ] as const;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] px-4 py-8 text-[var(--color-ink)]">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-soft sm:p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src="/icons/icon.svg" alt="PolyLex" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-h1 text-[var(--color-ink)]">{t('auth.createAccount')}</h1>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">{t('auth.createAccountSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="bg-[var(--color-bad-soft)] border border-[var(--color-bad)] text-[var(--color-bad)] text-sm px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          {fieldDefs.map(({ field, labelKey, type, ...rest }) => {
            const placeholder = 'placeholder' in rest ? rest.placeholder : t((rest as { placeholderKey: string }).placeholderKey);
            return (
              <TextField
                  key={field}
                  type={type}
                  label={t(labelKey)}
                  value={form[field as keyof typeof form]}
                  onChange={set(field)}
                  required
                  minLength={field === 'password' ? 8 : 2}
                  autoComplete={field === 'password' ? 'new-password' : field === 'email' ? 'email' : 'name'}
                  placeholder={placeholder}
                />
            );
          })}

          <Select
              label={t('auth.nativeLanguage')}
              value={form.nativeLanguageCode}
              onChange={set('nativeLanguageCode')}
              required
            >
              <option value="">{t('auth.selectNativeLanguage')}</option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flagEmoji} {l.name} — {l.nativeName}
                </option>
              ))}
          </Select>

          <Button type="submit" disabled={loading || guestLoading} fullWidth size="lg">
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
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
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-[var(--color-coral)] font-medium">
            {t('auth.signIn')}
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
