import {
  createAnalyticsApi,
  createApiClientWithAuth,
  createAuthApi,
  createGamificationApi,
  createPathApi,
  createReviewApi,
  createUserApi,
  createVocabularyApi,
  type DialogueLine,
  type ReviewQueueResponse,
  type StageDialogueDto,
  type VideoDto,
  type PathDto,
} from '../../../../packages/shared-types/src/index.ts';
import { useAuthStore } from '@/store/auth.store';

// In dev (Vite proxy) leave empty → relative '/api/v1'.
// In production/native builds set VITE_API_BASE_URL=https://ebms.store/api/v1
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export const apiClient = createApiClientWithAuth({
  baseURL: API_BASE,
  includeAccessTokenInRefreshHeader: true,
  auth: {
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    onRefreshed: (tokens) => {
      useAuthStore.getState().setTokens(tokens);
      return true;
    },
    onAuthFailed: () => {
      useAuthStore.getState().logout();
    },
  },
});

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = createAuthApi(apiClient);
export const userApi = createUserApi(apiClient);

// ─── Language endpoints ───────────────────────────────────────────────────────

export const languageApi = {
  getAll: () => apiClient.get('/languages').then((r) => r.data),
};

export const vocabularyApi = createVocabularyApi(apiClient);
export const reviewApi = createReviewApi(apiClient);
export const analyticsApi = createAnalyticsApi(apiClient);

// ─── Roadmap endpoints ────────────────────────────────────────────────────────

export const roadmapApi = {
  getRecommendations: (languageCode: string) =>
    apiClient.get(`/roadmap/${languageCode}`).then((r) => r.data),
};

export const gamificationApi = createGamificationApi(apiClient);

export const quickNoteApi = {
  create: (data: { term: string; sourceLanguageCode: string; targetLanguageCode: string }) =>
    apiClient.post('/quick-notes', data).then((r) => r.data),
  list: () => apiClient.get('/quick-notes').then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/quick-notes/${id}`).then((r) => r.data),
};

export const pathApi = createPathApi(apiClient);

export type { DialogueLine, ReviewQueueResponse, StageDialogueDto, VideoDto, PathDto };
