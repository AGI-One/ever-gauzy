# 🔌 Plugin Per-Tenant Management Guide

> Comprehensive guide on how to enable/disable plugins per-tenant in Ever-Gauzy

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Implementation Methods](#-implementation-methods)
- [Guards & Middleware](#-guards--middleware)
- [API Endpoints](#-api-endpoints)
- [Frontend Integration](#-frontend-integration)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Best Practices](#-best-practices)

---

## 🎯 Overview

### Question: Can plugins be enabled/disabled per-tenant?

**YES!** Ever-Gauzy provides full support for per-tenant plugin activation:

- ✅ Each tenant can enable/disable plugins independently
- ✅ Plugin installation tracked per-tenant
- ✅ Guards automatically check plugin status
- ✅ Frontend can hide/show features based on plugin status
- ✅ Admin has full control via API

### Use Cases

1. **SaaS Multi-Tenant Platform**
   - Tenant A: Enable Loyalty Plugin
   - Tenant B: Disable Loyalty Plugin (not needed)
   - Tenant C: Enable Loyalty + Analytics Plugin

2. **Pricing Tiers**
   - Free tier: Core features only
   - Pro tier: + Advanced Analytics Plugin
   - Enterprise tier: + All custom plugins

3. **Gradual Rollout**
   - Enable plugin for beta tenants first
   - Test thoroughly
   - Enable for all tenants later

---

## 🏗️ Architecture

### Entity Relationships

```
┌─────────────┐       ┌──────────────────────┐       ┌─────────────┐
│   Plugin    │◄──────│ PluginInstallation   │──────►│   Tenant    │
│             │       │                      │       │             │
│ - name      │       │ - status             │       │ - name      │
│ - version   │       │ - installedAt        │       │ - isActive  │
│ - status    │       │ - uninstalledAt      │       │             │
└─────────────┘       │ - tenantId           │       └─────────────┘
                      │ - organizationId     │
                      └──────────────────────┘
                                 │
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │    Organization      │
                      │                      │
                      │ - name               │
                      │ - tenantId           │
                      └──────────────────────┘
```

### Plugin Installation Lifecycle

```
┌─────────────┐
│   Created   │  Plugin available in system
└──────┬──────┘
       │
       │ Admin clicks "Install for Tenant A"
       ▼
┌─────────────┐
│ IN_PROGRESS │  Installation process running
└──────┬──────┘
       │
       │ Success
       ▼
┌─────────────┐
│  INSTALLED  │  Plugin active for Tenant A
└──────┬──────┘
       │
       │ Admin clicks "Disable"
       ▼
┌─────────────┐
│ UNINSTALLED │  Plugin disabled for Tenant A
└─────────────┘
```

---

## 🛠️ Implementation Methods

### Method 1: Plugin Installation Status (Recommended)

**Pros:**
- ✅ Native Ever-Gauzy approach
- ✅ Detailed tracking (installedAt, installedBy, version)
- ✅ Support multiple versions per tenant
- ✅ Built-in status enum

```typescript
// packages/plugins/loyalty/src/lib/services/loyalty-plugin.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContext } from '@gauzy/core';
import {
    PluginInstallation,
    PluginInstallationStatus,
    Plugin
} from '@gauzy/plugin';

@Injectable()
export class LoyaltyPluginService {

    constructor(
        @InjectRepository(PluginInstallation)
        private readonly pluginInstallationRepository: Repository<PluginInstallation>,
        @InjectRepository(Plugin)
        private readonly pluginRepository: Repository<Plugin>
    ) {}

    /**
     * Check if loyalty plugin is enabled for current tenant
     */
    async isPluginEnabled(): Promise<boolean> {
        try {
            const tenantId = RequestContext.currentTenantId();
            const organizationId = RequestContext.currentOrganizationId();

            if (!tenantId) {
                return false;
            }

            const installation = await this.pluginInstallationRepository.findOne({
                where: {
                    plugin: { name: 'LoyaltyPlugin' },
                    tenantId,
                    organizationId,
                    status: PluginInstallationStatus.INSTALLED
                },
                relations: ['plugin']
            });

            return !!installation;
        } catch (error) {
            console.error('Error checking plugin status:', error);
            return false;
        }
    }

    /**
     * Enable plugin for current tenant
     */
    async enablePlugin(): Promise<PluginInstallation> {
        const tenantId = RequestContext.currentTenantId();
        const organizationId = RequestContext.currentOrganizationId();
        const employee = RequestContext.currentEmployee();

        // Find or create plugin
        const plugin = await this.pluginRepository.findOne({
            where: { name: 'LoyaltyPlugin' }
        });

        if (!plugin) {
            throw new Error('Loyalty plugin not found in system');
        }

        // Check if already installed
        let installation = await this.pluginInstallationRepository.findOne({
            where: { plugin: { id: plugin.id }, tenantId, organizationId }
        });

        if (installation) {
            // Reactivate if exists
            installation.status = PluginInstallationStatus.INSTALLED;
            installation.installedAt = new Date();
            installation.uninstalledAt = null;
        } else {
            // Create new installation
            installation = this.pluginInstallationRepository.create({
                plugin,
                status: PluginInstallationStatus.INSTALLED,
                installedAt: new Date(),
                installedBy: employee,
                tenantId,
                organizationId
            });
        }

        return await this.pluginInstallationRepository.save(installation);
    }

    /**
     * Disable plugin for current tenant
     */
    async disablePlugin(): Promise<PluginInstallation> {
        const tenantId = RequestContext.currentTenantId();
        const organizationId = RequestContext.currentOrganizationId();

        const installation = await this.pluginInstallationRepository.findOne({
            where: {
                plugin: { name: 'LoyaltyPlugin' },
                tenantId,
                organizationId
            }
        });

        if (!installation) {
            throw new Error('Plugin installation not found');
        }

        installation.status = PluginInstallationStatus.UNINSTALLED;
        installation.uninstalledAt = new Date();

        return await this.pluginInstallationRepository.save(installation);
    }

    /**
     * Get installation details
     */
    async getInstallationInfo(): Promise<any> {
        const tenantId = RequestContext.currentTenantId();
        const organizationId = RequestContext.currentOrganizationId();

        const installation = await this.pluginInstallationRepository.findOne({
            where: {
                plugin: { name: 'LoyaltyPlugin' },
                tenantId,
                organizationId
            },
            relations: ['plugin', 'version', 'installedBy']
        });

        if (!installation) {
            return {
                enabled: false,
                message: 'Plugin not installed for this tenant'
            };
        }

        return {
            enabled: installation.status === PluginInstallationStatus.INSTALLED,
            status: installation.status,
            installedAt: installation.installedAt,
            installedBy: installation.installedBy?.user?.email,
            version: installation.version?.number,
            uninstalledAt: installation.uninstalledAt
        };
    }
}
```

### Method 2: Tenant Settings (Simpler Alternative)

**Pros:**
- ✅ Simpler implementation
- ✅ Faster queries (fewer joins)
- ✅ Easy to understand

**Cons:**
- ❌ Less detailed tracking
- ❌ No version management
- ❌ No audit trail (who installed)

```typescript
// packages/plugins/loyalty/src/lib/services/loyalty-config.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContext, TenantSetting } from '@gauzy/core';

@Injectable()
export class LoyaltyConfigService {

    constructor(
        @InjectRepository(TenantSetting)
        private readonly tenantSettingRepository: Repository<TenantSetting>
    ) {}

    private readonly PLUGIN_ENABLED_KEY = 'loyalty_plugin_enabled';

    /**
     * Check if plugin enabled for current tenant
     */
    async isEnabled(): Promise<boolean> {
        const tenantId = RequestContext.currentTenantId();
        const organizationId = RequestContext.currentOrganizationId();

        const setting = await this.tenantSettingRepository.findOne({
            where: {
                name: this.PLUGIN_ENABLED_KEY,
                tenantId,
                ...(organizationId && { organizationId })
            }
        });

        return setting?.value === 'true';
    }

    /**
     * Enable plugin for current tenant
     */
    async setEnabled(enabled: boolean): Promise<void> {
        const tenantId = RequestContext.currentTenantId();
        const organizationId = RequestContext.currentOrganizationId();

        let setting = await this.tenantSettingRepository.findOne({
            where: {
                name: this.PLUGIN_ENABLED_KEY,
                tenantId,
                organizationId
            }
        });

        if (setting) {
            setting.value = enabled ? 'true' : 'false';
        } else {
            setting = this.tenantSettingRepository.create({
                name: this.PLUGIN_ENABLED_KEY,
                value: enabled ? 'true' : 'false',
                tenantId,
                organizationId
            });
        }

        await this.tenantSettingRepository.save(setting);
    }
}
```

---

## 🛡️ Guards & Middleware

### Plugin Enabled Guard

```typescript
// packages/plugins/loyalty/src/lib/guards/loyalty-plugin.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoyaltyPluginService } from '../services/loyalty-plugin.service';

@Injectable()
export class LoyaltyPluginGuard implements CanActivate {

    constructor(
        private readonly loyaltyPluginService: LoyaltyPluginService,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if plugin is enabled for current tenant
        const isEnabled = await this.loyaltyPluginService.isPluginEnabled();

        if (!isEnabled) {
            throw new ForbiddenException(
                'Loyalty plugin is not enabled for your organization. ' +
                'Please contact your administrator to enable this feature.'
            );
        }

        return true;
    }
}
```

### Optional: Decorator for Skipping Check

```typescript
// packages/plugins/loyalty/src/lib/decorators/skip-plugin-check.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SKIP_PLUGIN_CHECK_KEY = 'skipPluginCheck';
export const SkipPluginCheck = () => SetMetadata(SKIP_PLUGIN_CHECK_KEY, true);
```

Updated Guard:

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route has @SkipPluginCheck() decorator
    const skipCheck = this.reflector.get<boolean>(
        SKIP_PLUGIN_CHECK_KEY,
        context.getHandler()
    );

    if (skipCheck) {
        return true; // Allow public plugin info endpoints
    }

    const isEnabled = await this.loyaltyPluginService.isPluginEnabled();

    if (!isEnabled) {
        throw new ForbiddenException(
            'Loyalty plugin is not enabled for your organization.'
        );
    }

    return true;
}
```

---

## 🌐 API Endpoints

### Public Plugin Info (No Auth Required)

```typescript
// packages/plugins/loyalty/src/lib/controllers/loyalty-info.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from '@gauzy/core';

@Controller('plugins/loyalty')
export class LoyaltyInfoController {

    @Public()
    @Get('info')
    async getPluginInfo() {
        return {
            name: 'Loyalty Program',
            version: '1.0.0',
            description: 'Customer loyalty and rewards program',
            features: [
                'Loyalty cards',
                'Points tracking',
                'Rewards redemption',
                'Customer tiers'
            ]
        };
    }
}
```

### Protected Plugin Endpoints

```typescript
// packages/plugins/loyalty/src/lib/controllers/loyalty-card.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards
} from '@nestjs/common';
import {
    TenantPermissionGuard,
    PermissionGuard,
    Permissions,
    UUIDValidationPipe
} from '@gauzy/core';
import { LoyaltyPluginGuard } from '../guards/loyalty-plugin.guard';
import { LoyaltyCardService } from '../services/loyalty-card.service';

@Controller('loyalty/cards')
@UseGuards(
    TenantPermissionGuard,     // 1. Verify tenant context exists
    LoyaltyPluginGuard,        // 2. Check plugin enabled for tenant
    PermissionGuard            // 3. Check user has permissions
)
export class LoyaltyCardController {

    constructor(private readonly loyaltyCardService: LoyaltyCardService) {}

    @Get()
    @Permissions('LOYALTY_CARD_READ')
    async findAll() {
        return this.loyaltyCardService.findAll();
    }

    @Get(':id')
    @Permissions('LOYALTY_CARD_READ')
    async findOne(@Param('id', UUIDValidationPipe) id: string) {
        return this.loyaltyCardService.findById(id);
    }

    @Post()
    @Permissions('LOYALTY_CARD_CREATE')
    async create(@Body() dto: CreateLoyaltyCardDTO) {
        return this.loyaltyCardService.create(dto);
    }

    @Put(':id')
    @Permissions('LOYALTY_CARD_UPDATE')
    async update(
        @Param('id', UUIDValidationPipe) id: string,
        @Body() dto: UpdateLoyaltyCardDTO
    ) {
        return this.loyaltyCardService.update(id, dto);
    }

    @Delete(':id')
    @Permissions('LOYALTY_CARD_DELETE')
    async delete(@Param('id', UUIDValidationPipe) id: string) {
        return this.loyaltyCardService.delete(id);
    }
}
```

### Admin Plugin Management Endpoints

```typescript
// packages/plugins/loyalty/src/lib/controllers/loyalty-admin.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
    TenantPermissionGuard,
    PermissionGuard,
    Permissions
} from '@gauzy/core';
import { LoyaltyPluginService } from '../services/loyalty-plugin.service';

@Controller('admin/plugins/loyalty')
@UseGuards(TenantPermissionGuard, PermissionGuard)
export class LoyaltyAdminController {

    constructor(private readonly loyaltyPluginService: LoyaltyPluginService) {}

    /**
     * Get plugin status for current tenant
     */
    @Get('status')
    @Permissions('PLUGIN_VIEW')
    async getStatus() {
        return await this.loyaltyPluginService.getInstallationInfo();
    }

    /**
     * Enable plugin for current tenant
     */
    @Post('enable')
    @Permissions('PLUGIN_ENABLE')
    async enable() {
        const installation = await this.loyaltyPluginService.enablePlugin();
        return {
            success: true,
            message: 'Loyalty plugin enabled successfully',
            installation
        };
    }

    /**
     * Disable plugin for current tenant
     */
    @Post('disable')
    @Permissions('PLUGIN_DISABLE')
    async disable() {
        const installation = await this.loyaltyPluginService.disablePlugin();
        return {
            success: true,
            message: 'Loyalty plugin disabled successfully',
            installation
        };
    }
}
```

---

## 🎨 Frontend Integration

### Angular Service

```typescript
// packages/plugins/loyalty/src/lib/services/loyalty-plugin.service.ts (Frontend)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface PluginStatus {
    enabled: boolean;
    status?: string;
    installedAt?: Date;
    version?: string;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyPluginService {

    private pluginStatusSubject = new BehaviorSubject<PluginStatus>({ enabled: false });
    public pluginStatus$ = this.pluginStatusSubject.asObservable();

    constructor(private http: HttpClient) {
        this.checkPluginStatus();
    }

    /**
     * Check if plugin is enabled for current tenant
     */
    checkPluginStatus(): Observable<PluginStatus> {
        return this.http.get<PluginStatus>('/api/admin/plugins/loyalty/status').pipe(
            tap(status => this.pluginStatusSubject.next(status))
        );
    }

    /**
     * Enable plugin
     */
    enablePlugin(): Observable<any> {
        return this.http.post('/api/admin/plugins/loyalty/enable', {}).pipe(
            tap(() => this.checkPluginStatus())
        );
    }

    /**
     * Disable plugin
     */
    disablePlugin(): Observable<any> {
        return this.http.post('/api/admin/plugins/loyalty/disable', {}).pipe(
            tap(() => this.checkPluginStatus())
        );
    }

    /**
     * Get current plugin status (synchronous)
     */
    get isEnabled(): boolean {
        return this.pluginStatusSubject.value.enabled;
    }
}
```

### Component with Plugin Check

```typescript
// packages/plugins/loyalty/src/lib/components/loyalty-card-list.component.ts
import { Component, OnInit } from '@angular/core';
import { LoyaltyPluginService } from '../services/loyalty-plugin.service';
import { LoyaltyCardService } from '../services/loyalty-card.service';

@Component({
    selector: 'gauzy-loyalty-card-list',
    template: `
        <div *ngIf="pluginStatus$ | async as status">
            <!-- Plugin enabled - show features -->
            <div *ngIf="status.enabled; else disabledMessage">
                <h2>Loyalty Cards</h2>
                <div class="plugin-info">
                    <small>Version: {{ status.version }} |
                           Installed: {{ status.installedAt | date }}</small>
                </div>

                <button (click)="createCard()">Create New Card</button>

                <table>
                    <tr *ngFor="let card of cards">
                        <td>{{ card.cardNumber }}</td>
                        <td>{{ card.points }}</td>
                    </tr>
                </table>
            </div>

            <!-- Plugin disabled - show message -->
            <ng-template #disabledMessage>
                <div class="alert alert-warning">
                    <h3>🔌 Loyalty Plugin Not Enabled</h3>
                    <p>This feature is not available for your organization.</p>
                    <p>Please contact your administrator to enable the Loyalty Program plugin.</p>

                    <button *ngIf="hasAdminAccess"
                            (click)="enablePlugin()"
                            class="btn btn-primary">
                        Enable Loyalty Plugin
                    </button>
                </div>
            </ng-template>
        </div>
    `
})
export class LoyaltyCardListComponent implements OnInit {

    pluginStatus$ = this.loyaltyPluginService.pluginStatus$;
    cards = [];
    hasAdminAccess = false; // Check from permissions

    constructor(
        private loyaltyPluginService: LoyaltyPluginService,
        private loyaltyCardService: LoyaltyCardService
    ) {}

    ngOnInit() {
        this.loyaltyPluginService.checkPluginStatus().subscribe(status => {
            if (status.enabled) {
                this.loadCards();
            }
        });
    }

    loadCards() {
        this.loyaltyCardService.findAll().subscribe(cards => {
            this.cards = cards;
        });
    }

    enablePlugin() {
        this.loyaltyPluginService.enablePlugin().subscribe(() => {
            alert('Loyalty plugin enabled successfully!');
        });
    }

    createCard() {
        // Create card logic
    }
}
```

### Route Guard

```typescript
// packages/plugins/loyalty/src/lib/guards/loyalty-plugin-route.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoyaltyPluginService } from '../services/loyalty-plugin.service';

@Injectable({ providedIn: 'root' })
export class LoyaltyPluginRouteGuard implements CanActivate {

    constructor(
        private loyaltyPluginService: LoyaltyPluginService,
        private router: Router
    ) {}

    canActivate(): Observable<boolean> {
        return this.loyaltyPluginService.checkPluginStatus().pipe(
            map(status => {
                if (status.enabled) {
                    return true;
                } else {
                    this.router.navigate(['/pages/dashboard']);
                    alert('Loyalty plugin is not enabled for your organization');
                    return false;
                }
            })
        );
    }
}
```

Apply to routes:

```typescript
// app-routing.module.ts
const routes: Routes = [
    {
        path: 'loyalty',
        canActivate: [LoyaltyPluginRouteGuard],
        loadChildren: () => import('./loyalty/loyalty.module').then(m => m.LoyaltyModule)
    }
];
```

---

## 🗄️ Database Schema

### Plugin Installation Table

```sql
-- Plugin installation tracking per-tenant
CREATE TABLE plugin_installation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Plugin reference
    plugin_id UUID NOT NULL REFERENCES plugin(id) ON DELETE CASCADE,
    version_id UUID REFERENCES plugin_version(id) ON DELETE SET NULL,

    -- Tenant/Organization scope
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,

    -- Installation status
    status VARCHAR(50) NOT NULL DEFAULT 'INSTALLED',
    -- INSTALLED, UNINSTALLED, FAILED, IN_PROGRESS

    -- Audit fields
    installed_by_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uninstalled_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one installation record per plugin per tenant
    UNIQUE(plugin_id, tenant_id, organization_id)
);

-- Indexes for performance
CREATE INDEX idx_plugin_installation_tenant
ON plugin_installation(tenant_id, organization_id);

CREATE INDEX idx_plugin_installation_status
ON plugin_installation(tenant_id, status);

CREATE INDEX idx_plugin_installation_plugin
ON plugin_installation(plugin_id, tenant_id);
```

### Tenant Setting Table (Alternative)

```sql
-- Simpler approach using tenant_setting
CREATE TABLE tenant_setting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., 'loyalty_plugin_enabled'
    value TEXT, -- 'true' or 'false'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tenant_id, organization_id, name)
);

CREATE INDEX idx_tenant_setting_lookup
ON tenant_setting(tenant_id, organization_id, name);
```

---

## 🧪 Testing

### Unit Test: Plugin Service

```typescript
// loyalty-plugin.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoyaltyPluginService } from './loyalty-plugin.service';
import { PluginInstallation, Plugin } from '@gauzy/plugin';
import { RequestContext } from '@gauzy/core';

describe('LoyaltyPluginService', () => {
    let service: LoyaltyPluginService;
    let mockPluginInstallationRepository;
    let mockPluginRepository;

    beforeEach(async () => {
        mockPluginInstallationRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn()
        };

        mockPluginRepository = {
            findOne: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoyaltyPluginService,
                {
                    provide: getRepositoryToken(PluginInstallation),
                    useValue: mockPluginInstallationRepository
                },
                {
                    provide: getRepositoryToken(Plugin),
                    useValue: mockPluginRepository
                }
            ]
        }).compile();

        service = module.get<LoyaltyPluginService>(LoyaltyPluginService);
    });

    describe('isPluginEnabled', () => {
        it('should return true when plugin is installed', async () => {
            jest.spyOn(RequestContext, 'currentTenantId').mockReturnValue('tenant-123');

            mockPluginInstallationRepository.findOne.mockResolvedValue({
                id: 'installation-123',
                status: 'INSTALLED'
            });

            const result = await service.isPluginEnabled();

            expect(result).toBe(true);
            expect(mockPluginInstallationRepository.findOne).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    tenantId: 'tenant-123',
                    status: 'INSTALLED'
                }),
                relations: ['plugin']
            });
        });

        it('should return false when plugin is not installed', async () => {
            jest.spyOn(RequestContext, 'currentTenantId').mockReturnValue('tenant-123');
            mockPluginInstallationRepository.findOne.mockResolvedValue(null);

            const result = await service.isPluginEnabled();

            expect(result).toBe(false);
        });
    });

    describe('enablePlugin', () => {
        it('should create installation when not exists', async () => {
            jest.spyOn(RequestContext, 'currentTenantId').mockReturnValue('tenant-123');

            const mockPlugin = { id: 'plugin-123', name: 'LoyaltyPlugin' };
            mockPluginRepository.findOne.mockResolvedValue(mockPlugin);
            mockPluginInstallationRepository.findOne.mockResolvedValue(null);

            const newInstallation = { id: 'installation-123', status: 'INSTALLED' };
            mockPluginInstallationRepository.create.mockReturnValue(newInstallation);
            mockPluginInstallationRepository.save.mockResolvedValue(newInstallation);

            const result = await service.enablePlugin();

            expect(result.status).toBe('INSTALLED');
            expect(mockPluginInstallationRepository.save).toHaveBeenCalled();
        });
    });
});
```

### Integration Test: API Endpoints

```typescript
// loyalty-admin.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LoyaltyModule } from '../loyalty.module';

describe('LoyaltyAdminController (e2e)', () => {
    let app: INestApplication;
    let authToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [LoyaltyModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Login and get token
        const loginResponse = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'password' });

        authToken = loginResponse.body.token;
    });

    describe('POST /admin/plugins/loyalty/enable', () => {
        it('should enable plugin for tenant', async () => {
            return request(app.getHttpServer())
                .post('/api/admin/plugins/loyalty/enable')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.message).toContain('enabled');
                });
        });
    });

    describe('GET /admin/plugins/loyalty/status', () => {
        it('should return plugin status', async () => {
            return request(app.getHttpServer())
                .get('/api/admin/plugins/loyalty/status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .expect(res => {
                    expect(res.body).toHaveProperty('enabled');
                    expect(res.body).toHaveProperty('status');
                });
        });
    });

    afterAll(async () => {
        await app.close();
    });
});
```

---

## ✅ Best Practices

### 1. Always Check Plugin Status in Guards

```typescript
@UseGuards(
    TenantPermissionGuard,     // First: Verify tenant exists
    PluginEnabledGuard,        // Second: Check plugin enabled
    PermissionGuard            // Third: Check permissions
)
```

### 2. Cache Plugin Status

```typescript
@Injectable()
export class LoyaltyPluginService {
    private cache = new Map<string, { enabled: boolean; expiresAt: number }>();
    private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    async isPluginEnabled(): Promise<boolean> {
        const tenantId = RequestContext.currentTenantId();
        const cacheKey = `plugin-enabled:${tenantId}`;

        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.enabled;
        }

        const enabled = await this.checkDatabase();

        this.cache.set(cacheKey, {
            enabled,
            expiresAt: Date.now() + this.CACHE_TTL
        });

        return enabled;
    }
}
```

### 3. Graceful Degradation in Frontend

```typescript
// Don't crash - show helpful message instead
<div *ngIf="pluginEnabled; else upgradeMessage">
    <!-- Full features -->
</div>

<ng-template #upgradeMessage>
    <div class="upgrade-prompt">
        <h3>Unlock Loyalty Features</h3>
        <p>Upgrade your plan to enable customer loyalty program.</p>
        <button>Contact Sales</button>
    </div>
</ng-template>
```

### 4. Audit Plugin Changes

```typescript
@Post('enable')
@Permissions('PLUGIN_ENABLE')
async enable() {
    const installation = await this.loyaltyPluginService.enablePlugin();

    // Log audit event
    await this.auditLogService.log({
        action: 'PLUGIN_ENABLED',
        entity: 'LoyaltyPlugin',
        entityId: installation.id,
        userId: RequestContext.currentUserId(),
        tenantId: RequestContext.currentTenantId()
    });

    return { success: true, installation };
}
```

### 5. Feature Flags for Gradual Rollout

```typescript
async isPluginEnabled(): Promise<boolean> {
    // Check feature flag first (for beta tenants)
    const featureFlagEnabled = await this.featureFlagService.isEnabled(
        'loyalty_plugin_beta',
        RequestContext.currentTenantId()
    );

    if (!featureFlagEnabled) {
        return false;
    }

    // Then check installation
    return await this.checkInstallation();
}
```

---

## 📊 Monitoring & Analytics

### Track Plugin Usage

```typescript
@Injectable()
export class PluginAnalyticsService {

    async trackPluginUsage(pluginName: string, action: string) {
        await this.analytics.track({
            event: 'plugin_usage',
            properties: {
                plugin: pluginName,
                action: action,
                tenantId: RequestContext.currentTenantId(),
                timestamp: new Date()
            }
        });
    }
}

// Usage in controller
@Get()
async findAll() {
    await this.pluginAnalytics.trackPluginUsage('LoyaltyPlugin', 'list_cards');
    return this.loyaltyCardService.findAll();
}
```

---

## 🎉 Summary

### Quick Answer

**YES - Plugins can be enabled/disabled per-tenant!**

✅ **2 Methods:**
1. **PluginInstallation** (Recommended) - Full tracking, audit trail
2. **TenantSetting** (Simpler) - Quick enable/disable

✅ **Features:**
- Per-tenant activation
- Per-organization activation
- Admin API for management
- Guards for access control
- Frontend integration
- Audit logging

✅ **Integration:**
- Works seamlessly with existing RBAC
- Compatible with all Guards
- Easy frontend implementation
- Database-backed persistence

🚀 **Start with Method 1 (PluginInstallation)** for production-ready solution!
