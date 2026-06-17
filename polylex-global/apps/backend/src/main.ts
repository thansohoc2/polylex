import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Parse form-data (giữ nguyên)
  app.use(require('express').urlencoded({ extended: true }));

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ CORS chuẩn cho Zalo Mini App
  app.enableCors({
    origin: (origin, cb) => {
      console.log('Origin:', origin);

      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        'https://ebms.store',
        'https://mini.zalo.me',
        'https://h5.zdn.vn',
        'capacitor://localhost',
        'ionic://localhost',
        'http://localhost',
      ];

      // ✅ Zalo / mobile webview thường không có origin
      if (!origin) {
        return cb(null, true);
      }

      // ✅ Allow all Zalo domains (*.zdn.vn, *.zalo.me)
      if (origin.endsWith('.zdn.vn') || origin.endsWith('.zalo.me')) {
        return cb(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      return cb(new Error(`CORS blocked: ${origin}`));
    },

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // ⚠️ QUAN TRỌNG: để false cho Zalo
  });

  // ✅ Swagger
  const config = new DocumentBuilder()
    .setTitle('PolyLex Global API')
    .setDescription('Multilingual vocabulary learning platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  // ── Startup diagnostic log ───────────────────────────────────────────────
  const redisRaw = process.env.REDIS_URL ?? '';
  const redisSafe = redisRaw
    ? redisRaw.replace(/(:)[^@]+(@)/, '$1****$2') // hide password
    : '(not set)';
  console.log(`API running on http://localhost:${port}/api/v1`);
  console.log('[Boot] REDIS_URL      :', redisSafe);
  console.log('[Boot] DATABASE_URL   :', (process.env.DATABASE_URL ?? '(not set)').replace(/(:)[^@]+(@)/, '$1****$2'));
  console.log('[Boot] GOOGLE_TTS_ENABLED:', process.env.GOOGLE_TTS_ENABLED ?? 'false');
  console.log('[Boot] OPENAI_ENABLED :', process.env.OPENAI_ENABLED ?? 'false');
  console.log('[Boot] GEMINI_ENABLED :', process.env.GEMINI_ENABLED ?? 'false');
  console.log('[Boot] NODE_ENV       :', process.env.NODE_ENV ?? 'development');
  // ────────────────────────────────────────────────────────────────────────
}

bootstrap();