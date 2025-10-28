# 🚀 Quick Start: Custom Plugin Development

> Quick guide to create custom plugin for customers in 15 minutes

---

## 📦 Prerequisites

- Ever-Gauzy platform already setup
- Node.js 18+
- TypeScript knowledge
- NestJS basics

---

## 🎯 Goal

Create custom plugin for **Customer A** with:
- Custom entity: `Inventory`
- Custom permissions: `INVENTORY_VIEW`, `INVENTORY_CREATE`
- Custom API endpoints with authorization
- Seed permissions for roles

---

## ⚡ Step-by-Step Guide

### Step 1: Create Plugin Structure

```bash
# Create plugin directory
mkdir -p custom-plugins/customer-a/src

cd custom-plugins/customer-a

# Initialize package.json
npm init -y

# Install dependencies
npm install @gauzy/plugin @gauzy/core @gauzy/contracts @nestjs/common @nestjs/core typeorm
```

### Step 2: Define Custom Permissions

```typescript
// src/permissions/inventory.permissions.ts
export enum InventoryPermissions {
	INVENTORY_VIEW = 'CUSTOMER_A_INVENTORY_VIEW',
	INVENTORY_CREATE = 'CUSTOMER_A_INVENTORY_CREATE',
	INVENTORY_EDIT = 'CUSTOMER_A_INVENTORY_EDIT',
	INVENTORY_DELETE = 'CUSTOMER_A_INVENTORY_DELETE'
}
```

### Step 3: Create Entity

```typescript
// src/entities/inventory.entity.ts
import { Entity, Column } from 'typeorm';
import { TenantBaseEntity } from '@gauzy/core';
import { ApiProperty } from '@nestjs/swagger';

@Entity('customer_a_inventory')
export class Inventory extends TenantBaseEntity {

	@ApiProperty({ type: () => String })
	@Column()
	name: string;

	@ApiProperty({ type: () => Number })
	@Column({ type: 'integer' })
	quantity: number;

	@ApiProperty({ type: () => Number })
	@Column({ type: 'decimal', precision: 10, scale: 2 })
	price: number;
}
```

### Step 4: Create Service

```typescript
// src/services/inventory.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantAwareCrudService } from '@gauzy/core';
import { Inventory } from '../entities/inventory.entity';

@Injectable()
export class InventoryService extends TenantAwareCrudService<Inventory> {

	constructor(
		@InjectRepository(Inventory)
		private readonly inventoryRepository: Repository<Inventory>
	) {
		super(inventoryRepository);
	}

	// Custom methods here
	async findLowStock(threshold: number = 10) {
		return await this.inventoryRepository.find({
			where: {
				quantity: LessThan(threshold)
			}
		});
	}
}
```

### Step 5: Create Controller

```typescript
// src/controllers/inventory.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
	TenantPermissionGuard,
	PermissionGuard,
	Permissions,
	UUIDValidationPipe
} from '@gauzy/core';
import { InventoryPermissions } from '../permissions/inventory.permissions';
import { InventoryService } from '../services/inventory.service';

@ApiTags('Customer A - Inventory')
@ApiBearerAuth()
@UseGuards(TenantPermissionGuard, PermissionGuard)
@Controller('customer-a/inventory')
export class InventoryController {

	constructor(private readonly service: InventoryService) {}

	@ApiOperation({ summary: 'Get all inventory items' })
	@Get()
	@Permissions(InventoryPermissions.INVENTORY_VIEW)
	async findAll() {
		return await this.service.findAll();
	}

	@ApiOperation({ summary: 'Create inventory item' })
	@Post()
	@Permissions(InventoryPermissions.INVENTORY_CREATE)
	async create(@Body() input: any) {
		return await this.service.create(input);
	}

	@ApiOperation({ summary: 'Update inventory item' })
	@Put(':id')
	@Permissions(InventoryPermissions.INVENTORY_EDIT)
	async update(
		@Param('id', UUIDValidationPipe) id: string,
		@Body() input: any
	) {
		return await this.service.update(id, input);
	}

	@ApiOperation({ summary: 'Delete inventory item' })
	@Delete(':id')
	@Permissions(InventoryPermissions.INVENTORY_DELETE)
	async delete(@Param('id', UUIDValidationPipe) id: string) {
		return await this.service.delete(id);
	}
}
```

### Step 6: Create Module

```typescript
// src/customer-a.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryService } from './services/inventory.service';
import { InventoryController } from './controllers/inventory.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([Inventory])
	],
	controllers: [InventoryController],
	providers: [InventoryService],
	exports: [InventoryService]
})
export class CustomerAModule {}
```

### Step 7: Create Plugin

```typescript
// src/customer-a.plugin.ts
import { GauzyCorePlugin as Plugin, IOnPluginBootstrap } from '@gauzy/plugin';
import { ApplicationPluginConfig } from '@gauzy/common';
import * as chalk from 'chalk';
import { CustomerAModule } from './customer-a.module';
import { Inventory } from './entities/inventory.entity';

@Plugin({
	imports: [CustomerAModule],
	entities: [Inventory],
	configuration: (config: ApplicationPluginConfig) => {
		return config;
	}
})
export class CustomerAPlugin implements IOnPluginBootstrap {

	async onPluginBootstrap(): Promise<void> {
		console.log(chalk.green('🚀 Customer A Plugin loaded successfully!'));
	}
}
```

### Step 8: Register Plugin

```typescript
// apps/api/src/main.ts (or config/plugins.config.ts)
import { CustomerAPlugin } from '@custom-plugins/customer-a';

export const config = {
	// ... other config
	plugins: [
		// Base plugins
		RegistryPlugin,

		// Custom plugins
		CustomerAPlugin  // ⭐ Add this
	]
};
```

### Step 9: Create Permissions Seeder

```typescript
// src/seeds/permissions.seeder.ts
import { Injectable } from '@nestjs/common';
import { RolePermissionsService, RoleService } from '@gauzy/core';
import { RolesEnum } from '@gauzy/contracts';
import { InventoryPermissions } from '../permissions/inventory.permissions';

@Injectable()
export class InventoryPermissionsSeeder {

	constructor(
		private readonly rolePermissionsService: RolePermissionsService,
		private readonly roleService: RoleService
	) {}

	async seed(tenantId: string): Promise<void> {
		// SUPER_ADMIN: All permissions
		await this.grantToRole(
			tenantId,
			RolesEnum.SUPER_ADMIN,
			Object.values(InventoryPermissions)
		);

		// ADMIN: Most permissions
		await this.grantToRole(
			tenantId,
			RolesEnum.ADMIN,
			[
				InventoryPermissions.INVENTORY_VIEW,
				InventoryPermissions.INVENTORY_CREATE,
				InventoryPermissions.INVENTORY_EDIT
			]
		);

		// EMPLOYEE: View only
		await this.grantToRole(
			tenantId,
			RolesEnum.EMPLOYEE,
			[InventoryPermissions.INVENTORY_VIEW]
		);
	}

	private async grantToRole(
		tenantId: string,
		roleName: RolesEnum,
		permissions: string[]
	): Promise<void> {
		const role = await this.roleService.findOne({
			where: { name: roleName, tenantId }
		});

		for (const permission of permissions) {
			await this.rolePermissionsService.create({
				roleId: role.id,
				permission,
				enabled: true,
				tenantId
			});
		}
	}
}
```

### Step 10: Run & Test

```bash
# Build
npm run build

# Run migrations (if needed)
npm run typeorm:migration:run

# Seed permissions
npm run seed:permissions

# Start server
npm run start:dev
```

**Test API:**

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin"}'

# Get inventory (requires INVENTORY_VIEW)
curl http://localhost:3000/api/customer-a/inventory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create inventory (requires INVENTORY_CREATE)
curl -X POST http://localhost:3000/api/customer-a/inventory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product A",
    "quantity": 100,
    "price": 29.99
  }'
```

---

## ✅ Checklist

- [x] Plugin structure created
- [x] Custom permissions defined
- [x] Entity created with tenant isolation
- [x] Service extends TenantAwareCrudService
- [x] Controller with @Permissions decorators
- [x] Module configured
- [x] Plugin registered
- [x] Permissions seeded
- [x] API tested

---

## 🎯 What You've Achieved

✅ **Authorization automatically integrated:**
- JWT validation
- Tenant isolation
- Permission checking
- Role-based access

✅ **Reuse base infrastructure:**
- Guards
- Decorators
- Services
- Database migrations

✅ **Production-ready:**
- Multi-tenant support
- Error handling
- API documentation (Swagger)
- Type safety

---

## 📚 Next Steps

1. **Add more features:**
   - Pagination
   - Filtering
   - Sorting
   - Export

2. **Add tests:**
   - Unit tests
   - Integration tests
   - E2E tests

3. **Advanced permissions:**
   - Row-level security
   - Dynamic permissions
   - Custom permission logic

4. **Frontend integration:**
   - Angular components
   - Permission directives
   - Role-based UI

---

## 🔗 References

- [Full Architecture Guide](./CUSTOM_MODULE_ARCHITECTURE.md)
- [Authorization System](./AUTHORIZATION_SYSTEM.md)
- [Plugin System](../packages/plugin/README.md)
- [NestJS Documentation](https://docs.nestjs.com/)

---

**Congratulations! 🎉**

You have successfully created a custom plugin with full authorization integration in 15 minutes!

````
