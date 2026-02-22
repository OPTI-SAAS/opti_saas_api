import { ClientController, JwtAuthGuard, TenantApiHeader } from '@lib/shared';
import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import {
  CreateContactLensProductDto,
  CreateFrameProductDto,
  CreateLensProductDto,
  CreateProductDto,
} from './dto/create-product.dto';
import {
  UpdateContactLensProductDto,
  UpdateFrameProductDto,
  UpdateLensProductDto,
  UpdateProductDto,
} from './dto/update-products.dto';
import {
  CreateProductValidationPipe,
  UpdateProductValidationPipe,
} from './pipes';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiExtraModels(
  CreateFrameProductDto,
  CreateLensProductDto,
  CreateContactLensProductDto,
  UpdateFrameProductDto,
  UpdateLensProductDto,
  UpdateContactLensProductDto,
)
@ClientController('products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateFrameProductDto) },
        { $ref: getSchemaPath(CreateLensProductDto) },
        { $ref: getSchemaPath(CreateContactLensProductDto) },
      ],
    },
  })
  async create(
    @Body(new CreateProductValidationPipe()) createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(UpdateFrameProductDto) },
        { $ref: getSchemaPath(UpdateLensProductDto) },
        { $ref: getSchemaPath(UpdateContactLensProductDto) },
      ],
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new UpdateProductValidationPipe()) updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
