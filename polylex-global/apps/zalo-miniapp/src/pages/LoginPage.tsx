import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import zmp from 'zmp-sdk';
import { SocialLoginButton, ErrorToast, type SocialLoginError } from '@polylex/shared-ui';
import { miniAuthApi } from '../api/client';
import { useAuthStore } from '../store/auth.store';

function getZaloRuntimeInfo() {
  const userAgent = navigator.userAgent ?? '';
  const isInZalo = /zalo/i.test(userAgent);
  return { isInZalo };
}

function extractZaloProfile(raw: unknown) {
  const value = (raw ?? {}) as {
    id?: string;
    userId?: string;
    name?: string;
    displayName?: string;
    avatar?: string;
    avatarUrl?: string;
    email?: string;
    userInfo?: {
      id?: string;
      userId?: string;
      name?: string;
      displayName?: string;
      avatar?: string;
      avatarUrl?: string;
      email?: string;
    };
  };

  const profile = value.userInfo ?? value;
  const providerId = profile.id ?? profile.userId;
  if (!providerId) {
    throw new Error('Không lấy được thông tin tài khoản Zalo (thiếu user id)');
  }

  return {
    providerId,
    displayName: profile.displayName ?? profile.name ?? null,
    avatarUrl: profile.avatarUrl ?? profile.avatar ?? null,
    email: profile.email ?? null,
  };
}

export default function LoginPage() {
  const [error, setError] = useState('');
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const handleSuccess = async (auth: { accessToken: string; refreshToken: string }) => {
    const me = await miniAuthApi.getMe();
    setSession({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: {
        id: me.id,
        email: me.email,
        displayName: me.displayName,
      },
    });
    navigate('/vocabulary', { replace: true });
  };

  const handleError = (e: SocialLoginError) => {
    setError(e.message || 'Đăng nhập Zalo thất bại');
  };

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>PolyLex trên Zalo</h2>
        <p>Đăng nhập bằng Zalo để đồng bộ tiến độ. Nếu không đăng nhập, bạn vẫn có thể vào ứng dụng ở chế độ hiện tại.</p>
        {error ? <ErrorToast message={error} autoClose={false} className="zalo-error-toast" /> : null}
        <button
          className="button button-secondary"
          style={{ width: '100%', marginBottom: 12 }}
          onClick={() => navigate('/vocabulary', { replace: true })}
        >
          Bỏ qua đăng nhập Zalo
        </button>
        <SocialLoginButton
          provider="zalo"
          label="Đăng nhập với Zalo"
          fullWidth
          className="social-login-button-zalo"
          getToken={async () => {
            const runtime = getZaloRuntimeInfo();
            if (!runtime.isInZalo) {
              throw new Error('Không chạy trong ứng dụng Zalo. Hãy mở mini app bằng app Zalo trên điện thoại.');
            }

            await new Promise<void>((resolve, reject) => {
              zmp.login({
                success: () => resolve(),
                fail: (err) => reject(err),
              });
            });

            const token = await new Promise<string>((resolve, reject) => {
              zmp.getAccessToken({
                success: (accessToken) => resolve(accessToken),
                fail: (err) => reject(err),
              });
            });

            if (!token || token === 'DEFAULT ACCESS TOKEN') {
              throw new Error('Không lấy được access token Zalo. Vui lòng đăng nhập lại và thử lại.');
            }

            const rawProfile = await new Promise<unknown>((resolve, reject) => {
              zmp.getUserInfo({
                success: (data) => resolve(data),
                fail: (err) => reject(err),
              });
            });

            const profile = extractZaloProfile(rawProfile);
            return { token, zaloProfile: profile };
          }}
          socialLoginFn={async (dto) =>
            miniAuthApi.loginWithZalo(dto.token, dto.zaloProfile)
          }
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
}
