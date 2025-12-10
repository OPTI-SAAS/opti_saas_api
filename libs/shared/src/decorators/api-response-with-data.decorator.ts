import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { SwaggerApiBaseResponseDto } from '../dto';

type TApiResponseOptions = {
  status?: number;
  message?: string;
  isArray?: boolean;
};

export const ApiResponseWithData = <TModel extends Type<unknown>>(
  model: TModel,
  options: TApiResponseOptions = {},
) => {
  const { status = 200, message = 'Success', isArray = false } = options;
  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(SwaggerApiBaseResponseDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(SwaggerApiBaseResponseDto) },
          {
            properties: {
              status: { example: status },
              message: { example: message },
              data: dataSchema,
            },
          },
        ],
      },
    }),
  );
};
