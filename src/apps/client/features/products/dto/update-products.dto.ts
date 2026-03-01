/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  PRODUCT_PRICING_MODES,
  PRODUCT_STATUS,
  PRODUCT_TYPES,
  ProductPricingMode,
  ProductPricingModeValues,
  ProductStatus,
} from '@lib/shared/enums/client/product.client.enum';
import {
  getPricingModeParametersErrorMessage,
  validatePricingModeParameters,
} from '@lib/shared/helpers';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
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
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierReference?: string;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  familyId?: string;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  subFamilyId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  alertThreshold?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  purchasePriceHT?: number;

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
  @Min(0)
  @IsOptional()
  coefficient?: number;

  @ApiPropertyOptional()
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.FIXED_PRICE,
  )
  @IsNumber()
  @Min(0)
  @IsOptional()
  fixedPrice?: number;

  @ApiPropertyOptional()
  @ValidateIf(
    (object) => object.pricingMode === PRODUCT_PRICING_MODES.FIXED_ADDED_AMOUNT,
  )
  @IsNumber()
  @Min(0)
  @IsOptional()
  fixedAddedAmount?: number;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  vatId?: string;

  @ApiPropertyOptional({ enum: Object.values(PRODUCT_STATUS) })
  @IsEnum(Object.values(PRODUCT_STATUS))
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  productPhotoId?: string;
}

export class UpdateFrameProductDto extends UpdateProductBaseDto {
  @ApiPropertyOptional({ enum: [PRODUCT_TYPES.FRAME] })
  @IsOptional()
  productType?: 'frame';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameCategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  framegender?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameshape?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  framematerial?: string;

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
  frameColor?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameTempleColor?: string;
}

export class UpdateLensProductDto extends UpdateProductBaseDto {
  @ApiPropertyOptional({ enum: [PRODUCT_TYPES.LENS] })
  @IsOptional()
  productType?: 'lens';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  framematerial?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensRefractiveIndex?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensTint?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lensFilters?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lensTreatments?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lensSpherePower?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lensCylinderPower?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lensAxis?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lensAddition?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lensDiameter?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lensBaseCurve?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lensCurvature?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lensOpticalFamily?: string;
}

export class UpdateContactLensProductDto extends UpdateProductBaseDto {
  @ApiPropertyOptional({ enum: [PRODUCT_TYPES.CONTACT_LENS] })
  @IsOptional()
  productType?: 'contact_lens';

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
  contactLensCommercialModel?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  contactLensCylinder?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactLensBatchNumber?: string;
}

export type UpdateProductDto =
  | UpdateFrameProductDto
  | UpdateLensProductDto
  | UpdateContactLensProductDto;
