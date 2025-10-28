# 🏗️ Custom Module Architecture - Multi-Tenant with Custom Plugins

> Architecture design guide for base platform + custom modules per customer

---

## 📋 Table of Contents

- [Analysis of 2 Approaches](#-analysis-of-2-approaches)
- [✅ Recommended: Plugin-Based Architecture](#-recommended-plugin-based-architecture)
- [Implementation Guide](#-implementation-guide)
- [Authorization Integration](#-authorization-integration)
- [Deployment Strategies](#-deployment-strategies)
- [Best Practices](#-best-practices)

---

## 🤔 Analysis of 2 Approaches

### Approach 1: Microservices with Separate Auth

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                           │
│              (Routing + Auth Proxy)                      │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
    ┌────────▼────────┐          ┌───────▼────────────┐
    │  Base Platform  │          │  Custom Module     │
    │  (Ever-Gauzy)   │          │  (Customer A)      │
    │                 │          │                    │
    │  - Auth Service │◄─────────┤  - Custom Logic    │
    │  - Core Modules │          │  - Custom Entities │
    │  - Permissions  │          │  - Custom APIs     │
    └─────────────────┘          └────────────────────┘
```

**Pros:**
- ✅ Complete separation
- ✅ Independent scaling
- ✅ Technology flexibility
- ✅ Isolated failures

**Cons:**
- ❌ Complex auth sync (JWT validation, permission sync)
- ❌ Network latency between services
- ❌ Distributed transactions difficult
- ❌ More infrastructure overhead
- ❌ Duplicate code (guards, decorators, validation)
- ❌ **Consistency issues with permissions**

---

### Approach 2: Plugin-Based (Monolith Extension)

```
┌──────────────────────────────────────────────────────────┐
│            Ever-Gauzy Base Platform                       │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Core System                              │    │
│  │  - Authentication (JWT)                          │    │
│  │  - Authorization (RBAC)                          │    │
│  │  - User/Role/Permission Management               │    │
│  │  - Multi-tenant Context                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Plugin System                            │    │
│  │                                                   │    │
│  │  📦 Customer A Plugin                            │    │
│  │     - Custom Entities                            │    │
│  │     - Custom Controllers (with @Permissions)     │    │
│  │     - Custom Services                            │    │
│  │     - Custom Permissions Registration            │    │
│  │                                                   │    │
│  │  📦 Customer B Plugin                            │    │
│  │     - Different Custom Logic                     │    │
│  │     - Different Permissions                      │    │
│  │                                                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  All plugins share same auth/permission system           │
└──────────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ **Single auth system** - No sync needed
- ✅ **Shared permission system** - Consistent RBAC
- ✅ **Reuse all guards/decorators** - @Permissions(), @Roles()
- ✅ **Single database transaction** - ACID guaranteed
- ✅ **Lower latency** - In-process calls
- ✅ **Simpler deployment** - One application
- ✅ **Ever-Gauzy already has plugin system!**
- ✅ **Tenant isolation** - Built-in multi-tenant

**Cons:**
- ❌ All plugins in same process (resource sharing)
- ❌ Plugin bugs can crash entire app
- ❌ Must restart to load new plugins (can mitigate)
- ❌ Technology locked to NestJS/TypeScript

---

## ✅ Recommended: Plugin-Based Architecture

**Reasons:**

1. **Ever-Gauzy already has powerful Plugin System** - Use it immediately!
2. **Simple authorization integration** - Shared RBAC
3. **Built-in multi-tenant** - Each customer = 1 tenant
4. **Cost-effective** - No complex infrastructure needed
5. **Faster development** - Reuse entire core platform

---

## 🚀 Implementation Guide

### 1. Project Structure

```
ever-gauzy/
├── packages/
│   ├── core/              # Base platform (shared by all)
│   ├── contracts/         # Interfaces
│   ├── plugin/            # Plugin infrastructure
│   └── plugins/           # Official plugins
│       ├── integration-zapier/
│       ├── integration-activepieces/
│       └── registry/
│
└── custom-plugins/        # ⭐ Custom plugins for each customer
    ├── customer-a/
    │   └── src/
    │       ├── customer-a.plugin.ts
    │       ├── entities/
    │       ├── controllers/
    │       ├── services/
    │       └── permissions/
    │           └── custom-permissions.enum.ts
    │
    ├── customer-b/
    │   └── src/
    │       ├── customer-b.plugin.ts
    │       └── ...
    │
    └── shared-utilities/  # Shared code between custom plugins
        └── src/
            ├── base-custom.plugin.ts
            └── common-utils.ts
```

### 2. Custom Plugin Template

```typescript
// custom-plugins/customer-a/src/customer-a.plugin.ts
import { GauzyCorePlugin as Plugin, IOnPluginBootstrap, IOnPluginDestroy } from '@gauzy/plugin';
import { ApplicationPluginConfig } from '@gauzy/common';
import * as chalk from 'chalk';
import { CustomerAModule } from './customer-a.module';
import { CustomerAEntity } from './entities/customer-a.entity';
import { CustomerAPermissions } from './permissions/customer-a-permissions.enum';

/**
 * Custom Plugin for Customer A
 * Extends base platform with customer-specific features
 */
@Plugin({
	// Import customer-specific modules
	imports: [CustomerAModule],

	// Register custom entities
	entities: [CustomerAEntity],

	// Configure plugin
	configuration: (config: ApplicationPluginConfig) => {
		// Register custom permissions
		config.customFields = {
			...config.customFields,
			CustomerAPermissions
		};

		return config;
	}
})
export class CustomerAPlugin implements IOnPluginBootstrap, IOnPluginDestroy {

	async onPluginBootstrap(): Promise<void> {
		console.log(chalk.green('🚀 Customer A Plugin bootstrapped'));

		// Register custom permissions to database
		await this.registerCustomPermissions();
	}

	async onPluginDestroy(): Promise<void> {
		console.log(chalk.red('🛑 Customer A Plugin destroyed'));
	}

	/**
	 * Register custom permissions for Customer A
	 */
	private async registerCustomPermissions(): Promise<void> {
		// Auto-register permissions into system
		// Will be used with @Permissions() decorator
	}
}
```

### 3. Custom Permissions

```typescript
// custom-plugins/customer-a/src/permissions/customer-a-permissions.enum.ts

/**
 * Custom permissions for Customer A
 * Extends base PermissionsEnum
 */
export enum CustomerAPermissions {
	// Custom Module: Inventory Management
	INVENTORY_VIEW = 'INVENTORY_VIEW',
	INVENTORY_CREATE = 'INVENTORY_CREATE',
	INVENTORY_EDIT = 'INVENTORY_EDIT',
	INVENTORY_DELETE = 'INVENTORY_DELETE',

	// Custom Module: Advanced Reporting
	ADVANCED_REPORTS_VIEW = 'ADVANCED_REPORTS_VIEW',
	ADVANCED_REPORTS_EXPORT = 'ADVANCED_REPORTS_EXPORT',

	// Custom Module: Custom Workflows
	CUSTOM_WORKFLOW_MANAGE = 'CUSTOM_WORKFLOW_MANAGE',
	CUSTOM_WORKFLOW_EXECUTE = 'CUSTOM_WORKFLOW_EXECUTE'
}

// Merge with base permissions
export const ALL_PERMISSIONS = {
	...PermissionsEnum,  // Base platform permissions
	...CustomerAPermissions  // Customer A custom permissions
};
```

### 4. Custom Controller with Authorization

```typescript
// custom-plugins/customer-a/src/controllers/inventory.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
	TenantPermissionGuard,
	PermissionGuard,
	Permissions
} from '@gauzy/core';
import { CustomerAPermissions } from '../permissions/customer-a-permissions.enum';

@ApiTags('Customer A - Inventory')
@ApiBearerAuth()
@UseGuards(TenantPermissionGuard, PermissionGuard)
@Controller('customer-a/inventory')
export class InventoryController {

	constructor(private readonly inventoryService: InventoryService) {}

	/**
	 * Get all inventory items
	 * Requires: INVENTORY_VIEW permission
	 */
	@Get()
	@Permissions(CustomerAPermissions.INVENTORY_VIEW)
	async findAll() {
		return await this.inventoryService.findAll();
	}

	/**
	 * Create inventory item
	 * Requires: INVENTORY_CREATE permission
	 */
	@Post()
	@Permissions(CustomerAPermissions.INVENTORY_CREATE)
	async create(@Body() input: CreateInventoryDTO) {
		return await this.inventoryService.create(input);
	}

	/**
	 * Update inventory item
	 * Requires: INVENTORY_EDIT permission
	 */
	@Put(':id')
	@Permissions(CustomerAPermissions.INVENTORY_EDIT)
	async update(
		@Param('id') id: string,
		@Body() input: UpdateInventoryDTO
	) {
		return await this.inventoryService.update(id, input);
	}

	/**
	 * Delete inventory item
	 * Requires: INVENTORY_DELETE permission
	 */
	@Delete(':id')
	@Permissions(CustomerAPermissions.INVENTORY_DELETE)
	async delete(@Param('id') id: string) {
		return await this.inventoryService.delete(id);
	}
}
```

### 5. Permission Seeding for Custom Plugin

```typescript
// custom-plugins/customer-a/src/seeds/customer-a-permissions.seed.ts
import { Injectable } from '@nestjs/common';
import { RolePermissionsService } from '@gauzy/core';
import { CustomerAPermissions } from '../permissions/customer-a-permissions.enum';
import { RolesEnum } from '@gauzy/contracts';

@Injectable()
export class CustomerAPermissionSeeder {

	constructor(
		private readonly rolePermissionsService: RolePermissionsService
	) {}

	/**
	 * Seed custom permissions for different roles
	 */
	async seed(tenantId: string): Promise<void> {

		// SUPER_ADMIN gets all custom permissions
		await this.grantPermissionsToRole(
			tenantId,
			RolesEnum.SUPER_ADMIN,
			Object.values(CustomerAPermissions)
		);

		// ADMIN gets most custom permissions
		await this.grantPermissionsToRole(
			tenantId,
			RolesEnum.ADMIN,
			[
				CustomerAPermissions.INVENTORY_VIEW,
				CustomerAPermissions.INVENTORY_CREATE,
				CustomerAPermissions.INVENTORY_EDIT,
				CustomerAPermissions.ADVANCED_REPORTS_VIEW,
				CustomerAPermissions.ADVANCED_REPORTS_EXPORT
			]
		);

		// EMPLOYEE gets limited custom permissions
		await this.grantPermissionsToRole(
			tenantId,
			RolesEnum.EMPLOYEE,
			[
				CustomerAPermissions.INVENTORY_VIEW,
				CustomerAPermissions.ADVANCED_REPORTS_VIEW
			]
		);

		// VIEWER only gets view permissions
		await this.grantPermissionsToRole(
			tenantId,
			RolesEnum.VIEWER,
			[
				CustomerAPermissions.INVENTORY_VIEW
			]
		);
	}

	private async grantPermissionsToRole(
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

---

## 🔐 Authorization Integration

### 1. Shared Guards (Reuse Base Platform)

```typescript
// Custom plugin controllers automatically inherit guards from base
import {
	TenantPermissionGuard,  // ✅ Multi-tenant isolation
	PermissionGuard,        // ✅ Permission checking
	RoleGuard,             // ✅ Role checking
	Permissions,           // ✅ Permission decorator
	Roles                  // ✅ Role decorator
} from '@gauzy/core';

// Use exactly like base platform
@UseGuards(TenantPermissionGuard, PermissionGuard)
@Controller('customer-a/custom-feature')
export class CustomController {

	@Get()
	@Permissions(CustomerAPermissions.CUSTOM_FEATURE_VIEW)
	async getData() {
		// Automatically:
		// 1. Validate JWT token
		// 2. Check tenant isolation
		// 3. Check user has CUSTOM_FEATURE_VIEW permission
		// 4. All via RequestContext
	}
}
```

### 2. Request Context (Shared Across All Plugins)

```typescript
import { RequestContext } from '@gauzy/core';

// In custom plugin service
export class CustomService {

	async doSomething() {
		// Get current user info
		const currentUser = RequestContext.currentUser();
		const currentTenantId = RequestContext.currentTenantId();
		const currentRoleId = RequestContext.currentRoleId();

		// Check permissions programmatically
		if (RequestContext.hasPermission(CustomerAPermissions.ADVANCED_FEATURE)) {
			// Do advanced stuff
		}

		// All queries automatically filtered by tenant
		return await this.repository.find({
			where: { tenantId: currentTenantId }
		});
	}
}
```

### 3. Dynamic Permission Registration

```typescript
// packages/core/src/lib/role-permission/role-permission.service.ts
// Extend to support dynamic permissions from plugins

@Injectable()
export class RolePermissionService {

	/**
	 * Register plugin permissions dynamically
	 */
	async registerPluginPermissions(
		pluginName: string,
		permissions: string[]
	): Promise<void> {
		for (const permission of permissions) {
			// Store in permission registry
			await this.permissionRegistry.register({
				name: permission,
				source: pluginName,  // Track which plugin adds this
				isPluginPermission: true
			});
		}
	}

	/**
	 * Get all permissions including plugin permissions
	 */
	async getAllPermissions(): Promise<string[]> {
		const basePermissions = Object.values(PermissionsEnum);
		const pluginPermissions = await this.permissionRegistry.findAll();

		return [...basePermissions, ...pluginPermissions.map(p => p.name)];
	}
}
```

---

## 🚀 Deployment Strategies

### Strategy 1: Single Deployment (All Customers)

```yaml
# docker-compose.yml
version: '3.8'
services:
  gauzy-api:
    image: gauzy-platform:latest
    environment:
      - ACTIVE_PLUGINS=customer-a,customer-b,customer-c
      - NODE_ENV=production
    volumes:
      - ./custom-plugins:/app/custom-plugins
    ports:
      - "3000:3000"
```

**Use cases:**
- All customers share same infrastructure
- Cost optimization
- Centralized monitoring

### Strategy 2: Per-Customer Deployment

```yaml
# Customer A deployment
services:
  gauzy-customer-a:
    image: gauzy-platform:latest
    environment:
      - ACTIVE_PLUGINS=customer-a
      - TENANT_ID=customer-a-tenant-id
    ports:
      - "3000:3000"
```

```yaml
# Customer B deployment
services:
  gauzy-customer-b:
    image: gauzy-platform:latest
    environment:
      - ACTIVE_PLUGINS=customer-b
      - TENANT_ID=customer-b-tenant-id
    ports:
      - "3001:3000"
```

**Use cases:**
- Dedicated infrastructure per customer
- Isolation requirements
- Different SLAs

### Strategy 3: Hybrid (Base + Customer-Specific)

```
┌──────────────────────────────────────┐
│   Shared Base Deployment             │
│   - Common features                  │
│   - Multi-tenant                     │
│   - Core plugins                     │
└──────────────────────────────────────┘
              │
      ┌───────┴───────┐
      │               │
┌─────▼──────┐  ┌────▼──────┐
│ Customer A │  │ Customer B│
│ Sidecar    │  │ Sidecar   │
│ (Custom    │  │ (Custom   │
│  plugins)  │  │  plugins) │
└────────────┘  └───────────┘
```

---

## 📦 Plugin Loading Configuration

```typescript
// apps/api/src/config/plugins.config.ts
import { ApplicationPluginConfig } from '@gauzy/common';
import { CustomerAPlugin } from '@custom-plugins/customer-a';
import { CustomerBPlugin } from '@custom-plugins/customer-b';

export const pluginsConfig: ApplicationPluginConfig = {
	plugins: [
		// Base plugins (always loaded)
		RegistryPlugin,
		ZapierPlugin,

		// Conditional loading based on environment
		...(process.env.ACTIVE_PLUGINS?.includes('customer-a')
			? [CustomerAPlugin]
			: []
		),

		...(process.env.ACTIVE_PLUGINS?.includes('customer-b')
			? [CustomerBPlugin]
			: []
		)
	]
};
```

---

## 🎯 Best Practices

### 1. Permission Naming Convention

```typescript
// ✅ GOOD: Prefix with customer/module name
export enum CustomerAPermissions {
	CUSTOMER_A_INVENTORY_VIEW = 'CUSTOMER_A_INVENTORY_VIEW',
	CUSTOMER_A_REPORTS_EXPORT = 'CUSTOMER_A_REPORTS_EXPORT'
}

// ❌ BAD: Generic names (conflict risk)
export enum CustomerAPermissions {
	INVENTORY_VIEW = 'INVENTORY_VIEW',  // May conflict with other plugins
	REPORTS_EXPORT = 'REPORTS_EXPORT'
}
```

### 2. Database Schema Isolation

```typescript
// Custom entity with tenant isolation
@Entity('customer_a_inventory')
export class CustomerAInventory extends TenantBaseEntity {

	@Column()
	name: string;

	@Column()
	quantity: number;

	// Automatically filtered by tenantId via TenantBaseEntity
}
```

### 3. API Routing Convention

```
Base Platform:
GET /api/employees
GET /api/organizations

Customer A Plugin:
GET /api/customer-a/inventory
GET /api/customer-a/reports

Customer B Plugin:
GET /api/customer-b/custom-feature
GET /api/customer-b/workflows
```

### 4. Error Handling

```typescript
// Wrap plugin errors to prevent crashing entire app
@Catch()
export class PluginExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();

		// Log plugin error
		this.logger.error(`Plugin error: ${exception.message}`, exception.stack);

		// Return graceful error
		response.status(500).json({
			statusCode: 500,
			message: 'Plugin error occurred',
			pluginName: exception.pluginName,
			error: exception.message
		});
	}
}
```

### 5. Testing Custom Plugins

```typescript
// customer-a.plugin.spec.ts
describe('CustomerAPlugin', () => {
	let plugin: CustomerAPlugin;
	let testingModule: TestingModule;

	beforeEach(async () => {
		testingModule = await Test.createTestingModule({
			imports: [CustomerAModule],
			providers: [CustomerAPlugin]
		}).compile();

		plugin = testingModule.get<CustomerAPlugin>(CustomerAPlugin);
	});

	it('should bootstrap successfully', async () => {
		await expect(plugin.onPluginBootstrap()).resolves.not.toThrow();
	});

	it('should register custom permissions', async () => {
		// Test permission registration
	});
});
```

---

## � Plugin Enable/Disable Per-Tenant

### Per-Tenant Plugin Activation Architecture

Ever-Gauzy plugins support **per-tenant activation** - each tenant can enable/disable plugins independently:

```typescript
// Plugin Installation per-tenant
export interface IPluginInstallation extends IBasePerTenantAndOrganizationEntityModel {
    plugin: IPlugin;
    pluginId?: ID;
    version: IPluginVersion;
    status: PluginInstallationStatus; // INSTALLED, UNINSTALLED, FAILED, IN_PROGRESS
    installedAt?: Date;
    uninstalledAt?: Date;
    installedBy?: IEmployee;
    tenantId?: string;
    organizationId?: string;
}
```

### Method 1: Using Plugin Installation Status (Recommended)

```typescript
// packages/plugins/loyalty/src/lib/services/loyalty-plugin.service.ts
import { Injectable } from '@nestjs/common';
import { RequestContext } from '@gauzy/core';
import { PluginInstallationService } from '@gauzy/plugin';

@Injectable()
export class LoyaltyPluginService {
    constructor(
        private readonly pluginInstallationService: PluginInstallationService
    ) {}

    /**
     * Check if plugin is enabled for current tenant
     */
    async isPluginEnabled(): Promise<boolean> {
        const tenantId = RequestContext.currentTenantId();
        const organizationId = RequestContext.currentOrganizationId();

        const installation = await this.pluginInstallationService.findOne({
            where: {
                plugin: { name: 'LoyaltyPlugin' },
                tenantId,
                organizationId,
                status: PluginInstallationStatus.INSTALLED
            }
        });

        return !!installation;
    }

    /**
     * Enable plugin for current tenant
     */
    async enablePlugin(): Promise<void> {
        const tenantId = RequestContext.currentTenantId();

        await this.pluginInstallationService.create({
            plugin: await this.findPluginByName('LoyaltyPlugin'),
            status: PluginInstallationStatus.INSTALLED,
            installedAt: new Date(),
            installedBy: RequestContext.currentEmployee(),
            tenantId
        });
    }

    /**
     * Disable plugin for current tenant
     */
    async disablePlugin(): Promise<void> {
        const tenantId = RequestContext.currentTenantId();

        await this.pluginInstallationService.update(
            { plugin: { name: 'LoyaltyPlugin' }, tenantId },
            {
                status: PluginInstallationStatus.UNINSTALLED,
                uninstalledAt: new Date()
            }
        );
    }
}
```

### Method 2: Using Tenant Settings (Alternative)

Similar to Integration pattern (ActivePieces, Zapier):

```typescript
// packages/plugins/loyalty/src/lib/services/loyalty-config.service.ts
import { Injectable } from '@nestjs/common';
import { TenantSettingService } from '@gauzy/core';

@Injectable()
export class LoyaltyConfigService {
    constructor(private readonly tenantSettingService: TenantSettingService) {}

    async isEnabled(tenantId: string, organizationId?: string): Promise<boolean> {
        const setting = await this.tenantSettingService.findOneByOptions({
            where: {
                name: 'loyalty_plugin_enabled',
                tenantId,
                ...(organizationId && { organizationId })
            }
        });

        return setting?.value === 'true';
    }

    async setEnabled(enabled: boolean): Promise<void> {
        const tenantId = RequestContext.currentTenantId();

        await this.tenantSettingService.saveSettings([{
            name: 'loyalty_plugin_enabled',
            value: enabled ? 'true' : 'false',
            tenantId
        }]);
    }
}
```

### Guard for Plugin Access Control

```typescript
// packages/plugins/loyalty/src/lib/guards/loyalty-plugin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { LoyaltyPluginService } from '../services/loyalty-plugin.service';

@Injectable()
export class LoyaltyPluginGuard implements CanActivate {
    constructor(private readonly loyaltyPluginService: LoyaltyPluginService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isEnabled = await this.loyaltyPluginService.isPluginEnabled();

        if (!isEnabled) {
            throw new ForbiddenException(
                'Loyalty plugin is not enabled for this tenant. ' +
                'Please contact administrator to enable it.'
            );
        }

        return true;
    }
}
```

### Apply Guard to Controllers

```typescript
// packages/plugins/loyalty/src/lib/controllers/loyalty-card.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TenantPermissionGuard, PermissionGuard, Permissions } from '@gauzy/core';
import { LoyaltyPluginGuard } from '../guards/loyalty-plugin.guard';

@Controller('loyalty/cards')
@UseGuards(
    TenantPermissionGuard,     // 1. Verify tenant context
    LoyaltyPluginGuard,        // 2. Check plugin enabled for tenant
    PermissionGuard            // 3. Check user permissions
)
export class LoyaltyCardController {

    @Get()
    @Permissions('LOYALTY_CARD_READ')
    async findAll() {
        // Plugin enabled + user has permission = OK
        return this.loyaltyCardService.findAll();
    }

    @Post()
    @Permissions('LOYALTY_CARD_CREATE')
    async create(@Body() dto: CreateLoyaltyCardDTO) {
        return this.loyaltyCardService.create(dto);
    }
}
```

### Frontend Plugin Check

```typescript
// Angular component
@Component({
    selector: 'gauzy-loyalty-card-list',
    template: `
        <div *ngIf="pluginEnabled; else disabledMessage">
            <h2>Loyalty Cards</h2>
            <!-- Card list UI -->
        </div>

        <ng-template #disabledMessage>
            <div class="alert alert-warning">
                <h3>Loyalty Plugin Not Enabled</h3>
                <p>Contact your administrator to enable this feature.</p>
            </div>
        </ng-template>
    `
})
export class LoyaltyCardListComponent implements OnInit {
    pluginEnabled = false;

    constructor(private loyaltyPluginService: LoyaltyPluginService) {}

    async ngOnInit() {
        this.pluginEnabled = await this.loyaltyPluginService.isEnabled();
    }
}
```

### Admin API for Plugin Management

```typescript
// packages/plugins/loyalty/src/lib/controllers/loyalty-admin.controller.ts
@Controller('admin/plugins/loyalty')
@UseGuards(TenantPermissionGuard, PermissionGuard)
export class LoyaltyAdminController {

    @Get('status')
    @Permissions('PLUGIN_VIEW')
    async getStatus() {
        return {
            enabled: await this.loyaltyPluginService.isPluginEnabled(),
            version: '1.0.0',
            installedAt: await this.getInstallationDate()
        };
    }

    @Post('enable')
    @Permissions('PLUGIN_ENABLE')
    async enable() {
        await this.loyaltyPluginService.enablePlugin();
        return { success: true, message: 'Loyalty plugin enabled' };
    }

    @Post('disable')
    @Permissions('PLUGIN_DISABLE')
    async disable() {
        await this.loyaltyPluginService.disablePlugin();
        return { success: true, message: 'Loyalty plugin disabled' };
    }
}
```

### Database Schema

```sql
-- Plugin installation per-tenant
CREATE TABLE plugin_installation (
    id UUID PRIMARY KEY,
    plugin_id UUID REFERENCES plugin(id),
    version_id UUID REFERENCES plugin_version(id),
    tenant_id UUID REFERENCES tenant(id),
    organization_id UUID REFERENCES organization(id),
    installed_by_id UUID REFERENCES employee(id),
    installed_at TIMESTAMP,
    uninstalled_at TIMESTAMP,
    status VARCHAR(50) -- INSTALLED, UNINSTALLED, FAILED, IN_PROGRESS
);

-- Fast tenant lookup
CREATE INDEX idx_plugin_installation_tenant
ON plugin_installation(tenant_id, organization_id, status);
```

---

## �🔄 Migration Path

### Phase 1: Setup Plugin Infrastructure
1. Create `custom-plugins/` directory
2. Setup base custom plugin template
3. Configure plugin loading

### Phase 2: Migrate First Customer
1. Create Customer A plugin
2. Define custom permissions
3. Implement custom controllers/services
4. Seed permissions to database
5. Test authorization

### Phase 3: Scale to Multiple Customers
1. Extract shared utilities
2. Create base custom plugin class
3. Replicate for Customer B, C, D...
4. Configure deployment strategy

### Phase 4: Advanced Features
1. Hot-reload plugins (optional)
2. Plugin marketplace
3. Plugin versioning
4. Plugin health monitoring

---

## 📊 Comparison Summary

| Aspect | Microservices | Plugin-Based |
|--------|--------------|-------------|
| **Auth Integration** | Complex (JWT sync, permission sync) | ✅ Simple (shared RBAC) |
| **Latency** | Network calls | ✅ In-process |
| **Consistency** | Eventual consistency | ✅ ACID transactions |
| **Deployment** | Complex orchestration | ✅ Simple deployment |
| **Code Reuse** | Minimal | ✅ Maximum (guards, decorators) |
| **Scaling** | Independent | Vertical |
| **Isolation** | ✅ Complete | Process-level |
| **Cost** | Higher (more infrastructure) | ✅ Lower |
| **Development Speed** | Slower | ✅ Faster |
| **Ever-Gauzy Support** | None | ✅ Built-in |

---

## 🎉 Conclusion

**Recommended: Plugin-Based Architecture**

✅ **Practical Pros:**
- Leverage existing plugin system
- Simple authorization integration (reuse entire RBAC)
- Faster time to market
- Lower cost
- Easier maintenance

✅ **When to use Microservices:**
- Requires separate scaling
- Different technology stacks
- Complete isolation requirement
- Very large custom modules (mini-applications)

**Best of both worlds:** Start with plugins, migrate to microservices when scaling is needed!
