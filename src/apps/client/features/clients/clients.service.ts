import { TenantRepositoryFactory } from '@lib/shared';
import { ClClient } from '@lib/shared/entities/client/clients.client.entity';
import { ClContactInterne } from '@lib/shared/entities/client/contacts-internes.client.entity';
import { ClConvention } from '@lib/shared/entities/client/conventions.client.entity';
import { ClFamilyGroup } from '@lib/shared/entities/client/family-groups.client.entity';
import {
  CLIENT_TYPES,
  isClientProfessionnel,
} from '@lib/shared/enums/client/client.client.enum';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateContactInterneDto,
  UpdateContactInterneDto,
} from './dto/contact-interne.dto';
import { ConventionDto } from './dto/convention.dto';
import { CreateClientDto } from './dto/create-client.dto';
import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
} from './dto/family-group.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  // ───────── US1/US2/US3: Create Client ─────────

  async createClient(dto: CreateClientDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);

      // Sponsor existence check
      if (dto.sponsorId) {
        const sponsor = await clientRepo.findOne({
          where: { id: dto.sponsorId },
        });
        if (!sponsor) {
          throw new NotFoundException(
            `Sponsor with id ${dto.sponsorId} not found`,
          );
        }
      }

      // ICE uniqueness check for professionnel
      if (dto.type === CLIENT_TYPES.PROFESSIONNEL && dto.ice) {
        const existing = await clientRepo.findOne({
          where: { ice: dto.ice },
        });
        if (existing) {
          throw new ConflictException(
            `A client with ICE ${dto.ice} already exists`,
          );
        }
      }

      // Default medical record for particulier
      const clientData: Partial<ClClient> = {
        ...dto,
        birthDate: dto.birthDate
          ? dto.birthDate.toISOString().split('T')[0]
          : undefined,
        medicalRecord:
          dto.type === CLIENT_TYPES.PARTICULIER
            ? (dto.medicalRecord ?? {})
            : {},
      };

      const client = clientRepo.create(clientData);
      return await clientRepo.save(client);
    });
  }

  // ───────── US1: Get Client By ID ─────────

  async getClientById(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const client = await clientRepo.findOne({
        where: { id },
        relations: ['convention', 'contactsInternes', 'familyGroup'],
      });

      if (!client) {
        throw new NotFoundException(`Client with id ${id} not found`);
      }

      return client;
    });
  }

  // ───────── US6: List Clients ─────────

  async listClients(query: QueryClientsDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const qb = clientRepo.createQueryBuilder('client');

      // Active filter (default: true)
      if (query.active !== undefined) {
        qb.andWhere('client.active = :active', { active: query.active });
      }

      // Type filter
      if (query.type) {
        qb.andWhere('client.type = :type', { type: query.type });
      }

      // Search filter (ILIKE on last_name, first_name, company_name)
      if (query.search) {
        qb.andWhere(
          '(client.last_name ILIKE :search OR client.first_name ILIKE :search OR client.company_name ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }

      // Family group filter
      if (query.familyGroupId) {
        qb.andWhere('client.family_group_id = :familyGroupId', {
          familyGroupId: query.familyGroupId,
        });
      }

      // Pagination
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const total = await qb.getCount();

      qb.orderBy('client.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const data = await qb.getMany();
      const pages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          pages,
          hasPrev: page > 1,
          hasNext: page < pages,
        },
      };
    });
  }

  // ───────── US7: Update Client ─────────

  async updateClient(id: string, dto: UpdateClientDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const existing = await clientRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Client with id ${id} not found`);
      }

      // Type is immutable — reject if included
      if ('type' in dto) {
        throw new BadRequestException('Client type cannot be changed');
      }

      // Sponsor existence check if changed
      if (dto.sponsorId !== undefined && dto.sponsorId !== null) {
        const sponsor = await clientRepo.findOne({
          where: { id: dto.sponsorId },
        });
        if (!sponsor) {
          throw new NotFoundException(
            `Sponsor with id ${dto.sponsorId} not found`,
          );
        }
      }

      // ICE uniqueness check if changed
      if (dto.ice && dto.ice !== existing.ice) {
        const conflict = await clientRepo.findOne({
          where: { ice: dto.ice },
        });
        if (conflict && conflict.id !== id) {
          throw new ConflictException(
            `A client with ICE ${dto.ice} already exists`,
          );
        }
      }

      // Medical record replacement
      const updateData: Partial<ClClient> = {
        ...dto,
        birthDate: undefined,
        medicalRecord: undefined,
      };
      if (dto.birthDate) {
        updateData.birthDate = dto.birthDate.toISOString().split('T')[0];
      }
      if (dto.medicalRecord !== undefined) {
        updateData.medicalRecord = dto.medicalRecord;
      }

      const updated = clientRepo.merge(existing, updateData);
      return await clientRepo.save(updated);
    });
  }

  // ───────── US8: Deactivate / Reactivate Client ─────────

  async deactivateClient(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const client = await clientRepo.findOne({ where: { id } });

      if (!client) {
        throw new NotFoundException(`Client with id ${id} not found`);
      }

      client.active = false;
      return await clientRepo.save(client);
    });
  }

  async reactivateClient(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const client = await clientRepo.findOne({ where: { id } });

      if (!client) {
        throw new NotFoundException(`Client with id ${id} not found`);
      }

      client.active = true;
      return await clientRepo.save(client);
    });
  }

  // ───────── US4: Convention Management ─────────

  async upsertConvention(clientId: string, dto: ConventionDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const conventionRepo = manager.getRepository(ClConvention);

      const client = await clientRepo.findOne({ where: { id: clientId } });
      if (!client) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }

      if (!isClientProfessionnel(client)) {
        throw new BadRequestException(
          'Conventions are only allowed for professional clients',
        );
      }

      // Check if convention already exists
      let convention = await conventionRepo.findOne({
        where: { clientId },
      });

      const conventionData: Partial<ClConvention> = {
        ...dto,
        clientId,
        dateDebut: dto.dateDebut
          ? dto.dateDebut.toISOString().split('T')[0]
          : undefined,
        dateFin: dto.dateFin
          ? dto.dateFin.toISOString().split('T')[0]
          : undefined,
      };

      if (convention) {
        // Update existing
        const updated = conventionRepo.merge(convention, conventionData);
        return await conventionRepo.save(updated);
      } else {
        // Create new
        convention = conventionRepo.create(conventionData);
        return await conventionRepo.save(convention);
      }
    });
  }

  async deleteConvention(clientId: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const conventionRepo = manager.getRepository(ClConvention);

      const client = await clientRepo.findOne({ where: { id: clientId } });
      if (!client) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }

      const convention = await conventionRepo.findOne({
        where: { clientId },
      });
      if (!convention) {
        throw new NotFoundException(
          `No convention found for client ${clientId}`,
        );
      }

      await conventionRepo.remove(convention);
      return { message: 'Convention removed successfully' };
    });
  }

  // ───────── US5: Internal Contact Management ─────────

  async addContact(clientId: string, dto: CreateContactInterneDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const contactRepo = manager.getRepository(ClContactInterne);

      const client = await clientRepo.findOne({ where: { id: clientId } });
      if (!client) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }

      if (!isClientProfessionnel(client)) {
        throw new BadRequestException(
          'Internal contacts are only allowed for professional clients',
        );
      }

      // Auto-unmark existing principal contact
      if (dto.principal) {
        await contactRepo.update(
          { clientId, principal: true },
          { principal: false },
        );
      }

      const contact = contactRepo.create({ ...dto, clientId });
      return await contactRepo.save(contact);
    });
  }

  async updateContact(
    clientId: string,
    contactId: string,
    dto: UpdateContactInterneDto,
  ) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const contactRepo = manager.getRepository(ClContactInterne);

      const contact = await contactRepo.findOne({
        where: { id: contactId, clientId },
      });
      if (!contact) {
        throw new NotFoundException(
          `Contact with id ${contactId} not found for client ${clientId}`,
        );
      }

      // Auto-unmark existing principal contact
      if (dto.principal === true) {
        await contactRepo.update(
          { clientId, principal: true },
          { principal: false },
        );
      }

      const updated = contactRepo.merge(contact, dto);
      return await contactRepo.save(updated);
    });
  }

  async deleteContact(clientId: string, contactId: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const contactRepo = manager.getRepository(ClContactInterne);

      const contact = await contactRepo.findOne({
        where: { id: contactId, clientId },
      });
      if (!contact) {
        throw new NotFoundException(
          `Contact with id ${contactId} not found for client ${clientId}`,
        );
      }

      await contactRepo.remove(contact);
      return { message: 'Contact deleted successfully' };
    });
  }

  async listContacts(clientId: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const clientRepo = manager.getRepository(ClClient);
      const contactRepo = manager.getRepository(ClContactInterne);

      const client = await clientRepo.findOne({ where: { id: clientId } });
      if (!client) {
        throw new NotFoundException(`Client with id ${clientId} not found`);
      }

      return await contactRepo.find({
        where: { clientId },
        order: { principal: 'DESC', createdAt: 'DESC' },
      });
    });
  }

  // ───────── Family Group Management ─────────

  async createFamilyGroup(dto: CreateFamilyGroupDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const repo = manager.getRepository(ClFamilyGroup);
      const group = repo.create(dto);
      return await repo.save(group);
    });
  }

  async listFamilyGroups() {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const repo = manager.getRepository(ClFamilyGroup);
      return await repo.find({
        order: { createdAt: 'DESC' },
        relations: ['members'],
      });
    });
  }

  async getFamilyGroupById(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const repo = manager.getRepository(ClFamilyGroup);
      const group = await repo.findOne({
        where: { id },
        relations: ['members'],
      });

      if (!group) {
        throw new NotFoundException(`Family group with id ${id} not found`);
      }

      return group;
    });
  }

  async updateFamilyGroup(id: string, dto: UpdateFamilyGroupDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const repo = manager.getRepository(ClFamilyGroup);
      const group = await repo.findOne({ where: { id } });

      if (!group) {
        throw new NotFoundException(`Family group with id ${id} not found`);
      }

      const updated = repo.merge(group, dto);
      return await repo.save(updated);
    });
  }

  async deleteFamilyGroup(id: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const repo = manager.getRepository(ClFamilyGroup);
      const group = await repo.findOne({ where: { id } });

      if (!group) {
        throw new NotFoundException(`Family group with id ${id} not found`);
      }

      // Unlink clients from this group before deleting
      const clientRepo = manager.getRepository(ClClient);
      await clientRepo.update(
        { familyGroupId: id },
        { familyGroupId: undefined },
      );

      await repo.remove(group);
      return { message: 'Family group deleted successfully' };
    });
  }
}
