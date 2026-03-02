export type StockReceiptLineInput = {
  productId: string;
  warehouseId: string;
  quantity: number;
  purchasePrice?: number;
};
