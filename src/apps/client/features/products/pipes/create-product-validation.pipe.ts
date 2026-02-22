import {
  PRODUCT_TYPES,
  ProductValues,
} from '@lib/shared/enums/client/product.client.enum';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

import {
  CreateContactLensProductDto,
  CreateFrameProductDto,
  CreateLensProductDto,
} from '../dto/create-product.dto';

type CreateProductTypeKey =
  | typeof PRODUCT_TYPES.FRAME
  | typeof PRODUCT_TYPES.LENS
  | typeof PRODUCT_TYPES.CONTACT_LENS;

type CreateProductDtoConstructor = ClassConstructor<object>;

@Injectable()
export class CreateProductValidationPipe implements PipeTransform {
  private readonly dtoMap: Record<
    CreateProductTypeKey,
    CreateProductDtoConstructor
  > = {
    [PRODUCT_TYPES.FRAME]: CreateFrameProductDto,
    [PRODUCT_TYPES.LENS]: CreateLensProductDto,
    [PRODUCT_TYPES.CONTACT_LENS]: CreateContactLensProductDto,
  };

  transform(value: unknown): object {
    const productType = (value as { productType?: string })?.productType;

    if (!this.isCreateProductTypeKey(productType)) {
      throw new BadRequestException(
        `productType is required and must be one of: ${ProductValues.join(', ')}`,
      );
    }

    const DtoClass = this.dtoMap[productType];
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
    return ProductValues.includes(value as CreateProductTypeKey);
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
