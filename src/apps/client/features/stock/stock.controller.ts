import {
  ClientController,
  CurrentUser,
  JwtAuthGuard,
  TenantApiHeader,
} from '@lib/shared';
import { JwtPayload } from '@lib/shared/types';
import {
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateBulkStockReceiptDto } from './dto/create-bulk-stock-receipt.dto';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { MoveStockItemsDto } from './dto/move-stock-items.dto';
import { QueryStockHistoryDto } from './dto/query-stock-history.dto';
import { QueryWarehouseStockDto } from './dto/query-warehouse-stock.dto';
import { RemoveStockItemsDto } from './dto/remove-stock-items.dto';
import { StockService } from './stock.service';

@ApiTags('Stock')
@ClientController('stock')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  @ApiOperation({
    summary: 'Create stock entry with one or multiple product/warehouse lines',
  })
  async createStockEntry(
    @Body() createStockEntryDto: CreateStockEntryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.stockService.createStockEntry(
      createStockEntryDto,
      user.sub,
    );
  }

  @Post('bulk-receipt')
  @ApiOperation({
    summary: 'Create a bulk stock receipt with new and existing product lines',
  })
  async createBulkStockReceipt(
    @Body() createBulkStockReceiptDto: CreateBulkStockReceiptDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.stockService.createBulkStockReceipt(
      createBulkStockReceiptDto,
      user.sub,
    );
  }

  @Get('entries/:entryId')
  @ApiOperation({
    summary: 'Get stock entry details including lines and items',
  })
  async findEntry(@Param('entryId', ParseUUIDPipe) entryId: string) {
    return await this.stockService.findEntry(entryId);
  }

  @Get('warehouse/:warehouseId')
  @ApiOperation({ summary: 'List active/reserved stock items for a warehouse' })
  async findWarehouseStock(
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query() query: QueryWarehouseStockDto,
  ) {
    return await this.stockService.findWarehouseStock(warehouseId, query);
  }

  @Post('move')
  @ApiOperation({ summary: 'Move stock items to another active warehouse' })
  async moveStockItems(
    @Body() moveStockItemsDto: MoveStockItemsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.stockService.moveStockItems(moveStockItemsDto, user.sub);
  }

  @Post('remove')
  @ApiOperation({ summary: 'Remove/write-off stock items with reason' })
  async removeStockItems(
    @Body() removeStockItemsDto: RemoveStockItemsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.stockService.removeStockItems(
      removeStockItemsDto,
      user.sub,
    );
  }

  @Get('items/:stockItemId/history')
  @ApiOperation({ summary: 'Get movement history for a stock item' })
  async getItemHistory(
    @Param('stockItemId', ParseUUIDPipe) stockItemId: string,
    @Query() query: QueryStockHistoryDto,
  ) {
    return await this.stockService.getItemHistory(stockItemId, query);
  }

  @Get('warehouse/:warehouseId/history')
  @ApiOperation({ summary: 'Get movement history for a warehouse' })
  async getWarehouseHistory(
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query() query: QueryStockHistoryDto,
  ) {
    return await this.stockService.getWarehouseHistory(warehouseId, query);
  }

  @Get('product/:productId/history')
  @ApiOperation({ summary: 'Get movement history for a product' })
  async getProductHistory(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: QueryStockHistoryDto,
  ) {
    return await this.stockService.getProductHistory(productId, query);
  }
}
