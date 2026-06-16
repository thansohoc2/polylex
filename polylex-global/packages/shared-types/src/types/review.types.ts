import type { ReviewMode } from '../index';
import type { VocabularyBaseDto } from './vocabulary.types';

export interface ReviewQueueParams {
  languageCode?: string;
  sourceType?: string;
  cefrLevel?: string;
  limit?: number;
  userPathId?: string;
}

export interface ReviewQueueItemDto {
  id: string;
  memoryStrength: number;
  reviewCount: number;
  isLeech: boolean;
  isLearned: boolean;
  sourceType?: string | null;
  vocabularyBase: VocabularyBaseDto;
}

export interface ReviewQueueResponse {
  items: ReviewQueueItemDto[];
  pathTitle?: string;
  currentPathStageId?: string;
}

export interface SubmitReviewPayload {
  userVocabularyId: string;
  reviewMode: ReviewMode;
  recallQuality: number;
  responseTimeMs: number;
  confidenceLevel: number;
}