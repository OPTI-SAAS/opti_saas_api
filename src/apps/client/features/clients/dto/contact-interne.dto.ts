import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDefined, IsString } from 'class-validator';

export class CreateContactInterneDto {
  @ApiProperty({ example: 'Alami' })
  @IsString()
  @IsDefined()
  nom!: string;

  @ApiProperty({ example: 'Sara' })
  @IsString()
  @IsDefined()
  prenom!: string;

  @ApiProperty({ example: 'Responsable RH' })
  @IsString()
  @IsDefined()
  fonction!: string;

  @ApiProperty({ example: '0612345678' })
  @IsString()
  @IsDefined()
  telephone!: string;

  @ApiProperty({ example: 's.alami@company.ma' })
  @IsString()
  @IsDefined()
  email!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsDefined()
  principal!: boolean;
}

export class UpdateContactInterneDto extends PartialType(
  CreateContactInterneDto,
) {}
