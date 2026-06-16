import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class GenerateExampleDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  vocabularyBaseId: string;

  @ApiProperty({ example: 'vi', description: 'Context language code' })
  @IsString()
  targetLanguageCode: string;
}

export class AiHintDto {
  @ApiProperty()
  @IsString()
  term: string;

  @ApiProperty({ example: 'en' })
  @IsString()
  termLanguageCode: string;

  @ApiProperty({ example: 'vi' })
  @IsString()
  userNativeLanguageCode: string;
}

export interface EnrichedWordResult {
  phonetic: string | null;
  phoneticRomaji: string | null;
  cefrLevel: string | null;
  partOfSpeech: string | null;
  translationText: string;
  exampleSentence: string | null;
}

export interface GeneratedPathVocab {
  term: string;
  phonetic?: string | null;
  phoneticRomaji?: string | null;
  cefrLevel?: string | null;
  partOfSpeech?: string | null;
  translation: string;
  exampleSentence?: string | null;
}

export interface GeneratedPathStage {
  order: number;
  title: string;
  description?: string | null;
  vocab: GeneratedPathVocab[];
}

export interface GeneratedPath {
  title: string;
  description?: string | null;
  emoji: string;
  stages: GeneratedPathStage[];
}

// ─── Zod schemas for AI output validation ─────────────────────────────────────

const GeneratedPathVocabSchema = z.object({
  term: z.string(),
  phonetic: z.string().nullish(),
  phoneticRomaji: z.string().nullish(),
  cefrLevel: z.string().nullish(),
  partOfSpeech: z.string().nullish(),
  translation: z.string(),
  exampleSentence: z.string().nullish(),
});

const GeneratedPathStageSchema = z.object({
  order: z.number(),
  title: z.string(),
  description: z.string().nullish(),
  vocab: z.array(GeneratedPathVocabSchema).min(1),
});

const GeneratedPathSchema = z.object({
  title: z.string(),
  description: z.string().nullish(),
  emoji: z.string(),
  stages: z.array(GeneratedPathStageSchema).min(1),
});

export interface DialogueLine {
  speaker: 'A' | 'B';
  text: string;         // target language
  translation: string;  // native language translation
  vocabTerms: string[]; // subset of stage vocab appearing in this line
}

const DialogueLineSchema = z.object({
  speaker: z.enum(['A', 'B']),
  text: z.string().min(1),
  translation: z.string().min(1),
  vocabTerms: z.array(z.string()),
});

const DialogueSchema = z.array(DialogueLineSchema).min(6).max(20);

// ─── Video-related interfaces & schemas ───────────────────────────────────────

export interface RankedVideoResult {
  youtubeVideoId: string;
  relevanceScore: number;
  aiReason: string;
}

const RankedVideoSchema = z.object({
  youtubeVideoId: z.string().min(1),
  relevanceScore: z.number().min(0).max(1),
  aiReason: z.string().min(1),
});

const RankedVideosSchema = z.array(RankedVideoSchema).min(1).max(5);

/**
 * Returns a language-specific instruction for the `phoneticRomaji` field in AI prompts.
 * Japanese uses kanji+furigana+romaji format per user requirement.
 */
function getPhoneticRomajiGuide(langCode: string): string {
  const code = langCode.toLowerCase().split('-')[0];
  switch (code) {
    case 'ja':
      return (
        'for Japanese, provide kanji (if present) + furigana + romaji in format "漢字 (よみがな, romaji)". ' +
        'Examples: "食べる (たべる, taberu)", "花 (はな, hana)". ' +
        'If the word contains no kanji, use "よみがな (romaji)" format, e.g. "ありがとう (arigatou)". ' +
        'Never omit kanji for words that contain it.'
      );
    case 'zh':
      return 'Pinyin with tone marks, e.g. "nǐ hǎo". Always include tone marks. Do not omit.';
    case 'ko':
      return 'Revised Romanization of Korean (RR), e.g. "annyeonghaseyo".';
    case 'ar':
      return 'Standard Arabic romanization / transliteration, e.g. "marhaban".';
    case 'th':
      return 'RTGS romanization of Thai, e.g. "sawasdee".';
    case 'hi':
    case 'bn':
    case 'uk':
    case 'el':
    case 'he':
      return 'Latin romanization of the native script, e.g. for Hindi "namaste", Greek "kalimera".';
    default:
      return 'null — this language uses Latin script so romanization is not applicable.';
  }
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private gemini: GenerativeModel | null = null;
  private geminiJson: GenerativeModel | null = null;

  constructor(private readonly config: ConfigService) {
    const enabled = config.get<boolean>('GEMINI_ENABLED') === true;
    if (enabled) {
      const apiKey = config.get<string>('GEMINI_API_KEY') ?? '';
      const client = new GoogleGenerativeAI(apiKey);
      this.gemini = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.geminiJson = client.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
    }
  }

  get isEnabled(): boolean {
    return this.gemini !== null;
  }

  private ensureEnabled() {
    if (!this.gemini) {
      throw new ServiceUnavailableException('AI features are not enabled');
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const msg: string = err?.message ?? '';
        const is429 = msg.includes('429') || err?.status === 429;
        if (!is429) throw err;

        // Daily quota exhausted — retryDelay is "0s" or violation contains PerDay
        const isDailyQuota =
          msg.includes('PerDayPerProjectPerModel') ||
          msg.includes('"retryDelay":"0s"');
        if (isDailyQuota) {
          this.logger.error('Gemini daily free-tier quota exhausted. Enable billing at https://console.cloud.google.com or wait until quota resets.');
          throw new ServiceUnavailableException(
            'AI quota exhausted for today. Please try again tomorrow or enable billing on the API key project.',
          );
        }

        if (attempt < retries) {
          // Parse retryDelay from error message if available, default to 60s
          const match = msg.match(/"retryDelay":"(\d+)s"/);
          const delaySec = match ? parseInt(match[1], 10) : 60 * attempt;
          this.logger.warn(`Gemini 429 rate limit — retrying in ${delaySec}s (attempt ${attempt}/${retries})`);
          await new Promise((r) => setTimeout(r, delaySec * 1000));
        } else {
          throw err;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  async generateContextSentence(term: string, languageCode: string, level: string): Promise<string> {
    this.ensureEnabled();

    const prompt =
      `You are a language teacher. Generate a single natural example sentence at ${level} CEFR level. ` +
      `Return ONLY the sentence.\n\nGenerate an example sentence using the word "${term}" in ${languageCode}.`;

    const result = await this.withRetry(() => this.gemini!.generateContent(prompt));
    return result.response.text().trim();
  }

  async generateMemoryHint(
    term: string,
    termLanguage: string,
    nativeLanguage: string,
  ): Promise<string> {
    this.ensureEnabled();

    const prompt =
      `You are a memory expert. Create a short, memorable mnemonic or association hint in ${nativeLanguage}. ` +
      `Return ONLY the hint (max 2 sentences).\n\n` +
      `Create a memory hint for the ${termLanguage} word "${term}" for a ${nativeLanguage} speaker.`;

    const result = await this.withRetry(() => this.gemini!.generateContent(prompt));
    return result.response.text().trim();
  }

  async enrichWord(
    term: string,
    sourceLanguageCode: string,
    targetLanguageCode: string,
  ): Promise<EnrichedWordResult> {
    this.ensureEnabled();

    const phoneticRomajiGuide = getPhoneticRomajiGuide(sourceLanguageCode);

    const prompt = `You are a professional linguist.

Analyze the word/phrase below and return a JSON object with exactly these keys:
- "phonetic": IPA phonetic transcription string, or null if not applicable
- "phoneticRomaji": ${phoneticRomajiGuide}
- "cefrLevel": CEFR level string (A1/A2/B1/B2/C1/C2), or null if unsure
- "partOfSpeech": primary part of speech in English (noun/verb/adjective/adverb/phrase/other), or null
- "translationText": translation into ${targetLanguageCode} — this is REQUIRED, never null
- "exampleSentence": one natural example sentence in ${sourceLanguageCode} at an appropriate level, or null

Word: "${term}"
Source language: ${sourceLanguageCode}
Target language: ${targetLanguageCode}`;

    const result = await this.withRetry(() => this.geminiJson!.generateContent(prompt));
    const raw = result.response.text().trim();

    // Strip any accidental markdown code fence
    const json = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(json) as EnrichedWordResult;
    return parsed;
  }

  async generateLearningPath(
    goal: string,
    targetLanguage: string,
    nativeLanguage: string,
    targetCefrLevel: string,
  ): Promise<GeneratedPath> {
    this.ensureEnabled();

    const phoneticRomajiGuide = getPhoneticRomajiGuide(targetLanguage);

    const prompt = `You are an expert language curriculum designer.
Create a vocabulary learning path in ${targetLanguage} for a ${nativeLanguage} speaker.
Goal: "${goal}"
Target level: ${targetCefrLevel}

Requirements:
- 5–7 stages, each with 8–12 words
- Progress from simple to complex
- Words must be practical and directly related to the goal
- Each word must have: term, phonetic (IPA), phoneticRomaji, cefrLevel, partOfSpeech, translation (in ${nativeLanguage}), exampleSentence
- phoneticRomaji rule: ${phoneticRomajiGuide}

Return a JSON object with this exact format:
{
  "title": "Short path title",
  "description": "One sentence description",
  "emoji": "One representative emoji",
  "stages": [
    {
      "order": 1,
      "title": "Stage title",
      "description": "Stage description",
      "vocab": [
        {
          "term": "word",
          "phonetic": "IPA",
          "phoneticRomaji": "Pinyin/Romaji/transliteration, or omit for Latin-script languages",
          "cefrLevel": "A1",
          "partOfSpeech": "noun",
          "translation": "translation in ${nativeLanguage}",
          "exampleSentence": "Example sentence."
        }
      ]
    }
  ]
}`;

    const result = await this.withRetry(() => this.geminiJson!.generateContent(prompt));
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    let json: unknown;
    try {
      json = JSON.parse(cleaned);
    } catch {
      throw new ServiceUnavailableException('AI returned invalid JSON for learning path');
    }

    try {
      const validated = GeneratedPathSchema.parse(json);
      return validated;
    } catch (zodErr) {
      this.logger.error('Zod validation failed for AI learning path', zodErr);
      throw new ServiceUnavailableException('AI returned malformed path data');
    }
  }

  async generateStageDialogue(
    terms: string[],
    targetLanguage: string,
    nativeLanguage: string,
    cefrLevel: string,
    stageTitle: string,
  ): Promise<DialogueLine[]> {
    this.ensureEnabled();

    const prompt = `You are a language teacher creating a contextual dialogue.
Generate a natural dialogue of 8–10 exchanges (turns) between two people (speaker A and B) in ${targetLanguage}.
CEFR level: ${cefrLevel}. Topic: "${stageTitle}".
The dialogue MUST naturally use ALL of these vocabulary words: ${terms.join(', ')}.
For each line return: speaker ("A" or "B"), text (in ${targetLanguage}), translation (in ${nativeLanguage}), vocabTerms (array of the vocabulary words from the list that appear in this line).
Return a JSON object with a single key "lines" containing the array of dialogue lines.`;

    const result = await this.withRetry(() => this.geminiJson!.generateContent(prompt));
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```json\n?/i, '').replace(/\n?```$/, '').trim();

    let json: unknown;
    try {
      json = JSON.parse(cleaned);
    } catch {
      throw new Error('AI returned invalid JSON for dialogue');
    }

    // Accept both { lines: [...] } and bare array
    const arr = (json as any)?.lines ?? (Array.isArray(json) ? json : null);
    if (!arr) throw new Error('AI returned invalid JSON for dialogue');
    return DialogueSchema.parse(arr);
  }

  /**
   * Generate an optimal YouTube search query based on stage context.
   * Returns a single search query string that targets the right level + topic.
   */
  async generateVideoQuery(
    terms: string[],
    targetLanguage: string,
    stageTitle: string,
    cefrLevel: string,
  ): Promise<string> {
    this.ensureEnabled();

    const prompt = `You are an expert language learning content curator.
Generate ONE concise and highly-effective YouTube search query to find educational videos for language learners.

Context:
- Target language: ${targetLanguage}
- Vocabulary focus: ${terms.slice(0, 5).join(', ')}${terms.length > 5 ? ` + ${terms.length - 5} more` : ''}
- Stage topic: ${stageTitle}
- CEFR level: ${cefrLevel} (beginner=A1/A2, intermediate=B1/B2, advanced=C1/C2)

Requirements for the search query:
- Include the target language name
- Be specific to the topic and vocabulary
- Mention the proficiency level (e.g. "for beginners", "advanced")
- Optimize for educational content (avoid music videos, entertainment, etc.)
- Length: 6–12 words maximum
- Format: natural search query string, no quotes or special characters

Return ONLY the search query string, nothing else.`;

    const result = await this.withRetry(() => this.gemini!.generateContent(prompt));
    return result.response.text().trim();
  }

  /**
   * Rank YouTube video candidates by relevance to stage context.
   * Ensures AI only selects from provided candidates (no hallucination).
   * Returns top 3–5 videos with scores and reasoning.
   */
  async rankVideos(
    candidates: Array<{
      videoId: string;
      title: string;
      description: string;
      channelTitle: string;
      durationSeconds?: number;
    }>,
    context: {
      stageTitle: string;
      cefrLevel: string;
      terms: string[];
      targetLanguage: string;
    },
  ): Promise<RankedVideoResult[]> {
    this.ensureEnabled();

    if (candidates.length === 0) {
      return [];
    }

    const candidateList = candidates
      .map(
        (c, i) =>
          `${i + 1}. ID: ${c.videoId} | Title: "${c.title}" | Channel: ${c.channelTitle} | Duration: ${c.durationSeconds ? Math.round(c.durationSeconds / 60) + ' min' : 'unknown'} | Description: ${c.description.substring(0, 150)}...`,
      )
      .join('\n');

    const prompt = `You are an expert language education content curator.
Your task is to rank YouTube videos by their suitability for language learners.

STAGE CONTEXT:
- Topic: ${context.stageTitle}
- CEFR level: ${context.cefrLevel}
- Target vocabulary: ${context.terms.slice(0, 8).join(', ')}${context.terms.length > 8 ? ` + ${context.terms.length - 8} more` : ''}
- Target language: ${context.targetLanguage}

CANDIDATE VIDEOS (you MUST ONLY choose from these):
${candidateList}

RANKING CRITERIA:
1. Content appropriateness: Is the video relevant to the topic and vocabulary?
2. Level appropriateness: Is the video's difficulty suitable for ${context.cefrLevel}?
3. Pedagogical value: Is it educational for language learners, not entertainment-focused?
4. Video quality: Does it appear to be from a credible/professional channel?
5. Length: Prefer shorter videos (under 20 minutes for effective learning).

IMPORTANT:
- Return EXACTLY 3–5 top videos (most relevant first)
- Include ONLY video IDs from the candidate list above
- Each must include a brief reason why it's suitable (1–2 sentences)
- Score each from 0.0–1.0 based on relevance

Return ONLY a JSON array in this exact format:
[
  {
    "youtubeVideoId": "video_id_here",
    "relevanceScore": 0.95,
    "aiReason": "Clear explanation of why this video is suitable."
  }
]`;

    const result = await this.withRetry(() => this.geminiJson!.generateContent(prompt));
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    let json: unknown;
    try {
      json = JSON.parse(cleaned);
    } catch {
      this.logger.error('Failed to parse AI video ranking response', { raw });
      return [];
    }

    try {
      const validated = RankedVideosSchema.parse(json);
      // Validate that all returned video IDs are from candidates
      const candidateIds = new Set(candidates.map((c) => c.videoId));
      return validated.filter((v) => candidateIds.has(v.youtubeVideoId));
    } catch (zodErr) {
      this.logger.error('Zod validation failed for video ranking', zodErr);
      return [];
    }
  }
}
