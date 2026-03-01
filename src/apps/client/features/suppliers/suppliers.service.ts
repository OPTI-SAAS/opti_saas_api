import { TenantRepositoryFactory } from '@lib/shared';
import { ClSupplier } from '@lib/shared/entities/client/suppliers.client.entity';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async create(createSupplierDto: CreateSupplierDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const supplierRepo = manager.getRepository(ClSupplier);
      const supplier = supplierRepo.create(createSupplierDto);
      return await supplierRepo.save(supplier);
    });
  }

  async findAll() {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const supplierRepo = manager.getRepository(ClSupplier);
      return await supplierRepo.find({ order: { createdAt: 'DESC' } });
    });
  }

  async findOne(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const supplierRepo = manager.getRepository(ClSupplier);
      const supplier = await supplierRepo.findOne({ where: { id } });

      if (!supplier) {
        throw new NotFoundException(`Supplier with id ${id} not found`);
      }

      return supplier;
    });
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const supplierRepo = manager.getRepository(ClSupplier);
      const existing = await supplierRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Supplier with id ${id} not found`);
      }

      const updated = supplierRepo.merge(existing, updateSupplierDto);
      return await supplierRepo.save(updated);
    });
  }

  async remove(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const supplierRepo = manager.getRepository(ClSupplier);
      const existing = await supplierRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Supplier with id ${id} not found`);
      }

      await supplierRepo.softDelete(id);
      return { message: `Supplier with id ${id} has been deleted` };
    });
  }
}
