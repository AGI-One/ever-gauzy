# 📌 Quick Answer: Plugin Per-Tenant

**Question:** Can plugins be enabled/disabled per-tenant?

## ✅ ANSWER: YES!

Ever-Gauzy **fully supports** enable/disable plugins for each tenant independently.

---

## 🎯 Key Features

```
Tenant A: ✅ Loyalty Plugin ON   ✅ Analytics Plugin ON
Tenant B: ❌ Loyalty Plugin OFF  ✅ Analytics Plugin ON
Tenant C: ✅ Loyalty Plugin ON   ❌ Analytics Plugin OFF
```

### What Can You Do?

- ✅ **Enable/disable plugin per-tenant** - Each tenant independent
- ✅ **Enable/disable plugin per-organization** - Within same tenant
- ✅ **Track installation history** - Who enabled, when, which version
- ✅ **API management** - Enable/disable via REST API
- ✅ **Frontend integration** - Hide/show UI automatically
- ✅ **Access control** - Guards check automatically

---

## 🛠️ Implementation (2 Methods)

### Method 1: Plugin Installation (Recommended) ⭐

Using built-in `PluginInstallation` entity:

```typescript
// Service
async isPluginEnabled(): Promise<boolean> {
    const tenantId = RequestContext.currentTenantId();

    const installation = await this.pluginInstallationRepository.findOne({
        where: {
            plugin: { name: 'LoyaltyPlugin' },
            tenantId,
            status: PluginInstallationStatus.INSTALLED
        }
    });

    return !!installation;
}

// Enable
await this.pluginInstallationRepository.create({
    plugin,
    status: PluginInstallationStatus.INSTALLED,
    installedAt: new Date(),
    tenantId
});

// Disable
await this.pluginInstallationRepository.update(
    { plugin: { name: 'LoyaltyPlugin' }, tenantId },
    { status: PluginInstallationStatus.UNINSTALLED }
);
```

**Pros:**
- ✅ Full audit trail (who, when, version)
- ✅ Native Ever-Gauzy approach
- ✅ Support multiple versions

### Method 2: Tenant Settings (Simpler)

Using `TenantSetting`:

```typescript
// Check
const setting = await this.tenantSettingRepository.findOne({
    where: {
        name: 'loyalty_plugin_enabled',
        tenantId
    }
});
return setting?.value === 'true';

// Set
await this.tenantSettingRepository.save({
    name: 'loyalty_plugin_enabled',
    value: 'true',
    tenantId
});
```

**Pros:**
- ✅ Simpler
- ✅ Faster queries
- ❌ Less tracking information

---

## 🛡️ Guard Pattern

```typescript
// 1. Create Guard
@Injectable()
export class LoyaltyPluginGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isEnabled = await this.loyaltyPluginService.isPluginEnabled();

        if (!isEnabled) {
            throw new ForbiddenException(
                'Loyalty plugin not enabled for this tenant'
            );
        }

        return true;
    }
}

// 2. Apply to Controller
@Controller('loyalty/cards')
@UseGuards(
    TenantPermissionGuard,     // Check tenant
    LoyaltyPluginGuard,        // Check plugin enabled ⭐
    PermissionGuard            // Check permission
)
export class LoyaltyCardController {
    @Get()
    @Permissions('LOYALTY_CARD_READ')
    async findAll() {
        // Only accessible if plugin enabled + user has permission
    }
}
```

---

## 🌐 API Endpoints

```typescript
// Admin endpoints
GET    /api/admin/plugins/loyalty/status   // Get plugin status
POST   /api/admin/plugins/loyalty/enable   // Enable for tenant
POST   /api/admin/plugins/loyalty/disable  // Disable for tenant

// Example Response
{
    "enabled": true,
    "status": "INSTALLED",
    "installedAt": "2025-10-28T10:30:00Z",
    "installedBy": "admin@company.com",
    "version": "1.0.0"
}
```

---

## 🎨 Frontend Integration

### Angular Component

```typescript
@Component({
    template: `
        <div *ngIf="pluginEnabled; else disabledMessage">
            <!-- Show plugin features -->
            <h2>Loyalty Cards</h2>
            <button>Create Card</button>
        </div>

        <ng-template #disabledMessage>
            <div class="alert">
                🔌 Plugin not enabled. Contact admin.
            </div>
        </ng-template>
    `
})
export class LoyaltyComponent implements OnInit {
    pluginEnabled = false;

    async ngOnInit() {
        const status = await this.loyaltyPluginService.checkStatus();
        this.pluginEnabled = status.enabled;
    }
}
```

### Route Guard

```typescript
// Prevent access to entire route if plugin disabled
const routes: Routes = [
    {
        path: 'loyalty',
        canActivate: [LoyaltyPluginRouteGuard], // ⭐
        loadChildren: () => import('./loyalty/loyalty.module')
    }
];
```

---

## 🗄️ Database

```sql
-- Plugin Installation (per-tenant)
CREATE TABLE plugin_installation (
    id UUID PRIMARY KEY,
    plugin_id UUID REFERENCES plugin(id),
    tenant_id UUID REFERENCES tenant(id),
    organization_id UUID REFERENCES organization(id),
    status VARCHAR(50), -- INSTALLED, UNINSTALLED, FAILED
    installed_at TIMESTAMP,
    installed_by_id UUID REFERENCES employee(id),

    UNIQUE(plugin_id, tenant_id, organization_id)
);

CREATE INDEX idx_plugin_installation_tenant
ON plugin_installation(tenant_id, status);
```

---

## 📊 Use Cases

### 1. Pricing Tiers
```
Free:       Core features only
Pro:        + Loyalty Plugin
Enterprise: + Loyalty + Analytics + Custom Plugins
```

### 2. Beta Rollout
```
Phase 1: Enable for 5 beta tenants
Phase 2: Monitor usage + bugs
Phase 3: Enable for all tenants
```

### 3. Customer-Specific Features
```
Tenant A: E-commerce → Enable Loyalty Plugin
Tenant B: B2B SaaS   → Disable Loyalty, Enable Analytics
Tenant C: Marketplace → Enable All
```

---

## ✅ Best Practices

1. **Always use Guards** - Protect endpoints automatically
2. **Cache plugin status** - Avoid DB query each request
3. **Graceful degradation** - Show upgrade message, not crash
4. **Audit logging** - Track who enabled/disabled
5. **Feature flags** - Beta testing before full rollout

---

## 📚 Full Documentation

See complete documentation at:
- [PLUGIN_PER_TENANT_MANAGEMENT.md](./PLUGIN_PER_TENANT_MANAGEMENT.md) - 20+ pages guide
- [CUSTOM_MODULE_ARCHITECTURE.md](./CUSTOM_MODULE_ARCHITECTURE.md) - Architecture overview
- [QUICK_START_CUSTOM_PLUGIN.md](./QUICK_START_CUSTOM_PLUGIN.md) - 15-min tutorial

---

## 🎉 Summary

✅ **YES** - Plugins can be enabled/disabled per-tenant
✅ **2 Methods** - PluginInstallation (recommended) or TenantSetting
✅ **Full support** - Guards, API, Frontend, Database
✅ **Production ready** - Already used by ActivePieces, Zapier integrations

🚀 **Start implementing now!**
