import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
        JWT_DEMO_EXPIRES_IN: Joi.string().default('7d'),
        GEMINI_ENABLED: Joi.boolean().default(false),
        GEMINI_API_KEY: Joi.string().allow('').optional(),
        GOOGLE_TTS_ENABLED: Joi.boolean().default(false),
        GOOGLE_TTS_CREDENTIALS: Joi.string().allow('').optional(),
        R2_ACCOUNT_ID: Joi.string().allow('').optional(),
        R2_ACCESS_KEY_ID: Joi.string().allow('').optional(),
        R2_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
        R2_BUCKET_NAME: Joi.string().allow('').optional(),
        R2_PUBLIC_URL: Joi.string().allow('').optional(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        OTA_CURRENT_VERSION: Joi.string().default('0.0.0+dev'),
        OTA_BUNDLE_URL: Joi.string().uri().allow('').optional(),
        GOOGLE_CLIENT_ID_WEB: Joi.string().allow('').optional(),
        GOOGLE_CLIENT_ID_IOS: Joi.string().allow('').optional(),
        GOOGLE_CLIENT_ID_ANDROID: Joi.string().allow('').optional(),
        FACEBOOK_APP_ID: Joi.string().allow('').optional(),
        FACEBOOK_APP_SECRET: Joi.string().allow('').optional(),
        ZALO_APP_ID: Joi.string().allow('').optional(),
        ZALO_APP_SECRET: Joi.string().allow('').optional(),
      }),
    }),
  ],
})
export class ConfigModule {}

export interface AppConfig {
  databaseUrl: string;
  redisUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  openai: {
    enabled: boolean;
    apiKey: string;
  };
  port: number;
  nodeEnv: string;
}
