import { PaginationQueryDto, TenantRepositoryFactory } from '@lib/shared';
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
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';

import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { MoveStockItemsDto } from './dto/move-stock-items.dto';
import { QueryStockHistoryDto } from './dto/query-stock-history.dto';
import { QueryWarehouseStockDto } from './dto/query-warehouse-stock.dto';
import { RemoveStockItemsDto } from './dto/remove-stock-items.dto';

@Injectable()
export class StockService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  private getRepositories(manager: EntityManager) {
    return {
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

      const lines = createStockEntryDto.lines.map((line) =>
        stockEntryLineRepo.create({
          stockEntryId: stockEntry.id,
          productId: line.productId,
          warehouseId: line.warehouseId,
          quantity: line.quantity,
        }),
      );

      await stockEntryLineRepo.save(lines);

      const itemsToCreate = createStockEntryDto.lines.flatMap((line) =>
        Array.from({ length: line.quantity }).map(() =>
          stockItemRepo.create({
            productId: line.productId,
            warehouseId: line.warehouseId,
            stockEntryId: stockEntry.id,
            status: STOCK_ITEM_STATUSES.ACTIVE,
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
            stockEntryId: stockEntry.id,
            performedByUserId: actorUserId,
          }),
        ),
      );

      return stockEntryRepo.findOne({
        where: { id: stockEntry.id },
        relations: ['supplier', 'lines', 'stockItems'],
      });
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
