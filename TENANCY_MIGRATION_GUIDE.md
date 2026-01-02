# AsyncLocalStorage Tenancy Migration Guide

## Overview

The application has been refactored to use **AsyncLocalStorage (ALS)** for tenant context management, eliminating the need for request-scoped providers in the client module. All controllers and services are now **singleton-scoped**, improving performance and reducing memory overhead.

## What Changed

### Before (Request-Scoped)

```typescript
@Injectable({ scope: Scope.REQUEST })
export class MyClientService {
  private readonly repo: Repository<MyEntity>;

  constructor(@Inject(CLIENT_CONNECTION) connection: DataSource) {
    this.repo = connection.getRepository(MyEntity);
  }

  async findSomething() {
    return this.repo.find();
  }
}
```

### After (Singleton with ALS)

```typescript
@Injectable()
export class MyClientService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async findSomething() {
    const repo = await this.tenantRepoFactory.repo(MyEntity);
    return repo.find();
  }
}
```

## Architecture

### 1. TenantContext

Wraps AsyncLocalStorage to manage tenant context throughout the request lifecycle.

**Methods:**

- `run(tenantId, fn)` - Execute function within tenant context
- `getTenantId()` - Get current tenant ID (throws if not in context)
- `hasTenantContext()` - Check if context exists

### 2. TenantContextMiddleware

Extracts `tenantId` from request headers and establishes context.

**Supported Headers:**

- `tenantid`
- `tenant-id`
- `x-tenant-id`

**Validation:**

- Must match regex: `/^[a-zA-Z0-9_-]{1,64}$/`
- Throws `BadRequestException` if missing or invalid

### 3. TenantDataSourceManager

Manages per-tenant DataSource instances with lazy initialization and caching.

**Features:**

- Thread-safe connection pooling using `Map<string, Promise<DataSource>>`
- Automatic schema validation and initialization
- Connection reuse across requests
- Increased pool size (10 connections per tenant)

### 4. TenantRepositoryFactory

Provides repositories from the current tenant's DataSource.

**Methods:**

- `getRepository<Entity>(Entity)` - Get repository for entity
- `repo<Entity>(Entity)` - Shorthand alias

## Migration Steps

### Step 1: Remove Request Scope from Services

**Before:**

```typescript
@Injectable({ scope: Scope.REQUEST })
export class MyService {
  constructor(@Inject(CLIENT_CONNECTION) connection: DataSource) {
    // ...
  }
}
```

**After:**

```typescript
@Injectable()
export class MyService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}
}
```

### Step 2: Remove Request Scope from Controllers

**Before:**

```typescript
@Injectable({ scope: Scope.REQUEST })
@ClientController('endpoint')
export class MyController {
  // ...
}
```

**After:**

```typescript
@ClientController('endpoint')
export class MyController {
  // ...
}
```

### Step 3: Update Repository Access

Replace constructor-injected repositories with factory calls inside methods.

**Before:**

```typescript
@Injectable({ scope: Scope.REQUEST })
export class UserService {
  private readonly userRepo: Repository<ClUser>;

  constructor(@Inject(CLIENT_CONNECTION) connection: DataSource) {
    this.userRepo = connection.getRepository(ClUser);
  }

  async findUser(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }
}
```

**After:**

```typescript
@Injectable()
export class UserService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async findUser(id: string) {
    const userRepo = await this.tenantRepoFactory.repo(ClUser);
    return userRepo.findOne({ where: { id } });
  }
}
```

### Step 4: Update Feature Modules

Import `TenancyModule` (it's global, so only needed if you use its exports directly):

```typescript
@Module({
  imports: [TenancyModule], // Optional if @Global() is set
  controllers: [MyController],
  providers: [MyService],
})
export class MyFeatureModule {}
```

### Step 5: Register Middleware (Already Done in ClientModule)

```typescript
@Module({
  imports: [TenancyModule, AuthModule, UsersModule],
})
export class ClientModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
```

## Advanced Usage

### Accessing Tenant ID Directly

```typescript
@Injectable()
export class MyService {
  constructor(private readonly tenantContext: TenantContext) {}

  async doSomething() {
    const tenantId = this.tenantContext.getTenantId();
    console.log(`Processing for tenant: ${tenantId}`);
  }
}
```

### Manual DataSource Access

```typescript
@Injectable()
export class MyService {
  constructor(private readonly dataSourceManager: TenantDataSourceManager) {}

  async runRawQuery() {
    const dataSource = await this.dataSourceManager.getDataSource();
    return dataSource.query('SELECT * FROM custom_table');
  }
}
```

### Working with Multiple Repositories

```typescript
@Injectable()
export class OrderService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async createOrder(data: CreateOrderDto) {
    // Get multiple repositories
    const orderRepo = await this.tenantRepoFactory.repo(ClOrder);
    const productRepo = await this.tenantRepoFactory.repo(ClProduct);
    const inventoryRepo = await this.tenantRepoFactory.repo(ClInventory);

    // Use them in transaction
    const order = await orderRepo.save({ ...data });
    await productRepo.update(data.productId, { stock: () => 'stock - 1' });
    await inventoryRepo.insert({ orderId: order.id, ... });

    return order;
  }
}
```

## Benefits

✅ **Performance:** Singleton providers are instantiated once, not per-request
✅ **Memory:** Reduced memory footprint (no duplicate service instances)
✅ **Connection Pooling:** Better database connection reuse
✅ **Cleaner Code:** No more `{ scope: Scope.REQUEST }` boilerplate
✅ **Type Safety:** Full TypeScript support with proper generics
✅ **Testability:** Easier to mock and test singleton services

## Testing

### Unit Tests

```typescript
describe('MyService', () => {
  let service: MyService;
  let mockRepoFactory: jest.Mocked<TenantRepositoryFactory>;

  beforeEach(async () => {
    mockRepoFactory = {
      repo: jest.fn(),
      getRepository: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: TenantRepositoryFactory, useValue: mockRepoFactory },
      ],
    }).compile();

    service = module.get(MyService);
  });

  it('should fetch data from tenant repository', async () => {
    const mockRepo = {
      findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
    };
    mockRepoFactory.repo.mockResolvedValue(mockRepo as any);

    const result = await service.findUser('1');

    expect(mockRepoFactory.repo).toHaveBeenCalledWith(ClUser);
    expect(result).toEqual({ id: '1', name: 'Test' });
  });
});
```

### E2E Tests

```typescript
it('/GET client/users (with tenant)', () => {
  return request(app.getHttpServer())
    .get('/client/users')
    .set('x-tenant-id', 'valid-tenant-id')
    .expect(200);
});

it('/GET client/users (without tenant)', () => {
  return request(app.getHttpServer())
    .get('/client/users')
    .expect(400) // BadRequestException
    .expect((res) => {
      expect(res.body.message).toContain('Tenant ID is required');
    });
});
```

## Troubleshooting

### Error: "Tenant context is not available"

**Cause:** Trying to access `getTenantId()` outside of a request context.

**Solution:** Ensure `TenantContextMiddleware` is applied to the route, or manually wrap code with `tenantContext.run()`.

### Error: "Tenant ID is required"

**Cause:** Missing tenant header in the request.

**Solution:** Include one of the supported headers: `x-tenant-id`, `tenant-id`, or `tenantid`.

### Error: "Invalid Tenant ID format"

**Cause:** Tenant ID doesn't match validation regex.

**Solution:** Ensure tenant ID contains only alphanumeric characters, dashes, or underscores (1-64 chars).

## Next Steps

All new client-side services and controllers should:

1. ✅ Use default singleton scope (no `{ scope: Scope.REQUEST }`)
2. ✅ Inject `TenantRepositoryFactory` instead of `CLIENT_CONNECTION`
3. ✅ Call `repo(Entity)` inside methods, not in constructor
4. ✅ Remove any manual tenantId parameter passing

The backoffice module remains unchanged and continues using singleton providers as before.
