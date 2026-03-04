import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ActivateUserDto {
  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description:
      'Set to true to activate the user, false to deactivate (set status to inactive)',
    example: true,
  })
  active!: boolean;
}
