import { BoCreateUserDto } from '@lib/shared/dto/bo/create-user.bo.dto';
import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(BoCreateUserDto, ['email']),
) {
  /**
   * Current password is required when updating password.
   * This ensures the user knows their current password before changing it.
   */
  @ValidateIf((o: UpdateUserDto) => o.password !== undefined)
  @IsNotEmpty({
    message: 'Current password is required when changing password',
  })
  @IsString()
  @ApiPropertyOptional({
    description: 'Current password (required when updating password)',
    example: 'OldPassword123',
  })
  currentPassword?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({
    description:
      'Array of Tenant IDs to assign the user to (replaces existing assignments)',
    example: ['9c5802c1-03f4-45ff-8ab6-094ed391ac95'],
    type: [String],
  })
  tenantIds?: string[];
}
