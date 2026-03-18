import { ExtractEnumTypes } from '@lib/shared/helpers';
import {
  type Civilities,
  civilitiesValues,
  type ClientType,
  clientTypeValues,
  type FamilyLink,
  familyLinkValues,
} from '@optisaas/opti-saas-lib';

export type { Civilities, ClientType, FamilyLink };

export const ClientTypeValues = clientTypeValues;
export const FamilyLinkValues = familyLinkValues;

export const CLIENT_TYPES = {
  PARTICULIER: 'particulier',
  PROFESSIONNEL: 'professionnel',
} as const satisfies Record<string, ClientType>;

export const CLIENT_GROUPS = {
  PARTICULIER: 'particulier',
  PROFESSIONNEL: 'professionnel',
  PASSAGE: 'passage',
} as const;

export const FAMILY_LINKS = {
  PRINCIPAL: 'principal',
  CONJOINT: 'conjoint',
  TUTOR: 'tutor',
  PARENT: 'parent',
  CHILDREN: 'children',
} as const satisfies Record<string, FamilyLink>;

export const CivilitiesValues = civilitiesValues;

export const CLIENT_TITLES = {
  MRS: 'mrs',
  MR: 'Mr',
  AUTRE: 'Autre',
} as const satisfies Record<string, Civilities>;

export const ClientTitleValues = Object.values(CLIENT_TITLES);
export type ClientTitle = ExtractEnumTypes<typeof CLIENT_TITLES>;

export const ID_DOCUMENT_TYPES = {
  CIN: 'CIN',
  PASSPORT: 'Passport',
  CARTE_DE_SEJOUR: 'Carte de séjour',
} as const;

export const IdDocumentTypeValues = Object.values(ID_DOCUMENT_TYPES);
export type IdDocumentType = ExtractEnumTypes<typeof ID_DOCUMENT_TYPES>;

// Type guards
export function isClientParticulier(client: { type: string }): boolean {
  return client.type === CLIENT_TYPES.PARTICULIER;
}

export function isClientProfessionnel(client: { type: string }): boolean {
  return client.type === CLIENT_TYPES.PROFESSIONNEL;
}
