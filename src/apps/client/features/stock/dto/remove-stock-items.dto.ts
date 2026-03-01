import {
  StockRemovalReason,
  StockRemovalReasonValues,
} from '@lib/shared/enums/client/stock.client.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsEnum,
  IsUUID,
} from 'class-validator';

export class RemoveStockItemsDto {
  @ApiProperty({
    type: String,
    isArray: true,
    minItems: 1,
    example: [
      '00000000-0000-0000-0000-000000000301',
      '00000000-0000-0000-0000-000000000302',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  @IsDefined()
  stockItemIds!: string[];

  @ApiProperty({
    enum: StockRemovalReasonValues,
    example: StockRemovalReasonValues[0],
  })
  @IsEnum(StockRemovalReasonValues)
  @IsDefined()
  reason!: StockRemovalReason;
}
