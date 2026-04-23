# NestJS Dev — Coding Principles

Apply every rule in this document when writing or reviewing NestJS/TypeScript code. Rules marked **[CONFIRMED]** are extracted from the existing codebase. Rules marked **[PROPOSED — awaiting validation]** are best-practice recommendations not yet standardised.

---

## 1. TypeScript Strictness

### Strict mode — always on **[CONFIRMED]**

`tsconfig.json` has `strict: true`, `strictNullChecks: true`, `noImplicitAny: true`. Never disable or bypass these with `// @ts-ignore` or `any`.

### Definite assignment `!` for class fields **[CONFIRMED]**

Use `!` on class fields that TypeScript cannot infer are always assigned, including all DTO fields and entity columns:

```typescript
@IsString()
@IsDefined()
firstName!: string;

@Column({ name: 'name', type: 'varchar' })
name!: string;
```

Never use `= undefined` as a workaround. Use `?` only when the field is truly optional.

### `import type` for type-only imports **[CONFIRMED]**

When importing only a type (not a value), use `import type`. This is enforced by ESLint and keeps runtime bundle clean:

```typescript
import type { CreateClientDto } from './dto/create-client.dto';
import type { UpdateProductDto } from './dto/update-products.dto';
```

Use regular `import` when importing classes that are used as values (instantiated, called as functions, passed to `instanceof`).

### `satisfies` for type-safe maps **[CONFIRMED]**

Use `satisfies` instead of a type annotation when you want both type-safety and literal type inference:

```typescript
const CREATE_CLIENT_DTO_MAP = {
  [CLIENT_TYPES.INDIVIDUAL]: CreateParticulierClientDto,
  [CLIENT_TYPES.PROFESSIONAL]: CreateProfessionnelClientDto,
} satisfies Record<ClientType, ClassConstructor<object>>;
```

### `as const` for tuple and literal narrowing **[CONFIRMED]**

Use `as const` when passing arrays to `OmitType`/`PickType` or when you need a literal tuple type:

```typescript
export class CreateParticulierClientDto extends OmitType(CreateClientDto, [
  'companyName',
  'taxId',
] as const) {}
```

### Optional chaining `?.` and nullish coalescing `??` **[CONFIRMED]**

Always prefer `?.` over manual null checks and `??` over `||` for default values (avoids treating `0` and `''` as falsy):

```typescript
const userTenantIds = user.tenantMemberships?.map((m) => m.tenant.id) ?? [];
const page = query.page ?? 1;
const limit = query.limit ?? 10;
```

### Never use `any` **[CONFIRMED]**

`noImplicitAny` is enabled. When you need an escape hatch, use `unknown` and narrow with guards, or use a specific union type. The only accepted use of `any` is inside private pipe internals where TypeORM forces it (e.g. `{ where: { id } as never }`).

### Generics for reusable helpers **[CONFIRMED]**

When a private helper is reusable across entity types, type it with a generic constraint:

```typescript
private async ensureExists<T extends { id: string }>(
  repo: Repository<T>,
  id: string,
  entityName: string,
): Promise<T> {
  const item = await repo.findOne({ where: { id } as never });
  if (!item) throw new NotFoundException(`${entityName} with id ${id} not found`);
  return item;
}
```

### Discriminated unions for polymorphic types **[CONFIRMED]**

Use union types with a shared discriminator field. Never use a single class with all optional fields when the types are clearly distinct:

```typescript
export type CreateProductDto =
  | CreateFrameProductDto
  | CreateLensProductDto
  | CreateContactLensProductDto;
```

---

## 2. Imports & Module Organisation

### Import order **[CONFIRMED]**

Follow this exact order, enforced by `eslint-plugin-simple-import-sort`:

1. External packages (`@nestjs/*`, `typeorm`, `class-validator`, etc.)
2. Internal path aliases (`@lib/shared`, `@lib/shared/*`)
3. Relative imports (`./clients.service`, `./dto`)
4. Type-only imports (`import type { ... }`)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TenantRepositoryFactory } from '@lib/shared';
import { ClClient } from '@lib/shared/entities/client/clients.client.entity';

import { ClientsService } from './clients.service';
import type { CreateClientDto } from './dto/create-client.dto';
```

### Barrel exports via `index.ts` **[CONFIRMED]**

Every feature folder must have an `index.ts` that re-exports everything public:

```typescript
// src/apps/client/features/clients/index.ts
export * from './clients.controller';
export * from './clients.module';
export * from './clients.service';
export * from './dto';
```

### Path aliases — never relative `../../` for shared code **[CONFIRMED]**

Always use `@lib/shared` for imports from the shared library. Never use deep relative paths like `../../../../libs/shared/src/...`:

```typescript
// Correct
import { TenantRepositoryFactory, JwtAuthGuard } from '@lib/shared';

// Wrong
import { TenantRepositoryFactory } from '../../../../libs/shared/src';
```

---

## 3. File Naming

| Artifact           | Convention                           | Example                            |
| ------------------ | ------------------------------------ | ---------------------------------- |
| All files          | kebab-case                           | `create-client.dto.ts`             |
| Feature module     | `{name}.module.ts`                   | `clients.module.ts`                |
| Controller         | `{name}.controller.ts`               | `clients.controller.ts`            |
| Service            | `{name}.service.ts`                  | `clients.service.ts`               |
| DTO                | `{action}-{name}.dto.ts`             | `create-client.dto.ts`             |
| Pipe               | `{action}-{name}-validation.pipe.ts` | `create-client-validation.pipe.ts` |
| Guard              | `{name}.guard.ts`                    | `tenant.guard.ts`                  |
| Helper functions   | `{name}.helper.ts`                   | `clients.helper.ts`                |
| Enum/constant file | `{name}.enum.ts`                     | `product.client.enum.ts`           |
| Config file        | `{name}.config.ts`                   | `app.config.ts`                    |

**DTO files must live in subdirectories — never at the `dto/` root:**

```text
dto/
  request/    ← CreateXxxDto, UpdateXxxDto, QueryXxxDto
  response/   ← XxxResponseDto, XxxListResponseDto
```

This is a mandatory architectural rule defined in `backend-architect` Section 5.

---

## 4. Class & Symbol Naming

| Symbol          | Convention       | Example                                 |
| --------------- | ---------------- | --------------------------------------- |
| Class           | PascalCase       | `ClientsService`, `TenantGuard`         |
| Method          | camelCase        | `createClient`, `findAll`               |
| Variable        | camelCase        | `clientRepo`, `familyGroupRepo`         |
| Constant        | UPPER_SNAKE_CASE | `STOCK_ITEM_STATUSES`, `TENANT_HEADER`  |
| Enum value      | UPPER_SNAKE_CASE | `CLIENT_TYPES.INDIVIDUAL`               |
| Injection token | UPPER_SNAKE_CASE | `BACKOFFICE_CONNECTION`, `REDIS_CLIENT` |

---

## 5. Module Definition

### Standard module structure **[CONFIRMED]**

```typescript
@Module({
  imports: [ConfigModule, BoDatabaseModule, PassportModule, SharedJwtModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
```

- `imports` — other modules this module depends on
- `controllers` — only controllers, never services
- `providers` — services, guards, pipes, factories registered here
- `exports` — only what other modules need; never export everything by default

### `forRootAsync` for config-dependent modules **[CONFIRMED]**

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) =>
    getDBSourceOptions(configService),
  inject: [ConfigService],
});
```

### `@Global()` only for true cross-cutting infrastructure **[CONFIRMED]**

Use `@Global()` only for modules that virtually every feature needs (tenancy context, Redis, database connections). Never mark feature modules as global.

### Middleware via `NestModule` + `MiddlewareConsumer` **[CONFIRMED]**

```typescript
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
```

---

## 6. Dependency Injection

### Always `private readonly` in constructor **[CONFIRMED]**

```typescript
@Injectable()
export class ClientsService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}
}
```

Never use `protected` or `public` for injected dependencies.

### `@Inject()` with a token for non-class dependencies **[CONFIRMED]**

When injecting a `DataSource` or any value registered with a string/symbol token:

```typescript
constructor(
  @Inject(BACKOFFICE_CONNECTION)
  private readonly boConnection: DataSource,
  private readonly configService: ConfigService,
) {}
```

### Repository initialisation in constructor body **[CONFIRMED]**

When a service needs multiple repositories from the same `DataSource`, declare them as `private readonly` class fields and assign in the constructor:

```typescript
@Injectable()
export class UsersService {
  private readonly userRepository: Repository<BoUser>;
  private readonly tenantRepository: Repository<BoTenant>;

  constructor(
    @Inject(BACKOFFICE_CONNECTION)
    private readonly boConnection: DataSource,
  ) {
    this.userRepository = this.boConnection.getRepository(BoUser);
    this.tenantRepository = this.boConnection.getRepository(BoTenant);
  }
}
```

---

## 7. Services

### `@Injectable()` on every service **[CONFIRMED]**

### Small, single-responsibility private methods **[CONFIRMED]**

Extract every distinct business check into a named private method. Never inline multiple concerns in one public method:

```typescript
async createClient(dto: CreateClientDto) {
  return this.tenantRepoFactory.executeInTransaction(async (manager) => {
    await this.ensureIceUnique(manager, dto.ice);
    await this.validateSponsor(manager, dto.sponsorId);
    const client = await this.buildClientEntity(manager, dto);
    return manager.getRepository(ClClient).save(client);
  });
}

private async ensureIceUnique(manager: EntityManager, ice?: string) { ... }
private async validateSponsor(manager: EntityManager, sponsorId?: string) { ... }
private buildClientEntity(manager: EntityManager, dto: CreateClientDto) { ... }
```

### Logger — never `console.log` **[CONFIRMED]**

Use `Logger` from `@nestjs/common`. Instantiate once per class using `ClassName.name` so logs include the class:

```typescript
private readonly logger = new Logger(ClientsService.name);

// Usage
this.logger.warn('Failed to fetch role', { userId, tenantId });
this.logger.error('Unexpected error', error instanceof Error ? error.stack : String(error));
```

Never use `console.log`, `console.warn`, or `console.error` in service, guard, or controller code.

### Error re-throw pattern **[CONFIRMED]**

When wrapping async logic in try/catch, always re-throw `HttpException` instances as-is so the correct HTTP status propagates:

```typescript
try {
  return await this.tenantRepoFactory.executeInTransaction(async (manager) => {
    // ...
  });
} catch (error) {
  if (error instanceof HttpException) throw error;
  throw new BadRequestException('Failed to create client');
}
```

### `Promise.all` for independent parallel operations **[CONFIRMED]**

Never `await` sequentially when operations are independent:

```typescript
// Correct
const [accessToken, refreshToken] = await Promise.all([
  this.jwtService.signAsync(payload),
  this.generateRefreshToken(payload),
]);

// Wrong — sequential for no reason
const accessToken = await this.jwtService.signAsync(payload);
const refreshToken = await this.generateRefreshToken(payload);
```

### Always `async/await` — never `.then()` chains **[CONFIRMED]**

All async code uses `async/await`. `.then()` chains are not allowed.

### Helper functions in `.helper.ts` **[CONFIRMED]**

Pure functions that transform data (entity ↔ DTO mapping, validation helpers) live in a `{feature}.helper.ts` file alongside the service, not inside the service class:

```typescript
// clients.helper.ts
export function toClientResponse(client: ClClient): Record<string, unknown> { ... }
export function toClientEntityPayload(dto: CreateClientDto): Partial<ClClient> { ... }
export async function ensureIceUnique(repo: Repository<ClClient>, ice?: string) { ... }
```

---

## 8. Controllers

### No business logic in controllers **[CONFIRMED]**

Controllers only: receive the request → call a service method → return the result. Zero business logic, zero database access, zero exception throwing beyond what pipes/guards do.

### `@UseGuards` at class level **[CONFIRMED]**

Apply guards at the class level so they apply to all endpoints. Add extra guards at method level only when a specific endpoint needs stricter access:

```typescript
@ApiTags('Clients')
@ClientController('clients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@TenantApiHeader()
export class ClientsController { ... }
```

### `ParseUUIDPipe` on every UUID path param **[CONFIRMED]**

```typescript
@Get(':id')
async findOne(@Param('id', ParseUUIDPipe) id: string) { ... }

@Patch(':id')
async update(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateClientDto,
) { ... }
```

### Swagger documentation on every endpoint **[CONFIRMED]**

Every endpoint must have at minimum `@ApiOperation({ summary })`. Polymorphic bodies need `@ApiBody({ schema: { oneOf: [...] } })` and `@ApiExtraModels(...)` on the class:

```typescript
@ApiExtraModels(CreateParticulierClientDto, CreateProfessionnelClientDto)
@ClientController('clients')
export class ClientsController {
  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiBody({ schema: { oneOf: [{ $ref: getSchemaPath(CreateParticulierClientDto) }, ...] } })
  @ApiCreatedResponse({ description: 'Client created', schema: { oneOf: [...] } })
  async create(...) { ... }
}
```

---

## 9. DTOs

### `@IsDefined()` not `@IsNotEmpty()` for required fields **[CONFIRMED]**

`@IsNotEmpty()` rejects `0`, `false`, and `[]` — use `@IsDefined()` for required fields that may legitimately be those values:

```typescript
@IsString()
@IsDefined()
firstName!: string;

@IsNumber()
@IsDefined()
coefficient!: number; // would fail @IsNotEmpty() when 0
```

### `@IsOptional()` paired with `?` field type **[CONFIRMED]**

```typescript
@IsString()
@IsOptional()
phone?: string;
```

### `@ValidateIf()` for conditional required fields **[CONFIRMED]**

```typescript
@ValidateIf((o) => o.pricingMode === 'coefficient')
@IsNumber()
@IsDefined()
coefficient?: number;

@ValidateIf((o) => o.type === CLIENT_TYPES.PROFESSIONAL)
@IsString()
@IsDefined()
companyName?: string;
```

### `@ValidateNested()` + `@Type()` for nested DTOs **[CONFIRMED]**

```typescript
@IsOptional()
@ValidateNested()
@Type(() => ConventionDto)
convention?: ConventionDto;
```

### Custom `@ValidatorConstraint` for complex cross-field rules **[CONFIRMED]**

```typescript
@ValidatorConstraint({ name: 'pricingModeParameters', async: false })
class PricingModeParametersConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as CreateProductBaseDto;
    return validatePricingModeParameters(obj);
  }
  defaultMessage(args: ValidationArguments): string {
    return getPricingModeParametersErrorMessage(
      args.object as CreateProductBaseDto,
    );
  }
}
```

### `OmitType` / `PartialType` / `PickType` from `@nestjs/swagger` **[CONFIRMED]**

Always import from `@nestjs/swagger`, not from `@nestjs/mapped-types`, to preserve Swagger metadata:

```typescript
import { OmitType, PartialType, PickType } from '@nestjs/swagger';

export class CreateParticulierClientDto extends OmitType(CreateClientDto, [
  'companyName',
] as const) {}
export class UpdateClientDto extends PartialType(CreateClientDto) {}
```

### `@Transform()` for query parameter coercion **[CONFIRMED]**

Query parameters arrive as strings. Use `@Transform()` to coerce them before validation:

```typescript
@IsBoolean()
@IsOptional()
@Transform(({ value }): boolean => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value as boolean;
})
active?: boolean;
```

### `@ApiProperty()` on every DTO field including optional ones **[CONFIRMED]**

All fields — required and optional — must have `@ApiProperty()` or `@ApiPropertyOptional()` with an `example`:

```typescript
@ApiProperty({ example: 'Alami' })
@IsString()
@IsDefined()
lastName!: string;

@ApiPropertyOptional({ example: '0612345678' })
@IsString()
@IsOptional()
phone?: string;
```

---

## 10. TypeORM Patterns

### `repo.merge()` for partial updates **[CONFIRMED]**

Never spread or assign DTO fields manually onto an entity. Use `merge()` to produce a patched copy without mutating the original:

```typescript
const existing = await repo.findOne({ where: { id } });
if (!existing) throw new NotFoundException(`Entity ${id} not found`);
const merged = repo.merge(existing, toEntityPayload(dto));
return repo.save(merged);
```

### `softDelete()` — never hard delete domain entities **[CONFIRMED]**

```typescript
await productRepo.softDelete(id);
```

`remove()` is only acceptable for junction/pivot records (e.g. removing a contact from a client where the relation itself must be destroyed).

### `createQueryBuilder` for dynamic filters and pagination **[CONFIRMED]**

Use `find()` / `findOne()` for simple lookups. Switch to `createQueryBuilder` when filters are conditional or pagination is needed:

```typescript
const qb = clientRepo.createQueryBuilder('client');

if (query.active !== undefined) {
  qb.andWhere('client.active = :active', { active: query.active });
}
if (query.search) {
  qb.andWhere(
    '(client.lastName ILIKE :search OR client.firstName ILIKE :search)',
    { search: `%${query.search}%` },
  );
}

const total = await qb.getCount();
const page = query.page ?? 1;
const limit = query.limit ?? 10;

const data = await qb
  .orderBy('client.createdAt', 'DESC')
  .skip((page - 1) * limit)
  .take(limit)
  .getMany();

return {
  data: data.map(toClientResponse),
  meta: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasPrev: page > 1,
    hasNext: page < Math.ceil(total / limit),
  },
};
```

### `In()` operator for array conditions **[CONFIRMED]**

```typescript
import { In } from 'typeorm';

const count = await stockItemRepo.count({
  where: {
    productId: id,
    status: In([STOCK_ITEM_STATUSES.ACTIVE, STOCK_ITEM_STATUSES.RESERVED]),
  },
});
```

### `getRepositories()` helper for services with many repos **[CONFIRMED]**

When a single service method needs more than two repositories, extract them via a private helper to avoid repeating `manager.getRepository()` calls:

```typescript
private getRepositories(manager: EntityManager) {
  return {
    clientRepo: manager.getRepository(ClClient),
    familyGroupRepo: manager.getRepository(ClFamilyGroup),
    conventionRepo: manager.getRepository(ClConvention),
  };
}
```

---

## 11. Error Handling

### Three-way error decision

| Exception                      | Rule                                         |
| ------------------------------ | -------------------------------------------- |
| `BadRequestException`          | Input can't be accepted as a valid request   |
| `ConflictException`            | Input valid but current state prevents it    |
| `UnprocessableEntityException` | Input understood, domain rule rejects it     |
| `NotFoundException`            | Resource doesn't exist or user has no access |
| `UnauthorizedException`        | No valid auth token                          |
| `ForbiddenException`           | Authenticated but lacks permission           |
| `InternalServerErrorException` | Unexpected server error — always log         |

---

### Specific error codes — mandatory on every thrown exception

Every thrown exception **must** include a `errorCode` from the typed constants. This allows the frontend to map each case to a translated message independently from the HTTP status.

#### Response shape the frontend receives

```json
{
  "status": 404,
  "errorCode": "404_USER_NOT_FOUND",
  "message": "User with id abc-123 not found",
  "errors": [],
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

- `status` — standard HTTP code, used for general error category handling
- `errorCode` — specific typed string, used as the i18n translation key on the frontend
- `message` — raw backend message, useful for developers and logs
- `errors` — array of field-level validation errors (only populated for `BadRequestException` from `ValidationPipe`)

#### Error code format

```text
{HTTP_STATUS}_{DOMAIN}_{REASON}
```

All caps, underscore-separated. The HTTP status prefix makes the code self-describing:

```text
404_USER_NOT_FOUND
409_CLIENT_ICE_DUPLICATE
401_INVALID_CREDENTIALS
403_TENANT_ACCESS_DENIED
422_PRICING_MODE_INVALID
400_TENANT_HEADER_MISSING
```

#### Error code constants — location and pattern

All error codes live in `libs/shared/src/constants/error-codes.ts`, following the project's `as const` enum pattern (see `nestjs-dev` Section 14):

```typescript
// libs/shared/src/constants/error-codes.ts
import { ExtractEnumTypes } from '@lib/shared/helpers';

export const ERROR_CODES = {
  // 400 — Bad Request
  TENANT_HEADER_MISSING: '400_TENANT_HEADER_MISSING',
  INVALID_UUID_FORMAT: '400_INVALID_UUID_FORMAT',

  // 401 — Unauthorized
  INVALID_CREDENTIALS: '401_INVALID_CREDENTIALS',
  TOKEN_EXPIRED: '401_TOKEN_EXPIRED',
  TOKEN_INVALID: '401_TOKEN_INVALID',

  // 403 — Forbidden
  TENANT_ACCESS_DENIED: '403_TENANT_ACCESS_DENIED',
  ADMIN_ROLE_REQUIRED: '403_ADMIN_ROLE_REQUIRED',
  INSUFFICIENT_PERMISSIONS: '403_INSUFFICIENT_PERMISSIONS',

  // 404 — Not Found
  USER_NOT_FOUND: '404_USER_NOT_FOUND',
  TENANT_NOT_FOUND: '404_TENANT_NOT_FOUND',
  PRODUCT_NOT_FOUND: '404_PRODUCT_NOT_FOUND',
  ROLE_NOT_FOUND: '404_ROLE_NOT_FOUND',
  ROLE_AUTHORIZATIONS_NOT_FOUND: '404_ROLE_AUTHORIZATIONS_NOT_FOUND',

  // 409 — Conflict
  USER_EMAIL_DUPLICATE: '409_USER_EMAIL_DUPLICATE',
  CLIENT_ICE_DUPLICATE: '409_CLIENT_ICE_DUPLICATE',
  PRODUCT_ACTIVE_STOCK_EXISTS: '409_PRODUCT_ACTIVE_STOCK_EXISTS',

  // 422 — Unprocessable
  PRICING_MODE_INVALID: '422_PRICING_MODE_INVALID',
  FAMILY_GROUP_RULE_VIOLATED: '422_FAMILY_GROUP_RULE_VIOLATED',
} as const;

export type ErrorCode = ExtractEnumTypes<typeof ERROR_CODES>;
```

Add new codes to this file as new features are built. Never hardcode the string at the throw site.

#### How to throw — always pass an object with `errorCode`

Never throw with a plain string — that loses the `errorCode` field:

```typescript
// Wrong — no errorCode, frontend cannot map this
throw new NotFoundException(`User with id ${id} not found`);

// Correct
throw new NotFoundException({
  message: `User with id ${id} not found`,
  errorCode: ERROR_CODES.USER_NOT_FOUND,
});

throw new ConflictException({
  message: `A client with ICE ${ice} already exists`,
  errorCode: ERROR_CODES.CLIENT_ICE_DUPLICATE,
});

throw new UnauthorizedException({
  message: 'Invalid credentials',
  errorCode: ERROR_CODES.INVALID_CREDENTIALS,
});
```

#### `HttpExceptionFilter` — reads `errorCode` from the response object

The global filter extracts `errorCode` from the thrown response object and includes it in the serialized output:

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = exception.getStatus?.() ?? 500;

    const exceptionResponse = exception.getResponse() as {
      errorCode?: string;
      message?: string | string[];
    };

    const isValidationError = Array.isArray(exceptionResponse?.message);

    response.status(statusCode).json({
      status: statusCode,
      errorCode: exceptionResponse?.errorCode ?? null,
      message: isValidationError
        ? 'Validation failed'
        : (exceptionResponse?.message ?? exception.message),
      errors: isValidationError ? exceptionResponse.message : [],
      timestamp: new Date().toISOString(),
    });
  }
}
```

`errorCode` is `null` only for unexpected `InternalServerErrorException` cases where no code is set — the frontend treats `null` as a generic fallback.

---

## 12. Async & Control Flow

### Early return to reduce nesting **[CONFIRMED]**

```typescript
// Correct
if (!user) throw new NotFoundException('User not found');
const roles = await this.getRoles(user.id);
return roles;

// Wrong — unnecessary else
if (!user) {
  throw new NotFoundException('User not found');
} else {
  const roles = await this.getRoles(user.id);
  return roles;
}
```

### `const` everywhere, never `let` unless reassignment is needed **[CONFIRMED]**

---

## 13. Proposed Principles — Validate Before Adopting

The following principles are NestJS/TypeScript best practices not yet standardised in the codebase. **Ask for confirmation before applying them.**

---

### P1 — Explicit return types on all public service methods

Adding explicit return types makes API contracts visible at a glance and catches accidental shape changes at compile time:

```typescript
// Without (current)
async createClient(dto: CreateClientDto) { ... }

// Proposed
async createClient(dto: CreateClientDto): Promise<ClientResponseDto> { ... }
```

> Do you want all public service and controller methods to have explicit return types?

---

### P2 — Response mapper functions always return typed DTOs, not `Record<string, unknown>`

`toClientResponse()` currently returns `Record<string, unknown>`. The proposal is to return a typed union instead so callers get type safety:

```typescript
// Current
export function toClientResponse(client: ClClient): Record<string, unknown>;

// Proposed
export function toClientResponse(
  client: ClClient,
): ClientParticulierResponseDto | ClientProfessionnelResponseDto;
```

> Do you want mapper functions to return typed DTOs instead of `Record<string, unknown>`?

---

### P3 — One `@ApiProperty` example value per field must be realistic

Currently some fields have placeholder examples. The proposal is that every `example` value must match what a real valid value looks like (correct format, realistic data):

```typescript
// Wrong
@ApiProperty({ example: 'string' })

// Correct
@ApiProperty({ example: 'Alami' })
@ApiProperty({ example: '0612345678' })
@ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
```

> Do you want to enforce realistic `example` values as a code review rule?

---

### P4 — Events via `@nestjs/event-emitter` for post-write side effects

You already have `@nestjs/event-emitter` installed. The proposal: any time a service write triggers a side effect in another domain (e.g. "role updated → invalidate Redis cache"), emit a typed event instead of calling the cache service directly. This keeps service boundaries clean:

```typescript
// Instead of calling cache service directly inside roles service:
this.eventEmitter.emit('role.updated', new RoleUpdatedEvent(tenantId, roleId));

// A listener in the cache module handles invalidation:
@OnEvent('role.updated')
async handleRoleUpdated(event: RoleUpdatedEvent) {
  await this.roleAuthorizationCache.invalidateRole(event.tenantId, event.roleId);
}
```

> Do you want to adopt the event emitter pattern for cross-domain side effects?

---

### P5 — `@Expose()` + `ClassSerializerInterceptor` instead of manual mapper functions

`ClassSerializerInterceptor` is already registered globally. The proposal is to use `@Expose()` on response DTO fields and `@Exclude()` at entity level instead of writing `toClientResponse()` helper functions:

```typescript
// On entity
@Exclude()
export class ClClient extends BaseEntity { ... }

// On response DTO
export class ClientResponseDto {
  @Expose() id!: string;
  @Expose() firstName!: string;
  // sensitive fields simply not listed → not exposed
}

// Service returns entity, interceptor handles transformation
return plainToInstance(ClientResponseDto, entity, { excludeExtraneousValues: true });
```

> Do you want to standardise on `@Expose()` / `plainToInstance()` instead of custom mapper functions?

---

### P6 — `enum` classes for TypeORM columns, not raw `string` arrays

Currently some entities store enums as `varchar` columns with no DB-level constraint. The proposal is to use PostgreSQL native enums for fields where the value set is fixed:

```typescript
// Current
@Column({ name: 'status', type: 'varchar' })
status!: string;

// Proposed
@Column({ name: 'status', type: 'enum', enum: StockItemStatus, enumName: 'stock_item_status' })
status!: StockItemStatus;
```

> Do you want to enforce native PostgreSQL enums for fixed-value status columns?

---

## 14. Enum Pattern — `as const` Object, Never TypeScript `enum`

**[CONFIRMED]** Never use the TypeScript/JavaScript `enum` keyword. Always use a `const` object with `as const` and derive the type using `ExtractEnumTypes`.

### Why not `enum`

- TypeScript `enum` compiles to an IIFE with a reverse-mapping object — unexpected runtime behaviour
- Numeric enums allow implicit `0` / `1` assignments with no type error
- String enums cannot be iterated at runtime without extra boilerplate
- `as const` objects are plain JS — no hidden runtime output, fully tree-shakeable

### The pattern — three exports per enum **[CONFIRMED]**

```typescript
import { ExtractEnumTypes } from '@lib/shared/helpers';

// 1. The constant object — UPPER_SNAKE_CASE key, string value
export const PRODUCT_TYPES = {
  FRAME: 'frame',
  LENS: 'lens',
  CONTACT_LENS: 'contact_lens',
  CLIPON: 'clipon',
  ACCESSORY: 'accessory',
} as const;

// 2. The values array — for @IsEnum() validator and Swagger enums
export const ProductTypeValues = Object.values(PRODUCT_TYPES);

// 3. The derived type — for TypeScript type annotations
export type ProductType = ExtractEnumTypes<typeof PRODUCT_TYPES>;
```

`ExtractEnumTypes` is defined in `libs/shared/src/helpers/types.helper.ts`:

```typescript
export type ExtractEnumTypes<T extends Record<string, string>> = T[keyof T];
// resolves to: 'frame' | 'lens' | 'contact_lens' | 'clipon' | 'accessory'
```

### Usage across the codebase

**In a DTO — use the values array for `@IsEnum()` and the type for the field:**

```typescript
@ApiProperty({ enum: ProductTypeValues, example: PRODUCT_TYPES.FRAME })
@IsEnum(ProductTypeValues)
@IsString()
@IsDefined()
productType!: ProductType;
```

**In a discriminated union DTO — narrow the type to a single literal:**

```typescript
export class CreateFrameProductDto extends CreateProductBaseDto {
  @ApiProperty({ enum: [PRODUCT_TYPES.FRAME], example: PRODUCT_TYPES.FRAME })
  @IsString()
  @IsDefined()
  productType!: typeof PRODUCT_TYPES.FRAME; // literal 'frame', not the full union
}
```

**In a service or guard — always reference the constant, never hardcode the string:**

```typescript
// Correct
if (client.type === CLIENT_TYPES.INDIVIDUAL) { ... }
status: In([STOCK_ITEM_STATUSES.ACTIVE, STOCK_ITEM_STATUSES.RESERVED])

// Wrong — magic string, no type safety
if (client.type === 'individual') { ... }
```

**In a `satisfies` map — the type constraint uses the derived type as a key:**

```typescript
const CREATE_PRODUCT_DTO_MAP = {
  [PRODUCT_TYPES.FRAME]: CreateFrameProductDto,
  [PRODUCT_TYPES.LENS]: CreateLensProductDto,
} satisfies Record<ProductType, ClassConstructor<object>>;
```

### File naming and location

All enums live in `libs/shared/src/enums/` under either `backoffice/` or `client/`, following the schema prefix rule:

```text
libs/shared/src/enums/
  client/
    product.client.enum.ts   ← PRODUCT_TYPES, ProductType, ProductTypeValues
    stock.client.enum.ts     ← STOCK_ITEM_STATUSES, StockItemStatus, StockItemStatusValues
    users.client.enum.ts
  backoffice/
    users.bo.enum.ts
```

Each file exports the constant object, the values array, and the derived type — nothing else.
