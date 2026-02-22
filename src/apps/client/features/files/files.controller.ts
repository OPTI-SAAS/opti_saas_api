import {
  ApiResponseWithData,
  ClientController,
  JwtAuthGuard,
  TenantApiHeader,
} from '@lib/shared';
import { Body, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PresignedUrlResponseDto, RequestPresignedUploadUrlDto } from './dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@ClientController('files')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('request-upload-url')
  @ApiOperation({ summary: 'Request a presigned URL for uploading a file' })
  @ApiResponseWithData(PresignedUrlResponseDto)
  async requestUploadUrl(
    @Body() dto: RequestPresignedUploadUrlDto,
  ): Promise<PresignedUrlResponseDto> {
    return this.filesService.requestUploadUrl(dto);
  }
}
