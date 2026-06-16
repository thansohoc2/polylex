import type { CefrLevel, LanguageDto } from '../index';

export interface CreateVocabularyPayload {
  term: string;
  languageCode: string;
  cefrLevel?: CefrLevel | string;
  partOfSpeech?: string;
  phonetic?: string;
  phoneticRomaji?: string;
  exampleSentence?: string;
  imageUrl?: string;
}

export interface AddTranslationPayload {
  targetLanguageCode: string;
  translation: string;
  definition?: string;
  exampleTranslation?: string;
  notes?: string;
}

export interface VocabularyQueryParams {
  languageCode?: string;
  cefrLevel?: CefrLevel;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TtsPreviewPayload {
  term: string;
  languageCode: string;
}

export interface VocabularyTranslationDto {
  translation: string;
  targetLanguage: Pick<LanguageDto, 'code' | 'name'>;
}

export interface VocabularyBaseDto {
  id: string;
  term: string;
  phonetic?: string | null;
  phoneticRomaji?: string | null;
  exampleSentence?: string | null;
  audioUrl?: string | null;
  cefrLevel?: string | null;
  partOfSpeech?: string | null;
  imageUrl?: string | null;
  language: Pick<LanguageDto, 'code' | 'name'>;
  translations: VocabularyTranslationDto[];
}

export interface VocabularyListResponse {
  items: VocabularyBaseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface UserVocabularyListItemDto {
  id: string;
  memoryStrength: number;
  reviewCount: number;
  isLeech: boolean;
  isLearned: boolean;
  sourceType?: string | null;
  vocabularyBase: VocabularyBaseDto;
}

export interface UserVocabularyListResponse {
  items: UserVocabularyListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface VocabularyAudioResponse {
  audioUrl: string | null;
  reason?: string;
}