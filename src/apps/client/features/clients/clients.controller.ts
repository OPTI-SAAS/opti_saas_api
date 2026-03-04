import { ClientController, JwtAuthGuard, TenantApiHeader } from '@lib/shared';
import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ClientsService } from './clients.service';
import {
  CreateContactInterneDto,
  UpdateContactInterneDto,
} from './dto/contact-interne.dto';
import { ConventionDto } from './dto/convention.dto';
import { CreateClientDto } from './dto/create-client.dto';
import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
} from './dto/family-group.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients')
@ClientController('clients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ───────── Client CRUD ─────────

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.createClient(createClientDto);
  }

  // ───────── Family Group Management ─────────

  @Post('family-groups')
  @ApiOperation({ summary: 'Create a new family group' })
  async createFamilyGroup(@Body() dto: CreateFamilyGroupDto) {
    return this.clientsService.createFamilyGroup(dto);
  }

  @Get('family-groups')
  @ApiOperation({ summary: 'List all family groups with members' })
  async listFamilyGroups() {
    return this.clientsService.listFamilyGroups();
  }

  @Get('family-groups/:id')
  @ApiOperation({ summary: 'Get a family group by ID with members' })
  async getFamilyGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.getFamilyGroupById(id);
  }

  @Patch('family-groups/:id')
  @ApiOperation({ summary: 'Update a family group' })
  async updateFamilyGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFamilyGroupDto,
  ) {
    return this.clientsService.updateFamilyGroup(id, dto);
  }

  @Delete('family-groups/:id')
  @ApiOperation({ summary: 'Delete a family group' })
  async deleteFamilyGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.deleteFamilyGroup(id);
  }

  // ───────── Client Listing & Detail ─────────

  @Get()
  @ApiOperation({ summary: 'List clients with pagination and filters' })
  async findAll(@Query() query: QueryClientsDto) {
    return this.clientsService.listClients(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID with full profile' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.getClientById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client fields' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(id, updateClientDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a client' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.deactivateClient(id);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a client' })
  async reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.reactivateClient(id);
  }

  // ───────── Convention Management ─────────

  @Put(':clientId/convention')
  @ApiOperation({
    summary: 'Create or update convention for a professional client',
  })
  async upsertConvention(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() conventionDto: ConventionDto,
  ) {
    return this.clientsService.upsertConvention(clientId, conventionDto);
  }

  @Delete(':clientId/convention')
  @ApiOperation({ summary: 'Remove convention from a professional client' })
  async deleteConvention(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return await this.clientsService.deleteConvention(clientId);
  }

  // ───────── Internal Contact Management ─────────

  @Get(':clientId/contacts')
  @ApiOperation({ summary: 'List internal contacts for a professional client' })
  async listContacts(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.clientsService.listContacts(clientId);
  }

  @Post(':clientId/contacts')
  @ApiOperation({ summary: 'Add an internal contact to a professional client' })
  async addContact(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateContactInterneDto,
  ) {
    return this.clientsService.addContact(clientId, dto);
  }

  @Patch(':clientId/contacts/:contactId')
  @ApiOperation({ summary: 'Update an internal contact' })
  async updateContact(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateContactInterneDto,
  ) {
    return this.clientsService.updateContact(clientId, contactId, dto);
  }

  @Delete(':clientId/contacts/:contactId')
  @ApiOperation({ summary: 'Delete an internal contact' })
  async deleteContact(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return await this.clientsService.deleteContact(clientId, contactId);
  }
}
