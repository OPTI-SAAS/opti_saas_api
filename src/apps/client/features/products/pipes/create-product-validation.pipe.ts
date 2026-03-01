import {
  PRODUCT_TYPES,
  ProductType,
} from '@lib/shared/enums/client/product.client.enum';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

import {
  CreateAccessoryProductDto,
  CreateCliponProductDto,
  CreateContactLensProductDto,
  CreateFrameProductDto,
  CreateLensProductDto,
} from '../dto/create-product.dto';

type CreateProductDtoConstructor = ClassConstructor<object>;

const CREATE_PRODUCT_DTO_MAP = {
  [PRODUCT_TYPES.FRAME]: CreateFrameProductDto,
  [PRODUCT_TYPES.LENS]: CreateLensProductDto,
  [PRODUCT_TYPES.CONTACT_LENS]: CreateContactLensProductDto,
  [PRODUCT_TYPES.CLIPON]: CreateCliponProductDto,
  [PRODUCT_TYPES.ACCESSORY]: CreateAccessoryProductDto,
} satisfies Record<ProductType, CreateProductDtoConstructor>;

type CreateProductTypeKey = keyof typeof CREATE_PRODUCT_DTO_MAP;

@Injectable()
export class CreateProductValidationPipe implements PipeTransform {
  private readonly dtoMap = CREATE_PRODUCT_DTO_MAP;

  transform(value: unknown): object {
    const productType = (value as { productType?: string })?.productType;

    if (!this.isCreateProductTypeKey(productType)) {
      throw new BadRequestException(
        `productType is required and must be one of: ${Object.keys(this.dtoMap).join(', ')}`,
      );
    }

    const DtoClass = this.dtoMap[productType] as CreateProductDtoConstructor;
    const dto = plainToInstance(DtoClass, (value as object) ?? {});
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(this.formatValidationErrors(errors));
    }

    return dto;
  }

  private isCreateProductTypeKey(
    value: string | undefined,
  ): value is CreateProductTypeKey {
    return !!value && value in this.dtoMap;
  }

  private formatValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    const traverse = (validationErrors: ValidationError[], parent = '') => {
      for (const error of validationErrors) {
        const propertyPath = parent
          ? `${parent}.${error.property}`
          : error.property;

        if (error.constraints) {
          messages.push(...Object.values(error.constraints));
        }

        if (error.children?.length) {
          traverse(error.children, propertyPath);
        }
      }
    };

    traverse(errors);
    return messages;
  }
}
