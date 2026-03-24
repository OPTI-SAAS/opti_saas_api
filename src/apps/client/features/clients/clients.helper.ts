import { ClClient } from '@lib/shared/entities/client/clients.client.entity';
import { ClFamilyGroup } from '@lib/shared/entities/client/family-groups.client.entity';
import {
  CLIENT_GROUPS,
  CLIENT_TYPES,
  FAMILY_LINKS,
  type FamilyLink,
} from '@lib/shared/enums/client/client.client.enum';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Repository } from 'typeorm';

import type { CreateClientDto } from './dto/create-client.dto';
import type { CreateTutorPayloadDto } from './dto/create-tutor-payload.dto';
import type { UpdateClientDto } from './dto/update-client.dto';

/**
 * Serializes a ClClient entity to a plain object,
 * exposing only the fields relevant to its type.
 */
export function toClientResponse(client: ClClient): Record<string, unknown> {
  const group =
    client.type === CLIENT_TYPES.PROFESSIONAL
      ? CLIENT_GROUPS.PROFESSIONAL
      : client.walkIn
        ? CLIENT_GROUPS.WALK_IN
        : CLIENT_GROUPS.INDIVIDUAL;
  return instanceToPlain(client, { groups: [group] });
}

/**
 * Converts a DTO into a plain object compatible with ClClient entity.
 * - Strips DTO-only fields (tutorPayload, useTutorFamily, convention, contacts)
 * - Converts birthDate Date → ISO string for the DB date column
 */
export function toClientEntityPayload(
  dto: CreateClientDto | CreateTutorPayloadDto | UpdateClientDto,
): Partial<ClClient> {
  // Extract and discard DTO-only fields that don't map to entity columns
  const dtoRecord = dto as Record<string, unknown>;
  const {
    tutorPayload: _tp,
    useTutorFamily: _utf,
    convention: _conv,
    contacts: _cont,
    birthDate,
    ...rest
  } = dtoRecord;
  return {
    ...(rest as Partial<ClClient>),
    ...(birthDate instanceof Date
      ? { birthDate: birthDate.toISOString().split('T')[0] }
      : {}),
  };
}

/**
 * Ensures the given ICE value is unique across clients.
 * Optionally excludes a specific client ID (for updates).
 */
export async function ensureIceUnique(
  clientRepo: Repository<ClClient>,
  ice: string,
  excludeId?: string,
): Promise<void> {
  const existing = await clientRepo.findOne({ where: { ice } });
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(`A client with ICE ${ice} already exists`);
  }
}

/**
 * Validates that the sponsor exists and is active (simple referral link, no family logic).
 */
export async function validateSponsor(
  clientRepo: Repository<ClClient>,
  sponsorId?: string,
): Promise<void> {
  if (!sponsorId) return;
  const sponsor = await clientRepo.findOne({
    where: { id: sponsorId, active: true },
  });
  if (!sponsor) {
    throw new NotFoundException(
      `Active sponsor with id ${sponsorId} not found`,
    );
  }
}

/**
 * Resolves the tutor (legal guardian) for a new client:
 * - If tutorId is provided, fetches and validates it exists
 * - If tutorPayload is provided, creates a new client as tutor
 * - Returns null if no tutor info is present
 */
export async function resolveTutor(
  clientRepo: Repository<ClClient>,
  dto: CreateClientDto,
): Promise<ClClient | null> {
  if (dto.tutorId) {
    const tutor = await clientRepo.findOne({
      where: { id: dto.tutorId },
    });
    if (!tutor) {
      throw new NotFoundException(`Tutor with id ${dto.tutorId} not found`);
    }
    return tutor;
  }

  if (dto.tutorPayload) {
    if (
      dto.tutorPayload.type === CLIENT_TYPES.PROFESSIONAL &&
      dto.tutorPayload.ice
    ) {
      await ensureIceUnique(clientRepo, dto.tutorPayload.ice);
    }

    const tutor = clientRepo.create(toClientEntityPayload(dto.tutorPayload));
    return await clientRepo.save(tutor);
  }

  return null;
}

/**
 * Resolves the family group for a new client:
 * - If familyGroupId is provided, validates it exists
 *   (tutor is linked separately — no family effect)
 * - If useTutorFamily is true, reuses the tutor's family group
 * - If tutorPayload is present, creates a new family group,
 *   assigns tutor as principal, new user as member
 * - If client isMinor without a family group, auto-creates one
 * - Otherwise returns undefined familyGroupId with the DTO's familyLink
 */
export async function resolveFamilyGroup(
  clientRepo: Repository<ClClient>,
  familyGroupRepo: Repository<ClFamilyGroup>,
  dto: CreateClientDto,
  tutor: ClClient | null,
): Promise<{ familyGroupId?: string; familyLink?: FamilyLink }> {
  if (dto.familyGroupId) {
    const group = await familyGroupRepo.findOne({
      where: { id: dto.familyGroupId },
    });
    if (!group) {
      throw new NotFoundException(
        `Family group with id ${dto.familyGroupId} not found`,
      );
    }
    return { familyGroupId: dto.familyGroupId, familyLink: dto.familyLink };
  }

  if (dto.useTutorFamily && tutor) {
    if (!tutor.familyGroupId) {
      throw new BadRequestException(
        'Tutor does not belong to any family group',
      );
    }
    return {
      familyGroupId: tutor.familyGroupId,
      familyLink: dto.familyLink,
    };
  }

  if (dto.tutorPayload && tutor) {
    const familyName = tutor.lastName ?? tutor.companyName ?? 'Famille';
    const group = familyGroupRepo.create({ name: familyName });
    const saved = await familyGroupRepo.save(group);

    tutor.familyGroupId = saved.id;
    tutor.familyLink = FAMILY_LINKS.PRINCIPAL;
    await clientRepo.save(tutor);

    return { familyGroupId: saved.id, familyLink: dto.familyLink };
  }

  if (dto.isMinor && !dto.familyGroupId) {
    const familyName = dto.lastName ?? 'Famille';
    const group = familyGroupRepo.create({ name: familyName });
    const saved = await familyGroupRepo.save(group);

    return { familyGroupId: saved.id, familyLink: FAMILY_LINKS.PRINCIPAL };
  }

  // Auto-create family group when a principal has no familyGroupId
  if (dto.familyLink === FAMILY_LINKS.PRINCIPAL && !dto.familyGroupId) {
    const familyName = dto.lastName ?? dto.companyName ?? 'Famille';
    const group = familyGroupRepo.create({ name: familyName });
    const saved = await familyGroupRepo.save(group);

    return { familyGroupId: saved.id, familyLink: FAMILY_LINKS.PRINCIPAL };
  }

  return { familyGroupId: undefined, familyLink: dto.familyLink };
}
