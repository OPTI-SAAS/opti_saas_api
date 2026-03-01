import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsDefined, IsUUID } from 'class-validator';

export class MoveStockItemsDto {
  @ApiProperty({
    type: String,
    isArray: true,
    minItems: 1,
    example: [
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000102',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  @IsDefined()
  stockItemIds!: string[];

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000201' })
  @IsUUID()
  @IsDefined()
  destinationWarehouseId!: string;
}
