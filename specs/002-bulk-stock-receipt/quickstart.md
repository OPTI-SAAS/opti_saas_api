# Quickstart: Bulk Stock Receipt

## Prerequisites

- Node.js + pnpm installed
- PostgreSQL available with tenant setup
- Existing client auth flow working
- Existing entities available in tenant: supplier, warehouses, optional file

## 1) Install and build

```bash
pnpm install
pnpm run build
```

## 2) Run migration

```bash
pnpm ts-node scripts/migrations/runMigrations.ts client
```

Migration expectation:

- applies migration `1772367000000-migration.ts`
- adds `purchase_price` to `stock_items`
- adds `purchase_price` to `stock_entry_lines`

## 3) Start API

```bash
pnpm run start:dev
```

## 4) Call bulk receipt endpoint

`POST /api/client/stock/bulk-receipt`

Example request:

```json
{
  "supplierId": "a4f8f8ed-44f0-4f8f-8de6-e6f0f5897e4d",
  "fileId": "1f9a9f12-6f72-4b7f-8fc8-a13f0db8f8bc",
  "newProducts": [
    {
      "internalCode": "PRD-NEW-001",
      "productType": "frame",
      "designation": "Demo New Frame",
      "pricingMode": "fixed-price",
      "fixedPrice": 120,
      "warehouseId": "3707e553-a84c-4d58-a9fb-317dfe4bc7ff",
      "quantity": 3,
      "purchasePrice": 42.5,
      "productReferanceCode": "SUP-NEW-001"
    }
  ],
  "existingProducts": [
    {
      "productId": "31f1f5a0-cf47-4d96-9c9e-2689ba8ee88e",
      "warehouseId": "1dce7725-364a-4d87-b5f7-4f133f46fc8d",
      "quantity": 2,
      "purchasePrice": 35
    }
  ]
}
```

Expected success behavior:

- Creates one stock entry for the whole request
- Creates product(s) from `newProducts`
- Creates stock entry line(s) with per-unit `purchasePrice`
- Creates `quantity` stock item rows per line, each storing same per-unit `purchasePrice`
- Creates entry movement history for all generated stock items

Example success response:

```json
{
  "statusCode": 201,
  "message": "Bulk stock receipt created successfully",
  "data": {
    "stockEntryId": "2f32b5c9-3022-4bea-8fce-e9f44be6f8a4",
    "createdProductsCount": 1,
    "existingProductsCount": 1,
    "stockEntryLinesCount": 2,
    "stockItemsCount": 5,
    "warnings": []
  }
}
```

## 5) Validate business rules

- Duplicate (`productId`, `warehouseId`) in `existingProducts` returns 400.
- Missing `productReferanceCode` in `newProducts` is allowed.
- Missing product-supplier link in `existingProducts` does not block fill and is not auto-created.
- Endpoint is non-idempotent in MVP: retries may create additional stock.
- Invalid `supplierId` or `fileId` returns 404.
- Product-supplier link conflicts during creation return 409.

## 6) Validate aggregated error contract

Send a payload with multiple invalid items (across both arrays).

Expected 400 response contains full error list with source location:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    {
      "array": "newProducts",
      "index": 0,
      "field": "designation",
      "message": "designation should not be empty"
    },
    {
      "array": "existingProducts",
      "index": 1,
      "field": "quantity",
      "message": "quantity must be a positive integer"
    }
  ]
}
```

## 7) Suggested verification tests

- Mixed success (`newProducts` + `existingProducts`) creates one stock entry.
- Atomic rollback when one item fails validation/business rules.
- Per-unit `purchasePrice` persistence verified in both `stock_entry_lines` and `stock_items`.
- Aggregated errors include `array` and zero-based `index` for each invalid item.
