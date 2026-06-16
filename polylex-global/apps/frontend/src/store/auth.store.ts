import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TokenPair, UserProfile } from '@polylex/shared-types';
import { setLocale } from '@/i18n';
import { createPlatformStorage } from '@/lib/storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  setTokens: (tokens: TokenPair) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: ({ accessToken, refreshToken }: TokenPair) =>
        set({ accessToken, refreshToken }),
      setUser: (user: UserProfile) => {
        if (user.nativeLanguageCode) {
          setLocale(user.nativeLanguageCode);
        }
        set({ user });
      },
      logout: () => {
        setLocale('en');
        set({ accessToken: null, refreshToken: null, user: null });
      },
    }),
    {
      name: 'polylex-auth',
      storage: createJSONStorage(createPlatformStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
