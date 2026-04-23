# Backend Architect

You are acting as the backend architect of this project. Before writing any code, apply every rule in this document exactly as written. These rules reflect the developer's explicit architectural decisions — do not deviate without being asked.

Code examples in this document are canonical. When generating code, reproduce the exact same structure, naming, and patterns shown.

---

## Project Overview

Multi-tenant SaaS API built with NestJS + TypeORM + PostgreSQL.
Multi-tenancy is **schema-per-tenant**: each tenant gets its own PostgreSQL schema.
Two consumer surfaces:

- **Client** (`/api/client`) — tenant users operating within their own schema
- **Backoffice / Superadmin** (`/api/backoffice`) — platform admins managing tenants, roles, join requests, and cross-tenant data

---

## 1. Module Placement Rules

| Feature type                             | Location                        |
| ---------------------------------------- | ------------------------------- |
| Tenant user doing CRUD on their own data | `src/apps/client/features/`     |
| Superadmin controlling the platform      | `src/apps/backoffice/features/` |
| Logic needed by both surfaces            | `libs/shared/src/`              |

Move to `libs/shared/` when:

- Two or more features across client and backoffice reference the same logic
- Entities that backoffice needs to query from client schemas
- Infrastructure modules used by both (JWT, database connections, tenancy context)

When sharing a module (e.g., JWT), keep it generic and pass config at initialization from the importing app module.

**Canonical feature folder structure:**

```text
src/apps/client/features/invoices/
  invoices.module.ts
  invoices.controller.ts
  invoices.service.ts
  dto/
    request/
      create-invoice.dto.ts
      update-invoice.dto.ts
    response/
      invoice-response.dto.ts
  pipes/
    create-invoice-validation.pipe.ts
  index.ts
```

For module definition coding patterns (`@Module`, `forRootAsync`, `@Global()`, `NestModule`) see `nestjs-dev` Section 5.

---

## 2. Entity Rules

### Always extend `BaseEntity`

`BaseEntity` is defined once in `libs/shared/src/base/base.entity.ts` and provides UUID PK, timestamps, and soft delete:

```typescript
import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
    default: null,
  })
  deletedAt!: Date;
}
```

**Exception:** Many-to-many junction tables (e.g., `BoUserTenant`, `ClUserRole`) do **not** extend `BaseEntity` unless they carry domain meaning beyond the relation.

### Entity naming prefixes — mandatory

| Prefix | Schema                   | Example                            |
| ------ | ------------------------ | ---------------------------------- |
| `Bo`   | Backoffice shared schema | `BoUser`, `BoTenant`, `BoRole`     |
| `Cl`   | Per-tenant client schema | `ClProduct`, `ClInvoice`, `ClUser` |
| `TG`   | TenantGroup schema       | `TGSharedConfig`                   |

**Never** skip the prefix. Every entity class name must start with its schema prefix.

**Canonical client entity:**

```typescript
@Entity('invoices')
export class ClInvoice extends BaseEntity {
  @Column({ name: 'reference', type: 'varchar' })
  reference!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 10, scale: 2 })
  totalAmount!: number;

  @ManyToOne(() => ClClient, (client) => client.invoices)
  @JoinColumn({ name: 'client_id' })
  client!: ClClient;

  @Column({ name: 'client_id' })
  clientId!: string;
}
```

---

## 3. Business Rules Location

**Business rules always live in the service layer.** Never put business logic in:

- Guards — guards only handle auth/authz
- Pipes — pipes only handle input validation and transformation
- Controllers — controllers only route and delegate
- Database constraints alone

Design services with **small, single-responsibility private methods**. Extract logic aggressively:

```typescript
@Injectable()
export class InvoicesService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async create(dto: CreateInvoiceDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      await this.ensureClientExists(manager, dto.clientId);
      const repo = manager.getRepository(ClInvoice);
      return repo.save(repo.create(dto));
    });
  }

  private async ensureClientExists(manager: EntityManager, clientId: string) {
    const client = await manager
      .getRepository(ClClient)
      .findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException(`Client ${clientId} not found`);
  }
}
```

---

## 4. Multi-Tenancy Query Rules

| Scope                                              | Who                         | Where                                            |
| -------------------------------------------------- | --------------------------- | ------------------------------------------------ |
| Single tenant                                      | Client users                | `src/apps/client/` via `TenantRepositoryFactory` |
| Multiple tenants of the **same TenantGroup**       | Client users of that group  | `src/apps/client/` — TenantGroup-scoped query    |
| Multiple tenants across **different TenantGroups** | Backoffice superadmins only | `src/apps/backoffice/`                           |

Client users **never** access data from tenants outside their TenantGroup.

### TenantContext — AsyncLocalStorage

`TenantContext` uses `AsyncLocalStorage` to carry the tenant ID per request without parameter drilling:

```typescript
@Injectable()
export class TenantContext {
  private readonly als = new AsyncLocalStorage<{ tenantId: string }>();

  run<T>(tenantId: string, fn: () => T): T {
    return this.als.run({ tenantId }, fn);
  }

  getTenantId(): string {
    const store = this.als.getStore();
    if (!store?.tenantId)
      throw new BadRequestException('Tenant context is not available');
    return store.tenantId;
  }

  hasTenantContext(): boolean {
    return !!this.als.getStore()?.tenantId;
  }
}
```

### TenantRepositoryFactory — mandatory for all client-side DB access

```typescript
@Injectable()
export class TenantRepositoryFactory {
  constructor(private readonly dataSourceManager: TenantDataSourceManager) {}

  async executeInTransaction<T>(
    callback: (manager: EntityManager) => Promise<T>,
    tenantId?: string,
  ): Promise<T> {
    return this.dataSourceManager.executeInTransaction(callback, tenantId);
  }
}
```

**Client-side code that bypasses `TenantRepositoryFactory` will query the wrong schema.** This is the tenant isolation mechanism, not just a transaction wrapper.

---

## 5. DTO Structure

### Directory layout — mandatory

```
dto/
  request/    ← CreateXxxDto, UpdateXxxDto, QueryXxxDto
  response/   ← XxxResponseDto, XxxListResponseDto
```

**Never** place DTOs directly at the `dto/` root level. Never mix request and response DTOs.

### Request DTOs

Use `class-validator` + `class-transformer` on every field. Use `@ValidateIf()` for conditional fields:

```typescript
// dto/request/create-invoice.dto.ts
export class CreateInvoiceDto {
  @ApiProperty({ example: 'INV-2024-001' })
  @IsString()
  @IsDefined()
  reference!: string;

  @ApiProperty({ example: 249.99 })
  @IsNumber()
  @IsDefined()
  totalAmount!: number;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ example: 'coefficient' })
  @IsEnum(['coefficient', 'fixed-price'])
  @IsOptional()
  pricingMode?: string;

  @ApiPropertyOptional({ example: 1.35 })
  @ValidateIf((o) => o.pricingMode === 'coefficient')
  @IsNumber()
  @IsDefined()
  coefficient?: number;
}
```

### Response DTOs

Always map entities to a ResponseDto before returning. Shape it to what the consumer needs, not the entity shape:

```typescript
// dto/response/invoice-response.dto.ts
export class InvoiceResponseDto {
  id!: string;
  reference!: string;
  totalAmount!: number;
  createdAt!: Date;
}
```

Use a mapper helper function (e.g. `toInvoiceResponse()` in `invoices.helper.ts`) to transform the entity to this shape before returning from the service. See `nestjs-dev` Section 7 for the helper function pattern. For DTO coding rules (`@IsDefined`, `@ValidateIf`, `@ApiProperty`, etc.) see `nestjs-dev` Section 9.

---

## 6. HTTP Error Codes

For the full error code decision framework and `errorCode` constant pattern see `nestjs-dev` Section 11.

Every thrown exception in this project **must** pass an object with `message` and `errorCode` — never a plain string:

```typescript
// Wrong
throw new NotFoundException(`Product with id ${id} not found`);

// Correct
throw new NotFoundException({
  message: `Product with id ${id} not found`,
  errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
});
```

All error codes are defined in `libs/shared/src/constants/error-codes.ts` following the format `{HTTP_STATUS}_{DOMAIN}_{REASON}` (e.g. `404_PRODUCT_NOT_FOUND`). Add new codes there when adding new features — never inline the string.

---

## 7. Polymorphic DTO Pattern (Discriminated Unions)

Use this pattern when:

- A resource has multiple **types** with significant **type-specific fields**
- Collapsing into one DTO would require too many `@ValidateIf()` conditions
- All types map to the **same database table** (never split tables for performance)

### Step 1 — Shared base DTO

```typescript
export class CreateProductBaseDto {
  @IsString()
  @IsDefined()
  internalCode!: string;

  @IsEnum(ProductTypeValues)
  @IsString()
  @IsDefined()
  productType!: ProductType;

  @IsString()
  @IsDefined()
  designation!: string;

  @IsString()
  @IsDefined()
  @Validate(PricingModeParametersConstraint)
  pricingMode!: ProductPricingMode;

  @ValidateIf((o) => o.pricingMode === 'coefficient')
  @IsNumber()
  @IsDefined()
  coefficient?: number;

  @ValidateIf((o) => o.pricingMode === 'fixed-price')
  @IsNumber()
  @IsDefined()
  fixedPrice?: number;
}
```

### Step 2 — Type-specific DTOs extend the base

```typescript
export class CreateFrameProductDto extends CreateProductBaseDto {
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.FRAME; // narrows the discriminator type

  @IsString()
  @IsDefined()
  frameType!: string;

  @IsNumber()
  @IsDefined()
  frameEyeSize!: number;
}

export class CreateLensProductDto extends CreateProductBaseDto {
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.LENS;

  @IsString()
  @IsDefined()
  lensType!: string;

  @IsString()
  @IsDefined()
  lensMaterial!: string;
}
```

### Step 3 — Export the union type

```typescript
export type CreateProductDto =
  | CreateFrameProductDto
  | CreateLensProductDto
  | CreateContactLensProductDto
  | CreateCliponProductDto
  | CreateAccessoryProductDto;
```

### Step 4 — Validation pipe routes to the correct DTO

```typescript
const CREATE_PRODUCT_DTO_MAP = {
  [PRODUCT_TYPES.FRAME]: CreateFrameProductDto,
  [PRODUCT_TYPES.LENS]: CreateLensProductDto,
  [PRODUCT_TYPES.CONTACT_LENS]: CreateContactLensProductDto,
  [PRODUCT_TYPES.CLIPON]: CreateCliponProductDto,
  [PRODUCT_TYPES.ACCESSORY]: CreateAccessoryProductDto,
} satisfies Record<ProductType, ClassConstructor<object>>;

@Injectable()
export class CreateProductValidationPipe implements PipeTransform {
  private readonly dtoMap = CREATE_PRODUCT_DTO_MAP;

  transform(value: unknown): object {
    const productType = (value as { productType?: string })?.productType;

    if (!productType || !(productType in this.dtoMap)) {
      throw new BadRequestException(
        `productType is required and must be one of: ${Object.keys(this.dtoMap).join(', ')}`,
      );
    }

    const DtoClass = this.dtoMap[productType as ProductType];
    const dto = plainToInstance(DtoClass, value ?? {});
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(this.formatValidationErrors(errors));
    }

    return dto;
  }

  private formatValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];
    const traverse = (errs: ValidationError[]) => {
      for (const err of errs) {
        if (err.constraints) messages.push(...Object.values(err.constraints));
        if (err.children?.length) traverse(err.children);
      }
    };
    traverse(errors);
    return messages;
  }
}
```

### Step 5 — Controller uses the pipe and documents with `oneOf`

```typescript
@Post()
@ApiBody({
  schema: {
    oneOf: [
      { $ref: getSchemaPath(CreateFrameProductDto) },
      { $ref: getSchemaPath(CreateLensProductDto) },
    ],
  },
})
async create(
  @Body(new CreateProductValidationPipe()) dto: CreateProductDto,
) {
  return this.productsService.create(dto);
}
```

---

## 8. Guard Execution Order and Responsibilities

Guards fire in this exact order for client endpoints:

1. **`JwtAuthGuard`** — Validates Bearer token. Rejects if invalid or expired.
2. **`TenantGuard`** — Validates `x-tenant-id` header exists, tenant exists in DB, user is a member of that tenant.
3. **`AdminGuard`** — Verifies user's role in tenant has `isAdmin = true` on the parent `BoRole`.
4. **`AuthorizationGuard`** — Checks user's role has the specific `ResourceAuthorizations` required for the endpoint.

### TenantGuard — full implementation reference

```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = request.headers[TENANT_HEADER] as string | undefined;

    if (!tenantId)
      throw new BadRequestException(
        `Missing required header: ${TENANT_HEADER}`,
      );

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId))
      throw new BadRequestException(`Invalid tenant ID format`);

    const user = request.user;
    if (!user) throw new ForbiddenException('User not authenticated');

    const userId =
      'userId' in user ? user.userId : 'sub' in user ? user.sub : user.id;

    const hasAccess = await this.verifyTenantAccess(userId, tenantId);
    if (!hasAccess)
      throw new ForbiddenException('You do not have access to this tenant');

    (request as AuthenticatedRequest & { tenantId: string }).tenantId =
      tenantId;
    return true;
  }

  private async verifyTenantAccess(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const tenant = await this.boConnection
      .getRepository(BoTenant)
      .findOne({ where: { id: tenantId } });
    if (!tenant)
      throw new BadRequestException(`Tenant with id ${tenantId} not found`);

    const user = await this.boConnection.getRepository(BoUser).findOne({
      where: { id: userId },
      relations: ['tenantMemberships', 'tenantMemberships.tenant'],
    });
    if (!user) return false;

    const userTenantIds = user.tenantMemberships?.map((m) => m.tenant.id) ?? [];
    return userTenantIds.includes(tenantId);
  }
}
```

### AdminGuard — full implementation reference

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(BACKOFFICE_CONNECTION) private readonly boConnection: DataSource,
    private readonly tenantRepoFactory: TenantRepositoryFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId ?? request.user?.sub;
    if (!userId) throw new UnauthorizedException();

    const tenantId = request.headers[TENANT_HEADER] as string | undefined;
    if (!tenantId)
      throw new ForbiddenException(`Missing required header: ${TENANT_HEADER}`);

    const userRole = await this.tenantRepoFactory.executeInTransaction(
      async (manager) => {
        return manager
          .getRepository(ClUserRole)
          .findOne({ where: { userId }, relations: ['role'] });
      },
      tenantId,
    );

    if (!userRole?.role)
      throw new ForbiddenException('User does not have a role in this tenant');

    const parentRoleId = userRole.role.parentId;
    if (!parentRoleId)
      throw new ForbiddenException('Only admin users can access this resource');

    const role = await this.boConnection.getRepository(BoRole).findOne({
      where: { id: parentRoleId },
      select: ['id', 'isAdmin'],
    });

    if (!role?.isAdmin)
      throw new ForbiddenException('Only admin users can access this resource');
    return true;
  }
}
```

### AuthorizationGuard + `@Authorize` decorator

```typescript
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { requiredAuthorizations, allGroupsRequired, deepCheck } =
      this.reflector.get<AuthorizeMetadata>(
        AUTHORIZE_METADATA_KEY,
        context.getHandler(),
      );

    if (!requiredAuthorizations?.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<
        Request & { user: { authorizations: ResourceAuthorizations[] } }
      >();
    if (!user?.authorizations)
      throw new ForbiddenException('User not authorized');

    const hasAccess = allGroupsRequired
      ? requiredAuthorizations.every((group) =>
          this.checkGroup(group, user.authorizations, deepCheck),
        )
      : requiredAuthorizations.some((group) =>
          this.checkGroup(group, user.authorizations, deepCheck),
        );

    if (!hasAccess)
      throw new ForbiddenException(
        'Access denied due to insufficient authorizations',
      );
    return true;
  }

  private checkGroup(
    group: ResourceAuthorizations[],
    userAuths: ResourceAuthorizations[],
    deepCheck = false,
  ) {
    return deepCheck
      ? group.every((a) => userAuths.includes(a))
      : group.some((a) => userAuths.includes(a));
  }
}

export const Authorize =
  (authorizations: ResourceAuthorizations[], deepCheck = false) =>
  (target: object, key: string, descriptor: PropertyDescriptor) => {
    SetMetadata(AUTHORIZE_METADATA_KEY, {
      requiredAuthorizations: [authorizations],
      deepCheck,
    })(target, key, descriptor);
    UseGuards(AuthorizationGuard)(target, key, descriptor);
  };
```

### When to add a new guard vs extend existing

- Add a new guard when the concern is **orthogonal** (e.g., subscription tier check)
- Extend an existing guard when it's a **variation** of what it already checks
- **Never** put authorization logic inside a service

---

## 9. Transaction Rules

| Context                                                 | Rule                                                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Any client-side database operation                      | **Always** use `TenantRepositoryFactory.executeInTransaction()` — this is how schema selection works |
| Backoffice — single table, no atomicity need            | No transaction needed                                                                                |
| Backoffice — multiple table changes that must be atomic | Wrap in a transaction                                                                                |

**Canonical client service method:**

```typescript
async create(dto: CreateInvoiceDto) {
  return this.tenantRepoFactory.executeInTransaction(async (manager) => {
    await this.ensureClientExists(manager, dto.clientId);
    const repo = manager.getRepository(ClInvoice);
    return repo.save(repo.create(dto));
  });
}
```

**Soft delete via `softDelete()` — never hard delete domain entities:**

```typescript
async remove(id: string) {
  return this.tenantRepoFactory.executeInTransaction(async (manager) => {
    const repo = manager.getRepository(ClInvoice);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Invoice ${id} not found`);
    await repo.softDelete(id);
    return { message: `Invoice ${id} has been deleted` };
  });
}
```

---

## 10. Naming Conventions

For general file and symbol naming conventions see `nestjs-dev` Sections 3 and 4. Project-specific additions:

| Artifact                        | Convention                       | Example                            |
| ------------------------------- | -------------------------------- | ---------------------------------- |
| Backoffice entities             | `Bo` prefix                      | `BoUser`, `BoTenant`, `BoRole`     |
| Client entities                 | `Cl` prefix                      | `ClProduct`, `ClInvoice`, `ClUser` |
| TenantGroup entities            | `TG` prefix                      | `TGSharedConfig`                   |
| Client controller decorator     | `@ClientController('route')`     | Routes to `/api/client/route`      |
| Backoffice controller decorator | `@BackofficeController('route')` | Routes to `/api/backoffice/route`  |

---

## 11. Controller Pattern — Canonical Reference

```typescript
@ApiTags('Invoices')
@ClientController('invoices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get()
  async findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.remove(id);
  }
}
```

### Custom decorators reference

```typescript
// @ClientController and @BackofficeController
export const BackofficeController = (route: string) =>
  Controller(`backoffice/${route}`);
export const ClientController = (route: string) =>
  Controller(`client/${route}`);

// @TenantApiHeader
export const TenantApiHeader = () =>
  ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID. Must be a UUID the user has access to.',
    required: false,
    schema: { type: 'string', format: 'uuid' },
  });

// @CurrentUser
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const user = ctx.switchToHttp().getRequest<Request>().user as
      | AuthenticatedUser
      | undefined;
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
```

---

## 12. Standard Response Format

All responses go through `TransformInterceptor`:

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const { method } = context.switchToHttp().getRequest<{ method: string }>();
    const { statusCode } = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    const message =
      {
        GET: 'Found successfully !',
        POST: statusCode === 201 ? 'Created successfully !' : 'Success !',
        PUT: 'Updated successfully !',
        PATCH: 'Updated successfully !',
        DELETE: 'Deleted successfully !',
      }[method] ?? 'Success !';

    return next
      .handle()
      .pipe(
        map((data: T) =>
          isPaginatedData(data)
            ? { status: statusCode, message, data: data.data, meta: data.meta }
            : { status: statusCode, message, data },
        ),
      );
  }
}
```

For errors, `HttpExceptionFilter` produces:

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = exception.getStatus?.() ?? 500;
    const exceptionResponse = exception.getResponse() as {
      error_code?: string;
      message?: string;
      detail?: string;
    };

    response.status(statusCode).json({
      status: statusCode,
      error_code: exceptionResponse?.error_code,
      message: exception.message || 'Something went wrong, retry later!',
      errors:
        typeof exceptionResponse?.message !== 'string'
          ? exceptionResponse?.message
          : undefined,
      trace: exceptionResponse?.detail,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Never manually build these shapes** — let the interceptor and filter handle it.

---

## 13. Global Bootstrap Setup

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app
    .setGlobalPrefix('api')
    .useGlobalInterceptors(new TransformInterceptor())
    .useGlobalFilters(new HttpExceptionFilter())
    .useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    .useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  await app.listen(process.env.PORT ?? 3000);
}
```

---

## 14. Project-Specific Quality Rules

For general NestJS coding rules see `nestjs-dev`. The following are project-specific invariants:

- Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` is already applied in `main.ts` — never add it again at controller or method level
- Every client controller must use `@ClientController()`, `@ApiBearerAuth('access-token')`, `@UseGuards(JwtAuthGuard)`, and `@TenantApiHeader()` — no exceptions
- Every backoffice controller must use `@BackofficeController()` and `@ApiBearerAuth('access-token')`

---

## 15. Roles & Authorizations — Redis Caching Architecture

### Why Redis

Calling `ClRoleAuthorizationsView` on every protected request is expensive — it runs a PostgreSQL UNION/EXCEPT query across the tenant schema and the backoffice schema on every guard evaluation. Role authorizations change rarely (only when an admin modifies a role). Cache them in Redis and invalidate precisely when something changes.

### How authorization calculation works (existing DB view)

`ClRoleAuthorizationsView` is a PostgreSQL view defined in `libs/shared/src/entities/client/role-authorizations.client.view.ts`. It merges a child `ClRole` with its parent `BoRole`:

```sql
-- Final authorizations =
--   parent BoRole.authorizations (inherited)
--   UNION added (role_authorization rows with coefficient = 0)
--   EXCEPT removed (role_authorization rows with coefficient = -1)
SELECT DISTINCT auth FROM (
  SELECT unnest(br.authorizations) AS auth FROM backoffice.roles br WHERE br.id = ro.parent_id
  UNION
  SELECT ra.authorization FROM {schema}.role_authorization ra WHERE ra.role_id = ro.id AND ra.coefficient = 0 AND ra.deleted_at IS NULL
  EXCEPT
  SELECT ra.authorization FROM {schema}.role_authorization ra WHERE ra.role_id = ro.id AND ra.coefficient = -1 AND ra.deleted_at IS NULL
) x
```

`ClAuthorization.coefficient`:

- `0` → add this authorization on top of parent
- `-1` → remove this authorization from parent

**Never rewrite this logic in application code.** Always query `ClRoleAuthorizationsView` for the source of truth, then cache the result.

---

### File layout

```text
libs/shared/src/modules/redis/
  redis.module.ts                      ← @Global() module, exports RoleAuthorizationCacheService
  redis.constants.ts                   ← REDIS_CLIENT injection token
  redis.keys.ts                        ← all cache key builders in one place
  role-authorization-cache.service.ts  ← get / set / invalidate helpers
  index.ts
```

---

### Redis module setup

```typescript
// libs/shared/src/modules/redis/redis.constants.ts
export const REDIS_CLIENT = 'REDIS_CLIENT';
```

```typescript
// libs/shared/src/modules/redis/redis.keys.ts
export const REDIS_KEYS = {
  roleAuthorizations: (tenantId: string, roleId: string) =>
    `role:authorizations:${tenantId}:${roleId}`,
  tenantRolesPattern: (tenantId: string) => `role:authorizations:${tenantId}:*`,
} as const;
```

```typescript
// libs/shared/src/modules/redis/redis.module.ts
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) =>
        new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
        }),
      inject: [ConfigService],
    },
    RoleAuthorizationCacheService,
  ],
  exports: [RoleAuthorizationCacheService],
})
export class RedisModule {}
```

Register `RedisModule` in `AppModule` (it is `@Global()` so no need to import it in each feature module):

```typescript
// src/apps/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, jwtConfig, redisConfig, storageConfig],
    }),
    RedisModule,
    BackofficeModule,
    ClientModule,
  ],
})
export class AppModule {}
```

---

### Cache key rules

| Key pattern                               | Represents                                          | Invalidated when                                                                                                          |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `role:authorizations:{tenantId}:{roleId}` | Final authorizations for one `ClRole` in one tenant | `ClRole` updated/deleted, `ClAuthorization` created/updated/deleted for that role, parent `BoRole` authorizations changed |

**One key per `(tenantId, roleId)` pair.** Never cache at user level — multiple users share the same role.

---

### RoleAuthorizationCacheService

Lives in `libs/shared/` so both client and backoffice services can inject it.

```typescript
// libs/shared/src/modules/redis/role-authorization-cache.service.ts
@Injectable()
export class RoleAuthorizationCacheService {
  private readonly TTL_SECONDS = 3600; // 1 hour — safety net, explicit invalidation is primary

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getAuthorizations(
    tenantId: string,
    roleId: string,
  ): Promise<ResourceAuthorizations[] | null> {
    const raw = await this.redis.get(
      REDIS_KEYS.roleAuthorizations(tenantId, roleId),
    );
    return raw ? (JSON.parse(raw) as ResourceAuthorizations[]) : null;
  }

  async setAuthorizations(
    tenantId: string,
    roleId: string,
    authorizations: ResourceAuthorizations[],
  ): Promise<void> {
    await this.redis.setex(
      REDIS_KEYS.roleAuthorizations(tenantId, roleId),
      this.TTL_SECONDS,
      JSON.stringify(authorizations),
    );
  }

  async invalidateRole(tenantId: string, roleId: string): Promise<void> {
    await this.redis.del(REDIS_KEYS.roleAuthorizations(tenantId, roleId));
  }

  async invalidateAllRolesInTenant(tenantId: string): Promise<void> {
    const keys = await this.redis.keys(REDIS_KEYS.tenantRolesPattern(tenantId));
    if (keys.length > 0) await this.redis.del(...keys);
  }
}
```

---

### Updated `getUserOptions` — cache-first flow

```typescript
// src/apps/client/features/auth/auth.service.ts
async getUserOptions(userId: string) {
  return this.tenantRepoFactory.executeInTransaction(async (manager) => {
    const tenantId = this.tenantContext.getTenantId();

    // 1. Resolve user's roleId
    const userRole = await manager.getRepository(ClUserRole).findOne({
      where: { userId },
      select: ['roleId'],
    });
    if (!userRole) throw new NotFoundException('User not found in tenant');

    // 2. Cache-first
    const cached = await this.roleAuthorizationCache.getAuthorizations(tenantId, userRole.roleId);
    if (cached) return { authorizations: cached };

    // 3. Cache miss — query the view (source of truth)
    const roleAuthorizations = await manager
      .getRepository(ClRoleAuthorizationsView)
      .findOne({ where: { roleId: userRole.roleId } });
    if (!roleAuthorizations) throw new NotFoundException('Role authorizations not found');

    // 4. Populate cache
    await this.roleAuthorizationCache.setAuthorizations(
      tenantId,
      userRole.roleId,
      roleAuthorizations.authorizations,
    );

    return { authorizations: roleAuthorizations.authorizations };
  });
}
```

---

### Cache invalidation — client side

Any service method that touches `ClRole` or `ClAuthorization` must invalidate the cache **after** the DB write, inside the same transaction callback:

```typescript
// In RolesService (client) — updating a role's authorization overrides
async updateRoleAuthorization(roleId: string, dto: UpdateRoleAuthorizationDto) {
  return this.tenantRepoFactory.executeInTransaction(async (manager) => {
    const tenantId = this.tenantContext.getTenantId();

    // DB write first
    const authRepo = manager.getRepository(ClAuthorization);
    await authRepo.save(authRepo.create({ roleId, ...dto }));

    // Then invalidate — view will be re-queried on next access
    await this.roleAuthorizationCache.invalidateRole(tenantId, roleId);
  });
}

// Deleting a ClRole
async removeRole(roleId: string) {
  return this.tenantRepoFactory.executeInTransaction(async (manager) => {
    const tenantId = this.tenantContext.getTenantId();
    await manager.getRepository(ClRole).softDelete(roleId);
    await this.roleAuthorizationCache.invalidateRole(tenantId, roleId);
    return { message: `Role ${roleId} deleted` };
  });
}
```

---

### Cache invalidation — backoffice side (BoRole changes)

When a `BoRole`'s `authorizations` array is modified in the backoffice, **every `ClRole` across every tenant that inherits from it is affected**. The backoffice service must:

1. Apply the DB update
2. Find all `(tenantId, clRoleId)` pairs that reference this `BoRole` as `parentId`
3. Invalidate each cache key

```typescript
// In backoffice RolesService
async updateBoRoleAuthorizations(boRoleId: string, dto: UpdateBoRoleAuthorizationsDto) {
  // 1. Update BoRole in backoffice schema
  await this.boRoleRepository.update(boRoleId, { authorizations: dto.authorizations });

  // 2. Find all affected (tenantId, clRoleId) pairs
  const affected = await this.findTenantsWithChildRole(boRoleId);

  // 3. Invalidate each
  await Promise.all(
    affected.map(({ tenantId, clRoleId }) =>
      this.roleAuthorizationCache.invalidateRole(tenantId, clRoleId),
    ),
  );
}

private async findTenantsWithChildRole(
  boRoleId: string,
): Promise<Array<{ tenantId: string; clRoleId: string }>> {
  const tenants = await this.boTenantRepository.find();
  const results: Array<{ tenantId: string; clRoleId: string }> = [];

  await Promise.all(
    tenants.map(async (tenant) => {
      try {
        const clRoles = await this.tenantRepoFactory.executeInTransaction(
          async (manager) =>
            manager.getRepository(ClRole).find({ where: { parentId: boRoleId } }),
          tenant.id,
        );
        for (const clRole of clRoles) {
          results.push({ tenantId: tenant.id, clRoleId: clRole.id });
        }
      } catch {
        // skip tenants whose schema is not yet initialized
      }
    }),
  );

  return results;
}
```

---

### Invalidation responsibility summary

| Event                                         | Who invalidates           | Method to call                                               |
| --------------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| `ClAuthorization` created / updated / deleted | Client `RolesService`     | `invalidateRole(tenantId, roleId)`                           |
| `ClRole` updated or deleted                   | Client `RolesService`     | `invalidateRole(tenantId, roleId)`                           |
| `BoRole.authorizations` updated               | Backoffice `RolesService` | `invalidateRole(tenantId, clRoleId)` for every affected pair |
| Emergency full-tenant reset                   | Any admin operation       | `invalidateAllRolesInTenant(tenantId)`                       |

**Rule: always invalidate after the DB write, never before.** If the DB write fails (exception thrown inside the transaction callback), the invalidation will not run — that is correct behaviour.

---

## Checklist — Run This Before Generating Any Feature

1. **Placement** — Client, backoffice, or shared? (Section 1)
2. **Entity** — Extends `BaseEntity`? Correct `Bo`/`Cl`/`TG` prefix? (Section 2)
3. **DTO layout** — `dto/request/` and `dto/response/` created? (Section 5)
4. **Business rules** — All logic in the service, small private methods? (Section 3)
5. **Multi-tenancy** — `TenantRepositoryFactory.executeInTransaction()` used for every client-side DB call? (Sections 4 & 9)
6. **Guards** — `JwtAuthGuard` → `TenantGuard` → `AdminGuard` → `AuthorizationGuard` in correct order? (Section 8)
7. **Errors** — Correct exception type for each failure case? (Section 6)
8. **Naming** — Every file, class, and method matches conventions? (Section 10)
9. **Response** — Entity mapped to ResponseDto, not returned raw? (Section 5)
10. **Swagger** — `@ApiTags`, `@ApiBearerAuth`, `@TenantApiHeader`, `ParseUUIDPipe` on all UUID params? (Section 11)
11. **Redis invalidation** — Any service method touching `ClRole` or `ClAuthorization` calls `invalidateRole()`? Backoffice `BoRole` changes trigger cross-tenant invalidation? (Section 15)
