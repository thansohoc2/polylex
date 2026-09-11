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

  it('normalizes the language locale and uses the recording MIME encoding for Google STT', async () => {
    const config = {
      get: jest.fn((key: string, defaultValue: unknown) =>
        key === 'GOOGLE_STT_ENABLED' ? true : defaultValue,
      ),
    } as unknown as ConfigService;
    const service = new SpeechToTextService(config);
    const recognize = jest.fn().mockResolvedValue([{ results: [] }]);
    service['googleClient'] = { recognize } as never;

    await service.transcribe(
      Buffer.from('audio').toString('base64'),
      'en',
      'hello',
      'audio/ogg;codecs=opus',
    );

    expect(recognize).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          encoding: 'OGG_OPUS',
          languageCode: 'en-US',
        }),
      }),
    );
  });
});