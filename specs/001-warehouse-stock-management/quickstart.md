# Quickstart: Warehouse Stock Management

## Prerequisites

- Node.js and pnpm installed
- PostgreSQL accessible with tenant setup
- Environment variables configured for API + DB

## 1) Install and build

```bash
pnpm install
pnpm run build
```

## 2) Generate and run client migration

```bash
pnpm ts-node scripts/migrations/generateMigrations.ts client
pnpm ts-node scripts/migrations/runMigrations.ts client
```

## 3) Start API

```bash
pnpm run start:dev
```

API base path: `/api/client`

## 4) Prepare dependencies for stock entry test

Ensure these exist in the same tenant:

- Supplier ID
- Product IDs
- Active warehouse IDs
- File ID (uploaded through existing files workflow)

Get a file upload URL and complete file flow:

- `POST /api/client/files/request-upload-url`
- Persist resulting file metadata (existing files feature behavior)

## 5) Create stock entry (multi-product, multi-warehouse)

`POST /api/client/stock`

Example payload:

```json
{
  "supplierId": "a4f8f8ed-44f0-4f8f-8de6-e6f0f5897e4d",
  "fileId": "1f9a9f12-6f72-4b7f-8fc8-a13f0db8f8bc",
  "lines": [
    {
      "productId": "8a5dd95c-3a38-4c3b-a7f6-c9b00f7f2af4",
      "warehouseId": "3707e553-a84c-4d58-a9fb-317dfe4bc7ff",
      "quantity": 5
    },
    {
      "productId": "31f1f5a0-cf47-4d96-9c9e-2689ba8ee88e",
      "warehouseId": "1dce7725-364a-4d87-b5f7-4f133f46fc8d",
      "quantity": 3
    }
  ]
}
```

Expected:

- `201` success
- one stock entry created
- stock items generated for each line quantity
- addition history events persisted
- capacity warnings returned when exceeded

## 6) View warehouse stock

`GET /api/client/stock/warehouse/{warehouseId}?page=1&limit=10&search=...&productType=...`

Expected:

- paginated items
- filtering by designation/type
- excludes removed stock from active warehouse view

## 7) Move stock items

`POST /api/client/stock/move`

```json
{
  "stockItemIds": ["uuid-1", "uuid-2"],
  "destinationWarehouseId": "3707e553-a84c-4d58-a9fb-317dfe4bc7ff"
}
```

Expected:

- rejects inactive destination warehouse
- rejects same source/destination
- updates warehouse assignment
- creates transfer history records

## 8) Remove/write-off stock items

`POST /api/client/stock/remove`

```json
{
  "stockItemIds": ["uuid-1", "uuid-2"],
  "reason": "damaged"
}
```

Expected:

- only active items can be removed
- removed status set
- removal history records created

## 9) Query history

- `GET /api/client/stock/items/{stockItemId}/history`
- `GET /api/client/stock/warehouse/{warehouseId}/history?page=1&limit=10`
- `GET /api/client/stock/product/{productId}/history?page=1&limit=10`

Expected:

- item-level timeline in chronological order
- warehouse/product timelines with pagination

## 10) Validation checklist

- Stock addition requires supplier and file
- Quantity must be >= 1
- Warehouse must be active for add/move
- Movement history immutable via API (no edit/delete endpoints)
- Product deletion blocked if active/reserved stock exists
- Warehouse deactivation blocked if active/reserved stock exists

## 11) Implementation validation log

Executed during implementation (2026-03-01):

```bash
nvm use && pnpm -s tsc -p tsconfig.build.json --pretty false
nvm use && pnpm -s jest --config ./test/jest-e2e.json --runInBand \
  test/stock-us1-create-entry.e2e-spec.ts \
  test/stock-us3-transfer-success.e2e-spec.ts
```

Observed results:

- TypeScript build completed successfully
- Targeted e2e spec execution passed (`2` suites, `2` todo tests)
