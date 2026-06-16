import { useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SocialLoginButton, type SocialLoginResult, type SocialLoginError } from '@polylex/shared-ui';
import { authApi, userApi } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';

// Module-level flag so GSI initialize() is only called once
let gsiInitialized = false;

export default function SocialLoginButtons() {
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);

  const handleSuccess = async (result: SocialLoginResult) => {
    setTokens(result);
    const user = await userApi.getMe();
    setUser(user);
    const needsOnboarding = result.isNewUser && !user.isOnboarded;
    navigate(needsOnboarding ? '/onboarding' : '/dashboard');
  };

  const handleError = (err: SocialLoginError) => {
    toast.error(err.message);
  };

  const getGoogleToken = async () => {
    if (Capacitor.isNativePlatform()) {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.initialize({
        clientId:
          import.meta.env.VITE_GOOGLE_CLIENT_ID_IOS ??
          import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB ??
          '',
        scopes: ['profile', 'email'],
      });
      const result = await GoogleAuth.signIn();
      return { token: result.authentication.idToken };
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB;
    if (!clientId) throw new Error('Google Client ID chưa được cấu hình (VITE_GOOGLE_CLIENT_ID_WEB)');
    if (typeof window === 'undefined' || !window.google) throw new Error('Google SDK chưa tải. Vui lòng thử lại.');

    if (!gsiInitialized) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: () => {},
        use_fedcm_for_prompt: true,
      });
      gsiInitialized = true;
    }

    const token = await new Promise<string>((resolve, reject) => {
      if (!tokenClientRef.current) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid profile email',
          callback: (resp) => {
            if (resp.error) { reject(new Error(resp.error)); return; }
            resolve(resp.access_token);
          },
          error_callback: (e) => reject(new Error(e.type ?? 'Google OAuth cancelled')),
        });
      } else {
        tokenClientRef.current.callback = (resp) => {
          if (resp.error) { reject(new Error(resp.error)); return; }
          resolve(resp.access_token);
        };
      }
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    });

    return { token };
  };

  const getAppleToken = async () => {
    if (Capacitor.isNativePlatform()) {
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
      const result = await SignInWithApple.authorize({
        clientId: import.meta.env.VITE_APPLE_BUNDLE_ID ?? 'com.truongphatlab.polylex.app',
        redirectURI: 'https://ebms.store/auth/apple/callback',
        scopes: 'email name',
      });
      const token = result.response.identityToken;
      if (!token) throw new Error('Apple không trả về token. Vui lòng thử lại.');
      return { token };
    }

    const serviceId = import.meta.env.VITE_APPLE_WEB_SERVICE_ID;
    if (!serviceId) throw new Error('Apple Web Service ID chưa được cấu hình (VITE_APPLE_WEB_SERVICE_ID)');
    if (typeof window === 'undefined' || !window.AppleID) throw new Error('Apple SDK chưa tải. Vui lòng thử lại.');

    window.AppleID.auth.init({
      clientId: serviceId,
      scope: 'name email',
      redirectURI: 'https://ebms.store/auth/apple/callback',
      usePopup: true,
    });
    const response = await window.AppleID.auth.signIn();
    return { token: response.authorization.id_token };
  };

  const socialLoginFn = (dto: Parameters<typeof authApi.socialLogin>[0]) =>
    authApi.socialLogin(dto);

  return (
    <div className="space-y-3 mt-4">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-[#475569]">hoặc</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <SocialLoginButton
        provider="google"
        getToken={getGoogleToken}
        socialLoginFn={socialLoginFn}
        onSuccess={handleSuccess}
        onError={handleError}
        fullWidth
      />

      <SocialLoginButton
        provider="apple"
        getToken={getAppleToken}
        socialLoginFn={socialLoginFn}
        onSuccess={handleSuccess}
        onError={handleError}
        fullWidth
      />
    </div>
  );
}
