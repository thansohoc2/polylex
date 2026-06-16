export interface GeneratePathPayload {
  goal: string;
  targetLanguageCode: string;
  nativeLanguageCode?: string;
  targetCefrLevel: string;
}

export interface PathStageVocabDto {
  id: string;
  term: string;
  phonetic?: string | null;
  phoneticRomaji?: string | null;
  cefrLevel?: string | null;
  partOfSpeech?: string | null;
  translation?: string | null;
  exampleSentence?: string | null;
}

export interface VideoDto {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  aiReason: string;
}

export interface PathStageDto {
  id: string;
  pathStageId: string;
  hasDialogue: boolean;
  hasVideos: boolean;
  order: number;
  title: string;
  description?: string | null;
  wordCount: number;
  xpReward: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  wordsLearned: number;
  vocab?: PathStageVocabDto[];
}

export interface PathDto {
  id: string;
  pathTemplateId: string;
  title: string;
  description?: string | null;
  emoji: string;
  totalWords: number;
  currentStageOrder: number;
  completedAt?: string | null;
  stages: PathStageDto[];
}

export interface CompleteStageResponseDto {
  nextStageUnlocked: boolean;
  completedAt: string;
}

export interface DialogueLine {
  speaker: 'A' | 'B';
  text: string;
  translation: string;
  vocabTerms: string[];
}

export interface StageDialogueDto {
  pathStageId: string;
  stageTitle: string;
  targetLanguageCode: string;
  lines: DialogueLine[];
}