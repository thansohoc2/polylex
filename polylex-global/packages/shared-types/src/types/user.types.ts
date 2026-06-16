import type { UserProfile } from '../index';

export type UserDto = UserProfile;

export interface UpdateMeDto {
  displayName?: string;
  dailyGoal?: number;
  timezone?: string;
  nativeLanguageCode?: string;
  primaryLearningLanguageCode?: string;
}

export interface AddLearningLanguageDto {
  languageCode: string;
  targetCefrLevel: string;
}

export type TtsVoiceGender = 'MALE' | 'FEMALE';

export interface TtsPreferencesDto {
  ttsVoiceGender: TtsVoiceGender;
}