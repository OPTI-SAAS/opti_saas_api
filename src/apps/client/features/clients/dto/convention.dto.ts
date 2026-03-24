import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'endDateAfterStartDate', async: false })
class EndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as ConventionDto;
    if (!obj.endDate || !obj.startDate) return true;
    return new Date(obj.endDate) > new Date(obj.startDate);
  }

  defaultMessage() {
    return 'endDate must be after startDate';
  }
}

export class ConventionDto {
  @ApiProperty({ example: 'CONV-2026-001' })
  @IsString()
  @IsDefined()
  number!: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @Validate(EndDateAfterStartDateConstraint)
  endDate?: Date;

  @ApiProperty({ example: 10.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsDefined()
  discountRate!: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  @IsDefined()
  creditLimit!: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(0)
  @IsDefined()
  paymentDelay!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
