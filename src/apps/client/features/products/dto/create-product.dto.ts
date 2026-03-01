/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  PRODUCT_PRICING_MODES,
  PRODUCT_TYPES,
  ProductFrameGender,
  ProductGenderValues,
  ProductPricingMode,
  ProductPricingModeValues,
  ProductType,
} from '@lib/shared/enums/client/product.client.enum';
import {
  getPricingModeParametersErrorMessage,
  validatePricingModeParameters,
} from '@lib/shared/helpers';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsDefined,
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
  @ApiProperty()
  @IsString()
  @IsDefined()
  internalCode!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  productType!: ProductType;

  @ApiProperty()
  @IsString()
  @IsDefined()
  designation!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  brand!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  model!: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  family?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  externalReferance?: string;

  // * Pricing columns *

  @ApiProperty({ enum: ProductPricingModeValues })
  @IsString()
  @IsDefined()
  @Validate(PricingModeParametersConstraint)
  pricingMode!: ProductPricingMode;

  @ApiPropertyOptional()
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.COEFFICIENT,
  )
  @IsNumber()
  @IsDefined()
  coefficient?: number; // Used if pricingMode = 'coefficient'

  @ApiPropertyOptional()
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.FIXED_PRICE,
  )
  @IsNumber()
  @IsDefined()
  fixedPrice?: number; // Used if pricingMode = 'fixed-price'

  @ApiPropertyOptional()
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.FIXED_ADDED_AMOUNT,
  )
  @IsNumber()
  @IsDefined()
  fixedAddedAmount?: number; // Used if pricingMode = 'fixed-added-amount'

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vatId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minimumStockAlert?: number;
}

export class CreateFrameProductDto extends OmitType(CreateProductBaseDto, [
  'brand',
  'model',
] as const) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ enum: [PRODUCT_TYPES.FRAME] })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.FRAME;

  @ApiProperty({ enum: ProductGenderValues })
  @IsString()
  @IsDefined()
  frameGender!: ProductFrameGender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameShape!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameMaterial!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  frameType!: string;

  // charniere
  @ApiProperty()
  @IsString()
  @IsDefined()
  frameHingeType!: string;

  // Calibre
  @ApiProperty()
  @IsNumber()
  @IsDefined()
  frameEyeSize!: number;

  // pont
  @ApiProperty()
  @IsNumber()
  @IsDefined()
  frameBridge!: number;

  // branche
  @ApiProperty()
  @IsNumber()
  @IsDefined()
  frameTemple!: number;

  // Finition
  @ApiProperty()
  @IsString()
  @IsDefined()
  frameFinish!: string;
}

export class CreateLensProductDto extends CreateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.LENS] })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.LENS;

  @ApiProperty()
  @IsString()
  @IsDefined()
  lensType!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  lensMaterial!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  lensRefractiveIndex!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  lensTint!: string;

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsDefined()
  lensTreatments!: string[];

  @ApiProperty()
  @IsString()
  @IsDefined()
  lensFabricant!: string;
}

export class CreateContactLensProductDto extends CreateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.CONTACT_LENS] })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.CONTACT_LENS;

  @ApiProperty()
  @IsString()
  @IsDefined()
  contactLensType!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  contactLensUsage!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  contactLensFabricant!: string;

  @ApiProperty()
  @IsNumber()
  @IsDefined()
  contactLensBaseCurve!: number;

  @ApiProperty()
  @IsNumber()
  @IsDefined()
  contactLensDiameter!: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  contactLensQuantityPerBox!: number;
}

export class CreateCliponProductDto extends CreateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.CLIPON] })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.CLIPON;

  @ApiProperty()
  @IsString()
  @IsDefined()
  cliponType!: string;

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsDefined()
  cliponTreatments!: string[];

  @ApiProperty()
  @IsString()
  @IsDefined()
  cliponTint!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  cliponCompatibleEyeSize!: string;
}

export type CreateProductDto =
  | CreateFrameProductDto
  | CreateLensProductDto
  | CreateContactLensProductDto
  | CreateCliponProductDto;
