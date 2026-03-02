# Phase 1 Data Model: Bulk Stock Receipt

## Entity: BulkStockReceiptRequest (API command model)

- **Purpose**: Represents one endpoint call that creates one stock entry containing lines/items from two arrays.
- **Fields**:
  - `supplierId: uuid` (required)
  - `fileId: uuid | null` (optional)
  - `newProducts: NewProductReceiptItem[]` (optional, may be empty)
  - `existingProducts: ExistingProductReceiptItem[]` (optional, may be empty)
- **Validation rules**:
  - At least one of `newProducts` or `existingProducts` must contain at least one item.
  - Request-level duplicate check for `existingProducts` on (`productId`, `warehouseId`) must fail with 400.

## Entity: NewProductReceiptItem (request item)

- **Purpose**: Combines product creation payload and stock fill payload for a new product.
- **Fields**:
  - Product creation attributes (same as create product flow): `internalCode`, `productType`, `designation`, `pricingMode`, pricing params, optional metadata fields
  - `warehouseId: uuid` (required)
  - `quantity: int` (required, > 0)
  - `purchasePrice: number` (required, >= 0, per-unit)
  - `productReferanceCode: string | null` (optional, null/empty allowed)
- **Validation rules**:
  - Product DTO rules must match existing product creation constraints.
  - `purchasePrice` is per unit and required.

## Entity: ExistingProductReceiptItem (request item)

- **Purpose**: Adds stock for an already existing product.
- **Fields**:
  - `productId: uuid` (required)
  - `warehouseId: uuid` (required)
  - `quantity: int` (required, > 0)
  - `purchasePrice: number` (required, >= 0, per-unit)
- **Validation rules**:
  - Product and warehouse must exist in tenant and warehouse must be active.

## Entity: StockEntry (existing persisted entity, reused)

- **Table**: `stock_entries`
- **Role in feature**: One `StockEntry` created per bulk receipt request.
- **Fields used**:
  - `supplierId`, `fileId`, `createdByUserId`
- **Relationship impact**:
  - One-to-many with `StockEntryLine`
  - One-to-many with `StockItem`

## Entity: StockEntryLine (persisted, extended)

- **Table**: `stock_entry_lines`
- **Change**: add `purchasePrice` (per-unit)
- **Fields**:
  - `stockEntryId: uuid`
  - `productId: uuid`
  - `warehouseId: uuid`
  - `quantity: int` (> 0)
  - `purchasePrice: number` (>= 0, per-unit)
- **Constraints**:
  - Unique (`stockEntryId`, `productId`, `warehouseId`)
  - Quantity positive check
  - Purchase price non-negative check (application + DB check if migration includes it)

## Entity: StockItem (persisted, extended)

- **Table**: `stock_items`
- **Change**: add `purchasePrice` (per-unit)
- **Fields**:
  - `productId: uuid`
  - `warehouseId: uuid`
  - `stockEntryId: uuid`
  - `status: enum(active|reserved|removed)` default `active`
  - `purchasePrice: number` (>= 0, per-unit)
- **Generation rule**:
  - For each line, create `quantity` stock item rows and copy the line’s unit `purchasePrice` to each row.

## Entity: ProductSupplier (existing persisted entity)

- **Table**: `product_suppliers`
- **Role in feature**:
  - Created for each `newProducts` item.
  - Not auto-created for `existingProducts` items.
- **Special rule**:
  - `productReferanceCode` for `newProducts` may be null/empty.

## Entity: StockMovementHistory (existing persisted entity, reused)

- **Table**: `stock_movement_history`
- **Role in feature**:
  - One `entry` movement record created per stock item generated.
  - `performedByUserId` must be authenticated user.

## Error Model: AggregatedValidationError

- **Purpose**: API error response item for bulk payload validation.
- **Fields**:
  - `array: "newProducts" | "existingProducts"`
  - `index: number` (zero-based)
  - `field: string`
  - `message: string`
  - `code?: string`
- **Behavior**:
  - Return all validation errors in one response (no fail-fast short-circuit).

## State/Transaction Notes

- Entire operation executes in one DB transaction.
- Any validation/business failure causes full rollback of:
  - created products
  - product-supplier links for new products
  - stock entry
  - stock entry lines
  - stock items
  - movement history rows
- Endpoint is intentionally non-idempotent in MVP scope.
