import {
  PRODUCT_TYPES,
  ProductType,
} from '@lib/shared/enums/client/product.client.enum';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

import {
  UpdateAccessoryProductDto,
  UpdateCliponProductDto,
  UpdateContactLensProductDto,
  UpdateFrameProductDto,
  UpdateLensProductDto,
  UpdateProductBaseDto,
} from '../dto/update-products.dto';

type UpdateProductDtoConstructor = ClassConstructor<object>;

const UPDATE_PRODUCT_DTO_MAP = {
  [PRODUCT_TYPES.FRAME]: UpdateFrameProductDto,
  [PRODUCT_TYPES.LENS]: UpdateLensProductDto,
  [PRODUCT_TYPES.CONTACT_LENS]: UpdateContactLensProductDto,
  [PRODUCT_TYPES.CLIPON]: UpdateCliponProductDto,
  [PRODUCT_TYPES.ACCESSORY]: UpdateAccessoryProductDto,
} satisfies Record<ProductType, UpdateProductDtoConstructor>;

type UpdateProductTypeKey = keyof typeof UPDATE_PRODUCT_DTO_MAP;

@Injectable()
export class UpdateProductValidationPipe implements PipeTransform {
  private readonly dtoMap = UPDATE_PRODUCT_DTO_MAP;

  private readonly fallbackDtos: UpdateProductDtoConstructor[] = [
    UpdateFrameProductDto,
    UpdateLensProductDto,
    UpdateContactLensProductDto,
    UpdateCliponProductDto,
    UpdateProductBaseDto,
  ];

  transform(value: unknown): object {
    const productType = (value as { productType?: string })?.productType;

    if (this.isUpdateProductTypeKey(productType)) {
      return this.validateWith(this.dtoMap[productType], value);
    }

    for (const DtoClass of this.fallbackDtos) {
      const result = this.tryValidate(DtoClass, value);
      if (!result.errors.length) {
        return result.dto;
      }
    }

    throw new BadRequestException('Invalid product update payload');
  }

  private isUpdateProductTypeKey(
    value: string | undefined,
  ): value is UpdateProductTypeKey {
    return !!value && value in this.dtoMap;
  }

  private validateWith(DtoClass: UpdateProductDtoConstructor, value: unknown) {
    const { dto, errors } = this.tryValidate(DtoClass, value);
    if (errors.length > 0) {
      throw new BadRequestException(this.formatValidationErrors(errors));
    }
    return dto;
  }

  private tryValidate(DtoClass: UpdateProductDtoConstructor, value: unknown) {
    const dto = plainToInstance(DtoClass, (value as object) ?? {});
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: true,
    });

    return { dto, errors };
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
