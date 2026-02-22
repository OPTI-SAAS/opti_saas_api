import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestPresignedUploadUrlDto {
  @ApiProperty({
    description: 'File key/path in the bucket (e.g., "tmp/document.pdf")',
    example: 'tmp/invoice-2024.pdf',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;
}
