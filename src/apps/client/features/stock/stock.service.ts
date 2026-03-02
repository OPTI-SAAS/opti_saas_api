import { PaginationQueryDto, TenantRepositoryFactory } from '@lib/shared';
import { ClFile } from '@lib/shared/entities/client/files.client.entity';
import { ClProductSupplier } from '@lib/shared/entities/client/product-suppliers.client.entity';
import { ClProduct } from '@lib/shared/entities/client/products.client.entity';
import { ClStockEntry } from '@lib/shared/entities/client/stock-entries.client.entity';
import { ClStockEntryLine } from '@lib/shared/entities/client/stock-entry-lines.client.entity';
import { ClStockItem } from '@lib/shared/entities/client/stock-items.client.entity';
import { ClStockMovementHistory } from '@lib/shared/entities/client/stock-movement-history.client.entity';
import { ClSupplier } from '@lib/shared/entities/client/suppliers.client.entity';
import { ClWarehouse } from '@lib/shared/entities/client/warehouses.client.entity';
import {
  STOCK_ITEM_STATUSES,
  STOCK_MOVEMENT_TYPES,
} from '@lib/shared/enums/client/stock.client.enum';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';

import {
  BulkValidationErrorItem,
  CreateBulkExistingProductLineDto,
  CreateBulkNewProductLineDto,
  CreateBulkStockReceiptDto,
} from './dto/create-bulk-stock-receipt.dto';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { MoveStockItemsDto } from './dto/move-stock-items.dto';
import { QueryStockHistoryDto } from './dto/query-stock-history.dto';
import { QueryWarehouseStockDto } from './dto/query-warehouse-stock.dto';
import { RemoveStockItemsDto } from './dto/remove-stock-items.dto';
import { StockReceiptLineInput } from './types';

@Injectable()
export class StockService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  private getRepositories(manager: EntityManager) {
    return {
      fileRepo: manager.getRepository(ClFile),
      productSupplierRepo: manager.getRepository(ClProductSupplier),
      stockEntryRepo: manager.getRepository(ClStockEntry),
      stockEntryLineRepo: manager.getRepository(ClStockEntryLine),
      stockItemRepo: manager.getRepository(ClStockItem),
      stockMovementHistoryRepo: manager.getRepository(ClStockMovementHistory),
      supplierRepo: manager.getRepository(ClSupplier),
      productRepo: manager.getRepository(ClProduct),
      warehouseRepo: manager.getRepository(ClWarehouse),
    };
  }

  private async ensureExists<T extends { id: string }>(
    repo: Repository<T>,
    id: string,
    entityName: string,
  ) {
    const item = await repo.findOne({ where: { id } as never });
    if (!item) {
      throw new NotFoundException(`${entityName} with id ${id} not found`);
    }
    return item;
  }

  private async ensureWarehouseIsActive(
    warehouseRepo: Repository<ClWarehouse>,
    warehouseId: string,
  ) {
    const warehouse = await this.ensureExists(
      warehouseRepo,
      warehouseId,
      'Warehouse',
    );

    if (!warehouse.active) {
      throw new BadRequestException(
        `Warehouse with id ${warehouseId} is inactive`,
      );
    }

    return warehouse;
  }

  private toPagination(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  private addValidationError(
    errors: BulkValidationErrorItem[],
    payload: BulkValidationErrorItem,
  ) {
    errors.push(payload);
  }

  private throwAggregatedValidationErrors(errors: BulkValidationErrorItem[]) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Validation failed',
      error: 'Bad Request',
      errors,
    });
  }

  private collectExistingProductsDuplicateErrors(
    existingProducts: CreateBulkStockReceiptDto['existingProducts'],
  ) {
    const errors: BulkValidationErrorItem[] = [];
    const seen = new Map<string, number>();

    for (const [index, line] of (existingProducts ?? []).entries()) {
      const key = `${line.productId}:${line.warehouseId}`;
      if (seen.has(key)) {
        errors.push({
          array: 'existingProducts',
          index,
          field: 'productId|warehouseId',
          message: `Duplicate pair with existingProducts[${seen.get(key)}]`,
          code: 'DUPLICATE_PRODUCT_WAREHOUSE',
        });
      } else {
        seen.set(key, index);
      }
    }

    return errors;
  }

  private ensureBulkReceiptPayloadNotEmpty(
    newProducts: CreateBulkNewProductLineDto[],
    existingProducts: CreateBulkExistingProductLineDto[],
  ) {
    if (newProducts.length === 0 && existingProducts.length === 0) {
      this.throwAggregatedValidationErrors([
        {
          array: 'newProducts',
          index: 0,
          field: 'newProducts|existingProducts',
          message:
            'At least one product line is required in newProducts or existingProducts',
          code: 'EMPTY_PAYLOAD',
        },
      ]);
    }
  }

  private async collectBulkReferenceValidationErrors(
    newProducts: CreateBulkNewProductLineDto[],
    existingProducts: CreateBulkExistingProductLineDto[],
    productRepo: Repository<ClProduct>,
    warehouseRepo: Repository<ClWarehouse>,
  ) {
    const errors: BulkValidationErrorItem[] = [];

    for (const [index, line] of existingProducts.entries()) {
      try {
        await this.ensureExists(productRepo, line.productId, 'Product');
      } catch {
        this.addValidationError(errors, {
          array: 'existingProducts',
          index,
          field: 'productId',
          message: `Product with id ${line.productId} not found`,
          code: 'PRODUCT_NOT_FOUND',
        });
      }

      try {
        await this.ensureWarehouseIsActive(warehouseRepo, line.warehouseId);
      } catch {
        this.addValidationError(errors, {
          array: 'existingProducts',
          index,
          field: 'warehouseId',
          message: `Warehouse with id ${line.warehouseId} is invalid or inactive`,
          code: 'WAREHOUSE_INVALID_OR_INACTIVE',
        });
      }
    }

    for (const [index, line] of newProducts.entries()) {
      try {
        await this.ensureWarehouseIsActive(warehouseRepo, line.warehouseId);
      } catch {
        this.addValidationError(errors, {
          array: 'newProducts',
          index,
          field: 'warehouseId',
          message: `Warehouse with id ${line.warehouseId} is invalid or inactive`,
          code: 'WAREHOUSE_INVALID_OR_INACTIVE',
        });
      }
    }

    return errors;
  }

  private async createNewProductsWithSupplierLinks(
    newProducts: CreateBulkNewProductLineDto[],
    supplierId: string,
    productRepo: Repository<ClProduct>,
    productSupplierRepo: Repository<ClProductSupplier>,
  ) {
    const createdNewProducts: ClProduct[] = [];

    for (const newProductLine of newProducts) {
      const productPayload = Object.fromEntries(
        Object.entries(newProductLine).filter(
          ([key]) =>
            ![
              'warehouseId',
              'quantity',
              'purchasePrice',
              'productReferanceCode',
            ].includes(key),
        ),
      );

      const product = await productRepo.save(
        productRepo.create(productPayload),
      );
      createdNewProducts.push(product);

      try {
        await productSupplierRepo.save(
          productSupplierRepo.create({
            productId: product.id,
            supplierId,
            productReferanceCode: newProductLine.productReferanceCode ?? '',
          }),
        );
      } catch {
        throw new ConflictException(
          `Product supplier link already exists for product ${product.id}`,
        );
      }
    }

    return createdNewProducts;
  }

  private buildBulkStockReceiptLines(
    newProducts: CreateBulkNewProductLineDto[],
    existingProducts: CreateBulkExistingProductLineDto[],
    createdNewProducts: ClProduct[],
  ): StockReceiptLineInput[] {
    return [
      ...newProducts.map((line, index) => ({
        productId: createdNewProducts[index].id,
        warehouseId: line.warehouseId,
        quantity: line.quantity,
        purchasePrice: line.purchasePrice,
      })),
      ...existingProducts.map((line) => ({
        productId: line.productId,
        warehouseId: line.warehouseId,
        quantity: line.quantity,
        purchasePrice: line.purchasePrice,
      })),
    ];
  }

  private async saveLinesItemsAndHistory(
    stockEntryId: string,
    lines: StockReceiptLineInput[],
    actorUserId: string,
    stockEntryLineRepo: Repository<ClStockEntryLine>,
    stockItemRepo: Repository<ClStockItem>,
    stockMovementHistoryRepo: Repository<ClStockMovementHistory>,
  ) {
    const stockEntryLines = lines.map((line) =>
      stockEntryLineRepo.create({
        stockEntryId,
        productId: line.productId,
        warehouseId: line.warehouseId,
        quantity: line.quantity,
        purchasePrice: line.purchasePrice,
      }),
    );

    await stockEntryLineRepo.save(stockEntryLines);

    const itemsToCreate = lines.flatMap((line) =>
      Array.from({ length: line.quantity }).map(() =>
        stockItemRepo.create({
          productId: line.productId,
          warehouseId: line.warehouseId,
          stockEntryId,
          status: STOCK_ITEM_STATUSES.ACTIVE,
          purchasePrice: line.purchasePrice,
        }),
      ),
    );

    const createdItems = await stockItemRepo.save(itemsToCreate);

    await stockMovementHistoryRepo.save(
      createdItems.map((item) =>
        stockMovementHistoryRepo.create({
          stockItemId: item.id,
          movementType: STOCK_MOVEMENT_TYPES.ADDITION,
          toWarehouseId: item.warehouseId,
          stockEntryId,
          performedByUserId: actorUserId,
        }),
      ),
    );

    return createdItems;
  }

  async createStockEntry(
    createStockEntryDto: CreateStockEntryDto,
    actorUserId: string,
  ) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const {
        stockEntryRepo,
        stockEntryLineRepo,
        stockItemRepo,
        stockMovementHistoryRepo,
        supplierRepo,
        productRepo,
        warehouseRepo,
      } = this.getRepositories(manager);

      await this.ensureExists(
        supplierRepo,
        createStockEntryDto.supplierId,
        'Supplier',
      );

      for (const line of createStockEntryDto.lines) {
        await this.ensureExists(productRepo, line.productId, 'Product');
        await this.ensureWarehouseIsActive(warehouseRepo, line.warehouseId);
      }

      const stockEntry = await stockEntryRepo.save(
        stockEntryRepo.create({
          supplierId: createStockEntryDto.supplierId,
          createdByUserId: actorUserId,
        }),
      );

      await this.saveLinesItemsAndHistory(
        stockEntry.id,
        createStockEntryDto.lines,
        actorUserId,
        stockEntryLineRepo,
        stockItemRepo,
        stockMovementHistoryRepo,
      );

      return stockEntryRepo.findOne({
        where: { id: stockEntry.id },
        relations: ['supplier', 'lines', 'stockItems'],
      });
    });
  }

  async createBulkStockReceipt(
    createBulkStockReceiptDto: CreateBulkStockReceiptDto,
    actorUserId: string,
  ) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const {
        fileRepo,
        productRepo,
        productSupplierRepo,
        stockEntryLineRepo,
        stockEntryRepo,
        stockItemRepo,
        stockMovementHistoryRepo,
        supplierRepo,
        warehouseRepo,
      } = this.getRepositories(manager);

      const validationErrors: BulkValidationErrorItem[] = [];

      const newProducts = createBulkStockReceiptDto.newProducts ?? [];
      const existingProducts = createBulkStockReceiptDto.existingProducts ?? [];

      this.ensureBulkReceiptPayloadNotEmpty(newProducts, existingProducts);

      await this.ensureExists(
        supplierRepo,
        createBulkStockReceiptDto.supplierId,
        'Supplier',
      );

      if (createBulkStockReceiptDto.fileId) {
        await this.ensureExists(
          fileRepo,
          createBulkStockReceiptDto.fileId,
          'File',
        );
      }

      const duplicateErrors =
        this.collectExistingProductsDuplicateErrors(existingProducts);
      validationErrors.push(...duplicateErrors);

      const referenceValidationErrors =
        await this.collectBulkReferenceValidationErrors(
          newProducts,
          existingProducts,
          productRepo,
          warehouseRepo,
        );
      validationErrors.push(...referenceValidationErrors);

      if (validationErrors.length > 0) {
        this.throwAggregatedValidationErrors(validationErrors);
      }

      const stockEntry = await stockEntryRepo.save(
        stockEntryRepo.create({
          supplierId: createBulkStockReceiptDto.supplierId,
          fileId: createBulkStockReceiptDto.fileId,
          createdByUserId: actorUserId,
        }),
      );

      const createdNewProducts = await this.createNewProductsWithSupplierLinks(
        newProducts,
        createBulkStockReceiptDto.supplierId,
        productRepo,
        productSupplierRepo,
      );

      const mergedLines = this.buildBulkStockReceiptLines(
        newProducts,
        existingProducts,
        createdNewProducts,
      );

      const createdItems = await this.saveLinesItemsAndHistory(
        stockEntry.id,
        mergedLines,
        actorUserId,
        stockEntryLineRepo,
        stockItemRepo,
        stockMovementHistoryRepo,
      );

      return {
        statusCode: 201,
        message: 'Bulk stock receipt created successfully',
        data: {
          stockEntryId: stockEntry.id,
          createdProductsCount: createdNewProducts.length,
          existingProductsCount: existingProducts.length,
          stockEntryLinesCount: mergedLines.length,
          stockItemsCount: createdItems.length,
          warnings: [] as string[],
        },
      };
    });
  }

  async findEntry(entryId: string) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const { stockEntryRepo } = this.getRepositories(manager);
      const entry = await stockEntryRepo.findOne({
        where: { id: entryId },
        relations: ['supplier', 'file', 'lines', 'stockItems'],
      });

      if (!entry) {
        throw new NotFoundException(`Stock entry with id ${entryId} not found`);
      }

      return entry;
    });
  }

  async findWarehouseStock(warehouseId: string, query: QueryWarehouseStockDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const { stockItemRepo, warehouseRepo } = this.getRepositories(manager);

      await this.ensureExists(warehouseRepo, warehouseId, 'Warehouse');

      const { page, limit, skip } = this.toPagination(query);
      const qb = stockItemRepo
        .createQueryBuilder('stockItem')
        .leftJoinAndSelect('stockItem.product', 'product')
        .where('stockItem.warehouse_id = :warehouseId', { warehouseId })
        .andWhere('stockItem.status IN (:...statuses)', {
          statuses: [STOCK_ITEM_STATUSES.ACTIVE, STOCK_ITEM_STATUSES.RESERVED],
        });

      if (query.search) {
        qb.andWhere('LOWER(product.designation) LIKE LOWER(:search)', {
          search: `%${query.search}%`,
        });
      }

      if (query.productType) {
        qb.andWhere('product.product_type = :productType', {
          productType: query.productType,
        });
      }

      const [data, total] = await qb
        .orderBy('stockItem.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasPrev: page > 1,
          hasNext: page * limit < total,
        },
      };
    });
  }

  async moveStockItems(
    moveStockItemsDto: MoveStockItemsDto,
    actorUserId: string,
  ) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const { stockItemRepo, stockMovementHistoryRepo, warehouseRepo } =
        this.getRepositories(manager);

      const destination = await this.ensureWarehouseIsActive(
        warehouseRepo,
        moveStockItemsDto.destinationWarehouseId,
      );

      const stockItems = await stockItemRepo.find({
        where: { id: In(moveStockItemsDto.stockItemIds) },
      });

      if (stockItems.length !== moveStockItemsDto.stockItemIds.length) {
        throw new NotFoundException('One or more stock items were not found');
      }

      const invalid = stockItems.find(
        (stockItem) => stockItem.status !== STOCK_ITEM_STATUSES.ACTIVE,
      );
      if (invalid) {
        throw new BadRequestException(
          `Stock item ${invalid.id} is not active and cannot be moved`,
        );
      }

      const sameWarehouse = stockItems.find(
        (stockItem) => stockItem.warehouseId === destination.id,
      );
      if (sameWarehouse) {
        throw new BadRequestException(
          'Source and destination warehouses must be different',
        );
      }

      const fromWarehouses = Array.from(
        new Set(stockItems.map((stockItem) => stockItem.warehouseId)),
      );

      const movedItems = await stockItemRepo.save(
        stockItems.map((stockItem) =>
          stockItemRepo.merge(stockItem, {
            warehouseId: destination.id,
          }),
        ),
      );

      await stockMovementHistoryRepo.save(
        movedItems.map((stockItem) =>
          stockMovementHistoryRepo.create({
            stockItemId: stockItem.id,
            movementType: STOCK_MOVEMENT_TYPES.TRANSFER,
            fromWarehouseId:
              fromWarehouses.length === 1 ? fromWarehouses[0] : undefined,
            toWarehouseId: destination.id,
            performedByUserId: actorUserId,
          }),
        ),
      );

      return {
        movedCount: movedItems.length,
      };
    });
  }

  async removeStockItems(
    removeStockItemsDto: RemoveStockItemsDto,
    actorUserId: string,
  ) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const { stockItemRepo, stockMovementHistoryRepo } =
        this.getRepositories(manager);

      const stockItems = await stockItemRepo.find({
        where: { id: In(removeStockItemsDto.stockItemIds) },
      });

      if (stockItems.length !== removeStockItemsDto.stockItemIds.length) {
        throw new NotFoundException('One or more stock items were not found');
      }

      const invalid = stockItems.find(
        (stockItem) => stockItem.status !== STOCK_ITEM_STATUSES.ACTIVE,
      );
      if (invalid) {
        throw new BadRequestException(
          `Stock item ${invalid.id} is not active and cannot be removed`,
        );
      }

      const updated = await stockItemRepo.save(
        stockItems.map((stockItem) =>
          stockItemRepo.merge(stockItem, {
            status: STOCK_ITEM_STATUSES.REMOVED,
          }),
        ),
      );

      await stockMovementHistoryRepo.save(
        updated.map((stockItem) =>
          stockMovementHistoryRepo.create({
            stockItemId: stockItem.id,
            movementType: STOCK_MOVEMENT_TYPES.REMOVAL,
            fromWarehouseId: stockItem.warehouseId,
            removalReason: removeStockItemsDto.reason,
            performedByUserId: actorUserId,
          }),
        ),
      );

      return {
        removedCount: updated.length,
      };
    });
  }

  async getItemHistory(stockItemId: string, query: QueryStockHistoryDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const { stockMovementHistoryRepo } = this.getRepositories(manager);
      const { page, limit, skip } = this.toPagination(query);

      const [data, total] = await stockMovementHistoryRepo.findAndCount({
        where: { stockItemId },
        order: { createdAt: 'ASC' },
        skip,
        take: limit,
      });

      return {
        data,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasPrev: page > 1,
          hasNext: page * limit < total,
        },
      };
    });
  }

  async getWarehouseHistory(warehouseId: string, query: QueryStockHistoryDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const { stockMovementHistoryRepo, warehouseRepo } =
        this.getRepositories(manager);
      await this.ensureExists(warehouseRepo, warehouseId, 'Warehouse');

      const { page, limit, skip } = this.toPagination(query);
      const qb = stockMovementHistoryRepo
        .createQueryBuilder('history')
        .where('history.from_warehouse_id = :warehouseId', { warehouseId })
        .orWhere('history.to_warehouse_id = :warehouseId', { warehouseId })
        .orderBy('history.created_at', 'DESC')
        .skip(skip)
        .take(limit);

      const [data, total] = await qb.getManyAndCount();

      return {
        data,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasPrev: page > 1,
          hasNext: page * limit < total,
        },
      };
    });
  }

  async getProductHistory(productId: string, query: QueryStockHistoryDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const { productRepo, stockMovementHistoryRepo } =
        this.getRepositories(manager);
      await this.ensureExists(productRepo, productId, 'Product');

      const { page, limit, skip } = this.toPagination(query);
      const qb = stockMovementHistoryRepo
        .createQueryBuilder('history')
        .innerJoin('history.stockItem', 'stockItem')
        .where('stockItem.product_id = :productId', { productId })
        .orderBy('history.created_at', 'DESC')
        .skip(skip)
        .take(limit);

      const [data, total] = await qb.getManyAndCount();

      return {
        data,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasPrev: page > 1,
          hasNext: page * limit < total,
        },
      };
    });
  }
}
