import {
  PRODUCT_STATUS,
  PRODUCT_TYPES,
  ProductStatus,
} from '@lib/shared/enums/client/product.client.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductBaseDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  internalCode!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  designation!: string;

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

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsDefined()
  purchasePriceHT!: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  coefficient?: number;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  vatId?: string;

  @ApiProperty({ enum: Object.values(PRODUCT_STATUS) })
  @IsEnum(Object.values(PRODUCT_STATUS))
  @IsDefined()
  status!: ProductStatus;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  productPhotoId?: string;
}

export class CreateFrameProductDto extends CreateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.FRAME] })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.FRAME;

  @ApiProperty()
  @IsString()
  @IsDefined()
  frameCategory!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  framegender?: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  frameshape!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  framematerial!: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  frameType!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameHingeType?: string;

  @ApiProperty()
  @IsNumber()
  @IsDefined()
  frameEyeSize!: number;

  @ApiProperty()
  @IsNumber()
  @IsDefined()
  frameBridge!: number;

  @ApiProperty()
  @IsNumber()
  @IsDefined()
  frameTemple!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameColor?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frameTempleColor?: string;
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
  framematerial!: string;

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

export type CreateProductDto =
  | CreateFrameProductDto
  | CreateLensProductDto
  | CreateContactLensProductDto;
