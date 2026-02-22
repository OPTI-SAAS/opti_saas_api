import { ExtractEnumTypes } from '@lib/shared/helpers';

export const PRODUCT_TYPES = {
  FRAME: 'frame',
  LENS: 'lens',
  CONTACT_LENS: 'contact_lens',
  ACCESSORY: 'accessory',
};

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued',
} as const;

export type ProductType = ExtractEnumTypes<typeof PRODUCT_TYPES>;
export type ProductStatus = ExtractEnumTypes<typeof PRODUCT_STATUS>;
