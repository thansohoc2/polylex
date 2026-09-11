import {
  Injectable,
  Logger,
  OnModuleInit,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SpeechClient } from '@google-cloud/speech';
import { MAX_SPEECH_AUDIO_BYTES } from './speech.constants';
import { getVoiceConfig } from './voice-map.constants';

type GoogleAudioEncoding = 'WEBM_OPUS' | 'OGG_OPUS' | 'FLAC' | 'LINEAR16';

function getGoogleAudioEncoding(audioMimeType?: string): GoogleAudioEncoding {
  const mimeType = audioMimeType?.split(';')[0].toLowerCase();
  if (mimeType === 'audio/ogg') return 'OGG_OPUS';
  if (mimeType === 'audio/flac') return 'FLAC';
  if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') return 'LINEAR16';
  return 'WEBM_OPUS';
}

function parseCredentials(value?: string): Record<string, unknown> | null {
  if (!value || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function stripDataUri(base64Audio: string): string {
  return base64Audio.replace(/^data:[^;]+;base64,/, '');
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,!?;:'"¿¡]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function similarityPercent(a: string, b: string): number {
  const sa = normalizeText(a);
  const sb = normalizeText(b);
  if (!sa && !sb) return 100;
  if (!sa || !sb) return 0;
  const dist = levenshtein(sa, sb);
  const maxLen = Math.max(sa.length, sb.length);
  return Math.round(Math.max(0, 1 - dist / maxLen) * 100);
}

@Injectable()
export class SpeechToTextService implements OnModuleInit {
  private readonly logger = new Logger(SpeechToTextService.name);
  private googleClient: SpeechClient | null = null;
  private readonly googleEnabled: boolean;
  private readonly whisperEnabled: boolean;
  private readonly whisperUrl: string | null;

  constructor(private readonly config: ConfigService) {
    this.googleEnabled = this.config.get<boolean>('GOOGLE_STT_ENABLED', false);
    this.whisperEnabled = this.config.get<boolean>('WHISPER_STT_ENABLED', false);
    const whisperUrl = this.config.get<string>('WHISPER_STT_URL', '').trim();
    this.whisperUrl = whisperUrl ? whisperUrl : null;
  }

  onModuleInit() {
    if (this.whisperEnabled && this.whisperUrl) {
      this.logger.log(`Whisper STT is enabled and will use ${this.whisperUrl}`);
    } else if (this.whisperEnabled) {
      this.logger.warn('WHISPER_STT_ENABLED is true but WHISPER_STT_URL is missing');
    }

    if (!this.googleEnabled) {
      this.logger.log('Google STT is disabled (GOOGLE_STT_ENABLED=false)');
      return;
    }

    const credentials = this.config.get<string>('GOOGLE_STT_CREDENTIALS');
    const parsed = parseCredentials(credentials);

    if (credentials?.trim() && !parsed) {
      this.logger.warn('GOOGLE_STT_CREDENTIALS is present but invalid JSON');
    }

    try {
      const clientConfig = parsed ? { credentials: parsed } : {};
      this.googleClient = new SpeechClient(clientConfig);
      this.logger.log('Google STT client initialized successfully');
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to initialize Google STT client: ${error.message}`, error.stack);
    }
  }

  async transcribe(
    base64Audio: string,
    languageCode: string,
    targetText: string,
    audioMimeType?: string,
  ): Promise<{ transcript: string; confidence: number; accuracyPercent: number }> {
    const content = stripDataUri(base64Audio);
    if (!content) {
      throw new Error('Empty audio payload');
    }
    if (Buffer.byteLength(content, 'base64') > MAX_SPEECH_AUDIO_BYTES) {
      throw new PayloadTooLargeException('Audio payload exceeds the 5 MiB limit');
    }

    if (this.whisperEnabled && this.whisperUrl) {
      return this.transcribeWithWhisper(content, languageCode, targetText, audioMimeType);
    }

    if (!this.googleEnabled || !this.googleClient) {
      throw new ServiceUnavailableException('No STT provider is configured');
    }

    return this.transcribeWithGoogle(content, languageCode, targetText, audioMimeType);
  }

  private async transcribeWithWhisper(
    content: string,
    languageCode: string,
    targetText: string,
    audioMimeType?: string,
  ): Promise<{ transcript: string; confidence: number; accuracyPercent: number }> {
    if (!this.whisperUrl) {
      throw new ServiceUnavailableException('Whisper STT is not configured');
    }

    const response = await axios.post(
      `${this.whisperUrl.replace(/\/+$/, '')}/transcribe`,
      {
        audioBase64: content,
        languageCode,
        audioMimeType,
      },
      { timeout: 120_000 },
    );

    const transcript = String(response.data.transcript ?? '').trim();
    const confidence = Math.max(0, Number(response.data.confidence ?? 0));
    const accuracyPercent = similarityPercent(targetText, transcript);

    return {
      transcript,
      confidence: Math.round(confidence),
      accuracyPercent,
    };
  }

  private async transcribeWithGoogle(
    content: string,
    languageCode: string,
    targetText: string,
    audioMimeType?: string,
  ): Promise<{ transcript: string; confidence: number; accuracyPercent: number }> {
    const googleLanguageCode = getVoiceConfig(languageCode, 'FEMALE').languageCode;
    const [response] = await this.googleClient!.recognize({
      audio: { content },
      config: {
        encoding: getGoogleAudioEncoding(audioMimeType),
        languageCode: googleLanguageCode,
        enableAutomaticPunctuation: true,
        model: 'latest_long',
        audioChannelCount: 1,
      },
    });

    const transcript = (response.results ?? [])
      .map((result) => result.alternatives?.[0]?.transcript ?? '')
      .filter(Boolean)
      .join(' ')
      .trim();

    const confidence = Math.max(
      0,
      ...(response.results ?? []).flatMap((result) =>
        result.alternatives?.map((alt) => alt.confidence ?? 0) ?? [],
      ),
    );

    const accuracyPercent = similarityPercent(targetText, transcript);

    return {
      transcript,
      confidence: Math.round(confidence * 100),
      accuracyPercent,
    };
  }

  get isEnabled(): boolean {
    return this.whisperEnabled;
  }
}
