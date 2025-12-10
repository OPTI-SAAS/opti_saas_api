import { ApiProperty } from '@nestjs/swagger';

export class SwaggerApiBaseResponseDto<T> {
  @ApiProperty({ example: 200 })
  status!: number;

  @ApiProperty({ example: 'Success' })
  message!: string;

  @ApiProperty({ type: Object })
  data!: T;
}
