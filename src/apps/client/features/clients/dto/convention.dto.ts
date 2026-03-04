import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'dateFinAfterDebut', async: false })
class DateFinAfterDebutConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as ConventionDto;
    if (!obj.dateFin || !obj.dateDebut) return true;
    return new Date(obj.dateFin) > new Date(obj.dateDebut);
  }

  defaultMessage() {
    return 'dateFin must be after dateDebut';
  }
}

export class ConventionDto {
  @ApiProperty({ example: 'CONV-2026-001' })
  @IsString()
  @IsDefined()
  numero!: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateDebut?: Date;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @Validate(DateFinAfterDebutConstraint)
  dateFin?: Date;

  @ApiProperty({ example: 10.0 })
  @IsNumber()
  @Min(0)
  @IsDefined()
  tauxRemise!: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  @IsDefined()
  plafondCredit!: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(0)
  @IsDefined()
  delaiPaiement!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
