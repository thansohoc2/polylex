import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class R2StorageService implements OnModuleInit {
  private readonly logger = new Logger(R2StorageService.name);
  private client: S3Client | null = null;
  private bucket = '';
  private publicUrl = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const enabled = this.config.get<boolean>('GOOGLE_TTS_ENABLED', false);
    if (!enabled) return;

    try {
      const accountId = (this.config.get<string>('R2_ACCOUNT_ID') ?? '').trim();
      const accessKeyId = (this.config.get<string>('R2_ACCESS_KEY_ID') ?? '').trim();
      const secretAccessKey = (this.config.get<string>('R2_SECRET_ACCESS_KEY') ?? '').trim();
      this.bucket = (this.config.get<string>('R2_BUCKET_NAME') ?? '').trim();
      this.publicUrl = (this.config.get<string>('R2_PUBLIC_URL') ?? '').trim().replace(/\/$/, '');

      if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket || !this.publicUrl) {
        this.logger.warn('R2 config is incomplete, disabling R2 storage');
        this.client = null;
        return;
      }

      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('R2 client initialized');
    } catch (error) {
      this.client = null;
      this.logger.error('Failed to initialize R2 client, R2 storage disabled', error as Error);
    }
  }

  /**
   * Upload MP3 buffer to R2.
   * If the key already exists, skip upload and return the URL directly.
   */
  async upload(key: string, buffer: Buffer): Promise<string> {
    if (!this.client) {
      throw new Error('R2 client not initialized');
    }

    // Check existence to avoid duplicate uploads
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return `${this.publicUrl}/${key}`; // already exists
    } catch {
      // not found → proceed with upload
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return `${this.publicUrl}/${key}`;
  }
}
