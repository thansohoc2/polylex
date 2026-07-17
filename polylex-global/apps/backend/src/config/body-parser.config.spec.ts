import { INestApplication } from '@nestjs/common';
import express = require('express');
import request = require('supertest');
import {
  configureBodyParsers,
  SPEECH_RECOGNITION_ROUTE,
} from './body-parser.config';

describe('configureBodyParsers', () => {
  function createApp() {
    const app = express();
    configureBodyParsers(app as unknown as INestApplication);
    app.post(SPEECH_RECOGNITION_ROUTE, (req, res) => {
      res.json({ length: req.body.audioBase64.length });
    });
    app.post('/api/v1/regular', (req, res) => {
      res.json({ length: req.body.value.length });
    });
    return app;
  }

  it('accepts speech-recognition JSON above the normal 100kb limit', async () => {
    const audioBase64 = 'A'.repeat(150 * 1024);

    await request(createApp())
      .post(SPEECH_RECOGNITION_ROUTE)
      .send({ audioBase64, languageCode: 'en', targetText: 'hello' })
      .expect(200, { length: audioBase64.length });
  });

  it('keeps the 100kb JSON limit on other API routes', async () => {
    await request(createApp())
      .post('/api/v1/regular')
      .send({ value: 'A'.repeat(150 * 1024) })
      .expect(413);
  });

  it('rejects speech-recognition JSON above its dedicated 7mb limit', async () => {
    await request(createApp())
      .post(SPEECH_RECOGNITION_ROUTE)
      .send({ audioBase64: 'A'.repeat(7 * 1024 * 1024) })
      .expect(413);
  });
});