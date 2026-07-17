import { ConfigService } from '@nestjs/config';
import { MAX_SPEECH_AUDIO_BYTES } from './speech.constants';
import { SpeechToTextService } from './speech.service';

describe('SpeechToTextService', () => {
  it('rejects decoded audio above 5 MiB before calling an STT provider', async () => {
    const config = {
      get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
    } as unknown as ConfigService;
    const service = new SpeechToTextService(config);
    const oversizedAudio = Buffer.alloc(MAX_SPEECH_AUDIO_BYTES + 1).toString('base64');

    await expect(
      service.transcribe(oversizedAudio, 'en', 'hello'),
    ).rejects.toMatchObject({ status: 413 });
  });
});