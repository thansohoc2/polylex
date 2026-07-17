import { INestApplication } from '@nestjs/common';
import { json, urlencoded } from 'express';

export const DEFAULT_BODY_LIMIT = '100kb';
export const SPEECH_RECOGNITION_BODY_LIMIT = '7mb';
export const SPEECH_RECOGNITION_ROUTE = '/api/v1/vocabulary/speech-recognize';

/**
 * Keep the framework's default body limit for normal API traffic while allowing
 * the base64 overhead of a bounded audio recording on the STT endpoint.
 */
export function configureBodyParsers(app: INestApplication): void {
  app.use(
    SPEECH_RECOGNITION_ROUTE,
    json({ limit: SPEECH_RECOGNITION_BODY_LIMIT }),
  );
  app.use(json({ limit: DEFAULT_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: DEFAULT_BODY_LIMIT }));
}