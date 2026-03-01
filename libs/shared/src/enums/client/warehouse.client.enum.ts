import { ExtractEnumTypes } from '@lib/shared/helpers';

export const WAREHOUSE_TYPES = {
  PRINCIPALE: 'principale',
  SECONDARY: 'secondary',
} as const;

export type WarehouseType = ExtractEnumTypes<typeof WAREHOUSE_TYPES>;
