import { ExtractEnumTypes } from '@lib/shared/helpers';

export const PRODUCT_TYPES = {
  FRAME: 'frame',
  LENS: 'lens',
  CONTACT_LENS: 'contact_lens',
  CLIPON: 'clipon',
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

export const PRODUCT_PRICING_MODES = {
  COEFFICIENT: 'coefficient',
  FIXED_PRICE: 'fixed-price',
  FIXED_ADDED_AMOUNT: 'fixed-added-amount',
} as const;

export const PRODUCT_GENDER = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export const ProductPricingModeValues = Object.values(PRODUCT_PRICING_MODES);
export const ProductGenderValues = Object.values(PRODUCT_GENDER);

export type ProductType = ExtractEnumTypes<typeof PRODUCT_TYPES>;
export type ProductStatus = ExtractEnumTypes<typeof PRODUCT_STATUS>;
export type ProductPricingMode = ExtractEnumTypes<typeof PRODUCT_PRICING_MODES>;
export type ProductFrameGender = ExtractEnumTypes<typeof PRODUCT_GENDER>;
