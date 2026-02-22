import { TenantRepositoryFactory } from '@lib/shared';
import { ClVat } from '@lib/shared/entities/client/vats.client.entity';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateVatDto, UpdateVatDto } from './dto';

@Injectable()
export class VatsService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async create(createVatDto: CreateVatDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const vatRepo = manager.getRepository(ClVat);
      const vat = vatRepo.create(createVatDto);
      return await vatRepo.save(vat);
    });
  }

  async findAll() {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const vatRepo = manager.getRepository(ClVat);
      return await vatRepo.find({ order: { createdAt: 'DESC' } });
    });
  }

  async findOne(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const vatRepo = manager.getRepository(ClVat);
      const vat = await vatRepo.findOne({ where: { id } });

      if (!vat) {
        throw new NotFoundException(`VAT with id ${id} not found`);
      }

      return vat;
    });
  }

  async update(id: string, updateVatDto: UpdateVatDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const vatRepo = manager.getRepository(ClVat);
      const existing = await vatRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`VAT with id ${id} not found`);
      }

      const updated = vatRepo.merge(existing, updateVatDto);
      return await vatRepo.save(updated);
    });
  }

  async remove(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const vatRepo = manager.getRepository(ClVat);
      const existing = await vatRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`VAT with id ${id} not found`);
      }

      await vatRepo.softDelete(id);
      return { message: `VAT with id ${id} has been deleted` };
    });
  }
}
