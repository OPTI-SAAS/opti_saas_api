import {
  CLIENT_TYPES,
  ClientType,
} from '@lib/shared/enums/client/client.client.enum';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

import {
  CreateParticulierClientDto,
  CreateProfessionnelClientDto,
} from '../dto/create-client.dto';

type CreateClientDtoConstructor = ClassConstructor<object>;

const CREATE_CLIENT_DTO_MAP = {
  [CLIENT_TYPES.PARTICULIER]: CreateParticulierClientDto,
  [CLIENT_TYPES.PROFESSIONNEL]: CreateProfessionnelClientDto,
} satisfies Record<ClientType, CreateClientDtoConstructor>;

type CreateClientTypeKey = keyof typeof CREATE_CLIENT_DTO_MAP;

@Injectable()
export class CreateClientValidationPipe implements PipeTransform {
  private readonly dtoMap = CREATE_CLIENT_DTO_MAP;

  transform(value: unknown): object {
    const type = (value as { type?: string })?.type;

    if (!this.isCreateClientTypeKey(type)) {
      throw new BadRequestException(
        `type is required and must be one of: ${Object.keys(this.dtoMap).join(', ')}`,
      );
    }

    const DtoClass = this.dtoMap[type] as CreateClientDtoConstructor;
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

  private isCreateClientTypeKey(
    value: string | undefined,
  ): value is CreateClientTypeKey {
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
