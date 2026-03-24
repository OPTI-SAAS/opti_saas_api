import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDefined, IsEmail, IsString } from 'class-validator';

export class CreateContactInterneDto {
  @ApiProperty({ example: 'Alami' })
  @IsString()
  @IsDefined()
  lastName!: string;

  @ApiProperty({ example: 'Sara' })
  @IsString()
  @IsDefined()
  firstName!: string;

  @ApiProperty({ example: 'Responsable RH' })
  @IsString()
  @IsDefined()
  position!: string;

  @ApiProperty({ example: '0612345678' })
  @IsString()
  @IsDefined()
  phone!: string;

  @ApiProperty({ example: 's.alami@company.ma' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsDefined()
  email!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsDefined()
  isPrincipal!: boolean;
}

export class UpdateContactInterneDto extends PartialType(
  CreateContactInterneDto,
) {}
