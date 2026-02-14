import { TenantRepositoryFactory } from '@lib/shared';
import { ClWarehouse } from '@lib/shared/entities/client/warehouses.client.entity';
import { Injectable } from '@nestjs/common';

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
}
