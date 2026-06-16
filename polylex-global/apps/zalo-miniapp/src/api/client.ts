import {
  createApiClientWithAuth,
  createAuthApi,
  createUserApi,
  createVocabularyApi,
  type ZaloProfilePayload,
} from '../../../../packages/shared-types/src/index.ts';
import { useAuthStore } from '../store/auth.store';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  '/api/v1';

export const miniAppClient = createApiClientWithAuth({
  baseURL: API_BASE_URL,
  auth: {
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    onRefreshed: (tokens) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        return false;
      }
      useAuthStore.getState().setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
      });
      return true;
    },
    onAuthFailed: () => {
      useAuthStore.getState().clearSession();
    },
  },
});

const sharedAuthApi = createAuthApi(miniAppClient);
const sharedUserApi = createUserApi(miniAppClient);
const sharedVocabularyApi = createVocabularyApi(miniAppClient);

export const miniAuthApi = {
  loginWithZalo: (token: string, zaloProfile?: ZaloProfilePayload) =>
    sharedAuthApi.socialLogin({ provider: 'zalo', token, zaloProfile }),
  issueDemoSession: () => sharedAuthApi.issueDemoSession(),
  getMe: () => sharedUserApi.getMe(),
};

export const miniVocabularyApi = {
  getVocabulary: () => sharedVocabularyApi.search({}),
};
