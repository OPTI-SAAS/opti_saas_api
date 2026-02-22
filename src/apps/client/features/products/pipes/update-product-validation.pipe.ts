import { PRODUCT_TYPES } from '@lib/shared/enums/client/product.client.enum';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

import {
  UpdateContactLensProductDto,
  UpdateFrameProductDto,
  UpdateLensProductDto,
  UpdateProductBaseDto,
} from '../dto/update-products.dto';

type UpdateProductTypeKey =
  | typeof PRODUCT_TYPES.FRAME
  | typeof PRODUCT_TYPES.LENS
  | typeof PRODUCT_TYPES.CONTACT_LENS;

type UpdateProductDtoConstructor = ClassConstructor<object>;

@Injectable()
export class UpdateProductValidationPipe implements PipeTransform {
  private readonly dtoMap: Record<
    UpdateProductTypeKey,
    UpdateProductDtoConstructor
  > = {
    [PRODUCT_TYPES.FRAME]: UpdateFrameProductDto,
    [PRODUCT_TYPES.LENS]: UpdateLensProductDto,
    [PRODUCT_TYPES.CONTACT_LENS]: UpdateContactLensProductDto,
  };

  private readonly fallbackDtos: UpdateProductDtoConstructor[] = [
    UpdateFrameProductDto,
    UpdateLensProductDto,
    UpdateContactLensProductDto,
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
    return (
      value === PRODUCT_TYPES.FRAME ||
      value === PRODUCT_TYPES.LENS ||
      value === PRODUCT_TYPES.CONTACT_LENS
    );
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
