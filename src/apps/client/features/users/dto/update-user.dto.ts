import { PartialType, PickType } from '@nestjs/swagger';

import { BaseUserFieldsDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  PickType(BaseUserFieldsDto, [
    'firstName',
    'lastName',
    'mobilePhone',
    'mobileCountryCode',
    'agreement',
  ] as const),
) {}
