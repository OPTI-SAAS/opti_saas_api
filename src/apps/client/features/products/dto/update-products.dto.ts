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

@ValidatorConstraint({ name: 'pricingModeParametersUpdate', async: false })
class PricingModeParametersUpdateConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as UpdateProductBaseDto;

    return validatePricingModeParameters(
      {
        pricingMode: object.pricingMode,
        coefficient: object.coefficient,
        fixedPrice: object.fixedPrice,
        fixedAddedAmount: object.fixedAddedAmount,
      },
      { allowMissingPricingMode: true },
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as UpdateProductBaseDto;

    return getPricingModeParametersErrorMessage(
      {
        pricingMode: object.pricingMode,
        coefficient: object.coefficient,
        fixedPrice: object.fixedPrice,
        fixedAddedAmount: object.fixedAddedAmount,
      },
      { allowMissingPricingMode: true },
    );
  }
}

export class UpdateProductBaseDto {
  @ApiProperty({ enum: ProductTypeValues })
  @IsEnum(ProductTypeValues)
  @IsString()
  @IsDefined()
  productType!: ProductType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

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

  @ApiPropertyOptional({ enum: ProductPricingModeValues })
  @IsString()
  @IsOptional()
  @Validate(PricingModeParametersUpdateConstraint)
  pricingMode?: ProductPricingMode;

  @ApiPropertyOptional()
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.COEFFICIENT,
  )
  @IsNumber()
  @IsOptional()
  coefficient?: number;

  @ApiPropertyOptional()
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.FIXED_PRICE,
  )
  @IsNumber()
  @IsOptional()
  fixedPrice?: number;

  @ApiPropertyOptional()
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.FIXED_ADDED_AMOUNT,
  )
  @IsNumber()
  @IsOptional()
  fixedAddedAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vatId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minimumStockAlert?: number;
}

export class UpdateFrameProductDto extends OmitType(UpdateProductBaseDto, [
  'brand',
  'model',
] as const) {
  @ApiProperty({ enum: [PRODUCT_TYPES.FRAME] })
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.FRAME;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ enum: ProductGenderValues })
  @IsString()
  @IsOptional()
  frameGender?: ProductFrameGender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameShape?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameMaterial?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameHingeType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  frameEyeSize?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  frameBridge?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  frameTemple?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameFinish?: string;
}

export class UpdateLensProductDto extends UpdateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.LENS] })
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.LENS;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensMaterial?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensRefractiveIndex?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensTint?: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lensTreatments?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensFabricant?: string;
}

export class UpdateContactLensProductDto extends UpdateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.CONTACT_LENS] })
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.CONTACT_LENS;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactLensType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactLensUsage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactLensFabricant?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  contactLensBaseCurve?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  contactLensDiameter?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  contactLensQuantityPerBox?: number;
}

export class UpdateCliponProductDto extends UpdateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.CLIPON] })
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.CLIPON;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cliponType?: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cliponTreatments?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cliponTint?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cliponCompatibleEyeSize?: string;
}

export class UpdateAccessoryProductDto extends UpdateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.ACCESSORY] })
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.ACCESSORY;
}

export type UpdateProductDto =
  | UpdateFrameProductDto
  | UpdateLensProductDto
  | UpdateContactLensProductDto
  | UpdateCliponProductDto;
