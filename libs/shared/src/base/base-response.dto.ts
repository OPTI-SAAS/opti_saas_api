import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseResponseDto {
  @ApiProperty({ example: '9542089b-6e3f-41dd-b389-f7e110366dd4' })
  id!: string;

  @ApiProperty({ example: '2025-0&-01T12:00:00.216Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T14:00:00.216Z' })
  updatedAt!: Date;

  @ApiProperty({ nullable: true, example: null })
  deletedAt?: Date | null;
}
