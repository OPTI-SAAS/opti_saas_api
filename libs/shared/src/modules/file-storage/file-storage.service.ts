import {
  BucketLocationConstraint,
  CopyObjectCommand,
  CreateBucketCommand,
  CreateBucketCommandInput,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storageConfig } from '@lib/shared/config';
import { BoTenant } from '@lib/shared/entities';
import { ExceptionErrorType } from '@lib/shared/types';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { getBoConnection } from '../database/connection.bo';
import { TenantContext } from '../tenancy/tenant.context';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly client: S3Client;

  constructor(
    @Inject(storageConfig.KEY as string)
    private readonly config: ConfigType<typeof storageConfig>,
    private readonly tenantContext: TenantContext,
  ) {
    const protocol = this.config.useSSL ? 'https' : 'http';
    const endpoint = `${protocol}://${this.config.endPoint}:${this.config.port}`;

    this.client = new S3Client({
      region: this.config.region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
    });
  }

  /**
   * Get tenant bucket name from stored bucketName
   */
  private async getTenantBucketName(tenantId?: string): Promise<string> {
    const resolvedTenantId = tenantId ?? this.tenantContext.getTenantId();
    const boConnection = await getBoConnection();
    const tenantRepository = boConnection.getRepository(BoTenant);
    const tenant = await tenantRepository.findOneBy({ id: resolvedTenantId });

    if (!tenant) {
      throw new NotFoundException({
        error_code: ExceptionErrorType.TenantNotFound,
        message: `Tenant ID ${resolvedTenantId} not found`,
      });
    }

    return String(tenant.bucketName);
  }

  private async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucketName }));
      return true;
    } catch (error: any) {
      const statusCode = error?.$metadata?.httpStatusCode;
      const code = error?.name;

      if (
        statusCode === 404 ||
        code === 'NotFound' ||
        code === 'NoSuchBucket'
      ) {
        return false;
      }

      throw error;
    }
  }

  /**
   * Create a bucket for a tenant
   */
  async createBucket(bucketName: string): Promise<void> {
    try {
      const exists = await this.bucketExists(bucketName);
      if (exists) {
        this.logger.log(`Bucket already exists: ${bucketName}`);
        return;
      }

      const input: CreateBucketCommandInput = { Bucket: bucketName };
      if (this.config.region && this.config.region !== 'us-east-1') {
        input.CreateBucketConfiguration = {
          LocationConstraint: this.config.region as BucketLocationConstraint,
        };
      }

      const command = new CreateBucketCommand(input);
      await this.client.send(command);
      this.logger.log(`Created bucket: ${bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to create bucket ${bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Ensure tenant bucket exists (lazy creation)
   */
  private async ensureTenantBucket(tenantId?: string): Promise<string> {
    const bucketName = await this.getTenantBucketName(tenantId);
    await this.createBucket(bucketName);
    return bucketName;
  }

  /**
   * Get presigned URL for uploading a file
   * @param key - Full file key/path (e.g., "tmp/document.pdf")
   * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
   */
  async getPresignedUploadUrl(
    key: string,
    expiresIn: number = 3600,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const bucketName = await this.ensureTenantBucket();

    try {
      const url = await getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Metadata: metadata,
        }),
        { expiresIn },
      );
      this.logger.log(`Generated upload URL for ${bucketName}/${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate upload URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get presigned URL for downloading a file
   * @param key - Full file key/path
   * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const bucketName = await this.ensureTenantBucket();

    try {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: bucketName, Key: key }),
        { expiresIn },
      );
      this.logger.log(`Generated download URL for ${bucketName}/${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate download URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    const bucketName = await this.ensureTenantBucket();

    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: key }),
      );
      this.logger.log(`Deleted file: ${bucketName}/${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Move a file from one location to another
   */
  async moveFile(sourceKey: string, targetKey: string): Promise<void> {
    const bucketName = await this.ensureTenantBucket();

    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: bucketName,
          Key: targetKey,
          CopySource: `${bucketName}/${sourceKey}`,
        }),
      );

      await this.client.send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: sourceKey }),
      );

      this.logger.log(
        `Moved file from ${sourceKey} to ${targetKey} in bucket ${bucketName}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to move file from ${sourceKey} to ${targetKey}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Clean up old files in tmp directory for a specific bucket
   * @param bucketName - Bucket name to clean
   * @param maxAgeHours - Maximum age of files in hours
   */
  async cleanupOldTmpFiles(
    bucketName: string,
    maxAgeHours?: number,
  ): Promise<void> {
    const maxAge = maxAgeHours ?? this.config.tmpMaxAgeHours;
    const cutoffDate = new Date(Date.now() - maxAge * 60 * 60 * 1000);

    try {
      const exists = await this.bucketExists(bucketName);
      if (!exists) {
        this.logger.warn(
          `Bucket ${bucketName} does not exist, skipping cleanup`,
        );
        return;
      }

      const filesToDelete: string[] = [];
      let continuationToken: string | undefined;

      do {
        const response = await this.client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'tmp/',
            ContinuationToken: continuationToken,
          }),
        );

        for (const obj of response.Contents ?? []) {
          if (obj.LastModified && obj.LastModified < cutoffDate && obj.Key) {
            filesToDelete.push(obj.Key);
          }
        }

        continuationToken = response.IsTruncated
          ? response.NextContinuationToken
          : undefined;
      } while (continuationToken);

      if (filesToDelete.length === 0) {
        this.logger.log(`No old files to clean up in ${bucketName}/tmp/`);
        return;
      }

      const chunkSize = 1000;
      for (let i = 0; i < filesToDelete.length; i += chunkSize) {
        const batch = filesToDelete.slice(i, i + chunkSize);
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: { Objects: batch.map((key) => ({ Key: key })) },
          }),
        );
      }

      this.logger.log(
        `Cleaned up ${filesToDelete.length} old files from ${bucketName}/tmp/`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old files in bucket ${bucketName}:`,
        error,
      );
      // Don't throw - we don't want to break cleanup for other tenants
    }
  }

  /**
   * List all files in a directory
   */
  async listFiles(prefix: string = ''): Promise<string[]> {
    const bucketName = await this.ensureTenantBucket();

    try {
      const files: string[] = [];
      let continuationToken: string | undefined;

      do {
        const response = await this.client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );

        for (const obj of response.Contents ?? []) {
          if (obj.Key) {
            files.push(obj.Key);
          }
        }

        continuationToken = response.IsTruncated
          ? response.NextContinuationToken
          : undefined;
      } while (continuationToken);

      return files;
    } catch (error) {
      this.logger.error(`Failed to list files with prefix ${prefix}:`, error);
      throw error;
    }
  }
}
