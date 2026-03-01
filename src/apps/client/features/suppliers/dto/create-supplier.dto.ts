import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Essilor Luxottica' })
  @IsString()
  @IsDefined()
  name!: string;

  @ApiProperty({ required: false, example: 'Main lens supplier' })
  @IsString()
  @IsOptional()
  description?: string;
}
