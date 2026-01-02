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
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const repo = manager.getRepository(MyEntity);
      return repo.find();
    });
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

**Supported Header:**

- `x-tenant-id`

**Validation:**

- Must match regex: `/^[a-zA-Z0-9_-]{1,64}$/`
- If missing, logs error and continues (doesn't throw exception)
- Throws `BadRequestException` if format is invalid

### 3. TenantDataSourceManager

Manages a single shared DataSource and sets tenant schema at the transaction level.

**Features:**

- Single shared DataSource for all tenants
- Schema set via `SET search_path` per connection
- Automatic schema validation on each request
- Connection pooling handled by TypeORM

### 4. TenantRepositoryFactory

Provides a transaction-based method to execute code within tenant context.

**Method:**

- `executeInTransaction(callback)` - Execute callback within a transaction with tenant schema set

The method receives an `EntityManager` in the callback where you can call `manager.getRepository(Entity)` to access repositories. All operations within the callback are automatically wrapped in a transaction with automatic rollback on error.

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

Replace constructor-injected repositories with context-based callbacks.

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
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      const userRepo = manager.getRepository(ClUser);
      return userRepo.findOne({ where: { id } });
    });
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

### Basic Transaction Example

```typescript
@Injectable()
export class MyService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async updateUserData(userId: string, data: any) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      // All operations here run within a transaction
      // If any operation fails, everything will be rolled back
      const userRepo = manager.getRepository(ClUser);
      const user = await userRepo.findOne({ where: { id: userId } });

      user.name = data.name;
      await userRepo.save(user);

      // Can run raw queries too
      await manager.query(
        'UPDATE audit_log SET updated = true WHERE user_id = $1',
        [userId],
      );

      return user;
    });
  }
}
```

### Working with Multiple Repositories in a Transaction

```typescript
@Injectable()
export class OrderService {
  constructor(private readonly tenantRepoFactory: TenantRepositoryFactory) {}

  async createOrder(data: CreateOrderDto) {
    return this.tenantRepoFactory.executeInTransaction(async (manager) => {
      // All repositories share the same transaction
      const orderRepo = manager.getRepository(ClOrder);
      const productRepo = manager.getRepository(ClProduct);
      const inventoryRepo = manager.getRepository(ClInventory);

      // Create order
      const order = await orderRepo.save({ ...data });

      // Update product stock
      await productRepo.decrement({ id: data.productId }, 'stock', 1);

      // Record inventory change
      await inventoryRepo.insert({
        orderId: order.id,
        productId: data.productId,
      });

      // If any operation fails, all changes are rolled back automatically
      return order;
    });
  }
}
```

## Benefits

✅ **Performance:** Singleton providers are instantiated once, not per-request  
✅ **Memory:** Reduced memory footprint (no duplicate service instances)  
✅ **Single DataSource:** One shared connection pool for all tenants  
✅ **Transaction Safety:** Automatic rollback on errors with `executeInTransaction`  
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
      executeInTransaction: jest.fn(),
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
    const mockManager = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    mockRepoFactory.executeInTransaction.mockImplementation(
      async (callback) => {
        return callback(mockManager as any);
      },
    );

    const result = await service.findUser('1');

    expect(mockManager.getRepository).toHaveBeenCalledWith(ClUser);
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

**Solution:** Include the `x-tenant-id` header in your request.

### Error: "Invalid Tenant ID format"

**Cause:** Tenant ID doesn't match validation regex.

**Solution:** Ensure tenant ID contains only alphanumeric characters, dashes, or underscores (1-64 chars).

## Next Steps

All new client-side services and controllers should:

1. ✅ Use default singleton scope (no `{ scope: Scope.REQUEST }`)
2. ✅ Inject `TenantRepositoryFactory` instead of `CLIENT_CONNECTION`
3. ✅ Use `executeInTransaction()` for all database operations
4. ✅ Call `manager.getRepository(Entity)` inside the callback to access repositories
5. ✅ Remove any manual tenantId parameter passing

The backoffice module remains unchanged and continues using singleton providers as before.
