import {
  PRODUCT_PRICING_MODES,
  PRODUCT_TYPES,
  ProductFrameGender,
  ProductGenderValues,
  ProductPricingMode,
  ProductPricingModeValues,
  ProductType,
  ProductTypeValues,
} from '@lib/shared/enums/client/product.client.enum';
import {
  getPricingModeParametersErrorMessage,
  validatePricingModeParameters,
} from '@lib/shared/helpers';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'pricingModeParameters', async: false })
class PricingModeParametersConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as CreateProductBaseDto;

    return validatePricingModeParameters({
      pricingMode: object.pricingMode,
      coefficient: object.coefficient,
      fixedPrice: object.fixedPrice,
      fixedAddedAmount: object.fixedAddedAmount,
    });
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as CreateProductBaseDto;

    return getPricingModeParametersErrorMessage({
      pricingMode: object.pricingMode,
      coefficient: object.coefficient,
      fixedPrice: object.fixedPrice,
      fixedAddedAmount: object.fixedAddedAmount,
    });
  }
}

export class CreateProductBaseDto {
  @ApiProperty({ example: 'PRD-000123' })
  @IsString()
  @IsDefined()
  internalCode!: string;

  @ApiProperty({
    enum: ProductTypeValues,
    example: PRODUCT_TYPES.FRAME,
  })
  @IsEnum(ProductTypeValues)
  @IsString()
  @IsDefined()
  productType!: ProductType;

  @ApiProperty({ example: 'Ray-Ban Round Classic' })
  @IsString()
  @IsDefined()
  designation!: string;

  @ApiProperty({ example: 'Ray-Ban' })
  @IsString()
  @IsDefined()
  brand!: string;

  @ApiProperty({ example: 'RB3447' })
  @IsString()
  @IsDefined()
  model!: string;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    example: ['Optical', 'Premium'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  family?: string[];

  @ApiPropertyOptional({ example: 'Black' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'EXT-REF-9483' })
  @IsString()
  @IsOptional()
  externalReferance?: string;

  // * Pricing columns *

  @ApiProperty({
    enum: ProductPricingModeValues,
    example: PRODUCT_PRICING_MODES.COEFFICIENT,
  })
  @IsString()
  @IsDefined()
  @Validate(PricingModeParametersConstraint)
  pricingMode!: ProductPricingMode;

  @ApiPropertyOptional({ example: 1.35 })
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.COEFFICIENT,
  )
  @IsNumber()
  @IsDefined()
  coefficient?: number; // Used if pricingMode = 'coefficient'

  @ApiPropertyOptional({ example: 129.99 })
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.FIXED_PRICE,
  )
  @IsNumber()
  @IsDefined()
  fixedPrice?: number; // Used if pricingMode = 'fixed-price'

  @ApiPropertyOptional({ example: 25 })
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.FIXED_ADDED_AMOUNT,
  )
  @IsNumber()
  @IsDefined()
  fixedAddedAmount?: number; // Used if pricingMode = 'fixed-added-amount'

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001' })
  @IsString()
  @IsOptional()
  vatId?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  minimumStockAlert?: number;
}

export class CreateFrameProductDto extends OmitType(CreateProductBaseDto, [
  'brand',
  'model',
] as const) {
  @ApiPropertyOptional({ example: 'Tom Ford' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 'FT5860' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ enum: [PRODUCT_TYPES.FRAME], example: PRODUCT_TYPES.FRAME })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.FRAME;

  @ApiProperty({ enum: ProductGenderValues, example: ProductGenderValues[0] })
  @IsString()
  @IsDefined()
  frameGender!: ProductFrameGender;

  @ApiPropertyOptional({ example: 'Round' })
  @IsString()
  @IsOptional()
  frameShape!: string;

  @ApiPropertyOptional({ example: 'Acetate' })
  @IsString()
  @IsOptional()
  frameMaterial!: string;

  @ApiProperty({ example: 'Full-rim' })
  @IsString()
  @IsDefined()
  frameType!: string;

  // charniere
  @ApiProperty({ example: 'Spring hinge' })
  @IsString()
  @IsDefined()
  frameHingeType!: string;

  // Calibre
  @ApiProperty({ example: 52 })
  @IsNumber()
  @IsDefined()
  frameEyeSize!: number;

  // pont
  @ApiProperty({ example: 18 })
  @IsNumber()
  @IsDefined()
  frameBridge!: number;

  // branche
  @ApiProperty({ example: 145 })
  @IsNumber()
  @IsDefined()
  frameTemple!: number;

  // Finition
  @ApiProperty({ example: 'Matte' })
  @IsString()
  @IsDefined()
  frameFinish!: string;
}

export class CreateLensProductDto extends CreateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.LENS], example: PRODUCT_TYPES.LENS })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.LENS;

  @ApiProperty({ example: 'Single vision' })
  @IsString()
  @IsDefined()
  lensType!: string;

  @ApiProperty({ example: 'Polycarbonate' })
  @IsString()
  @IsDefined()
  lensMaterial!: string;

  @ApiProperty({ example: '1.67' })
  @IsString()
  @IsDefined()
  lensRefractiveIndex!: string;

  @ApiProperty({ example: 'Brown' })
  @IsString()
  @IsDefined()
  lensTint!: string;

  @ApiProperty({
    type: String,
    isArray: true,
    example: ['Anti-reflective', 'UV400'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsDefined()
  lensTreatments!: string[];

  @ApiProperty({ example: 'Essilor' })
  @IsString()
  @IsDefined()
  lensFabricant!: string;
}

export class CreateContactLensProductDto extends CreateProductBaseDto {
  @ApiProperty({
    enum: [PRODUCT_TYPES.CONTACT_LENS],
    example: PRODUCT_TYPES.CONTACT_LENS,
  })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.CONTACT_LENS;

  @ApiProperty({ example: 'Soft' })
  @IsString()
  @IsDefined()
  contactLensType!: string;

  @ApiProperty({ example: 'Monthly' })
  @IsString()
  @IsDefined()
  contactLensUsage!: string;

  @ApiProperty({ example: 'CooperVision' })
  @IsString()
  @IsDefined()
  contactLensFabricant!: string;

  @ApiProperty({ example: 8.6 })
  @IsNumber()
  @IsDefined()
  contactLensBaseCurve!: number;

  @ApiProperty({ example: 14.2 })
  @IsNumber()
  @IsDefined()
  contactLensDiameter!: number;

  @ApiPropertyOptional({ example: 6 })
  @IsNumber()
  @IsOptional()
  contactLensQuantityPerBox!: number;
}

export class CreateCliponProductDto extends CreateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.CLIPON], example: PRODUCT_TYPES.CLIPON })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.CLIPON;

  @ApiProperty({ example: 'Polarized clip-on' })
  @IsString()
  @IsDefined()
  cliponType!: string;

  @ApiProperty({
    type: String,
    isArray: true,
    example: ['Anti-scratch', 'Polarized'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsDefined()
  cliponTreatments!: string[];

  @ApiProperty({ example: 'Smoke' })
  @IsString()
  @IsDefined()
  cliponTint!: string;

  @ApiProperty({ example: '52-18' })
  @IsString()
  @IsDefined()
  cliponCompatibleEyeSize!: string;
}

export class CreateAccessoryProductDto extends CreateProductBaseDto {
  @ApiProperty({
    enum: [PRODUCT_TYPES.ACCESSORY],
    example: PRODUCT_TYPES.ACCESSORY,
  })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.ACCESSORY;
}

export type CreateProductDto =
  | CreateFrameProductDto
  | CreateLensProductDto
  | CreateContactLensProductDto
  | CreateCliponProductDto
  | CreateAccessoryProductDto;
