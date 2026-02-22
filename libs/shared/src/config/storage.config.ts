import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  endPoint: process.env.S3_ENDPOINT || 'localhost',
  port: Number(process.env.S3_PORT) || 9000,
  useSSL: process.env.S3_USE_SSL === 'true',
  region: process.env.S3_REGION || 'us-east-1',
  accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  tmpCleanupIntervalHours:
    Number(process.env.S3_TMP_CLEANUP_INTERVAL_HOURS) || 24,
  tmpMaxAgeHours: Number(process.env.S3_TMP_MAX_AGE_HOURS) || 24,
}));
