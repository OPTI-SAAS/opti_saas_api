import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNumber, IsString, Min } from 'class-validator';

export class CreateVatDto {
  @ApiProperty({ example: 'Standard VAT' })
  @IsString()
  @IsDefined()
  name!: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  @IsDefined()
  rate!: number;
}
