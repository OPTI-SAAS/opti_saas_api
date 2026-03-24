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
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ensureIceUnique,
  resolveFamilyGroup,
  resolveTutor,
  toClientEntityPayload,
  toClientResponse,
  validateSponsor,
} from './clients.helper';
import type {
  CreateContactInterneDto,
  UpdateContactInterneDto,
} from './dto/contact-interne.dto';
import type { ConventionDto } from './dto/convention.dto';
import type { CreateClientDto } from './dto/create-client.dto';
import type {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
} from './dto/family-group.dto';
import type { QueryClientsDto } from './dto/query-clients.dto';
import type { QueryFamilyGroupsDto } from './dto/query-family-groups.dto';
import type { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  // ───────── US1/US2/US3: Create Client ─────────

  async createClient(dto: CreateClientDto) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const familyGroupRepo = manager.getRepository(ClFamilyGroup);

          if (dto.type === CLIENT_TYPES.PROFESSIONAL && dto.ice) {
            await ensureIceUnique(clientRepo, dto.ice);
          }

          // Validate sponsor (simple referral link)
          await validateSponsor(clientRepo, dto.sponsorId);

          // Resolve tutor (legal guardian) with family logic
          const tutor = await resolveTutor(clientRepo, dto);
          const { familyGroupId, familyLink } = await resolveFamilyGroup(
            clientRepo,
            familyGroupRepo,
            dto,
            tutor,
          );

          const client = clientRepo.create({
            ...toClientEntityPayload(dto),
            sponsorId: dto.sponsorId,
            tutorId: tutor?.id ?? dto.tutorId,
            familyGroupId,
            familyLink,
          });

          const saved = await clientRepo.save(client);

          // Handle nested convention for professionnel clients
          if (dto.convention && dto.type === CLIENT_TYPES.PROFESSIONAL) {
            const conventionRepo = manager.getRepository(ClConvention);
            const convention = conventionRepo.create({
              ...dto.convention,
              clientId: saved.id,
              startDate: dto.convention.startDate
                ? new Date(dto.convention.startDate).toISOString().split('T')[0]
                : undefined,
              endDate: dto.convention.endDate
                ? new Date(dto.convention.endDate).toISOString().split('T')[0]
                : undefined,
            });
            saved.convention = await conventionRepo.save(convention);
          }

          // Handle nested contacts for professionnel clients
          if (dto.contacts?.length && dto.type === CLIENT_TYPES.PROFESSIONAL) {
            const contactRepo = manager.getRepository(ClContactInterne);
            const contacts = dto.contacts.map((c) =>
              contactRepo.create({ ...c, clientId: saved.id }),
            );
            saved.contactsInternes = await contactRepo.save(contacts);
          }

          return toClientResponse(saved);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to create client');
    }
  }

  // ───────── US1: Get Client By ID ─────────

  async getClientById(id: string) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const client = await clientRepo.findOne({
            where: { id },
            relations: ['convention', 'contactsInternes', 'familyGroup'],
          });

          if (!client) {
            throw new NotFoundException(`Client with id ${id} not found`);
          }

          return toClientResponse(client);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to get client');
    }
  }

  // ───────── US6: List Clients ─────────

  async listClients(query: QueryClientsDto) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const qb = clientRepo.createQueryBuilder('client');

          if (query.active !== undefined) {
            qb.andWhere('client.active = :active', { active: query.active });
          }

          if (query.type) {
            qb.andWhere('client.type = :type', { type: query.type });
          }

          if (query.search) {
            qb.andWhere(
              '(client.lastName ILIKE :search OR client.firstName ILIKE :search OR client.companyName ILIKE :search)',
              { search: `%${query.search}%` },
            );
          }

          if (query.familyGroupId) {
            qb.andWhere('client.familyGroupId = :familyGroupId', {
              familyGroupId: query.familyGroupId,
            });
          }

          const page = query.page ?? 1;
          const limit = query.limit ?? 10;
          const total = await qb.getCount();

          qb.orderBy('client.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

          const data = await qb.getMany();
          const pages = Math.ceil(total / limit);

          return {
            data: data.map(toClientResponse),
            meta: {
              page,
              limit,
              total,
              pages,
              hasPrev: page > 1,
              hasNext: page < pages,
            },
          };
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to list clients');
    }
  }

  // ───────── US7: Update Client ─────────

  async updateClient(id: string, dto: UpdateClientDto) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const existing = await clientRepo.findOne({ where: { id } });

          if (!existing) {
            throw new NotFoundException(`Client with id ${id} not found`);
          }

          if ('type' in dto) {
            throw new BadRequestException('Client type cannot be changed');
          }

          if (dto.sponsorId) {
            const sponsor = await clientRepo.findOne({
              where: { id: dto.sponsorId, active: true },
            });
            if (!sponsor) {
              throw new NotFoundException(
                `Active sponsor with id ${dto.sponsorId} not found`,
              );
            }
          }

          if (dto.tutorId) {
            const tutor = await clientRepo.findOne({
              where: { id: dto.tutorId },
            });
            if (!tutor) {
              throw new NotFoundException(
                `Tutor with id ${dto.tutorId} not found`,
              );
            }
          }

          if (dto.ice && dto.ice !== existing.ice) {
            await ensureIceUnique(clientRepo, dto.ice, id);
          }

          const merged = clientRepo.merge(existing, toClientEntityPayload(dto));
          const saved = await clientRepo.save(merged);

          // Handle nested convention for professionnel clients
          if (dto.convention && isClientProfessionnel(existing)) {
            const conventionRepo = manager.getRepository(ClConvention);
            let convention = await conventionRepo.findOne({
              where: { clientId: id },
            });

            const conventionData: Partial<ClConvention> = {
              ...dto.convention,
              clientId: id,
              startDate: dto.convention.startDate
                ? new Date(dto.convention.startDate).toISOString().split('T')[0]
                : undefined,
              endDate: dto.convention.endDate
                ? new Date(dto.convention.endDate).toISOString().split('T')[0]
                : undefined,
            };

            if (convention) {
              const updated = conventionRepo.merge(convention, conventionData);
              saved.convention = await conventionRepo.save(updated);
            } else {
              convention = conventionRepo.create(conventionData);
              saved.convention = await conventionRepo.save(convention);
            }
          }

          // Handle nested contacts for professionnel clients
          if (dto.contacts && isClientProfessionnel(existing)) {
            const contactRepo = manager.getRepository(ClContactInterne);
            // Remove existing contacts and replace with new ones
            await contactRepo.delete({ clientId: id });
            const contacts = dto.contacts.map((c) =>
              contactRepo.create({ ...c, clientId: id }),
            );
            saved.contactsInternes = await contactRepo.save(contacts);
          }

          return toClientResponse(saved);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to update client');
    }
  }

  // ───────── US8: Deactivate / Reactivate Client ─────────

  async deactivateClient(id: string) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const client = await clientRepo.findOne({ where: { id } });

          if (!client) {
            throw new NotFoundException(`Client with id ${id} not found`);
          }

          client.active = false;
          const saved = await clientRepo.save(client);
          return toClientResponse(saved);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to deactivate client');
    }
  }

  async reactivateClient(id: string) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const client = await clientRepo.findOne({ where: { id } });

          if (!client) {
            throw new NotFoundException(`Client with id ${id} not found`);
          }

          client.active = true;
          const saved = await clientRepo.save(client);
          return toClientResponse(saved);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to reactivate client');
    }
  }

  // ───────── US4: Convention Management ─────────

  async upsertConvention(clientId: string, dto: ConventionDto) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const conventionRepo = manager.getRepository(ClConvention);

          const client = await clientRepo.findOne({
            where: { id: clientId },
          });
          if (!client) {
            throw new NotFoundException(`Client with id ${clientId} not found`);
          }

          if (!isClientProfessionnel(client)) {
            throw new BadRequestException(
              'Conventions are only allowed for professional clients',
            );
          }

          let convention = await conventionRepo.findOne({
            where: { clientId },
          });

          const conventionData: Partial<ClConvention> = {
            ...dto,
            clientId,
            startDate: dto.startDate
              ? dto.startDate.toISOString().split('T')[0]
              : undefined,
            endDate: dto.endDate
              ? dto.endDate.toISOString().split('T')[0]
              : undefined,
          };

          if (convention) {
            const updated = conventionRepo.merge(convention, conventionData);
            return await conventionRepo.save(updated);
          }

          convention = conventionRepo.create(conventionData);
          return await conventionRepo.save(convention);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to upsert convention');
    }
  }

  async deleteConvention(clientId: string) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const conventionRepo = manager.getRepository(ClConvention);

          const client = await clientRepo.findOne({
            where: { id: clientId },
          });
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
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to delete convention');
    }
  }

  // ───────── US5: Internal Contact Management ─────────

  async addContact(clientId: string, dto: CreateContactInterneDto) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const contactRepo = manager.getRepository(ClContactInterne);

          const client = await clientRepo.findOne({
            where: { id: clientId },
          });
          if (!client) {
            throw new NotFoundException(`Client with id ${clientId} not found`);
          }

          if (!isClientProfessionnel(client)) {
            throw new BadRequestException(
              'Internal contacts are only allowed for professional clients',
            );
          }

          if (dto.isPrincipal) {
            await contactRepo.update(
              { clientId, isPrincipal: true },
              { isPrincipal: false },
            );
          }

          const contact = contactRepo.create({ ...dto, clientId });
          return await contactRepo.save(contact);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to add contact');
    }
  }

  async updateContact(
    clientId: string,
    contactId: string,
    dto: UpdateContactInterneDto,
  ) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const contactRepo = manager.getRepository(ClContactInterne);

          const contact = await contactRepo.findOne({
            where: { id: contactId, clientId },
          });
          if (!contact) {
            throw new NotFoundException(
              `Contact with id ${contactId} not found for client ${clientId}`,
            );
          }

          if (dto.isPrincipal === true) {
            await contactRepo.update(
              { clientId, isPrincipal: true },
              { isPrincipal: false },
            );
          }

          const updated = contactRepo.merge(contact, dto);
          return await contactRepo.save(updated);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to update contact');
    }
  }

  async deleteContact(clientId: string, contactId: string) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
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
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to delete contact');
    }
  }

  async listContacts(clientId: string) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const clientRepo = manager.getRepository(ClClient);
          const contactRepo = manager.getRepository(ClContactInterne);

          const client = await clientRepo.findOne({
            where: { id: clientId },
          });
          if (!client) {
            throw new NotFoundException(`Client with id ${clientId} not found`);
          }

          return await contactRepo.find({
            where: { clientId },
            order: { isPrincipal: 'DESC', createdAt: 'DESC' },
          });
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to list contacts');
    }
  }

  // ───────── Family Group Management ─────────

  async createFamilyGroup(dto: CreateFamilyGroupDto) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const repo = manager.getRepository(ClFamilyGroup);
          const group = repo.create(dto);
          return await repo.save(group);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to create family group');
    }
  }

  async listFamilyGroups(query: QueryFamilyGroupsDto) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const repo = manager.getRepository(ClFamilyGroup);
          const qb = repo
            .createQueryBuilder('fg')
            .leftJoinAndSelect('fg.members', 'member');

          if (query.name) {
            qb.andWhere('fg.name ILIKE :name', { name: `%${query.name}%` });
          }

          if (query.address) {
            qb.andWhere(
              `(fg.address->>'street' ILIKE :addr OR fg.address->>'city' ILIKE :addr OR fg.address->>'postcode' ILIKE :addr)`,
              { addr: `%${query.address}%` },
            );
          }

          if (query.memberName) {
            qb.andWhere(
              `EXISTS (
            SELECT 1 FROM clients c
            WHERE c.family_group_id = fg.id
            AND (c.first_name ILIKE :mname OR c.last_name ILIKE :mname)
            AND c.deleted_at IS NULL
          )`,
              { mname: `%${query.memberName}%` },
            );
          }

          if (query.memberPhone) {
            qb.andWhere(
              `EXISTS (
            SELECT 1 FROM clients c
            WHERE c.family_group_id = fg.id
            AND c.phone ILIKE :mphone
            AND c.deleted_at IS NULL
          )`,
              { mphone: `%${query.memberPhone}%` },
            );
          }

          const page = query.page ?? 1;
          const limit = query.limit ?? 10;
          const total = await qb.getCount();

          qb.orderBy('fg.createdAt', 'DESC')
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
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to list family groups');
    }
  }

  async getFamilyGroupById(id: string) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const repo = manager.getRepository(ClFamilyGroup);
          const group = await repo.findOne({
            where: { id },
            relations: ['members'],
          });

          if (!group) {
            throw new NotFoundException(`Family group with id ${id} not found`);
          }

          return group;
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to get family group');
    }
  }

  async updateFamilyGroup(id: string, dto: UpdateFamilyGroupDto) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const repo = manager.getRepository(ClFamilyGroup);
          const group = await repo.findOne({ where: { id } });

          if (!group) {
            throw new NotFoundException(`Family group with id ${id} not found`);
          }

          const updated = repo.merge(group, dto);
          return await repo.save(updated);
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to update family group');
    }
  }

  async deleteFamilyGroup(id: string) {
    try {
      return await this.tenantRepoFactory.executeInTransaction(
        async (manager) => {
          const repo = manager.getRepository(ClFamilyGroup);
          const group = await repo.findOne({ where: { id } });

          if (!group) {
            throw new NotFoundException(`Family group with id ${id} not found`);
          }

          const clientRepo = manager.getRepository(ClClient);
          await clientRepo
            .createQueryBuilder()
            .update(ClClient)
            .set({ familyGroupId: () => 'NULL', familyLink: () => 'NULL' })
            .where('familyGroupId = :id', { id })
            .execute();

          await repo.remove(group);
          return { message: 'Family group deleted successfully' };
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to delete family group');
    }
  }
}
