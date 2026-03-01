import { ClientController, JwtAuthGuard, TenantApiHeader } from '@lib/shared';
import { Body, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateWarehouseDto } from './dto';
import { WarehousesService } from './warehouses.service';

@ApiTags('Warehouses')
@ClientController('warehouses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  async getAllWarehouses() {
    return this.warehousesService.getAllWarehouses();
  }

  @Post()
  async createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.createWarehouse(createWarehouseDto);
  }
}
