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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import { ClientsService } from './clients.service';
import {
  ClientParticulierResponseDto,
  ClientProfessionnelResponseDto,
  ContactInterneResponseDto,
  ConventionResponseDto,
  FamilyGroupResponseDto,
  MessageResponseDto,
  PaginatedClientsResponseDto,
  PaginatedFamilyGroupsResponseDto,
} from './dto/client-response.dto';
import {
  CreateContactInterneDto,
  UpdateContactInterneDto,
} from './dto/contact-interne.dto';
import { ConventionDto } from './dto/convention.dto';
import {
  CreateClientDto,
  CreateParticulierClientDto,
  CreateProfessionnelClientDto,
} from './dto/create-client.dto';
import {
  CreateFamilyGroupDto,
  UpdateFamilyGroupDto,
} from './dto/family-group.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { QueryFamilyGroupsDto } from './dto/query-family-groups.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientValidationPipe } from './pipes';

@ApiTags('Clients')
@ApiExtraModels(
  CreateParticulierClientDto,
  CreateProfessionnelClientDto,
  ClientParticulierResponseDto,
  ClientProfessionnelResponseDto,
  ConventionResponseDto,
  ContactInterneResponseDto,
  FamilyGroupResponseDto,
)
@ClientController('clients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ───────── Client CRUD ─────────

  @Post()
  @ApiOperation({
    summary: 'Create a new client',
    description:
      'Creates a particulier (with optional tutor/family logic) or professionnel client. ' +
      'When passager=true, only minimal info is required.',
  })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateParticulierClientDto) },
        { $ref: getSchemaPath(CreateProfessionnelClientDto) },
      ],
    },
  })
  @ApiCreatedResponse({
    description: 'Client created successfully',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ClientParticulierResponseDto) },
        { $ref: getSchemaPath(ClientProfessionnelResponseDto) },
      ],
    },
  })
  async create(
    @Body(new CreateClientValidationPipe()) createClientDto: CreateClientDto,
  ) {
    return this.clientsService.createClient(createClientDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List clients with pagination and filters',
    description:
      'Returns paginated list of clients. Filter by type, active status, search term, or familyGroupId.',
  })
  @ApiOkResponse({ type: PaginatedClientsResponseDto })
  async findAll(@Query() query: QueryClientsDto) {
    return this.clientsService.listClients(query);
  }

  // ───────── Family Group Management ─────────

  @Post('family-groups')
  @ApiOperation({
    summary: 'Create a new family group',
    description:
      'Manually creates a family group with name, address, and notes.',
  })
  @ApiCreatedResponse({ type: FamilyGroupResponseDto })
  async createFamilyGroup(@Body() dto: CreateFamilyGroupDto) {
    return this.clientsService.createFamilyGroup(dto);
  }

  @Get('family-groups')
  @ApiOperation({
    summary: 'List family groups with optional filters',
    description:
      'Returns paginated list of family groups with their members. ' +
      'Filter by family name, address, member name, or member phone.',
  })
  @ApiOkResponse({ type: PaginatedFamilyGroupsResponseDto })
  async listFamilyGroups(@Query() query: QueryFamilyGroupsDto) {
    return this.clientsService.listFamilyGroups(query);
  }

  @Get('family-groups/:id')
  @ApiOperation({
    summary: 'Get a family group by ID with members',
    description: 'Returns a single family group with all its member clients.',
  })
  @ApiOkResponse({ type: FamilyGroupResponseDto })
  async getFamilyGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.getFamilyGroupById(id);
  }

  @Patch('family-groups/:id')
  @ApiOperation({
    summary: 'Update a family group',
    description: 'Partially updates family group name, address, or notes.',
  })
  @ApiOkResponse({ type: FamilyGroupResponseDto })
  async updateFamilyGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFamilyGroupDto,
  ) {
    return this.clientsService.updateFamilyGroup(id, dto);
  }

  @Delete('family-groups/:id')
  @ApiOperation({
    summary: 'Delete a family group',
    description:
      'Removes a family group and unlinks all member clients from it.',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  async deleteFamilyGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.deleteFamilyGroup(id);
  }

  // ───────── Client by ID ─────────

  @Get(':id')
  @ApiOperation({
    summary: 'Get client by ID with full profile',
    description:
      'Returns a single client with convention, internal contacts, and family group relations.',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ClientParticulierResponseDto) },
        { $ref: getSchemaPath(ClientProfessionnelResponseDto) },
      ],
    },
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.getClientById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update client fields',
    description:
      'Partially updates client fields. Client type cannot be changed.',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ClientParticulierResponseDto) },
        { $ref: getSchemaPath(ClientProfessionnelResponseDto) },
      ],
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(id, updateClientDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a client',
    description: 'Sets the client active flag to false.',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ClientParticulierResponseDto) },
        { $ref: getSchemaPath(ClientProfessionnelResponseDto) },
      ],
    },
  })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.deactivateClient(id);
  }

  @Patch(':id/reactivate')
  @ApiOperation({
    summary: 'Reactivate a client',
    description: 'Sets the client active flag to true.',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ClientParticulierResponseDto) },
        { $ref: getSchemaPath(ClientProfessionnelResponseDto) },
      ],
    },
  })
  async reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.reactivateClient(id);
  }

  // ───────── Convention Management ─────────

  @Put(':clientId/convention')
  @ApiOperation({
    summary: 'Create or update convention for a professional client',
    description:
      'Upserts a convention (discount agreement) for a professionnel client. ' +
      'Only one convention per client is allowed.',
  })
  @ApiOkResponse({ type: ConventionResponseDto })
  async upsertConvention(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() conventionDto: ConventionDto,
  ) {
    return this.clientsService.upsertConvention(clientId, conventionDto);
  }

  @Delete(':clientId/convention')
  @ApiOperation({
    summary: 'Remove convention from a professional client',
    description: 'Deletes the convention associated with the given client.',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  async deleteConvention(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return await this.clientsService.deleteConvention(clientId);
  }

  // ───────── Internal Contact Management ─────────

  @Get(':clientId/contacts')
  @ApiOperation({
    summary: 'List internal contacts for a professional client',
    description:
      'Returns all internal contacts for a professionnel client, ordered by principal first.',
  })
  @ApiOkResponse({ type: [ContactInterneResponseDto] })
  async listContacts(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.clientsService.listContacts(clientId);
  }

  @Post(':clientId/contacts')
  @ApiOperation({
    summary: 'Add an internal contact to a professional client',
    description:
      'Creates a new internal contact. If principal=true, existing principal is demoted.',
  })
  @ApiCreatedResponse({ type: ContactInterneResponseDto })
  async addContact(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateContactInterneDto,
  ) {
    return this.clientsService.addContact(clientId, dto);
  }

  @Patch(':clientId/contacts/:contactId')
  @ApiOperation({
    summary: 'Update an internal contact',
    description:
      'Partially updates a contact. If principal is set to true, existing principal is demoted.',
  })
  @ApiOkResponse({ type: ContactInterneResponseDto })
  async updateContact(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateContactInterneDto,
  ) {
    return this.clientsService.updateContact(clientId, contactId, dto);
  }

  @Delete(':clientId/contacts/:contactId')
  @ApiOperation({
    summary: 'Delete an internal contact',
    description: 'Removes an internal contact from a professional client.',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  async deleteContact(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return await this.clientsService.deleteContact(clientId, contactId);
  }
}
