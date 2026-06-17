import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { getVoiceConfig } from './voice-map.constants';

/** Escape special XML characters so the term is safe inside an SSML <lang> tag. */
function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@Injectable()
export class TtsService implements OnModuleInit {
  private readonly logger = new Logger(TtsService.name);
  private client: TextToSpeechClient | null = null;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.enabled = this.config.get<boolean>('GOOGLE_TTS_ENABLED', false);
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('TTS is disabled (GOOGLE_TTS_ENABLED=false) — skipping client init');
      return;
    }
    const credentials = this.config.get<string>('GOOGLE_TTS_CREDENTIALS');
    this.logger.log(
      `TTS init: credentials present=${!!credentials}, ` +
      `is-json=${credentials?.trim().startsWith('{') ?? false}`,
    );
    try {
      const parsed =
        credentials && credentials.trim().startsWith('{')
          ? (JSON.parse(credentials) as Record<string, unknown>)
          : null;
      if (parsed) {
        // Log non-sensitive credential fields to confirm the right service account is loaded
        this.logger.log(
          `TTS credentials: project_id=${String(parsed.project_id ?? 'n/a')}, ` +
          `client_email=${String(parsed.client_email ?? 'n/a')}`,
        );
      } else {
        this.logger.warn('No GOOGLE_TTS_CREDENTIALS found — using Application Default Credentials');
      }
      const clientConfig = parsed ? { credentials: parsed } : {};
      this.client = new TextToSpeechClient(clientConfig);
      this.logger.log('TTS client initialized successfully');
    } catch (err) {
      const e = err as Error;
      this.logger.error(`Failed to initialize TTS client: ${e.message}`, e.stack);
    }
  }

  async synthesize(
    term: string,
    langCode: string,
    gender: 'MALE' | 'FEMALE' = 'FEMALE',
  ): Promise<Buffer> {
    if (!this.enabled || !this.client) {
      throw new ServiceUnavailableException('TTS is disabled');
    }
    if (!term || term.length > 500) {
      throw new Error('Invalid term length');
    }

    const voice = getVoiceConfig(langCode, gender);
    // Use SSML <lang> tag to guarantee the correct language is used,
    // preventing TTS from mis-reading words that look identical across languages
    // (e.g. "hai" in Vietnamese vs English).
    const ssml = `<speak><lang xml:lang="${voice.languageCode}">${xmlEscape(term)}</lang></speak>`;

    this.logger.debug(`Synthesizing TTS: term="${term}" lang=${langCode} voice=${voice.name}`);
    const [response] = await this.client.synthesizeSpeech({
      input: { ssml },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
        ssmlGender: voice.ssmlGender as never,
      },
      audioConfig: { audioEncoding: 'MP3' as never },
    });

    if (!response.audioContent) {
      this.logger.error(`TTS API returned empty audioContent for term="${term}" lang=${langCode}`);
      throw new Error('TTS returned empty buffer');
    }
    this.logger.debug(`TTS synthesis OK: term="${term}" lang=${langCode} bytes=${(response.audioContent as Uint8Array).byteLength}`);
    return Buffer.from(response.audioContent as Uint8Array);
  }

  get isEnabled(): boolean {
    return this.enabled;
  }
}
