import { ExtractEnumTypes } from '@lib/shared/helpers';

export const FILE_TYPES = {
  PRODUCT: 'product',
} as const;

export type FileType = ExtractEnumTypes<typeof FILE_TYPES>;
