import { PartialType } from '@nestjs/swagger';

import { CreateVatDto } from './create-vat.dto';

export class UpdateVatDto extends PartialType(CreateVatDto) {}
