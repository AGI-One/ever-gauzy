# 📚 Ever-Gauzy Documentation Index

> Comprehensive documentation for Ever-Gauzy authorization, multi-tenancy, and plugin architecture

---

## 🔐 Authorization & RBAC

### Main Documentation
- **[AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md)** ⭐ **[3,984 lines]**
  - Complete guide to authorization mechanism
  - 9 system roles analysis
  - 150+ permissions breakdown
  - Guards implementation
  - Frontend integration
  - Testing & troubleshooting

---

## 🏗️ Multi-Tenant Architecture

### Custom Modules & Plugins
- **[CUSTOM_MODULE_ARCHITECTURE.md](./CUSTOM_MODULE_ARCHITECTURE.md)** ⭐ **[763+ lines]**
  - Microservices vs Plugin-based comparison
  - **Recommended: Plugin-based architecture**
  - Authorization integration guide
  - Deployment strategies
  - Implementation examples
  - Best practices

### Quick Start
- **[QUICK_START_CUSTOM_PLUGIN.md](./QUICK_START_CUSTOM_PLUGIN.md)** ⭐ **[450+ lines]**
  - 15-minute tutorial
  - Step-by-step guide
  - Complete code examples
  - Permission seeding
  - API testing

---

## 🔌 Plugin Management

### Per-Tenant Plugin Control
- **[PLUGIN_PER_TENANT_MANAGEMENT.md](./PLUGIN_PER_TENANT_MANAGEMENT.md)** ⭐ **NEW!**
  - Enable/disable plugins per-tenant
  - 2 implementation methods
  - Guards & middleware
  - API endpoints
  - Frontend integration
  - Database schema
  - Testing examples
  - Best practices

### Quick Answer
- **[QUICK_ANSWER_PLUGIN_PER_TENANT.md](./QUICK_ANSWER_PLUGIN_PER_TENANT.md)**
  - TL;DR version
  - Code snippets
  - Use cases
  - Quick reference

---

## 📖 Documentation Map

```
docs/
├── AUTHORIZATION_SYSTEM.md              # 🔐 Complete RBAC guide
├── ROLE_NAME_NORMALIZATION.md           # 🔧 Role naming rules
├── CUSTOM_MODULE_ARCHITECTURE.md        # 🏗️ Multi-tenant architecture
├── QUICK_START_CUSTOM_PLUGIN.md         # 🚀 15-min tutorial
├── PLUGIN_PER_TENANT_MANAGEMENT.md      # 🔌 Per-tenant plugins
└── QUICK_ANSWER_PLUGIN_PER_TENANT.md    # 📌 Quick reference
```

---

## 🎯 Scenarios & Use Cases

### Scenario 1: Understanding Authorization
**Goal:** Learn how Ever-Gauzy RBAC works

1. Start with [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md)
2. Review 9 system roles
3. Check permissions breakdown
4. Test with examples

### Scenario 2: Building Custom Module for Customer
**Goal:** Create custom plugin for specific customer (e.g., Loyalty Program)

1. Read [CUSTOM_MODULE_ARCHITECTURE.md](./CUSTOM_MODULE_ARCHITECTURE.md) - Understand architecture
2. Follow [QUICK_START_CUSTOM_PLUGIN.md](./QUICK_START_CUSTOM_PLUGIN.md) - Implement in 15 min
3. Reference [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md) - Add permissions
4. Check [PLUGIN_PER_TENANT_MANAGEMENT.md](./PLUGIN_PER_TENANT_MANAGEMENT.md) - Enable per-tenant

### Scenario 3: Multi-Tenant SaaS with Different Features
**Goal:** Base platform + custom modules per customer

1. Review architecture in [CUSTOM_MODULE_ARCHITECTURE.md](./CUSTOM_MODULE_ARCHITECTURE.md)
2. Implement plugins following [QUICK_START_CUSTOM_PLUGIN.md](./QUICK_START_CUSTOM_PLUGIN.md)
3. Enable per-tenant: [PLUGIN_PER_TENANT_MANAGEMENT.md](./PLUGIN_PER_TENANT_MANAGEMENT.md)
4. Test authorization: [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md)

### Scenario 4: Plugin Enable/Disable Per-Tenant
**Goal:** Control which tenants can use specific plugins

**Quick Answer:** [QUICK_ANSWER_PLUGIN_PER_TENANT.md](./QUICK_ANSWER_PLUGIN_PER_TENANT.md)

**Full Guide:** [PLUGIN_PER_TENANT_MANAGEMENT.md](./PLUGIN_PER_TENANT_MANAGEMENT.md)

Key points:
- ✅ YES - Plugins can be enabled/disabled per-tenant
- 2 methods: PluginInstallation (recommended) or TenantSetting
- Guards automatically check plugin status
- API endpoints for admin management
- Frontend integration examples

---

## 🔍 Quick Reference

### Key Concepts

| Concept | Description | Doc |
|---------|-------------|-----|
| **RBAC** | Role-Based Access Control | [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md) |
| **Guards** | Endpoint protection (Auth, Role, Permission) | [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md#️-guards-endpoint-protection) |
| **Multi-Tenant** | Tenant isolation & context | [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md#-special-features) |
| **Plugin System** | Extensible architecture | [CUSTOM_MODULE_ARCHITECTURE.md](./CUSTOM_MODULE_ARCHITECTURE.md) |
| **Per-Tenant Plugins** | Enable/disable plugins per-tenant | [PLUGIN_PER_TENANT_MANAGEMENT.md](./PLUGIN_PER_TENANT_MANAGEMENT.md) |

### Common Tasks

| Task | Documentation |
|------|--------------|
| Check user permissions | [Authorization System - Usage Guide](./AUTHORIZATION_SYSTEM.md#-usage-guide) |
| Create custom role | [Authorization System - Database Schema](./AUTHORIZATION_SYSTEM.md#-database-schema) |
| Add new permission | [Authorization System - Permissions](./AUTHORIZATION_SYSTEM.md#️-basic-structure) |
| Build custom plugin | [Quick Start Custom Plugin](./QUICK_START_CUSTOM_PLUGIN.md) |
| Enable plugin for tenant | [Plugin Per-Tenant Management](./PLUGIN_PER_TENANT_MANAGEMENT.md#-implementation-methods) |
| Protect API endpoint | [Authorization System - Guards](./AUTHORIZATION_SYSTEM.md#️-guards-endpoint-protection) |

---

## 📊 Documentation Statistics

| File | Lines | Topics |
|------|-------|--------|
| AUTHORIZATION_SYSTEM.md | 3,984 | RBAC, Guards, Permissions, Testing |
| CUSTOM_MODULE_ARCHITECTURE.md | 763+ | Architecture, Plugins, Deployment |
| PLUGIN_PER_TENANT_MANAGEMENT.md | 900+ | Per-tenant control, API, Guards |
| QUICK_START_CUSTOM_PLUGIN.md | 450+ | Tutorial, Examples, Testing |
| ROLE_NAME_NORMALIZATION.md | 300+ | Naming, Migration, Testing |
| QUICK_ANSWER_PLUGIN_PER_TENANT.md | 200+ | Quick reference, Code snippets |
| **Total** | **6,600+** | **Complete guide** |

---

## 🚀 Getting Started

### For Developers New to Ever-Gauzy

**Step 1: Understand Authorization**
```bash
# Read authorization basics
cat docs/AUTHORIZATION_SYSTEM.md | less
```

**Step 2: Try Custom Plugin (15 min)**
```bash
# Follow quick start guide
cat docs/QUICK_START_CUSTOM_PLUGIN.md | less
```

**Step 3: Enable Plugin Per-Tenant**
```bash
# Learn per-tenant control
cat docs/PLUGIN_PER_TENANT_MANAGEMENT.md | less
```

### For Architects & Team Leads

**Step 1: Review Architecture**
- [CUSTOM_MODULE_ARCHITECTURE.md](./CUSTOM_MODULE_ARCHITECTURE.md)
- Understand microservices vs plugin-based approach
- Choose deployment strategy

**Step 2: Plan Implementation**
- [QUICK_START_CUSTOM_PLUGIN.md](./QUICK_START_CUSTOM_PLUGIN.md)
- Define custom permissions
- Design plugin structure

**Step 3: Authorization Integration**
- [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md)
- Plan role-permission mapping
- Design guards & middleware

---

## 🎓 Learning Path

### Beginner
1. [QUICK_ANSWER_PLUGIN_PER_TENANT.md](./QUICK_ANSWER_PLUGIN_PER_TENANT.md) - Quick overview
2. [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md) - Sections 1-3 (basics)
3. [QUICK_START_CUSTOM_PLUGIN.md](./QUICK_START_CUSTOM_PLUGIN.md) - Hands-on tutorial

### Intermediate
1. [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md) - Full guide
2. [CUSTOM_MODULE_ARCHITECTURE.md](./CUSTOM_MODULE_ARCHITECTURE.md) - Architecture
3. [PLUGIN_PER_TENANT_MANAGEMENT.md](./PLUGIN_PER_TENANT_MANAGEMENT.md) - Advanced plugin control

### Advanced
1. [AUTHORIZATION_SYSTEM.md](./AUTHORIZATION_SYSTEM.md) - Advanced sections
2. [CUSTOM_MODULE_ARCHITECTURE.md](./CUSTOM_MODULE_ARCHITECTURE.md) - Deployment strategies
3. [PLUGIN_PER_TENANT_MANAGEMENT.md](./PLUGIN_PER_TENANT_MANAGEMENT.md) - Testing & best practices
4. Implement custom plugins for production

---

## 🤝 Contributing

Contributing to documentation:

1. Fork repository
2. Create branch: `git checkout -b docs/improve-plugin-guide`
3. Update documentation
4. Submit PR with clear description

---

## 📝 Changelog

### 2025-10-28
- ✅ Added `PLUGIN_PER_TENANT_MANAGEMENT.md` - Complete guide for per-tenant plugin control
- ✅ Added `QUICK_ANSWER_PLUGIN_PER_TENANT.md` - Quick reference
- ✅ Updated `CUSTOM_MODULE_ARCHITECTURE.md` - Added plugin enable/disable section
- ✅ Updated `AUTHORIZATION_SYSTEM.md` - Linked plugin management docs

### Previous
- ✅ Created `AUTHORIZATION_SYSTEM.md` - 3,984 lines comprehensive guide
- ✅ Created `CUSTOM_MODULE_ARCHITECTURE.md` - Architecture comparison
- ✅ Created `QUICK_START_CUSTOM_PLUGIN.md` - 15-minute tutorial
- ✅ Created `ROLE_NAME_NORMALIZATION.md` - Auto-normalization guide

---

## 📞 Support

Need help?
- 📧 Email: support@gauzy.co
- 💬 Discord: https://discord.gg/gauzy
- 🐛 Issues: https://github.com/ever-co/ever-gauzy/issues
- 📖 Docs: https://docs.gauzy.co

---

## 📄 License

Ever-Gauzy Platform is [AGPL-3.0 licensed](../LICENSE).

Documentation is [CC BY 4.0 licensed](https://creativecommons.org/licenses/by/4.0/).
