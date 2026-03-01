import { ClientController, JwtAuthGuard, TenantApiHeader } from '@lib/shared';
import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateVatDto, UpdateVatDto } from './dto';
import { VatsService } from './vats.service';

@ApiTags('VATs')
@ClientController('vats')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class VatsController {
  constructor(private readonly vatsService: VatsService) {}

  @Post()
  async create(@Body() createVatDto: CreateVatDto) {
    return this.vatsService.create(createVatDto);
  }

  @Get()
  async findAll() {
    return this.vatsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vatsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVatDto: UpdateVatDto,
  ) {
    return this.vatsService.update(id, updateVatDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vatsService.remove(id);
  }
}
