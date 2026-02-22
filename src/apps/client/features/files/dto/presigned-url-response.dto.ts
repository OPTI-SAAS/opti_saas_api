import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for upload',
    example: 'https://storage:9000/bucket/file?signature=...',
  })
  url!: string;

  @ApiProperty({
    description: 'File key used',
    example: 'tmp/invoice-2024.pdf',
  })
  key!: string;

  @ApiProperty({
    description: 'Expiration time in seconds',
    example: 3600,
  })
  expiresIn!: number;

  @ApiProperty({
    description: 'Unique ID associated with the upload (for tracking purposes)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uniqueId!: string;
}
