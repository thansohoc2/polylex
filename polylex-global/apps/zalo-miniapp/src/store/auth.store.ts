import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MiniAppUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: MiniAppUser | null;
  setDemoSession: (session: { accessToken: string; refreshToken: string }) => void;
  setSession: (session: {
    accessToken: string;
    refreshToken: string;
    user: MiniAppUser;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setDemoSession: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken, user: null }),
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'polylex-zalo-auth',
    },
  ),
);
