import styles from './SocialLoginButton.module.css';
import { LoadingSpinner } from './LoadingSpinner';
import { useSocialLogin } from '../hooks/useSocialLogin';
import type { SocialLoginProvider, SocialLoginResult, SocialLoginError, SocialLoginRequestDto, ButtonVariant, ButtonSize } from '../types';

/* ============================================================
   Provider SVG icons (inline, no external dep)
   ============================================================ */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="20" viewBox="0 0 17 20" fill="currentColor" aria-hidden="true">
      <path d="M13.776 10.654c-.022-2.437 1.991-3.614 2.083-3.672-1.138-1.664-2.905-1.891-3.529-1.915-1.492-.153-2.927.886-3.685.886-.772 0-1.955-.867-3.213-.843C3.747 5.133 2.12 6.013 1.23 7.449-.588 10.36.672 14.714 2.429 17.097c.872 1.255 1.906 2.66 3.257 2.608 1.315-.053 1.811-.843 3.402-.843 1.578 0 2.029.843 3.418.814 1.408-.022 2.3-1.27 3.158-2.534.999-1.452 1.41-2.86 1.431-2.933-.031-.014-2.741-1.049-2.767-4.155h.448zm-2.59-7.643c.723-.876 1.212-2.09 1.079-3.301-1.043.042-2.305.695-3.053 1.571C8.502 2.007 7.89 3.24 8.04 4.43c1.154.09 2.333-.586 3.146-1.42z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

function ZaloIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#0084FF"/>
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16" fontFamily="Arial, sans-serif">Z</text>
    </svg>
  );
}

const PROVIDER_ICONS: Record<SocialLoginProvider, JSX.Element> = {
  google: <GoogleIcon />,
  apple: <AppleIcon />,
  facebook: <FacebookIcon />,
  zalo: <ZaloIcon />,
};

const PROVIDER_LABELS: Record<SocialLoginProvider, string> = {
  google: 'Tiếp tục với Google',
  apple: 'Tiếp tục với Apple',
  facebook: 'Tiếp tục với Facebook',
  zalo: 'Đăng nhập với Zalo',
};

/* ============================================================
   SocialLoginButton
   ============================================================ */
export interface SocialLoginButtonProps {
  provider: SocialLoginProvider;
  /**
   * Platform-specific token acquisition function.
   * @example async () => loginWithZaloSdk()
   */
  getToken: () => Promise<{ token: string; zaloProfile?: SocialLoginRequestDto['zaloProfile'] }>;
  /** Backend social-login API call bound to the app's own HTTP client. */
  socialLoginFn: (dto: SocialLoginRequestDto) => Promise<SocialLoginResult>;
  onSuccess: (result: SocialLoginResult) => void;
  onError?: (error: SocialLoginError) => void;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function SocialLoginButton({
  provider,
  getToken,
  socialLoginFn,
  onSuccess,
  onError,
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className,
}: SocialLoginButtonProps) {
  const { authenticate, loading } = useSocialLogin({
    provider,
    getToken,
    socialLoginFn,
    onSuccess,
    onError,
  });

  const spinnerColor = provider === 'google' ? 'primary' : 'white';

  return (
    <button
      type="button"
      onClick={authenticate}
      disabled={loading || disabled}
      className={cn(
        styles.btn,
        styles[`size-${size}`],
        styles[`variant-${variant}`],
        styles[`provider-${provider}`],
        fullWidth && styles.fullWidth,
        className,
      )}
      aria-label={label ?? PROVIDER_LABELS[provider]}
    >
      <span className={styles.icon}>
        {loading ? (
          <LoadingSpinner size="sm" variant="ring" color={spinnerColor} />
        ) : (
          PROVIDER_ICONS[provider]
        )}
      </span>
      <span>{label ?? PROVIDER_LABELS[provider]}</span>
    </button>
  );
}
