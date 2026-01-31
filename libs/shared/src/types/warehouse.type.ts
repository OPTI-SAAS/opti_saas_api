import { ExtractEnumTypes } from '../helpers';

export type TAddress = {
  street: string;
  streetLine2?: string;
  postcode: string;
  city: string;
  country: string;
  lat?: number;
  lon?: number;
};

export const WAREHOUSE_TYPES = {
  PRINCIPALE: 'principale',
  SECONDARY: 'secondary',
} as const;

export type WarehouseType = ExtractEnumTypes<typeof WAREHOUSE_TYPES>;
