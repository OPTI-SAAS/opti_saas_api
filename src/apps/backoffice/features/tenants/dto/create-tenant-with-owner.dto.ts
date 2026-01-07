import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Name of the tenant',
    example: 'Acme Corporation',
    type: String,
  })
  @IsString()
  @Length(1, 63)
  @Matches(/^[^\d][\p{L}\p{N}\s_-]*$/u, {
    message:
      'Tenant name must not start with a number and may contain letters, numbers, spaces, hyphens, and underscores',
  })
  @Matches(/^(?!.*[ßæœøðđłþıĳĲ]).*$/u, {
    message:
      'Tenant name contains unsupported letters (like œ, æ, ø, ß, etc.). Use their plain equivalents (oe, ae, o, ss...).',
  })
  @IsDefined()
  tenantName!: string;
}

export class CreateTenantWithOwnerDto extends CreateTenantDto {
  @ApiProperty({
    description: "Owner's first name",
    example: 'John',
    type: String,
  })
  @IsString()
  @IsDefined()
  firstName!: string;

  @ApiProperty({
    description: "Owner's last name",
    example: 'Doe',
    type: String,
  })
  @IsString()
  @IsDefined()
  lastName!: string;

  @ApiProperty({
    description: "Owner's email address",
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  @IsString()
  @IsDefined()
  email!: string;

  @ApiProperty({
    description: "Owner's password",
    example: 'StrongPassword123!',
    type: String,
  })
  @IsStrongPassword()
  @IsString()
  @IsDefined()
  password!: string;

  @ApiProperty({
    description: "Admin user's email address",
    example: 'john.admin@example.com',
    type: String,
  })
  @IsEmail()
  @IsString()
  @IsDefined()
  adminEmail!: string;

  @ApiProperty({
    description: "Admin user's password",
    example: 'StrongPassword123!',
    type: String,
  })
  @IsStrongPassword()
  @IsString()
  @IsDefined()
  adminPassword!: string;
}
