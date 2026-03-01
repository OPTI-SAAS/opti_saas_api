import { TenantRepositoryFactory } from '@lib/shared';
import { ClProduct } from '@lib/shared/entities/client/products.client.entity';
import { ClStockItem } from '@lib/shared/entities/client/stock-items.client.entity';
import { ClVat } from '@lib/shared/entities/client/vats.client.entity';
import { STOCK_ITEM_STATUSES } from '@lib/shared/enums/client/stock.client.enum';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  private async ensureRelationsExist(
    manager: EntityManager,
    dto: { vatId?: string },
  ) {
    const vatRepo = manager.getRepository(ClVat);

    if (dto.vatId) {
      const vat = await vatRepo.findOne({ where: { id: dto.vatId } });
      if (!vat) {
        throw new NotFoundException(`VAT with id ${dto.vatId} not found`);
      }
    }
  }

  private toEntityPayload(dto: CreateProductDto | UpdateProductDto) {
    return dto;
  }

  async create(createProductDto: CreateProductDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      await this.ensureRelationsExist(manager, createProductDto);

      const productRepo = manager.getRepository(ClProduct);
      const product = productRepo.create(
        this.toEntityPayload(createProductDto),
      );

      return await productRepo.save(product);
    });
  }

  async findAll() {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const productRepo = manager.getRepository(ClProduct);
      return await productRepo.find({
        relations: [
          'vat',
          'mainPicture',
          'productSuppliers',
          'productSuppliers.supplier',
        ],
        order: { createdAt: 'DESC' },
      });
    });
  }

  async findOne(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const productRepo = manager.getRepository(ClProduct);
      const product = await productRepo.findOne({
        where: { id },
        relations: [
          'vat',
          'productPhoto',
          'productSuppliers',
          'productSuppliers.supplier',
        ],
      });

      if (!product) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      return product;
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const productRepo = manager.getRepository(ClProduct);
      const existing = await productRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      await this.ensureRelationsExist(manager, {
        vatId: updateProductDto.vatId,
      });

      const merged = productRepo.merge(
        existing,
        this.toEntityPayload(updateProductDto),
      );
      return await productRepo.save(merged);
    });
  }

  async remove(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const productRepo = manager.getRepository(ClProduct);
      const stockItemRepo = manager.getRepository(ClStockItem);
      const existing = await productRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      const blockingCount = await stockItemRepo.count({
        where: {
          productId: id,
          status: In([
            STOCK_ITEM_STATUSES.ACTIVE,
            STOCK_ITEM_STATUSES.RESERVED,
          ]),
        },
      });

      if (blockingCount > 0) {
        throw new ConflictException(
          `Product with id ${id} cannot be deleted because active or reserved stock items exist`,
        );
      }

      await productRepo.softDelete(id);
      return { message: `Product with id ${id} has been deleted` };
    });
  }
}
