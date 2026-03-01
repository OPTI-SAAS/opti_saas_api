import { ExtractEnumTypes } from '@lib/shared/helpers';

export const STOCK_ITEM_STATUSES = {
  ACTIVE: 'active',
  RESERVED: 'reserved',
  REMOVED: 'removed',
} as const;

export const STOCK_MOVEMENT_TYPES = {
  ADDITION: 'addition',
  TRANSFER: 'transfer',
  REMOVAL: 'removal',
} as const;

export const STOCK_REMOVAL_REASONS = {
  SOLD: 'sold',
  DAMAGED: 'damaged',
  LOST: 'lost',
  DISPOSED: 'disposed',
} as const;

export const StockItemStatusValues = Object.values(STOCK_ITEM_STATUSES);
export const StockMovementTypeValues = Object.values(STOCK_MOVEMENT_TYPES);
export const StockRemovalReasonValues = Object.values(STOCK_REMOVAL_REASONS);

export type StockItemStatus = ExtractEnumTypes<typeof STOCK_ITEM_STATUSES>;
export type StockMovementType = ExtractEnumTypes<typeof STOCK_MOVEMENT_TYPES>;
export type StockRemovalReason = ExtractEnumTypes<typeof STOCK_REMOVAL_REASONS>;
