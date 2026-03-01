# Phase 1 Data Model: Warehouse Stock Management

## Entity: StockEntry

- **Table**: `stock_entries`
- **Purpose**: Groups all stock items created in one addition action with shared supplier and justification file.
- **Fields**:
  - `id: uuid` (PK)
  - `supplierId: uuid` (FK -> suppliers.id, required)
  - `fileId: uuid` (FK -> files.id, required)
  - `createdByUserId: uuid` (required)
  - `createdAt: timestamptz`
  - `updatedAt: timestamptz`
  - `deletedAt: timestamptz | null` (soft-delete inherited; not exposed in API)
- **Relationships**:
  - many-to-one `Supplier`
  - many-to-one `File`
  - one-to-many `StockEntryLine`
  - one-to-many `StockItem` (items created in this entry)
- **Validation rules**:
  - supplier must exist in current tenant context
  - file must exist and comply with allowed file policy
  - at least one entry line required

## Entity: StockEntryLine

- **Table**: `stock_entry_lines`
- **Purpose**: Line-level decomposition of a stock entry for product/warehouse/quantity triples.
- **Fields**:
  - `id: uuid` (PK)
  - `stockEntryId: uuid` (FK -> stock_entries.id, required)
  - `productId: uuid` (FK -> products.id, required)
  - `warehouseId: uuid` (FK -> warehouses.id, required)
  - `quantity: int` (required, > 0)
  - `createdAt`, `updatedAt`, `deletedAt`
- **Relationships**:
  - many-to-one `StockEntry`
  - many-to-one `Product`
  - many-to-one `Warehouse`
- **Constraints**:
  - `quantity >= 1`
  - unique `(stockEntryId, productId, warehouseId)`

## Entity: StockItem

- **Table**: `stock_items`
- **Purpose**: Physical unit instance of a product located in exactly one warehouse.
- **Fields**:
  - `id: uuid` (PK, system-generated)
  - `productId: uuid` (FK -> products.id, required)
  - `warehouseId: uuid` (FK -> warehouses.id, required)
  - `stockEntryId: uuid` (FK -> stock_entries.id, required)
  - `status: enum(active|reserved|removed)` (required, default `active`)
  - `createdAt`, `updatedAt`, `deletedAt`
- **Relationships**:
  - many-to-one `Product`
  - many-to-one `Warehouse`
  - many-to-one `StockEntry`
  - one-to-many `StockMovementHistory`
- **Indexes**:
  - `(warehouseId, status)` for stock views
  - `(productId, status)` for deletion-guard checks

## Entity: StockMovementHistory

- **Table**: `stock_movement_history`
- **Purpose**: Immutable audit timeline for all stock item events.
- **Fields**:
  - `id: uuid` (PK)
  - `stockItemId: uuid` (FK -> stock_items.id, required)
  - `movementType: enum(addition|transfer|removal)` (required)
  - `fromWarehouseId: uuid | null` (null for addition)
  - `toWarehouseId: uuid | null` (null for removal)
  - `removalReason: enum(sold|damaged|lost|disposed) | null` (required for removal only)
  - `stockEntryId: uuid | null` (set for addition events)
  - `performedByUserId: uuid` (required)
  - `createdAt`, `updatedAt`, `deletedAt`
- **Relationships**:
  - many-to-one `StockItem`
  - many-to-one `Warehouse` (from)
  - many-to-one `Warehouse` (to)
  - many-to-one `StockEntry` (optional)
- **Indexes**:
  - `(stockItemId, createdAt)`
  - `(fromWarehouseId, createdAt)`
  - `(toWarehouseId, createdAt)`

## Existing Related Entities (read-only integration)

- `Product` (`products`) - catalog item reference
- `Warehouse` (`warehouses`) - destination/source and active flag
- `Supplier` (`suppliers`) - source supplier for stock entries
- `File` (`files`) - justification attachment for stock entries

## State Transitions

### StockItem.status

- `active -> removed` (write-off)
- `active -> reserved` (future reservation flow)
- `reserved -> active` (future release flow)
- `removed` is terminal

### Movement events by command

- **Create Stock Entry**
  - create `StockEntry`
  - create `StockEntryLine[]`
  - create `StockItem[]` with `status=active`
  - create `StockMovementHistory[]` with `movementType=addition`
- **Move Stock Items**
  - precondition: each item `status=active`
  - update `StockItem.warehouseId`
  - append `StockMovementHistory` with `movementType=transfer`
- **Remove Stock Items**
  - precondition: each item `status=active`
  - update `StockItem.status=removed`
  - append `StockMovementHistory` with `movementType=removal`

## Business Invariants

- Stock item belongs to exactly one warehouse at any time.
- Movement history is append-only via API design (no update/delete endpoints).
- Additions and transfers to inactive warehouses are forbidden.
- Removing already removed items is forbidden.
- Product deletion and warehouse deactivation are blocked when any related stock item is `active` or `reserved`.
- Tenant context must be enforced for every read/write path.
