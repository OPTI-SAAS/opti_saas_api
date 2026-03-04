import { ExtractEnumTypes } from '@lib/shared/helpers';

export const CLIENT_TYPES = {
  PARTICULIER: 'particulier',
  PASSAGE: 'passage',
  PROFESSIONNEL: 'professionnel',
} as const;

export const ClientTypeValues = Object.values(CLIENT_TYPES);
export type ClientType = ExtractEnumTypes<typeof CLIENT_TYPES>;

export const CLIENT_TITLES = {
  MR: 'Mr',
  MME: 'Mme',
  MLLE: 'Mlle',
} as const;

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

export function isClientPassage(client: { type: string }): boolean {
  return client.type === CLIENT_TYPES.PASSAGE;
}

export function isClientProfessionnel(client: { type: string }): boolean {
  return client.type === CLIENT_TYPES.PROFESSIONNEL;
}
