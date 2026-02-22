import { ExtractEnumTypes } from '@lib/shared/helpers';

export const PRODUCT_TYPES = {
  FRAME: 'frame',
  LENS: 'lens',
  CONTACT_LENS: 'contact_lens',
  ACCESSORY: 'accessory',
} as const;

export const ProductValues = Object.values(PRODUCT_TYPES);

export const PRODUCT_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  ON_ORDER: 'on_order',
  IN_TRANSIT: 'in_transit',
  OUT_OF_STOCK: 'out_of_stock',
  OBSOLETE: 'obsolete',
} as const;

export type ProductType = ExtractEnumTypes<typeof PRODUCT_TYPES>;
export type ProductStatus = ExtractEnumTypes<typeof PRODUCT_STATUS>;
