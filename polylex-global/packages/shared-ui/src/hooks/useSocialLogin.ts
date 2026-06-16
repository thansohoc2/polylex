import { useState, useCallback } from 'react';
import type { SocialLoginProvider, SocialLoginResult, SocialLoginRequestDto, SocialLoginError } from '../types';

export interface UseSocialLoginOptions {
  provider: SocialLoginProvider;
  /**
   * Platform-specific token acquisition (Google OAuth, Apple Sign-In, Zalo SDK, etc.).
   * The caller is responsible for providing the right implementation for the current platform.
   * @example
   * // Zalo mini-app
   * getToken: async () => {
   *   const { token, profile } = await loginWithZaloSdk();
   *   return { token, zaloProfile: profile };
   * }
   */
  getToken: () => Promise<{ token: string; zaloProfile?: SocialLoginRequestDto['zaloProfile'] }>;
  /**
   * Backend social-login API call. Use the app's own API client.
   * @example
   * socialLoginFn: (dto) => authApi.socialLogin(dto)
   */
  socialLoginFn: (dto: SocialLoginRequestDto) => Promise<SocialLoginResult>;
  onSuccess: (result: SocialLoginResult) => void;
  onError?: (error: SocialLoginError) => void;
}

/**
 * Social login hook – orchestrates token acquisition and backend authentication.
 * Provider-specific SDK logic is injected via `getToken`, keeping the hook platform-agnostic.
 *
 * @example
 * const { authenticate, loading } = useSocialLogin({
 *   provider: 'zalo',
 *   getToken: async () => {
 *     const { token, profile } = await loginWithZaloSdk();
 *     return { token, zaloProfile: profile };
 *   },
 *   socialLoginFn: (dto) => miniAuthApi.loginWithZalo(dto.token, dto.zaloProfile),
 *   onSuccess: (auth) => { storeTokens(auth); navigate('/vocabulary'); },
 * });
 */
export function useSocialLogin({
  provider,
  getToken,
  socialLoginFn,
  onSuccess,
  onError,
}: UseSocialLoginOptions) {
  const [loading, setLoading] = useState(false);

  const authenticate = useCallback(async () => {
    setLoading(true);
    try {
      const { token, zaloProfile } = await getToken();
      const dto: SocialLoginRequestDto = { provider, token, zaloProfile };
      const result = await socialLoginFn(dto);
      onSuccess(result);
    } catch (err) {
      const raw = err as { code?: string; message?: string } | Error | null;
      const error: SocialLoginError = {
        code: (raw as { code?: string })?.code ?? 'UNKNOWN',
        message: raw instanceof Error ? raw.message : String(raw ?? 'Unknown error'),
      };
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [provider, getToken, socialLoginFn, onSuccess, onError]);

  return { authenticate, loading };
}
