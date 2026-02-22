import { FileStorageService } from '@lib/shared';
import { Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';

import { PresignedUrlResponseDto, RequestPresignedUploadUrlDto } from './dto';

@Injectable()
export class FilesService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  /**
   * Request a presigned URL for uploading a file
   */
  async requestUploadUrl(
    dto: RequestPresignedUploadUrlDto,
  ): Promise<PresignedUrlResponseDto> {
    const expiresIn = 3600;
    const uniqueId = uuidV4();
    const url = await this.fileStorageService.getPresignedUploadUrl(
      dto.key,
      expiresIn,
      { uniqueId },
    );

    return {
      url,
      key: dto.key,
      expiresIn,
      uniqueId,
    };
  }
}
