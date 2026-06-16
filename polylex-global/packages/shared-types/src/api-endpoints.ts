import type { AxiosInstance } from 'axios';
import type {
  UserDto,
  UpdateMeDto,
  AddLearningLanguageDto,
  TtsPreferencesDto,
  TtsVoiceGender,
  CreateVocabularyPayload,
  AddTranslationPayload,
  VocabularyQueryParams,
  VocabularyListResponse,
  VocabularyBaseDto,
  UserVocabularyListResponse,
  VocabularyAudioResponse,
  TtsPreviewPayload,
  ReviewQueueParams,
  ReviewQueueResponse,
  SubmitReviewPayload,
  GeneratePathPayload,
  PathDto,
  CompleteStageResponseDto,
  StageDialogueDto,
  VideoDto,
  AnalyticsHeatmapEntry,
  AnalyticsVelocityEntry,
  AnalyticsRetentionRate,
  GamificationStatusDto,
  WeeklyLeaderboardResponseDto,
} from './types';

export interface UserApi {
  getMe(): Promise<UserDto>;
  updateMe(data: UpdateMeDto): Promise<UserDto>;
  addLanguage(data: AddLearningLanguageDto): Promise<UserDto>;
  getTtsPreferences(): Promise<TtsPreferencesDto>;
  updateTtsPreferences(data: { ttsVoiceGender: TtsVoiceGender }): Promise<TtsPreferencesDto>;
  deleteMe(): Promise<void>;
}

export function createUserApi(client: AxiosInstance): UserApi {
  return {
    getMe: () => client.get('/users/me').then((response) => response.data),
    updateMe: (data) => client.patch('/users/me', data).then((response) => response.data),
    addLanguage: (data) => client.post('/users/me/languages', data).then((response) => response.data),
    getTtsPreferences: () =>
      client.get('/users/me/tts-preferences').then((response) => response.data),
    updateTtsPreferences: (data) =>
      client.patch('/users/me/tts-preferences', data).then((response) => response.data),
    deleteMe: () => client.delete('/users/me').then(() => undefined),
  };
}

export interface VocabularyApi {
  search(params: VocabularyQueryParams): Promise<VocabularyListResponse>;
  getOne(id: string): Promise<VocabularyBaseDto>;
  create(data: CreateVocabularyPayload): Promise<VocabularyBaseDto>;
  addTranslation(id: string, data: AddTranslationPayload): Promise<unknown>;
  addToMyList(id: string): Promise<unknown>;
  getMyList(page?: number, limit?: number): Promise<UserVocabularyListResponse>;
  getAudio(id: string): Promise<VocabularyAudioResponse>;
  ttsPreview(data: TtsPreviewPayload): Promise<ArrayBuffer>;
}

export function createVocabularyApi(client: AxiosInstance): VocabularyApi {
  return {
    search: (params) => client.get('/vocabulary', { params }).then((response) => response.data),
    getOne: (id) => client.get(`/vocabulary/${id}`).then((response) => response.data),
    create: (data) => client.post('/vocabulary', data).then((response) => response.data),
    addTranslation: (id, data) =>
      client.post(`/vocabulary/${id}/translations`, data).then((response) => response.data),
    addToMyList: (id) => client.post(`/vocabulary/${id}/add-to-my-list`).then((response) => response.data),
    getMyList: (page = 1, limit = 20) =>
      client.get('/vocabulary/my-list', { params: { page, limit } }).then((response) => response.data),
    getAudio: (id) => client.get(`/vocabulary/${id}/audio`).then((response) => response.data),
    ttsPreview: (data) =>
      client
        .post('/vocabulary/tts-preview', data, { responseType: 'arraybuffer' })
        .then((response) => response.data as ArrayBuffer),
  };
}

export interface ReviewApi {
  getQueue(params?: ReviewQueueParams): Promise<ReviewQueueResponse>;
  submit(data: SubmitReviewPayload): Promise<unknown>;
}

export function createReviewApi(client: AxiosInstance): ReviewApi {
  return {
    getQueue: (params) => client.get('/review/queue', { params }).then((response) => response.data),
    submit: (data) => client.post('/review/submit', data).then((response) => response.data),
  };
}

export interface PathApi {
  generate(data: GeneratePathPayload): Promise<PathDto>;
  getMyPaths(): Promise<PathDto[]>;
  getPath(id: string): Promise<PathDto>;
  completeStage(userPathStageId: string): Promise<CompleteStageResponseDto>;
  getStageDialogue(pathStageId: string): Promise<StageDialogueDto>;
  getStageVideos(pathStageId: string): Promise<{ data: VideoDto[]; stageTitle: string }>;
}

export function createPathApi(client: AxiosInstance): PathApi {
  return {
    generate: (data) => client.post('/paths/generate', data).then((response) => response.data),
    getMyPaths: () => client.get('/paths/my').then((response) => response.data),
    getPath: (id) => client.get(`/paths/${id}`).then((response) => response.data),
    completeStage: (userPathStageId) =>
      client.post(`/paths/stages/${userPathStageId}/complete`).then((response) => response.data),
    getStageDialogue: (pathStageId) =>
      client.get(`/paths/stages/${pathStageId}/dialogue`).then((response) => response.data),
    getStageVideos: (pathStageId) =>
      client.get(`/paths/stages/${pathStageId}/videos`).then((response) => ({
        data: response.data.data ?? [],
        stageTitle: response.data.stageTitle ?? '',
      })),
  };
}

export interface AnalyticsApi {
  getHeatmap(days?: number): Promise<AnalyticsHeatmapEntry[]>;
  getVelocity(weeks?: number): Promise<AnalyticsVelocityEntry[]>;
  getRetention(): Promise<AnalyticsRetentionRate>;
}

export function createAnalyticsApi(client: AxiosInstance): AnalyticsApi {
  return {
    getHeatmap: (days) =>
      client.get('/analytics/heatmap', { params: { days } }).then((response) => response.data),
    getVelocity: (weeks) =>
      client.get('/analytics/velocity', { params: { weeks } }).then((response) => response.data),
    getRetention: () => client.get('/analytics/retention').then((response) => response.data),
  };
}

export interface GamificationApi {
  getStats(): Promise<GamificationStatusDto>;
  getLeaderboard(limit?: number): Promise<WeeklyLeaderboardResponseDto>;
}

export function createGamificationApi(client: AxiosInstance): GamificationApi {
  return {
    getStats: () => client.get('/gamification/stats').then((response) => response.data),
    getLeaderboard: (limit) =>
      client.get('/gamification/leaderboard', { params: { limit } }).then((response) => response.data),
  };
}