import { TenantRepositoryFactory } from '@lib/shared';
import { ClStockItem } from '@lib/shared/entities/client/stock-items.client.entity';
import { ClWarehouse } from '@lib/shared/entities/client/warehouses.client.entity';
import { STOCK_ITEM_STATUSES } from '@lib/shared/enums/client/stock.client.enum';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';

import { CreateWarehouseDto } from './dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async createWarehouse(createWarehouseDto: CreateWarehouseDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const warehouseRepo = manager.getRepository(ClWarehouse);
      const warehouse = warehouseRepo.create(createWarehouseDto);
      return await warehouseRepo.save(warehouse);
    });
  }

  async getAllWarehouses() {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const warehouseRepo = manager.getRepository(ClWarehouse);
      return await warehouseRepo.find();
    });
  }

  async deactivateWarehouse(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const warehouseRepo = manager.getRepository(ClWarehouse);
      const stockItemRepo = manager.getRepository(ClStockItem);

      const warehouse = await warehouseRepo.findOne({ where: { id } });
      if (!warehouse) {
        throw new NotFoundException(`Warehouse with id ${id} not found`);
      }

      const blockingCount = await stockItemRepo.count({
        where: {
          warehouseId: id,
          status: In([
            STOCK_ITEM_STATUSES.ACTIVE,
            STOCK_ITEM_STATUSES.RESERVED,
          ]),
        },
      });

      if (blockingCount > 0) {
        throw new ConflictException(
          `Warehouse with id ${id} cannot be deactivated because active or reserved stock items exist`,
        );
      }

      warehouse.active = false;
      return await warehouseRepo.save(warehouse);
    });
  }
}
