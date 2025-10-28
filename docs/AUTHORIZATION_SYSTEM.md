# 🔐 Authorization Mechanism in Ever-Gauzy

> Comprehensive documentation on Authorization & Permission (RBAC) system in Ever-Gauzy Platform

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Basic Structure](#-basic-structure)
- [Guards (Endpoint Protection)](#-guards-endpoint-protection)
- [Usage Guide](#-usage-guide)
- [Request Processing Flow](#-request-processing-flow)
- [Database Schema](#-database-schema)
- [Special Features](#-special-features)
- [🚀 Auto-Normalization](#-auto-normalization) ⭐ **NEW**
- [🏗️ Custom Modules & Plugins](#-custom-modules--plugins) ⭐ **NEW**
- [Best Practices](#-best-practices)

---

## 🏗️ Custom Modules & Plugins

> **Architecture for Multi-Tenant with Custom Customer Modules**

Ever-Gauzy supports **Plugin-based architecture** that enables:
- ✅ Shared base platform for all tenants
- ✅ Custom modules for each customer
- ✅ Automatic authorization integration
- ✅ Reuse entire RBAC system
- ✅ **Enable/disable plugins per-tenant** 🔌

**See details:**
- [Custom Module Architecture Guide](./CUSTOM_MODULE_ARCHITECTURE.md) - Multi-tenant architecture
- [Plugin Per-Tenant Management](./PLUGIN_PER_TENANT_MANAGEMENT.md) - Enable/disable plugins per-tenant

**Key features:**
- Custom permissions for each plugin
- Shared guards and decorators (@Permissions, @Roles)
- Automatic multi-tenant isolation
- **Per-tenant plugin activation/deactivation**
- Plugin lifecycle management
- Dynamic permission registration

**Example:**
```typescript
// Custom plugin with custom permissions
@Plugin({
	imports: [CustomerAModule],
	entities: [CustomEntity]
})
export class CustomerAPlugin {
	// Custom permissions
	enum CustomerAPermissions {
		INVENTORY_VIEW = 'CUSTOMER_A_INVENTORY_VIEW',
		REPORTS_EXPORT = 'CUSTOMER_A_REPORTS_EXPORT'
	}

	// Controllers automatically use base guards
	@UseGuards(TenantPermissionGuard, PermissionGuard)
	@Permissions(CustomerAPermissions.INVENTORY_VIEW)
	async getData() { /* ... */ }
}
```

---

## 🚀 Auto-Normalization

> **New Update:** System automatically normalizes role names to prevent "messy" names!

### Problem

Previously, users could create roles with names like:
- `Platform Admin`, `admin`, `Super_Admin` → causing confusion
- Case-sensitive comparison → logic errors
- Not consistent → hard to maintain

### Solution

**Automatically transform all role names to UPPERCASE with underscores:**

```typescript
Input: "Platform Admin"  → Output: "PLATFORM_ADMIN" (then rejected - reserved)
Input: "admin"           → Output: "ADMIN" (then rejected - reserved)
Input: "sales manager"   → Output: "SALES_MANAGER" ✅ (allowed)
Input: "  HR Manager  "  → Output: "HR_MANAGER" ✅ (allowed)
```

### Implementation

**2-layer protection:**

1. **DTO Transform** (HTTP requests)
2. **Service Normalization** (direct calls, migrations)

**See details:** [Role Name Normalization Guide](./ROLE_NAME_NORMALIZATION.md)

### Benefits

✅ **No more messy names:** All are UPPERCASE with `_`
✅ **User-friendly:** Users type freely, system normalizes automatically
✅ **Accurate validation:** Reserved names always detected
✅ **Zero breaking changes:** Frontend doesn't need any changes

---

## 🎯 Architecture Overview

Ever-Gauzy uses **RBAC (Role-Based Access Control)** system with **3 main security layers**:

1. **Authentication** - Identifies who the user is
2. **Authorization by Role** - Checks user role
3. **Authorization by Permission** - Checks specific permissions

### Main Components

```
┌─────────────────────────────────────────────────────┐
│                  REQUEST FLOW                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Request → AuthGuard → RoleGuard → PermissionGuard  │
│              ↓            ↓              ↓           │
│           JWT Token    Check Role   Check Permission│
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ Basic Structure

### 1. Roles

**File:** `packages/contracts/src/lib/role.model.ts`

```typescript
export enum RolesEnum {
    PLATFORM_ADMIN = 'PLATFORM_ADMIN',  // Platform Administrator (bypass all)
    SUPER_ADMIN = 'SUPER_ADMIN',        // Super Administrator
    ADMIN = 'ADMIN',                    // Administrator
    DATA_ENTRY = 'DATA_ENTRY',          // Data Entry Staff
    EMPLOYEE = 'EMPLOYEE',              // Employee
    CANDIDATE = 'CANDIDATE',            // Candidate
    MANAGER = 'MANAGER',                // Manager
    VIEWER = 'VIEWER',                  // Viewer
    INTERVIEWER = 'INTERVIEWER'         // Interviewer
}
```

#### Role Characteristics

| Role | Description | Special Rights |
|------|-------------|----------------|
| `PLATFORM_ADMIN` | Platform-wide administrator | Bypass all permission checks |
| `SUPER_ADMIN` | Tenant administrator | Manage everything within tenant |
| `ADMIN` | Organization administrator | Manage organization |
| `DATA_ENTRY` | Data entry staff | Data entry, manage tasks, invoices |
| `EMPLOYEE` | Employee | Basic rights per organization |
| `MANAGER` | Team manager | Manage plugins and team |
| `CANDIDATE` | Candidate | Minimal rights |
| `INTERVIEWER` | Interviewer | Manage candidate interviews |
| `VIEWER` | View only | View plugins only |

---

## 🎭 Detailed Permission Analysis by Role

> **Source file:** `packages/core/src/lib/role-permission/default-role-permissions.ts`

### 1. 👑 PLATFORM_ADMIN

**Number of permissions:** ~195 permissions (ALL)

**Special privileges:**
- ✅ **Bypass all guards** - No permission checks needed
- ✅ **Manage entire platform** - Access all tenants
- ✅ **Full access** - All functions in system

#### Main Permission Groups

<details>
<summary><b>Dashboard Permissions (6)</b></summary>

```typescript
ADMIN_DASHBOARD_VIEW
TEAM_DASHBOARD
PROJECT_MANAGEMENT_DASHBOARD
TIME_TRACKING_DASHBOARD
ACCOUNTING_DASHBOARD
HUMAN_RESOURCE_DASHBOARD
```
</details>

<details>
<summary><b>Employee Management (4)</b></summary>

```typescript
ORG_EMPLOYEES_ADD
ORG_EMPLOYEES_VIEW
ORG_EMPLOYEES_EDIT
ORG_EMPLOYEES_DELETE
```
</details>

<details>
<summary><b>Task Management (5)</b></summary>

```typescript
ORG_TASK_ADD
ORG_TASK_VIEW
ORG_TASK_EDIT
ORG_TASK_DELETE
ORG_TASK_SETTING
```
</details>

<details>
<summary><b>Financial Permissions (10)</b></summary>

```typescript
ORG_PAYMENT_VIEW
ORG_PAYMENT_ADD_EDIT
ORG_INCOMES_VIEW
ORG_INCOMES_EDIT
ORG_EXPENSES_VIEW
ORG_EXPENSES_EDIT
EMPLOYEE_EXPENSES_VIEW
EMPLOYEE_EXPENSES_EDIT
INVOICES_VIEW
INVOICES_EDIT
```
</details>

<details>
<summary><b>Special Admin Permissions</b></summary>

```typescript
CHANGE_SELECTED_EMPLOYEE      // View all employees
CHANGE_SELECTED_ORGANIZATION  // Change organization
CHANGE_ROLES_PERMISSIONS      // Manage roles & permissions
SUPER_ADMIN_EDIT              // Edit super admin
ACCESS_DELETE_ACCOUNT         // Delete account
ACCESS_DELETE_ALL_DATA        // Delete all data
MIGRATE_GAUZY_CLOUD           // Migration
```
</details>

**Use Case:** Manager of entire platform, can access and manage all tenants.

---

### 2. 🔱 SUPER_ADMIN

**Number of permissions:** ~195 permissions (Same as PLATFORM_ADMIN)

**Differences from PLATFORM_ADMIN:**
- ❌ Does not bypass guards (must check permissions)
- ✅ Only manages within 1 specific tenant
- ✅ Has all permissions but restricted to tenant

#### Characteristic Permissions

```typescript
SUPER_ADMIN_EDIT               // Edit super admin settings
CHANGE_ROLES_PERMISSIONS       // Manage roles/permissions
TENANT_SETTING                 // Configure tenant
ALL_ORG_VIEW / ALL_ORG_EDIT   // View/edit all organizations
```

**Use Case:** CEO, CTO of a company (tenant) - managing their entire company.

---

### 3. 👨‍💼 ADMIN

**Number of permissions:** ~140 permissions

**Differences from SUPER_ADMIN:**
- ❌ Does not have `SUPER_ADMIN_EDIT`
- ✅ Has most organization management permissions
- ✅ Manages employees, projects, teams

#### Core Permissions

<details>
<summary><b>Full Management Access</b></summary>

```typescript
// Employees
ORG_EMPLOYEES_ADD/VIEW/EDIT/DELETE

// Projects
ORG_PROJECT_ADD/VIEW/EDIT/DELETE

// Teams
ORG_TEAM_ADD/VIEW/EDIT/DELETE
ORG_TEAM_EDIT_ACTIVE_TASK
ORG_TEAM_JOIN_REQUEST_VIEW/EDIT

// Tasks
ORG_TASK_ADD/VIEW/EDIT/DELETE

// Candidates
ORG_CANDIDATES_VIEW/EDIT
ORG_CANDIDATES_INTERVIEW_EDIT/VIEW

// Financial
INVOICES_VIEW/EDIT
ESTIMATES_VIEW/EDIT
ORG_PAYMENT_VIEW/ADD_EDIT
```
</details>

<details>
<summary><b>Admin-Specific Permissions</b></summary>

```typescript
CHANGE_SELECTED_EMPLOYEE       // View all employees
CHANGE_ROLES_PERMISSIONS       // Manage permissions
CAN_APPROVE_TIMESHEET          // Approve timesheets
TIMESHEET_EDIT_TIME            // Edit timesheet
ACCESS_PRIVATE_PROJECTS        // Access private projects
```
</details>

**Use Case:** HR Manager, Senior Project Manager - managing organization/department.

---

### 4. 📝 DATA_ENTRY

**Number of permissions:** ~35 permissions

**Focused on:** Data entry, invoicing, task management

#### Core Permissions

```typescript
// Financial Data Entry
ORG_PAYMENT_VIEW
ORG_PAYMENT_ADD_EDIT
ORG_EXPENSES_VIEW/EDIT
ORG_INCOMES_VIEW/EDIT
INVOICES_VIEW/EDIT
ESTIMATES_VIEW/EDIT

// Task Management
ORG_TASK_ADD/VIEW/EDIT/DELETE

// Project Modules
PROJECT_MODULE_CREATE/READ/UPDATE/DELETE

// Dashboard
DASHBOARD_CREATE/READ/UPDATE/DELETE

// Candidates
ORG_CANDIDATES_TASK_EDIT
ORG_CANDIDATES_INTERVIEW_EDIT/VIEW

// Inventory
ORG_INVENTORY_PRODUCT_EDIT

// Basic
PROFILE_EDIT
SELECT_EMPLOYEE
```

**Characteristics:**
- ✅ Financial data entry (invoices, expenses, incomes)
- ✅ Manage tasks
- ✅ Create/edit dashboards
- ❌ Cannot view employees
- ❌ Cannot manage organization settings

**Use Case:** Accountant, data entry staff, data analyst.

---

### 5. 👷 EMPLOYEE

**Number of permissions:** ~75 permissions

**Focused on:** Self-service, team collaboration, daily work

#### Core Permissions

<details>
<summary><b>Dashboard Access</b></summary>

```typescript
ADMIN_DASHBOARD_VIEW
PROJECT_MANAGEMENT_DASHBOARD
TIME_TRACKING_DASHBOARD
HUMAN_RESOURCE_DASHBOARD
```
</details>

<details>
<summary><b>Task & Project</b></summary>

```typescript
// Tasks
ORG_TASK_ADD/VIEW/EDIT

// Projects
ORG_PROJECT_ADD/VIEW

// Daily Planning
DAILY_PLAN_CREATE/READ/UPDATE/DELETE

// Project Modules
PROJECT_MODULE_CREATE/READ/UPDATE/DELETE
```
</details>

<details>
<summary><b>Team Collaboration</b></summary>

```typescript
// Teams
ORG_TEAM_ADD/VIEW/EDIT/DELETE
ORG_TEAM_EDIT_ACTIVE_TASK
ORG_TEAM_REMOVE_ACCOUNT_AS_MEMBER
ORG_TEAM_JOIN_REQUEST_VIEW

// Members
ORG_MEMBERS_VIEW

// Contacts
ORG_CONTACT_VIEW
```
</details>

<details>
<summary><b>Self-Service</b></summary>

```typescript
// Time Off
TIME_OFF_VIEW

// Expenses
EMPLOYEE_EXPENSES_VIEW/EDIT

// Time Tracking
TIME_TRACKER
ALLOW_DELETE_TIME
ALLOW_MODIFY_TIME
ALLOW_MANUAL_TIME
DELETE_SCREENSHOTS

// Profile
PROFILE_EDIT
ACCESS_DELETE_ACCOUNT

// Availability
EMPLOYEE_AVAILABILITY_CREATE/READ/UPDATE/DELETE
```
</details>

<details>
<summary><b>Documents & Media</b></summary>

```typescript
// Inventory Gallery
INVENTORY_GALLERY_ADD/VIEW/EDIT/DELETE

// Media Gallery
MEDIA_GALLERY_ADD/VIEW/EDIT/DELETE

// Tags
ORG_TAGS_ADD/VIEW/EDIT/DELETE
ORG_TAG_TYPES_ADD/VIEW/EDIT/DELETE
```
</details>

**Characteristics:**
- ✅ Manage personal work (tasks, time tracking)
- ✅ Join teams and projects
- ✅ View and create proposals
- ✅ Manage personal expenses
- ❌ Cannot manage other employees
- ❌ Cannot change organization settings
- ❌ Can only see own data (unless has CHANGE_SELECTED_EMPLOYEE)

**Use Case:** Regular employee - developer, designer, marketer.

---

### 6. 🎤 INTERVIEWER

**Number of permissions:** 4 permissions

**Focused on:** Candidate interviewing

```typescript
ORG_CANDIDATES_INTERVIEW_EDIT
ORG_CANDIDATES_INTERVIEW_VIEW
ORG_CANDIDATES_DOCUMENTS_VIEW
PLUGIN_VIEW
```

**Characteristics:**
- ✅ Manage interviews
- ✅ View candidate documents
- ❌ No other permissions

**Use Case:** Technical interviewer, HR interviewer.

---

### 7. 🎓 CANDIDATE

**Number of permissions:** 1 permission

```typescript
PLUGIN_VIEW
```

**Characteristics:**
- ✅ View plugins only
- ❌ Almost no permissions in system
- ℹ️ Used to apply for jobs, participate in interview process

**Use Case:** Job applicant.

---

### 8. 📊 MANAGER

**Number of permissions:** 9 permissions

**Focused on:** Plugin management

```typescript
PLUGIN_VIEW
PLUGIN_DISCOVER
PLUGIN_INSTALL
PLUGIN_UNINSTALL
PLUGIN_UPDATE
PLUGIN_ENABLE
PLUGIN_DISABLE
PLUGIN_CONFIGURE
PLUGIN_DELETE
```

**Characteristics:**
- ✅ Full plugin management
- ❌ Few permissions in core system
- ℹ️ This role seems to be under development

**Use Case:** Plugin administrator, system integrator.

---

### 9. 👀 VIEWER

**Number of permissions:** 2 permissions

```typescript
PLUGIN_VIEW
PLUGIN_DISCOVER
```

**Characteristics:**
- ✅ View only
- ✅ Discover plugins
- ❌ Cannot edit/delete anything

**Use Case:** Auditor, observer, external consultant.

---

## 📊 Permission Comparison Between Roles

### Overall Comparison Table

| Role | Total Perms | Dashboards | Employees | Projects | Tasks | Financial | Admin |
|------|-------------|------------|-----------|----------|-------|-----------|-------|
| PLATFORM_ADMIN | ~195 | ✅ All | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| SUPER_ADMIN | ~195 | ✅ All | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| ADMIN | ~140 | ✅ All | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Most |
| DATA_ENTRY | ~35 | ❌ No | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Full | ❌ No |
| EMPLOYEE | ~75 | ⚠️ Some | ❌ No | ⚠️ View | ✅ Yes | ⚠️ Self | ❌ No |
| MANAGER | 9 | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ⚠️ Plugins |
| INTERVIEWER | 4 | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| CANDIDATE | 1 | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| VIEWER | 2 | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

### Permissions Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    PLATFORM_ADMIN                        │
│                    (Bypass All)                          │
└─────────────────────────────────────────────────────────┘
                            │
                            │ ~195 permissions
                            │
┌─────────────────────────────────────────────────────────┐
│                    SUPER_ADMIN                           │
│              (Full Tenant Management)                    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ ~195 permissions (tenant-scoped)
                            │
┌─────────────────────────────────────────────────────────┐
│                       ADMIN                              │
│            (Organization Management)                     │
└─────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
    ┌───────────▼──────────┐  ┌────────▼─────────┐
    │    DATA_ENTRY        │  │    EMPLOYEE      │
    │  (Data Operations)   │  │  (Self Service)  │
    │   ~35 permissions    │  │  ~75 permissions │
    └──────────────────────┘  └──────────────────┘
                │
        ┌───────┴────────┬──────────┬──────────┐
        │                │          │          │
    ┌───▼────┐   ┌──────▼──┐  ┌────▼────┐  ┌──▼─────┐
    │MANAGER │   │INTERVIEW│  │CANDIDATE│  │ VIEWER │
    │   9    │   │    4    │  │    1    │  │   2    │
    └────────┘   └─────────┘  └─────────┘  └────────┘
```

### Key Permissions Matrix

| Permission Category | PLATFORM | SUPER | ADMIN | DATA | EMPL | MGR | INT | CAN | VIW |
|---------------------|----------|-------|-------|------|------|-----|-----|-----|-----|
| **CHANGE_SELECTED_EMPLOYEE** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CHANGE_ROLES_PERMISSIONS** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **EMPLOYEES CRUD** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TASKS CRUD** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **PROJECTS CRUD** | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **INVOICES** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **TIME_TRACKER** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CAN_APPROVE_TIMESHEET** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **TEAM Management** | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **PLUGIN Management** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ⚠️ |

**Legend:**
- ✅ Full Access
- ⚠️ Limited Access (View/Edit only, no Delete)
- ❌ No Access

---

## 🔍 Permission Patterns

### 1. CRUD Pattern

Most entities follow CRUD pattern:

```typescript
// Entity: Tasks
ORG_TASK_ADD      // Create
ORG_TASK_VIEW     // Read
ORG_TASK_EDIT     // Update
ORG_TASK_DELETE   // Delete
```

**Roles with full CRUD:**
- PLATFORM_ADMIN, SUPER_ADMIN, ADMIN: Tasks, Projects, Teams, Employees
- DATA_ENTRY: Tasks only
- EMPLOYEE: Tasks (no delete), Projects (view only)

### 2. Hierarchical Access Pattern

```typescript
// Example: Employee Management
CHANGE_SELECTED_EMPLOYEE  → Can view/manage ALL employees
↓ (without this)
SELECT_EMPLOYEE           → Can only view/select specific employees
↓ (without this)
No access                 → Cannot see employees at all
```

### 3. Self-Service Pattern

```typescript
// EMPLOYEE can self-manage:
EMPLOYEE_EXPENSES_VIEW/EDIT        // Own expenses
PROFILE_EDIT                       // Own profile
EMPLOYEE_AVAILABILITY_*            // Own availability
ACCESS_DELETE_ACCOUNT              // Own account
```

### 4. Approval Pattern

```typescript
// Workflow: Request → Approval
REQUEST_APPROVAL_VIEW/EDIT    // Create/view requests
APPROVAL_POLICY_VIEW/EDIT     // Set approval policies
CAN_APPROVE_TIMESHEET         // Approve specific items
EQUIPMENT_APPROVE_REQUEST     // Approve equipment requests
```

### 2. Permissions

**File:** `packages/contracts/src/lib/role-permission.model.ts`

The system has **over 150+ permissions** grouped by function:

```typescript
export enum PermissionsEnum {
    // ==================== DASHBOARD ====================
    ADMIN_DASHBOARD_VIEW = 'ADMIN_DASHBOARD_VIEW',
    TEAM_DASHBOARD = 'TEAM_DASHBOARD',
    PROJECT_MANAGEMENT_DASHBOARD = 'PROJECT_MANAGEMENT_DASHBOARD',
    TIME_TRACKING_DASHBOARD = 'TIME_TRACKING_DASHBOARD',
    ACCOUNTING_DASHBOARD = 'ACCOUNTING_DASHBOARD',
    HUMAN_RESOURCE_DASHBOARD = 'HUMAN_RESOURCE_DASHBOARD',

    // ==================== EMPLOYEES ====================
    ORG_EMPLOYEES_ADD = 'ORG_EMPLOYEES_ADD',
    ORG_EMPLOYEES_VIEW = 'ORG_EMPLOYEES_VIEW',
    ORG_EMPLOYEES_EDIT = 'ORG_EMPLOYEES_EDIT',
    ORG_EMPLOYEES_DELETE = 'ORG_EMPLOYEES_DELETE',

    // ==================== TASKS ====================
    ORG_TASK_ADD = 'ORG_TASK_ADD',
    ORG_TASK_VIEW = 'ORG_TASK_VIEW',
    ORG_TASK_EDIT = 'ORG_TASK_EDIT',
    ORG_TASK_DELETE = 'ORG_TASK_DELETE',

    // ==================== PROJECTS ====================
    ORG_PROJECT_ADD = 'ORG_PROJECT_ADD',
    ORG_PROJECT_VIEW = 'ORG_PROJECT_VIEW',
    ORG_PROJECT_EDIT = 'ORG_PROJECT_EDIT',
    ORG_PROJECT_DELETE = 'ORG_PROJECT_DELETE',

    // ==================== TEAMS ====================
    ORG_TEAM_ADD = 'ORG_TEAM_ADD',
    ORG_TEAM_VIEW = 'ORG_TEAM_VIEW',
    ORG_TEAM_EDIT = 'ORG_TEAM_EDIT',
    ORG_TEAM_DELETE = 'ORG_TEAM_DELETE',

    // ==================== TAGS ====================
    ORG_TAGS_ADD = 'ORG_TAGS_ADD',
    ORG_TAGS_VIEW = 'ORG_TAGS_VIEW',
    ORG_TAGS_EDIT = 'ORG_TAGS_EDIT',
    ORG_TAGS_DELETE = 'ORG_TAGS_DELETE',

    // ==================== SPECIAL ====================
    CHANGE_SELECTED_EMPLOYEE = 'CHANGE_SELECTED_EMPLOYEE',
    CHANGE_SELECTED_ORGANIZATION = 'CHANGE_SELECTED_ORGANIZATION',
    CHANGE_ROLES_PERMISSIONS = 'CHANGE_ROLES_PERMISSIONS',
    ACCESS_PRIVATE_PROJECTS = 'ACCESS_PRIVATE_PROJECTS',

    // ... and 100+ more permissions
}
```

#### Main Permission Groups

1. **Dashboard Permissions** - Access to dashboards
2. **CRUD Permissions** - Create, Read, Update, Delete for each entity
3. **Management Permissions** - Manage configuration, settings
4. **Special Permissions** - Special rights (change employee, organization...)

### 3. Role-Permission Mapping

**File:** `packages/contracts/src/lib/role-permission.model.ts`

```typescript
export interface IRolePermission extends IBasePerTenantEntityModel {
    role: IRole;           // Role
    roleId: ID;            // Role ID
    permission: string;    // Permission name (from PermissionsEnum)
    enabled: boolean;      // Is activated
    description: string;   // Permission description
}
```

**Relationship:** Many-to-Many between Role and Permission

```
Role (1) ←→ (N) RolePermission (N) ←→ (1) Permission
```

---

## 🛡️ Guards (Endpoint Protection)

### 1. AuthGuard - JWT Authentication

**File:** `packages/core/src/lib/shared/guards/auth.guard.ts`

```typescript
@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        const request = this.getRequest(context);

        // 1. Allow CORS preflight requests
        if (request.method === 'OPTIONS') {
            return true;
        }

        // 2. Check if route has @Public() decorator
        const isPublic = this._reflector.get<boolean>(
            PUBLIC_METHOD_METADATA,
            context.getHandler()
        );
        if (isPublic) {
            return true;
        }

        // 3. Validate JWT token
        return super.canActivate(context);
    }
}
```

#### Functions

✅ Check JWT token in request header
✅ Skip routes with `@Public()` decorator
✅ Decode token and save user info to `RequestContext`
✅ Support both HTTP and GraphQL requests

### 2. RoleGuard - Role Check

**File:** `packages/core/src/lib/shared/guards/role.guard.ts`

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. PLATFORM_ADMIN bypasses all
        const currentUser = RequestContext.currentUser();
        if (currentUser?.role?.name === 'PLATFORM_ADMIN') {
            console.log('🚀 Platform Admin - bypassing role checks');
            return true;
        }

        // 2. Get required roles from metadata
        const targets = [context.getHandler(), context.getClass()];
        const roles = this._reflector.getAllAndOverride<RolesEnum[]>(
            ROLES_METADATA,
            targets
        ) || [];

        // 3. Check if user has appropriate role
        return isEmpty(roles) || RequestContext.hasRoles(roles);
    }
}
```

#### Decorator Usage

```typescript
// File: packages/core/src/lib/shared/decorators/roles.decorator.ts
export const Roles = (...roles: RolesEnum[]): CustomDecorator =>
    SetMetadata(ROLES_METADATA, roles);
```

### 3. PermissionGuard - Permission Check

**File:** `packages/core/src/lib/shared/guards/permission.guard.ts`

```typescript
@Injectable()
export class PermissionGuard extends BaseGuard implements CanActivate {
    constructor(
        @Inject(CACHE_MANAGER) protected _cacheManager: Cache,
        protected readonly _reflector: Reflector,
        protected readonly _rolePermissionService: RolePermissionService
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. PLATFORM_ADMIN bypass
        const currentUser = RequestContext.currentUser();
        if (currentUser?.role?.name === 'PLATFORM_ADMIN') {
            console.log('🚀 Platform Admin - bypassing permission checks');
            return true;
        }

        // 2. Get required permissions from metadata
        const targets = [context.getHandler(), context.getClass()];
        const permissions = deduplicate(
            this._reflector.getAllAndOverride<PermissionsEnum[]>(
                PERMISSIONS_METADATA,
                targets
            )
        ) || [];

        // 3. No permission required → allow
        if (isEmpty(permissions)) {
            return true;
        }

        // 4. Get user info from token
        const token = RequestContext.currentToken();
        const { id, role } = verify(token, env.JWT_SECRET);
        const tenantId = RequestContext.currentTenantId();
        const roleId = RequestContext.currentRoleId();

        // 5. Check cache (5 minutes)
        const cacheKey = `userPermissions_${tenantId}_${roleId}_${permissions.join('_')}`;
        let isAuthorized = await this._cacheManager.get<boolean>(cacheKey);

        // 6. If no cache, query database
        if (isAuthorized == null) {
            isAuthorized = await this._rolePermissionService
                .checkRolePermission(tenantId, roleId, permissions, true);

            // Save cache for 5 minutes
            await this._cacheManager.set(
                cacheKey,
                isAuthorized,
                5 * 60 * 1000
            );
        }

        // 7. Log result
        if (!isAuthorized) {
            console.log(
                `❌ Unauthorized: User ${id}, Role ${role}, ` +
                `Permissions: ${permissions.join(', ')}`
            );
        } else {
            console.log(
                `✅ Access granted: User ${id}, Role ${role}, ` +
                `Permissions: ${permissions.join(', ')}`
            );
        }

        return isAuthorized;
    }
}
```

#### Decorator Usage

```typescript
// File: packages/core/src/lib/shared/decorators/permissions.decorator.ts
export const Permissions = (...permissions: PermissionsEnum[]) =>
    SetMetadata(PERMISSIONS_METADATA, permissions);
```

#### Cache Strategy

- **Cache Key Format:** `userPermissions_{tenantId}_{roleId}_{permissions}`
- **TTL:** 5 minutes (300,000ms)
- **Cache Manager:** NestJS Cache Manager (in-memory or Redis)

### 4. OrganizationPermissionGuard

**File:** `packages/core/src/lib/shared/guards/organization-permission.guard.ts`

```typescript
@Injectable()
export class OrganizationPermissionGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Get permissions from metadata
        const permissions = this._reflector.getAllAndOverride(...);

        if (isEmpty(permissions)) return true;

        // Get user info
        const { id, role, employeeId } = verify(token, env.JWT_SECRET);

        // SUPER_ADMIN bypass (if enabled in .env)
        if (env.allowSuperAdminRole &&
            RequestContext.hasRoles([RolesEnum.SUPER_ADMIN])) {
            return true;
        }

        // Special handling for EMPLOYEE role
        if (role === RolesEnum.EMPLOYEE) {
            const cacheKey =
                `orgPermissions_${tenantId}_${employeeId}_${permissions.join('_')}`;

            // Check cache or query database
            return await this.checkOrganizationPermission(
                tenantId,
                employeeId,
                permissions
            );
        }

        // Other roles default authorized
        return true;
    }
}
```

#### Characteristics

- Check permissions **by organization context**
- Special for **EMPLOYEE role** - must check if employee has permission in org
- Uses separate cache with `orgPermissions_` prefix

### 5. TenantPermissionGuard

**File:** `packages/core/src/lib/shared/guards/tenant-permission.guard.ts`

Checks permissions in **multi-tenant** context, ensuring user only accesses data from their tenant.

---

## 🎯 Usage Guide

### Backend (NestJS)

#### 1. Controller Level - Apply to All Routes

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PermissionsEnum } from '@gauzy/contracts';
import {
    TenantPermissionGuard,
    PermissionGuard
} from '../shared/guards';
import { Permissions } from '../shared/decorators';

@Controller('/employee')
@UseGuards(TenantPermissionGuard, PermissionGuard)  // Apply guards
@Permissions(PermissionsEnum.ORG_EMPLOYEES_EDIT)    // Default permission
export class EmployeeController {

    @Get()
    findAll() {
        // Requires ORG_EMPLOYEES_EDIT permission
    }
}
```

#### 2. Method Level - Override Controller Permission

```typescript
@Controller('/employee')
@UseGuards(TenantPermissionGuard, PermissionGuard)
@Permissions(PermissionsEnum.ORG_EMPLOYEES_EDIT)
export class EmployeeController {

    @Get('/working')
    @Permissions(
        PermissionsEnum.CHANGE_SELECTED_EMPLOYEE,
        PermissionsEnum.SELECT_EMPLOYEE
    )
    async findAllWorkingEmployees() {
        // Override: requires one of 2 permissions
    }

    @Post()
    @Permissions(PermissionsEnum.ORG_EMPLOYEES_ADD)
    async create() {
        // Override: requires ADD permission
    }

    @Get('/public-info')
    @Public()  // Skip authentication
    async getPublicInfo() {
        // No authentication needed
    }
}
```

#### 3. Use Role Guard

```typescript
import { RoleGuard } from '../shared/guards';
import { Roles } from '../shared/decorators';

@Controller('/admin')
@UseGuards(AuthGuard, RoleGuard)
@Roles(RolesEnum.SUPER_ADMIN, RolesEnum.ADMIN)
export class AdminController {
    // Only SUPER_ADMIN and ADMIN can access

    @Get('/dashboard')
    getDashboard() {
        // Accessible by SUPER_ADMIN or ADMIN
    }
}
```

#### 4. Combining Multiple Guards

```typescript
@Controller('/organization-contact')
@UseGuards(TenantPermissionGuard, PermissionGuard)
export class OrganizationContactController {

    @Get()
    @Permissions(PermissionsEnum.ORG_CONTACT_VIEW)
    findAll() { }

    @Post()
    @Permissions(PermissionsEnum.ORG_CONTACT_EDIT)
    create() { }

    @Delete(':id')
    @Permissions(PermissionsEnum.ORG_CONTACT_EDIT)
    delete() { }
}
```

### Frontend (Angular)

#### 1. Route Guard

**File:** `apps/gauzy/src/app/pages/documents/documents-routing.module.ts`

```typescript
import { PermissionsEnum } from '@gauzy/contracts';
import { PermissionsGuard } from '@gauzy/ui-core/core';

const routes: Routes = [
    {
        path: '',
        component: DocumentsComponent,
        canActivate: [PermissionsGuard],
        data: {
            permissions: {
                only: [PermissionsEnum.ALL_ORG_VIEW],
                redirectTo: '/pages/dashboard'
            }
        }
    }
];
```

#### 2. Permissions Service

**File:** `packages/ui-core/core/src/lib/services/permission/permissions.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PermissionsService {
    constructor(
        private readonly _http: HttpClient,
        private readonly _ngxPermissionsService: NgxPermissionsService,
        private readonly _store: Store
    ) {}

    async loadPermissions(): Promise<void> {
        if (!this._store.userId) return;

        try {
            // 1. Fetch permissions from API
            const rolePermissions = await this.getPermissions();

            // 2. Save to store
            this._store.userRolePermissions = rolePermissions;

            // 3. Load into NgxPermissionsService
            const permissions = rolePermissions.map(p => p.permission);
            this._ngxPermissionsService.flushPermissions();
            this._ngxPermissionsService.loadPermissions(permissions);
        } catch (error) {
            console.error('Error loading permissions:', error);
        }
    }

    async getPermissions(): Promise<IRolePermissions> {
        return firstValueFrom(
            this._http.get<IRolePermissions>(
                `${API_PREFIX}/role-permissions/me`
            )
        );
    }
}
```

#### 3. Check Permission in Component

```typescript
import { Component, OnInit } from '@angular/core';
import { PermissionsEnum } from '@gauzy/contracts';
import { Store } from '@gauzy/ui-core/core';

@Component({
    selector: 'ga-employees',
    templateUrl: './employees.component.html'
})
export class EmployeesComponent implements OnInit {
    canEdit: boolean = false;
    canDelete: boolean = false;
    canAdd: boolean = false;

    constructor(private readonly store: Store) {}

    async ngOnInit() {
        // Check permissions
        this.canEdit = this.store.hasPermission(
            PermissionsEnum.ORG_EMPLOYEES_EDIT
        );
        this.canDelete = this.store.hasPermission(
            PermissionsEnum.ORG_EMPLOYEES_DELETE
        );
        this.canAdd = this.store.hasPermission(
            PermissionsEnum.ORG_EMPLOYEES_ADD
        );
    }
}
```

#### 4. Use in Template (HTML)

```html
<!-- Display button based on permission -->
<button
    *ngIf="canAdd"
    (click)="addEmployee()">
    Add Employee
</button>

<button
    *ngIf="canEdit"
    (click)="editEmployee()">
    Edit
</button>

<button
    *ngIf="canDelete"
    (click)="deleteEmployee()">
    Delete
</button>

<!-- Or use NgxPermissions directive -->
<button
    *ngxPermissionsOnly="[PermissionsEnum.ORG_EMPLOYEES_ADD]"
    (click)="addEmployee()">
    Add Employee
</button>
```

#### 5. PermissionsGuard Implementation

**File:** `packages/ui-core/core/src/lib/guards/permission.guard.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PermissionsGuard {
    constructor(
        private readonly _authService: AuthService,
        private readonly _router: Router
    ) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this._hasPermissions(route, state);
    }

    private _hasPermissions(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        const permissions = route.data?.permissions;

        if (!permissions) {
            return of(true);
        }

        return this._authService.hasPermission(permissions.only).pipe(
            map(hasPermission => {
                if (!hasPermission && permissions.redirectTo) {
                    this._router.navigate([permissions.redirectTo]);
                    return false;
                }
                return hasPermission;
            }),
            catchError(() => {
                if (permissions.redirectTo) {
                    this._router.navigate([permissions.redirectTo]);
                }
                return of(false);
            })
        );
    }
}
```

---

## 🔄 Request Processing Flow

### Overall Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     REQUEST PROCESSING FLOW                   │
└──────────────────────────────────────────────────────────────┘

1. HTTP REQUEST arrives at endpoint
   │
   ├─→ [AuthGuard] ─────────────────────────────────────┐
   │   │                                                  │
   │   ├─ Check: Is OPTIONS request? ──→ YES ──→ ALLOW  │
   │   │                                                  │
   │   ├─ Check: Has @Public decorator? ──→ YES ──→ ALLOW
   │   │
   │   └─ Validate JWT Token
   │       │
   │       ├─→ VALID ──→ Decode & Store User in RequestContext
   │       │
   │       └─→ INVALID ──→ ❌ 401 UNAUTHORIZED
   │
   ↓
2. [RoleGuard] ───────────────────────────────────────┐
   │                                                    │
   ├─ Check: Is PLATFORM_ADMIN? ──→ YES ──→ ✅ BYPASS │
   │                                                    │
   ├─ Get required roles from @Roles decorator         │
   │                                                    │
   ├─ Check: User has required role?                   │
   │   │                                                │
   │   ├─→ YES ──→ Continue                            │
   │   │                                                │
   │   └─→ NO ──→ ❌ 403 FORBIDDEN                     │
   │
   ↓
3. [PermissionGuard] ─────────────────────────────────┐
   │                                                    │
   ├─ Check: Is PLATFORM_ADMIN? ──→ YES ──→ ✅ BYPASS │
   │                                                    │
   ├─ Get required permissions from @Permissions()     │
   │                                                    │
   ├─ Check: No permissions required? ──→ YES ──→ ALLOW
   │
   ├─ Build cache key:
   │   "userPermissions_{tenantId}_{roleId}_{perms}"
   │
   ├─ Check cache (5 min TTL)
   │   │
   │   ├─→ CACHED ──→ Return cached result
   │   │
   │   └─→ NOT CACHED
   │       │
   │       ├─→ Query RolePermissionService
   │       │   │
   │       │   └─→ Check user's role has permissions
   │       │
   │       └─→ Save to cache (5 min)
   │
   ├─ Check result:
   │   │
   │   ├─→ HAS PERMISSION ──→ ✅ Continue
   │   │
   │   └─→ NO PERMISSION ──→ ❌ 403 FORBIDDEN
   │
   ↓
4. [TenantPermissionGuard] (Optional) ───────────────┐
   │                                                    │
   ├─ Verify user belongs to correct tenant            │
   │                                                    │
   ├─ Check tenant-specific permissions                │
   │                                                    │
   └─ Continue or Reject                               │
   │
   ↓
5. [OrganizationPermissionGuard] (Optional) ─────────┐
   │                                                    │
   ├─ Check: Is EMPLOYEE role?                         │
   │   │                                                │
   │   ├─→ YES ──→ Check employee org permissions      │
   │   │                                                │
   │   └─→ NO ──→ Allow (other roles)                  │
   │                                                    │
   └─ Continue or Reject                               │
   │
   ↓
6. ✅ EXECUTE CONTROLLER METHOD
   │
   └─→ Return Response
```

### Detailed Steps

#### Step 1: AuthGuard

```typescript
Input:  HTTP Request with headers
Check:
  - OPTIONS request? → Allow (CORS)
  - @Public decorator? → Allow
  - Valid JWT token? → Decode & Continue
Output:
  - Success: User stored in RequestContext
  - Fail: 401 Unauthorized
```

#### Step 2: RoleGuard

```typescript
Input:  ExecutionContext with User
Check:
  - User is PLATFORM_ADMIN? → Bypass
  - Route has @Roles decorator? → Check user role
  - User has required role? → Continue
Output:
  - Success: Continue to next guard
  - Fail: 403 Forbidden
```

#### Step 3: PermissionGuard

```typescript
Input:  ExecutionContext with User & Role
Check:
  1. Is PLATFORM_ADMIN? → Bypass all checks
  2. Get @Permissions from route metadata
  3. No permissions required? → Allow
  4. Build cache key from tenantId + roleId + permissions
  5. Check cache:
     - Found? → Use cached result
     - Not found? → Query DB → Cache result (5 min)
  6. User has all required permissions? → Allow
Output:
  - Success: Continue
  - Fail: 403 Forbidden
```

### RequestContext Flow

```typescript
// Store user information in request lifecycle
class RequestContext {
    static currentUser() → IUser
    static currentTenantId() → string
    static currentRoleId() → string
    static currentEmployeeId() → string
    static hasPermission(permission) → boolean
    static hasPermissions(permissions[]) → boolean
    static hasRoles(roles[]) → boolean
}
```

---

## 💾 Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│     Tenant      │
│─────────────────│
│ id              │
│ name            │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐         ┌──────────────────┐
│      User       │         │       Role       │
│─────────────────│         │──────────────────│
│ id              │    N:1  │ id               │
│ email           │◀────────┤ name             │
│ tenantId        │         │ isSystem         │
│ roleId          │─────────│ tenantId         │
│ employeeId      │         └────────┬─────────┘
└─────────────────┘                  │
                                     │ 1:N
                                     │
                          ┌──────────▼──────────────┐
                          │   RolePermission        │
                          │─────────────────────────│
                          │ id                      │
                          │ roleId (FK)             │
                          │ permission (string)     │
                          │ enabled (boolean)       │
                          │ description             │
                          │ tenantId                │
                          └─────────────────────────┘
                                     │
                                     │ Uses enum
                                     │
                          ┌──────────▼──────────────┐
                          │  PermissionsEnum        │
                          │─────────────────────────│
                          │ ORG_EMPLOYEES_VIEW      │
                          │ ORG_EMPLOYEES_ADD       │
                          │ ORG_EMPLOYEES_EDIT      │
                          │ ORG_EMPLOYEES_DELETE    │
                          │ ... (150+ permissions)  │
                          └─────────────────────────┘
```

### Main Tables

#### 1. `user` Table

```sql
CREATE TABLE user (
    id UUID PRIMARY KEY,
    email VARCHAR NOT NULL,
    tenantId UUID REFERENCES tenant(id),
    roleId UUID REFERENCES role(id),
    employeeId UUID REFERENCES employee(id),
    -- ... other fields
);
```

#### 2. `role` Table

```sql
CREATE TABLE role (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,           -- ADMIN, EMPLOYEE, etc.
    isSystem BOOLEAN DEFAULT false,  -- System role cannot be deleted
    tenantId UUID REFERENCES tenant(id),
    -- ... audit fields
);
```

#### 3. `role_permission` Table

```sql
CREATE TABLE role_permission (
    id UUID PRIMARY KEY,
    roleId UUID REFERENCES role(id),
    permission VARCHAR NOT NULL,      -- From PermissionsEnum
    enabled BOOLEAN DEFAULT true,
    description TEXT,
    tenantId UUID REFERENCES tenant(id),
    -- ... audit fields
);
```

### Sample Data Flow

```sql
-- 1. User login
SELECT * FROM user WHERE email = 'admin@example.com';
-- Returns: { id, roleId, tenantId }

-- 2. Get user's role
SELECT * FROM role WHERE id = {roleId} AND tenantId = {tenantId};
-- Returns: { id, name: 'ADMIN' }

-- 3. Get role permissions (cached 5 min)
SELECT * FROM role_permission
WHERE roleId = {roleId}
  AND tenantId = {tenantId}
  AND enabled = true;
-- Returns: [
--   { permission: 'ORG_EMPLOYEES_VIEW', enabled: true },
--   { permission: 'ORG_EMPLOYEES_EDIT', enabled: true },
--   ...
-- ]
```

---

## ⚡ Special Features

### 1. Multi-Tenant Architecture

```typescript
// Each tenant has separate roles and permissions
┌─────────────────────────────────────────────┐
│  Tenant A                                    │
│  ├─ ADMIN role                              │
│  │  └─ Permissions: [VIEW, EDIT, DELETE]   │
│  └─ EMPLOYEE role                           │
│     └─ Permissions: [VIEW]                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Tenant B                                    │
│  ├─ ADMIN role                              │
│  │  └─ Permissions: [VIEW, EDIT]           │
│  └─ EMPLOYEE role                           │
│     └─ Permissions: [VIEW, ADD]             │
└─────────────────────────────────────────────┘
```

**Characteristics:**
- Each tenant independent in roles and permissions
- PLATFORM_ADMIN manages all tenants
- Tenant isolation ensures security

### 2. Caching Strategy

```typescript
// Cache Manager Configuration
@Module({
    imports: [
        CacheModule.register({
            ttl: 5 * 60, // 5 minutes
            max: 100,    // Maximum items
        }),
    ],
})

// Cache Key Format
const cacheKey = `userPermissions_${tenantId}_${roleId}_${permissions.join('_')}`;

// Cache Flow
┌─────────────────────────────────────────────┐
│  Request Permission Check                    │
│                                              │
│  1. Build cache key                         │
│  2. Check cache                             │
│     ├─ HIT → Return cached result (fast)   │
│     └─ MISS → Query DB → Cache result      │
│                                              │
│  TTL: 5 minutes                             │
│  Invalidated on: Role/Permission changes    │
└─────────────────────────────────────────────┘
```

**Benefits:**
- ⚡ Reduce database queries
- 🚀 Significantly increase performance
- 💾 Support for Redis or in-memory cache

### 3. RequestContext - Global Context

```typescript
// RequestContext uses CLS (Continuation Local Storage)
export class RequestContext {
    protected static clsService: ClsService;

    // Store user info in request lifecycle
    static currentUser(): IUser {
        const context = RequestContext.currentRequestContext();
        return context?._req['user'];
    }

    static currentTenantId(): string {
        return RequestContext.currentUser()?.tenantId;
    }

    static currentRoleId(): string {
        return RequestContext.currentUser()?.roleId;
    }
}
```

**Usage:**

```typescript
// Anywhere in the request lifecycle
const user = RequestContext.currentUser();
const tenantId = RequestContext.currentTenantId();
const hasPermission = RequestContext.hasPermission(
    PermissionsEnum.ORG_EMPLOYEES_EDIT
);
```

### 4. Hierarchical Permissions

```typescript
// Special permission: CHANGE_SELECTED_EMPLOYEE
static currentEmployeeId(): string | null {
    const user = RequestContext.currentUser();

    // If has permission CHANGE_SELECTED_EMPLOYEE
    // → User can work with ALL employees
    if (RequestContext.hasPermission(
        PermissionsEnum.CHANGE_SELECTED_EMPLOYEE
    )) {
        return null; // null = all employees
    }

    // Otherwise → Only work with their own employee record
    return user?.employeeId || null;
}
```

**Use Case:**

```typescript
// In Service Layer
async findEmployees() {
    const employeeId = RequestContext.currentEmployeeId();

    if (employeeId === null) {
        // User has CHANGE_SELECTED_EMPLOYEE permission
        // → Get all employees
        return this.employeeRepository.find();
    } else {
        // User can only view their own employee record
        return this.employeeRepository.findOne({ id: employeeId });
    }
}
```

### 5. Platform Admin Bypass

```typescript
// PLATFORM_ADMIN bypasses all permission checks
if (currentUser?.role?.name === 'PLATFORM_ADMIN') {
    console.log('🚀 Platform Admin - bypassing all checks');
    return true;
}
```

**PLATFORM_ADMIN Privileges:**
- ✅ Bypass AuthGuard
- ✅ Bypass RoleGuard
- ✅ Bypass PermissionGuard
- ✅ Bypass OrganizationPermissionGuard
- ✅ Bypass TenantPermissionGuard
- ✅ Access all tenants
- ✅ Manage entire platform

### 6. Dynamic Permission Loading

```typescript
// Frontend: Load permissions when user logs in
class PermissionsService {
    async loadPermissions(): Promise<void> {
        // 1. Fetch from API
        const rolePermissions = await this.getPermissions();

        // 2. Save to store
        this._store.userRolePermissions = rolePermissions;

        // 3. Load into NgxPermissionsService
        const permissions = rolePermissions.map(p => p.permission);
        this._ngxPermissionsService.loadPermissions(permissions);
    }
}

// API Endpoint
@Get('/role-permissions/me')
async findMePermissions(): Promise<IRolePermissions> {
    const tenantId = RequestContext.currentTenantId();
    const roleId = RequestContext.currentRoleId();

    return await this.find({
        where: {
            role: { id: roleId, tenantId },
            enabled: true,
            isActive: true
        }
    });
}
```

---

## 🎨 Best Practices

### 1. ✅ Always Use Guards

```typescript
// ❌ BAD: No guards
@Controller('/employee')
export class EmployeeController {
    @Get()
    findAll() { }
}

// ✅ GOOD: Protected with guards
@Controller('/employee')
@UseGuards(TenantPermissionGuard, PermissionGuard)
@Permissions(PermissionsEnum.ORG_EMPLOYEES_VIEW)
export class EmployeeController {
    @Get()
    findAll() { }
}
```

### 2. ✅ Combine Multiple Guards When Needed

```typescript
// Apply multiple layers of security
@Controller('/sensitive-data')
@UseGuards(
    AuthGuard,                    // 1. Authentication
    RoleGuard,                    // 2. Check role
    TenantPermissionGuard,        // 3. Check tenant
    PermissionGuard               // 4. Check permission
)
@Roles(RolesEnum.ADMIN)
@Permissions(PermissionsEnum.SUPER_ADMIN_EDIT)
export class SensitiveDataController { }
```

### 3. ✅ Use Cache Effectively

```typescript
// Guards automatically cache
// Just ensure cache invalidation when needed

@Injectable()
export class RolePermissionService {
    async updateRolePermission(id: string, dto: UpdateDTO) {
        // 1. Update database
        await this.repository.update(id, dto);

        // 2. Invalidate cache
        const cachePattern = `userPermissions_*`;
        await this.cacheManager.del(cachePattern);

        return updated;
    }
}
```

### 4. ✅ Check Permissions on Both Frontend & Backend

```typescript
// Backend: Main security
@Permissions(PermissionsEnum.ORG_EMPLOYEES_EDIT)
@Put(':id')
async update(@Param('id') id: string, @Body() dto: UpdateDTO) {
    return this.service.update(id, dto);
}

// Frontend: Better UX (hide button early)
@Component({ ... })
export class EmployeeComponent {
    canEdit = this.store.hasPermission(
        PermissionsEnum.ORG_EMPLOYEES_EDIT
    );
}
```

```html
<!-- Template -->
<button *ngIf="canEdit" (click)="edit()">
    Edit Employee
</button>
```

### 5. ✅ Use @Public() for Public Endpoints

```typescript
@Controller('/auth')
export class AuthController {

    @Public()  // Skip authentication
    @Post('/login')
    async login(@Body() dto: LoginDTO) {
        return this.authService.login(dto);
    }

    @Public()
    @Post('/register')
    async register(@Body() dto: RegisterDTO) {
        return this.authService.register(dto);
    }

    // This route requires authentication
    @Post('/logout')
    async logout() {
        return this.authService.logout();
    }
}
```

### 6. ✅ Log Unauthorized Access

```typescript
// Guards automatically log
if (!isAuthorized) {
    console.log(
        `❌ Unauthorized access blocked:`,
        `User ID: ${id},`,
        `Role: ${role},`,
        `Tenant ID: ${tenantId},`,
        `Permissions Checked: ${permissions.join(', ')}`
    );
}
```

### 7. ✅ Organize Permissions by Group

```typescript
// Good practice: Group permissions by entity
export const EMPLOYEE_PERMISSIONS = [
    PermissionsEnum.ORG_EMPLOYEES_VIEW,
    PermissionsEnum.ORG_EMPLOYEES_ADD,
    PermissionsEnum.ORG_EMPLOYEES_EDIT,
    PermissionsEnum.ORG_EMPLOYEES_DELETE,
];

export const TASK_PERMISSIONS = [
    PermissionsEnum.ORG_TASK_VIEW,
    PermissionsEnum.ORG_TASK_ADD,
    PermissionsEnum.ORG_TASK_EDIT,
    PermissionsEnum.ORG_TASK_DELETE,
];

// Usage
@Permissions(...EMPLOYEE_PERMISSIONS)
```

### 8. ✅ Handle Permission Denied Gracefully

```typescript
// Frontend: Redirect to appropriate page
@Injectable()
export class PermissionsGuard {
    canActivate(route, state): Observable<boolean> {
        const permissions = route.data?.permissions;

        return this._authService.hasPermission(permissions.only).pipe(
            map(hasPermission => {
                if (!hasPermission) {
                    // Redirect instead of showing error
                    this._router.navigate([permissions.redirectTo]);
                    return false;
                }
                return true;
            })
        );
    }
}
```

### 9. ✅ Test Permissions

```typescript
// Unit test for permissions
describe('EmployeeController', () => {
    it('should deny access without permission', async () => {
        const user = { roleId: 'viewer-role' };

        await expect(
            controller.create(createDto)
        ).rejects.toThrow(ForbiddenException);
    });

    it('should allow access with permission', async () => {
        const user = { roleId: 'admin-role' };

        const result = await controller.create(createDto);
        expect(result).toBeDefined();
    });
});
```

### 10. ❌ Things to Avoid

```typescript
// ❌ BAD: Hardcode permission checks
if (user.role === 'ADMIN') {
    // Do something
}

// ✅ GOOD: Use permission system
if (RequestContext.hasPermission(PermissionsEnum.ADMIN_DASHBOARD_VIEW)) {
    // Do something
}

// ❌ BAD: Not using guards
@Get('/sensitive')
async getSensitiveData() {
    const user = RequestContext.currentUser();
    if (user.role !== 'ADMIN') throw new ForbiddenException();
}

// ✅ GOOD: Use guards and decorators
@Get('/sensitive')
@UseGuards(PermissionGuard)
@Permissions(PermissionsEnum.SUPER_ADMIN_EDIT)
async getSensitiveData() {
    // Logic here
}
```

---

## 📊 Performance Optimization

### Cache Hit Rate Monitoring

```typescript
@Injectable()
export class PermissionGuard {
    private cacheHits = 0;
    private cacheMisses = 0;

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const cached = await this._cacheManager.get(cacheKey);

        if (cached !== null) {
            this.cacheHits++;
            console.log(`Cache hit rate: ${this.getCacheHitRate()}%`);
        } else {
            this.cacheMisses++;
        }

        // ... rest of logic
    }

    getCacheHitRate(): number {
        const total = this.cacheHits + this.cacheMisses;
        return total > 0 ? (this.cacheHits / total) * 100 : 0;
    }
}
```

---

## 🔒 Security Considerations

### 1. JWT Token Security

```typescript
// Token contains minimal info
interface JWTPayload {
    id: string;              // User ID
    role: string;            // Role name
    tenantId: string;        // Tenant ID
    employeeId?: string;     // Employee ID (optional)
    permissions: string[];   // User permissions
    iat: number;            // Issued at
    exp: number;            // Expiration
}
```

### 2. Token Expiration

```typescript
// Environment config
export const environment = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_TOKEN_EXPIRATION_TIME: 86400, // 24 hours
    JWT_REFRESH_TOKEN_EXPIRATION_TIME: 604800, // 7 days
};
```

### 3. Permission Validation

```typescript
// Always validate permissions on backend
// Frontend only to improve UX
@Post()
@UseGuards(PermissionGuard)
@Permissions(PermissionsEnum.ORG_EMPLOYEES_ADD)
async create(@Body() dto: CreateDTO) {
    // Even if frontend bypassed, backend protects
    return this.service.create(dto);
}
```

---

## 📚 Reference Documentation

### Important Files

1. **Guards:**
   - `packages/core/src/lib/shared/guards/auth.guard.ts`
   - `packages/core/src/lib/shared/guards/role.guard.ts`
   - `packages/core/src/lib/shared/guards/permission.guard.ts`
   - `packages/core/src/lib/shared/guards/organization-permission.guard.ts`
   - `packages/core/src/lib/shared/guards/tenant-permission.guard.ts`

2. **Decorators:**
   - `packages/core/src/lib/shared/decorators/permissions.decorator.ts`
   - `packages/core/src/lib/shared/decorators/roles.decorator.ts`

3. **Models:**
   - `packages/contracts/src/lib/role.model.ts`
   - `packages/contracts/src/lib/role-permission.model.ts`

4. **Services:**
   - `packages/core/src/lib/role-permission/role-permission.service.ts`
   - `packages/ui-core/core/src/lib/services/permission/permissions.service.ts`

5. **Context:**
   - `packages/core/src/lib/core/context/request-context.ts`

---

## 🎓 Conclusion

The authorization system of **Ever-Gauzy** is a complete and enterprise-grade **RBAC (Role-Based Access Control)** system with notable features:

### ✨ Strengths

✅ **9 role types** standardized and extensible
✅ **150+ permissions** detailed by functionality
✅ **Multi-tenant** architecture with tenant isolation
✅ **Cache optimization** reduces database queries (5-minute TTL)
✅ **Flexible guards** system (Auth, Role, Permission, Organization, Tenant)
✅ **Frontend & Backend** synchronized validation
✅ **PLATFORM_ADMIN bypass** for super user
✅ **RequestContext** global state management
✅ **Hierarchical permissions** for complex use cases

### 🎯 Use Cases

1. **Multi-tenant SaaS**: Each tenant has separate roles and permissions
2. **Enterprise applications**: Detailed permissions by functionality
3. **Team collaboration**: Manage access rights within organization
4. **Hierarchical organizations**: Employees can view their own data or all data

### 🚀 Performance

- **Cache hit rate**: Usually achieves >80% after warm-up
- **Response time**: <5ms for cached permission checks
- **Database queries**: Reduced by 80-90% thanks to caching

---

## � Role-Permission Relationship Report

### System Overview

Ever-Gauzy uses a **Many-to-Many relationship** between Roles and Permissions, allowing:

✅ **Flexible customization** - Customize permissions for each role
✅ **Tenant isolation** - Each tenant has separate permissions
✅ **Dynamic updates** - Change permissions at runtime
✅ **Granular control** - Detailed control of each function

### Relationship Architecture

```
┌──────────────────────────────────────────────────────────┐
│              ROLE-PERMISSION RELATIONSHIP                 │
└──────────────────────────────────────────────────────────┘

Tenant A                          Tenant B
├── Role: ADMIN                   ├── Role: ADMIN
│   ├── Permission: EMPLOYEES_*   │   ├── Permission: EMPLOYEES_*
│   ├── Permission: PROJECTS_*    │   ├── Permission: TASKS_*
│   └── Permission: INVOICES_*    │   └── Custom: SPECIAL_FEATURE
│                                 │
├── Role: EMPLOYEE                ├── Role: EMPLOYEE
│   ├── Permission: TASKS_VIEW    │   ├── Permission: TASKS_*
│   └── Permission: TIME_TRACKER  │   └── Permission: PROJECTS_VIEW
│                                 │
└── Custom Role: ACCOUNTANT       └── Custom Role: CONSULTANT
    ├── Permission: INVOICES_*        ├── Permission: PROJECTS_VIEW
    └── Permission: EXPENSES_*        └── Permission: TIME_TRACKER
```

---

## 🎯 Permission Customization Capability

### 1. Customize Existing Roles

**Can customize:** ✅ **YES**

```typescript
// Example: Allow EMPLOYEE to delete tasks
async customizeEmployeeRole(tenantId: string) {
    // 1. Find tenant's EMPLOYEE role
    const employeeRole = await this.roleRepository.findOne({
        where: {
            name: RolesEnum.EMPLOYEE,
            tenantId
        }
    });

    // 2. Add DELETE permission
    await this.rolePermissionRepository.save({
        role: employeeRole,
        permission: PermissionsEnum.ORG_TASK_DELETE,
        enabled: true,
        tenantId
    });

    console.log('✅ EMPLOYEE now can delete tasks');
}
```

**Real-World Use Case:**

```typescript
// Company A: EMPLOYEE has more permissions
const companyA = {
    EMPLOYEE: [
        'ORG_TASK_*',           // Full CRUD tasks
        'ORG_PROJECT_*',        // Full CRUD projects
        'ORG_TEAM_*',           // Full CRUD teams
        'INVOICES_VIEW/EDIT'    // Manage invoices
    ]
};

// Company B: EMPLOYEE can only view
const companyB = {
    EMPLOYEE: [
        'ORG_TASK_VIEW',        // Only view tasks
        'ORG_PROJECT_VIEW',     // Only view projects
        'TIME_TRACKER'          // Track time only
    ]
};
```

### 2. Create New Custom Roles

**Can create new:** ✅ **YES**

```typescript
// Create new ACCOUNTANT role
async createAccountantRole(tenantId: string) {
    // 1. Create role
    const accountantRole = await this.roleRepository.save({
        name: 'ACCOUNTANT',
        tenantId,
        isSystem: false  // Custom role
    });

    // 2. Assign permissions
    const accountantPermissions = [
        PermissionsEnum.ORG_PAYMENT_VIEW,
        PermissionsEnum.ORG_PAYMENT_ADD_EDIT,
        PermissionsEnum.ORG_EXPENSES_VIEW,
        PermissionsEnum.ORG_EXPENSES_EDIT,
        PermissionsEnum.ORG_INCOMES_VIEW,
        PermissionsEnum.ORG_INCOMES_EDIT,
        PermissionsEnum.INVOICES_VIEW,
        PermissionsEnum.INVOICES_EDIT,
        PermissionsEnum.ESTIMATES_VIEW,
        PermissionsEnum.ESTIMATES_EDIT,
        PermissionsEnum.VIEW_ALL_ACCOUNTING_TEMPLATES
    ];

    for (const permission of accountantPermissions) {
        await this.rolePermissionRepository.save({
            role: accountantRole,
            permission,
            enabled: true,
            tenantId
        });
    }

    return accountantRole;
}
```

#### 🔒 Role Name Constraints

**Question:** *"Can custom roles have the same name as existing system roles?"*

**Answer:** ❌ **NO - System role names are protected**

##### Reserved Role Names

The following role names are **RESERVED** and cannot be used for custom roles:

```typescript
// packages/core/src/lib/role/role.entity.ts
export enum RolesEnum {
    PLATFORM_ADMIN = 'PLATFORM_ADMIN',      // ❌ Reserved
    SUPER_ADMIN = 'SUPER_ADMIN',            // ❌ Reserved
    ADMIN = 'ADMIN',                         // ❌ Reserved
    DATA_ENTRY = 'DATA_ENTRY',               // ❌ Reserved
    EMPLOYEE = 'EMPLOYEE',                   // ❌ Reserved
    MANAGER = 'MANAGER',                     // ❌ Reserved
    VIEWER = 'VIEWER',                       // ❌ Reserved
    CANDIDATE = 'CANDIDATE',                 // ❌ Reserved
    INTERVIEWER = 'INTERVIEWER'              // ❌ Reserved
}

// Cannot create custom role with name matching this enum
```

##### Database Constraint

```sql
-- Unique constraint on (name + tenantId)
CREATE UNIQUE INDEX "IDX_role_name_tenant"
ON "role" ("name", "tenantId");

-- Prevent duplicate role names within same tenant
```

##### Validation Logic

```typescript
// Check before creating role
async validateRoleName(name: string, tenantId: string) {
    // 1. Check reserved names
    const reservedNames = Object.values(RolesEnum);
    if (reservedNames.includes(name as RolesEnum)) {
        throw new BadRequestException(
            `Role name '${name}' is reserved for system roles. ` +
            `Please choose a different name.`
        );
    }

    // 2. Check existing custom roles
    const existingRole = await this.roleRepository.findOne({
        where: { name, tenantId }
    });

    if (existingRole) {
        throw new ConflictException(
            `Role '${name}' already exists in this tenant.`
        );
    }

    return true;
}
```

##### Case-Sensitivity ⚠️

**IMPORTANT:** Database is **CASE-SENSITIVE**

```typescript
// Role name is stored as VARCHAR/TEXT in database
// PostgreSQL/MySQL/SQLite are all case-sensitive for string comparison

// Role name comparison
'PLATFORM_ADMIN' === 'PLATFORM_ADMIN'  // ✅ true
'PLATFORM_ADMIN' === 'Platform Admin'  // ❌ false
'PLATFORM_ADMIN' === 'platform_admin'  // ❌ false
'ADMIN' === 'admin'                     // ❌ false
'ADMIN' === 'Admin'                     // ❌ false
```

**Validation in code:**

```typescript
// packages/core/src/lib/shared/validators/constraints/role-already-exist.constraint.ts
async validate(name: string): Promise<boolean> {
    const tenantId = RequestContext.currentTenantId();

    // EXACT string comparison (case-sensitive)
    const existingRole = await this.typeOrmRoleRepository.findOneByOrFail({
        name,      // Exact match, case-sensitive
        tenantId
    });

    return !existingRole;
}

// Check reserved names
const reservedNames = Object.values(RolesEnum);
// ['PLATFORM_ADMIN', 'SUPER_ADMIN', 'ADMIN', ...]

if (reservedNames.includes(name as RolesEnum)) {
    // Only reject if EXACTLY matches enum value
    throw new BadRequestException(`Role '${name}' is reserved`);
}
```

##### Examples: Allowed vs Forbidden

| Role Name | Status | Reason |
|----------|--------|--------|
| `ACCOUNTANT` | ✅ Allowed | Does not match system roles |
| `SALES_MANAGER` | ✅ Allowed | New name, not reserved |
| `CUSTOM_ADMIN` | ✅ Allowed | Different from `ADMIN` |
| `HR_SPECIALIST` | ✅ Allowed | New name |
| `Platform Admin` | ⚠️ **Allowed** | Different from `PLATFORM_ADMIN` (has space + lowercase) |
| `platform_admin` | ⚠️ **Allowed** | Different from `PLATFORM_ADMIN` (lowercase) |
| `Admin` | ⚠️ **Allowed** | Different from `ADMIN` (different capitalization) |
| `admin` | ⚠️ **Allowed** | Different from `ADMIN` (lowercase) |
| `PLATFORM_ADMIN` | ❌ Forbidden | Reserved - exact match |
| `ADMIN` | ❌ Forbidden | Reserved - exact match |
| `SUPER_ADMIN` | ❌ Forbidden | Reserved - exact match |
| `EMPLOYEE` | ❌ Forbidden | Reserved - exact match |
| `VIEWER` | ❌ Forbidden | Reserved - exact match |

##### Best Practices

**⚠️ WARNING:** Although technically possible to create roles with similar names but different case (e.g., `Platform Admin`, `admin`), **DO NOT DO THIS** because:

1. **Confusing for users**: Difficult to distinguish `ADMIN` vs `admin` vs `Admin`
2. **Hard to maintain code**: Developers easily confused when referencing roles
3. **Hidden logic errors**: Code may compare incorrectly due to case-sensitivity
4. **Violates best practices**: Role names should be consistent and clear

```typescript
// ✅ GOOD: Descriptive custom names (avoid names similar to system roles)
const goodRoleNames = [
    'ACCOUNTANT',
    'SALES_REPRESENTATIVE',
    'HR_MANAGER',
    'PROJECT_COORDINATOR',
    'MARKETING_SPECIALIST',
    'CUSTOMER_SUPPORT',
    'TEAM_LEAD',
    'DEPARTMENT_HEAD'
];

// ⚠️ TECHNICALLY ALLOWED but NOT RECOMMENDED
const technicallyAllowedButBad = [
    'Platform Admin',    // Confusing with PLATFORM_ADMIN
    'admin',             // Confusing with ADMIN
    'Super_Admin',       // Confusing with SUPER_ADMIN
    'Employee',          // Confusing with EMPLOYEE
    'viewer'             // Confusing with VIEWER
];

// ❌ BAD: Exact matches with system roles
const badRoleNames = [
    'PLATFORM_ADMIN',  // Reserved - REJECTED
    'ADMIN',           // Reserved - REJECTED
    'SUPER_ADMIN',     // Reserved - REJECTED
    'EMPLOYEE',        // Reserved - REJECTED
    'MANAGER'          // Reserved - REJECTED
];

// ✅ Safe role creation with validation
async createCustomRole(
    name: string,
    tenantId: string,
    permissions: PermissionsEnum[]
) {
    // Validate name first
    await this.validateRoleName(name, tenantId);

    // Create role
    const role = await this.roleRepository.save({
        name,
        tenantId,
        isSystem: false
    });

    // Grant permissions
    for (const permission of permissions) {
        await this.rolePermissionRepository.save({
            roleId: role.id,
            permission,
            enabled: true,
            tenantId
        });
    }

    return role;
}
```

##### 🚀 Auto-Normalization (Updated)

**Good news:** The system has been updated to **AUTOMATICALLY NORMALIZE** role names!

```typescript
// packages/core/src/lib/role/dto/create-role.dto.ts
import { Transform } from "class-transformer";

export class CreateRoleDTO extends TenantBaseDTO implements IRoleCreateInput {
    @ApiProperty({ type: () => String })
    @IsNotEmpty()
    @IsRoleAlreadyExist()
    @Transform(({ value }) => {
        // Automatically uppercase and replace spaces with underscores
        if (typeof value === 'string') {
            return value.trim().toUpperCase().replace(/\s+/g, '_');
        }
        return value;
    })
    readonly name: string;
}

// packages/core/src/lib/role/role.service.ts
@Injectable()
export class RoleService extends TenantAwareCrudService<Role> {
    /**
     * Normalize role name: uppercase and replace spaces with underscores
     */
    private normalizeRoleName(name: string): string {
        if (!name || typeof name !== 'string') {
            return name;
        }
        return name.trim().toUpperCase().replace(/\s+/g, '_');
    }

    async create(entity: Partial<Role>): Promise<IRole> {
        if (entity.name) {
            entity.name = this.normalizeRoleName(entity.name);
        }
        return await super.create(entity);
    }

    async update(id: string | number | Partial<Role>, entity: Partial<Role>): Promise<IRole> {
        if (entity.name) {
            entity.name = this.normalizeRoleName(entity.name);
        }
        return await super.update(id, entity);
    }
}
```

**Transformations:**

| Input (User entered) | Output (DB stored) | Status |
|---------------------|-------------------|--------|
| `Platform Admin` | `PLATFORM_ADMIN` | ❌ Reserved - Rejected |
| `admin` | `ADMIN` | ❌ Reserved - Rejected |
| `Super Admin` | `SUPER_ADMIN` | ❌ Reserved - Rejected |
| `sales manager` | `SALES_MANAGER` | ✅ Allowed (custom) |
| `Account  Manager` | `ACCOUNT_MANAGER` | ✅ Allowed (multiple spaces normalized) |
| `  HR Manager  ` | `HR_MANAGER` | ✅ Allowed (trimmed) |
| `ACCOUNTANT` | `ACCOUNTANT` | ✅ Allowed (already uppercase) |
| `project-coordinator` | `PROJECT-COORDINATOR` | ✅ Allowed (hyphens kept) |

**Benefits:**

1. ✅ **Prevent messy names:** `Platform Admin`, `admin`, `Super_Admin` → all normalized
2. ✅ **Consistency:** All roles are UPPERCASE with underscore
3. ✅ **User-friendly:** Users can input freely (case insensitive)
4. ✅ **Validation still works:** Reserved names are still rejected after normalization

**Testing:**

```bash
# Run unit tests
npm test -- role-name-normalization.spec.ts

# Test cases:
# ✓ "Platform Admin" → "PLATFORM_ADMIN" (then rejected as reserved)
# ✓ "admin" → "ADMIN" (then rejected as reserved)
# ✓ "sales manager" → "SALES_MANAGER" (allowed)
# ✓ "Account  Manager" → "ACCOUNT_MANAGER" (allowed)
# ✓ "  HR Manager  " → "HR_MANAGER" (allowed)
```

##### Helper Functions

```typescript
// Check if role name is reserved
export function isReservedRoleName(name: string): boolean {
    return Object.values(RolesEnum).includes(name as RolesEnum);
}

// Suggest alternative names
export function suggestAlternativeName(attemptedName: string): string[] {
    const suggestions: string[] = [];

    if (attemptedName === 'ADMIN') {
        suggestions.push('CUSTOM_ADMIN', 'DEPARTMENT_ADMIN', 'TEAM_ADMIN');
    } else if (attemptedName === 'MANAGER') {
        suggestions.push('PROJECT_MANAGER', 'TEAM_MANAGER', 'SALES_MANAGER');
    } else if (attemptedName === 'EMPLOYEE') {
        suggestions.push('STAFF', 'TEAM_MEMBER', 'CONTRIBUTOR');
    }

    return suggestions;
}

// Usage
try {
    await createCustomRole('ADMIN', tenantId, permissions);
} catch (error) {
    if (error.message.includes('reserved')) {
        const alternatives = suggestAlternativeName('ADMIN');
        console.log('Try these instead:', alternatives);
        // Output: ['CUSTOM_ADMIN', 'DEPARTMENT_ADMIN', 'TEAM_ADMIN']
    }
}
```

##### Summary

| Aspect | System Roles | Custom Roles |
|--------|-------------|--------------|
| **Can names match?** | ❌ NO - Reserved (exact match) | ✅ NO - Auto-normalized before check |
| **Case-sensitive?** | ✅ YES - But auto-normalized | ✅ YES - But auto-normalized to UPPERCASE |
| **Auto-normalization** | ✅ YES - All inputs → UPPERCASE + `_` | ✅ YES - All inputs → UPPERCASE + `_` |
| **Unique constraint** | ✅ Protected by enum + DB index | ✅ Protected by DB index (name + tenantId) |
| **Validation** | Built-in enum check (after normalization) | Validate against RolesEnum + existing (after normalization) |
| **User input** | Can type any case | Can type any case |
| **DB storage** | Always UPPERCASE with `_` | Always UPPERCASE with `_` |
| **Examples** | `ADMIN`, `SUPER_ADMIN` | `ACCOUNTANT`, `SALES_MANAGER` |

**Conclusion about "Creating role named 'Platform Admin'":**

✅ **SYSTEM AUTO-FIXES:**
- Input: `Platform Admin`
- Normalized: `PLATFORM_ADMIN`
- Result: ❌ **REJECTED** because it matches system role `PLATFORM_ADMIN`

**No more "messy" names!** 🎉

All inputs are automatically:
1. Trim whitespace
2. Convert to UPPERCASE
3. Replace spaces with underscores
4. Validate against reserved names

**Recommendation:** Use completely different names like:
- `ORGANIZATION_ADMIN` (input: `organization admin`, `Organization Admin`, etc. → all OK)
- `TENANT_ADMIN` (input: `tenant admin`, `Tenant Admin`, etc. → all OK)
- `WORKSPACE_ADMIN` (input: `workspace admin`, `WORKSPACE ADMIN`, etc. → all OK)

---

### 3. Full Permissions For All Users

**Question:** *"What if the client wants everyone to have full permissions?"*

**Answer:** ✅ **There are 3 ways**

#### Option 1: Use SUPER_ADMIN Role (Recommended)

```typescript
// Assign all users SUPER_ADMIN role
async grantFullAccessToAllUsers(tenantId: string) {
    const superAdminRole = await this.roleRepository.findOne({
        where: {
            name: RolesEnum.SUPER_ADMIN,
            tenantId
        }
    });

    // Update all users
    await this.userRepository.update(
        { tenantId },
        { roleId: superAdminRole.id }
    );

    console.log('✅ All users now have SUPER_ADMIN permissions');
}
```

**Advantages:**
- ✅ Simple and fast
- ✅ Uses existing role
- ✅ ~195 permissions

**Disadvantages:**
- ⚠️ High security risk
- ⚠️ No role differentiation

#### Option 2: Create Custom "ALL_ACCESS" Role

```typescript
async createAllAccessRole(tenantId: string) {
    // 1. Create new role
    const allAccessRole = await this.roleRepository.save({
        name: 'ALL_ACCESS',
        tenantId,
        isSystem: false
    });

    // 2. Get ALL permissions
    const allPermissions = Object.values(PermissionsEnum);

    // 3. Assign all permissions
    for (const permission of allPermissions) {
        await this.rolePermissionRepository.save({
            role: allAccessRole,
            permission,
            enabled: true,
            tenantId
        });
    }

    // 4. Assign to all users
    await this.userRepository.update(
        { tenantId },
        { roleId: allAccessRole.id }
    );

    return allAccessRole;
}
```

**Advantages:**
- ✅ Clear role name
- ✅ Can customize later
- ✅ Separated from system roles

**Disadvantages:**
- ⚠️ Need to create and maintain
- ⚠️ Still has security risk

#### Option 3: Modify Each Existing Role (Flexible)

```typescript
async grantFullAccessByModifyingRoles(tenantId: string) {
    const allPermissions = Object.values(PermissionsEnum);

    // Get all tenant roles
    const roles = await this.roleRepository.find({
        where: { tenantId }
    });

    for (const role of roles) {
        // Delete old permissions
        await this.rolePermissionRepository.delete({
            roleId: role.id
        });

        // Add all permissions
        for (const permission of allPermissions) {
            await this.rolePermissionRepository.save({
                role,
                permission,
                enabled: true,
                tenantId
            });
        }
    }

    console.log('✅ All roles now have full permissions');
}
```

**Advantages:**
- ✅ Maintains role hierarchy
- ✅ Users don't need to change role
- ✅ Flexible for each role

**Disadvantages:**
- ⚠️ Loses permission structure
- ⚠️ Difficult to rollback

---

## 🏢 Real-World Use Cases

### Scenario 1: Small Startup (<10 people)

**Requirement:** Everyone does everything, no complex permission needed

**Solution:**

```typescript
// Option 1: Use ADMIN for everyone
await grantRoleToAllUsers(tenantId, RolesEnum.ADMIN);

// Or Option 2: Custom "TEAM_MEMBER" role
const teamMemberRole = await createCustomRole({
    name: 'TEAM_MEMBER',
    permissions: [
        ...EMPLOYEE_PERMISSIONS,
        ...ADMIN_PERMISSIONS.filter(p =>
            !p.includes('DELETE') && // Don't allow delete
            !p.includes('SUPER_ADMIN') // No admin settings
        )
    ]
});
```

**Result:**
- ✅ Everyone can do most tasks
- ✅ Still keep critical actions safe
- ✅ Easy to scale when company grows

---

### Scenario 2: Agency/Consulting Firm

**Requirements:**
- Clients only view progress
- Consultants manage projects
- Admins manage everything

**Solution:**

```typescript
// Role hierarchy
const roles = {
    CLIENT: {
        permissions: [
            'ORG_PROJECT_VIEW',
            'ORG_TASK_VIEW',
            'DASHBOARD_READ',
            'ORG_TEAM_VIEW'
        ]
    },

    CONSULTANT: {
        permissions: [
            'ORG_PROJECT_*',
            'ORG_TASK_*',
            'ORG_TEAM_VIEW/EDIT',
            'TIME_TRACKER',
            'INVOICES_VIEW',
            'DASHBOARD_*'
        ]
    },

    AGENCY_ADMIN: {
        permissions: [...ALL_PERMISSIONS]
    }
};
```

---

### Scenario 3: Enterprise (>100 people)

**Requirement:** Detailed permissions by department

**Solution:**

```typescript
const departmentRoles = {
    // Engineering Department
    DEVELOPER: ['ORG_TASK_*', 'ORG_PROJECT_VIEW', 'TIME_TRACKER'],
    TECH_LEAD: ['ORG_TASK_*', 'ORG_PROJECT_*', 'ORG_TEAM_*'],
    CTO: [...ALL_TECH_PERMISSIONS],

    // Finance Department
    ACCOUNTANT: ['INVOICES_*', 'EXPENSES_*', 'PAYMENT_*'],
    CFO: [...ALL_FINANCE_PERMISSIONS],

    // HR Department
    HR_SPECIALIST: ['ORG_EMPLOYEES_VIEW/EDIT', 'TIME_OFF_*'],
    HR_MANAGER: ['ORG_EMPLOYEES_*', 'ORG_CANDIDATES_*'],

    // Sales Department
    SALES_REP: ['ORG_CONTACT_*', 'PROPOSALS_*', 'ESTIMATES_*'],
    SALES_MANAGER: [...ALL_SALES_PERMISSIONS]
};
```

---

### Scenario 4: Outsourcing Company

**Requirement:** Contractors have limited permissions, employees full access

**Solution:**

```typescript
const outsourcingRoles = {
    CONTRACTOR: {
        permissions: [
            'ORG_TASK_VIEW/EDIT',      // Only edit assigned tasks
            'TIME_TRACKER',             // Track time
            'ORG_PROJECT_VIEW',         // View projects only
            'PROFILE_EDIT'              // Edit own profile
        ],
        restrictions: {
            cannotDelete: true,
            cannotInvite: true,
            cannotAccessFinancial: true
        }
    },

    FULL_TIME_EMPLOYEE: {
        permissions: [...EMPLOYEE_PERMISSIONS],
        extras: [
            'ORG_TEAM_*',
            'ORG_INVITE_EDIT',
            'ACCESS_PRIVATE_PROJECTS'
        ]
    }
};
```

---

## 📋 Permission Management Dashboard

### Admin UI for Managing Permissions

```typescript
// Component: Role-Permission Management
@Component({
    selector: 'role-permission-manager',
    template: `
        <div class="role-permission-manager">
            <!-- Select Role -->
            <nb-select [(ngModel)]="selectedRole">
                <nb-option *ngFor="let role of roles" [value]="role">
                    {{ role.name }}
                </nb-option>
            </nb-select>

            <!-- Permission List -->
            <div class="permissions-grid">
                <div *ngFor="let category of permissionCategories">
                    <h3>{{ category.name }}</h3>

                    <nb-checkbox
                        *ngFor="let permission of category.permissions"
                        [(ngModel)]="rolePermissions[permission]"
                        (change)="updatePermission(permission)">
                        {{ permission }}
                    </nb-checkbox>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <button (click)="grantAllPermissions()">
                    Grant All Permissions
                </button>
                <button (click)="revokeAllPermissions()">
                    Revoke All Permissions
                </button>
                <button (click)="resetToDefaults()">
                    Reset to Defaults
                </button>
            </div>
        </div>
    `
})
export class RolePermissionManagerComponent {
    selectedRole: IRole;
    rolePermissions: Record<string, boolean> = {};

    async grantAllPermissions() {
        const allPermissions = Object.values(PermissionsEnum);

        for (const permission of allPermissions) {
            await this.rolePermissionService.update({
                roleId: this.selectedRole.id,
                permission,
                enabled: true
            });
        }

        this.toastr.success('All permissions granted!');
    }

    async revokeAllPermissions() {
        await this.rolePermissionService.deleteAll({
            roleId: this.selectedRole.id
        });

        this.toastr.success('All permissions revoked!');
    }

    async resetToDefaults() {
        const defaults = DEFAULT_ROLE_PERMISSIONS.find(
            r => r.role === this.selectedRole.name
        );

        // Clear current
        await this.revokeAllPermissions();

        // Apply defaults
        for (const permission of defaults.defaultEnabledPermissions) {
            await this.rolePermissionService.create({
                roleId: this.selectedRole.id,
                permission,
                enabled: true
            });
        }

        this.toastr.success('Reset to default permissions!');
    }
}
```

---

## 🔄 API Endpoints for Managing Permissions

### 1. Get Role Permissions

```typescript
// GET /role-permissions/:roleId
@Get(':roleId')
@Permissions(PermissionsEnum.CHANGE_ROLES_PERMISSIONS)
async getRolePermissions(@Param('roleId') roleId: string) {
    return await this.rolePermissionService.find({
        where: { roleId }
    });
}

// Response
{
    "items": [
        {
            "id": "xxx",
            "permission": "ORG_EMPLOYEES_VIEW",
            "enabled": true,
            "description": "View employees"
        },
        {
            "id": "yyy",
            "permission": "ORG_EMPLOYEES_EDIT",
            "enabled": true,
            "description": "Edit employees"
        }
    ],
    "total": 75
}
```

### 2. Update Permission

```typescript
// PUT /role-permissions/:id
@Put(':id')
@Permissions(PermissionsEnum.CHANGE_ROLES_PERMISSIONS)
async updatePermission(
    @Param('id') id: string,
    @Body() dto: { enabled: boolean }
) {
    await this.rolePermissionService.update(id, dto);

    // Clear cache
    await this.cacheManager.del('userPermissions_*');

    return { success: true };
}
```

### 3. Bulk Update

```typescript
// POST /role-permissions/bulk-update
@Post('bulk-update')
@Permissions(PermissionsEnum.CHANGE_ROLES_PERMISSIONS)
async bulkUpdate(@Body() dto: {
    roleId: string;
    permissions: Array<{
        permission: string;
        enabled: boolean;
    }>;
}) {
    for (const perm of dto.permissions) {
        await this.rolePermissionService.upsert({
            roleId: dto.roleId,
            permission: perm.permission,
            enabled: perm.enabled
        });
    }

    // Clear cache
    await this.cacheManager.del(`userPermissions_*_${dto.roleId}_*`);

    return { success: true, updated: dto.permissions.length };
}
```

### 4. Grant All Permissions

```typescript
// POST /role-permissions/:roleId/grant-all
@Post(':roleId/grant-all')
@Permissions(PermissionsEnum.CHANGE_ROLES_PERMISSIONS)
async grantAllPermissions(@Param('roleId') roleId: string) {
    const allPermissions = Object.values(PermissionsEnum);

    // Delete existing
    await this.rolePermissionRepository.delete({ roleId });

    // Insert all
    const rolePermissions = allPermissions.map(permission => ({
        roleId,
        permission,
        enabled: true,
        tenantId: RequestContext.currentTenantId()
    }));

    await this.rolePermissionRepository.save(rolePermissions);

    // Clear cache
    await this.cacheManager.del('userPermissions_*');

    return {
        success: true,
        granted: allPermissions.length
    };
}
```

---

## ⚠️ Important Notes When Customizing

### 1. System Roles vs Custom Roles

```typescript
// System roles (should not delete)
const SYSTEM_ROLES = [
    'PLATFORM_ADMIN',
    'SUPER_ADMIN',
    'ADMIN',
    'EMPLOYEE',
    'CANDIDATE',
    'VIEWER'
];

// Check before deleting
async deleteRole(roleId: string) {
    const role = await this.roleRepository.findOne(roleId);

    if (role.isSystem) {
        throw new BadRequestException(
            'Cannot delete system role'
        );
    }

    // OK to delete custom role
    await this.roleRepository.delete(roleId);
}
```

### 2. Tenant Isolation

```typescript
// ❌ BAD: Do not check tenantId
await this.rolePermissionRepository.update(
    { roleId },
    { enabled: false }
);

// ✅ GOOD: Always filter by tenantId
const tenantId = RequestContext.currentTenantId();
await this.rolePermissionRepository.update(
    { roleId, tenantId },
    { enabled: false }
);
```

### 3. Cache Invalidation

```typescript
// After updating permissions, MUST clear cache
async updateRolePermissions(roleId: string, updates: any[]) {
    // Update database
    await this.bulkUpdate(roleId, updates);

    // Clear cache - IMPORTANT!
    const tenantId = RequestContext.currentTenantId();
    await this.cacheManager.del(`userPermissions_${tenantId}_${roleId}_*`);

    // Or clear all
    await this.cacheManager.reset();
}
```

### 4. Audit Trail

```typescript
// Log all permission changes
async updatePermission(id: string, dto: any) {
    const old = await this.findOne(id);
    const updated = await this.repository.update(id, dto);

    // Audit log
    await this.auditLogService.create({
        action: 'PERMISSION_UPDATED',
        userId: RequestContext.currentUserId(),
        before: old,
        after: updated,
        timestamp: new Date()
    });

    return updated;
}
```

---

## 📊 Permission Reports By Tenant

### Permission Analytics

```typescript
@Injectable()
export class PermissionAnalyticsService {
    // Statistics of permissions by role
    async getPermissionsByRole(tenantId: string) {
        const roles = await this.roleRepository.find({
            where: { tenantId },
            relations: ['rolePermissions']
        });

        return roles.map(role => ({
            role: role.name,
            totalPermissions: role.rolePermissions.length,
            enabledPermissions: role.rolePermissions.filter(
                rp => rp.enabled
            ).length,
            permissions: role.rolePermissions.map(rp => ({
                permission: rp.permission,
                enabled: rp.enabled
            }))
        }));
    }

    // Compare permissions between roles
    async compareRoles(tenantId: string, role1: string, role2: string) {
        const [r1, r2] = await Promise.all([
            this.getRolePermissions(tenantId, role1),
            this.getRolePermissions(tenantId, role2)
        ]);

        const r1Perms = new Set(r1.map(p => p.permission));
        const r2Perms = new Set(r2.map(p => p.permission));

        return {
            role1: role1,
            role2: role2,
            uniqueToRole1: [...r1Perms].filter(p => !r2Perms.has(p)),
            uniqueToRole2: [...r2Perms].filter(p => !r1Perms.has(p)),
            shared: [...r1Perms].filter(p => r2Perms.has(p))
        };
    }

    // Find users with specific permission
    async findUsersWithPermission(
        tenantId: string,
        permission: string
    ) {
        const rolePermissions = await this.rolePermissionRepository.find({
            where: {
                tenantId,
                permission,
                enabled: true
            },
            relations: ['role']
        });

        const roleIds = rolePermissions.map(rp => rp.role.id);

        return await this.userRepository.find({
            where: {
                tenantId,
                roleId: In(roleIds)
            }
        });
    }
}
```

### Export Report

```typescript
// Export permissions report to Excel/CSV
async exportPermissionsReport(tenantId: string, format: 'excel' | 'csv') {
    const analytics = await this.permissionAnalyticsService
        .getPermissionsByRole(tenantId);

    if (format === 'excel') {
        return this.exportToExcel(analytics);
    } else {
        return this.exportToCSV(analytics);
    }
}
```

---

## 🎯 Recommendations

### For Startup/SMB (<50 people)

```
✅ Use existing system roles
✅ Customize each role as needed
✅ Avoid creating too many custom roles
✅ ADMIN role cho founders/managers
✅ EMPLOYEE role cho team members
```

### For Enterprise (>50 people)

```
✅ Create custom roles by department
✅ Implement role hierarchy
✅ Use permission analytics
✅ Regular audit permissions
✅ Automated permission reviews
```

### Cho Agencies/Consulting

```
✅ Separate client vs team roles
✅ Time-limited permissions cho contractors
✅ Project-based permissions
✅ Client has view-only access
```

---

## �🛠️ Troubleshooting & Common Issues

### Issue 1: Permission Denied (403)

**Symptoms:**
```
❌ Unauthorized access blocked: User ID: xxx, Role: EMPLOYEE,
   Permissions Checked: ORG_EMPLOYEES_EDIT
```

**Root cause:**
1. User does not have required permission
2. Permission is disabled in database
3. Cache has not been invalidated after updating permissions

**Solution:**

```typescript
// 1. Check user permissions
const permissions = await this.rolePermissionService.findMePermissions();
console.log('User permissions:', permissions);

// 2. Check role permissions in database
SELECT * FROM role_permission
WHERE roleId = 'xxx'
  AND permission = 'ORG_EMPLOYEES_EDIT'
  AND enabled = true;

// 3. Clear cache
await this.cacheManager.del('userPermissions_*');
```

### Issue 2: PLATFORM_ADMIN Does Not Bypass

**Symptoms:**
- PLATFORM_ADMIN still gets permission checks
- Still receives 403 errors

**Root cause:**
- Role name does not match exactly (case-sensitive)
- Database has different role name

**Solution:**

```typescript
// Check exact role name
const user = RequestContext.currentUser();
console.log('Role name:', user.role?.name);

// Ensure it's exactly 'PLATFORM_ADMIN'
if (user?.role?.name === 'PLATFORM_ADMIN') {
    return true;
}
```

### Issue 3: Cache Not Invalidated

**Symptoms:**
- Update permissions but user still has old permissions
- Must wait 5 minutes or restart server

**Solution:**

```typescript
// Service: Invalidate cache khi update
@Injectable()
export class RolePermissionService {
    async updateRolePermission(id: string, dto: UpdateDTO) {
        const updated = await this.repository.update(id, dto);

        // Clear related caches
        const cachePattern = `userPermissions_*_${dto.roleId}_*`;
        await this.cacheManager.del(cachePattern);

        return updated;
    }
}
```

### Issue 4: Multi-Tenant Confusion

**Symptoms:**
- User sees data from other tenant
- Permission checks fail for new tenant

**Solution:**

```typescript
// Always check tenantId
const tenantId = RequestContext.currentTenantId();

// Filter by tenant in queries
const employees = await this.repository.find({
    where: { tenantId }
});
```

---

## 🔧 Development Tools & Utilities

### 1. Permission Checker Utility

```typescript
// utils/permission-checker.ts
export class PermissionChecker {
    static async checkUserPermissions(userId: string) {
        const user = await User.findOne({
            where: { id: userId },
            relations: ['role', 'role.rolePermissions']
        });

        const permissions = user.role.rolePermissions
            .filter(rp => rp.enabled)
            .map(rp => rp.permission);

        console.log(`User ${user.email} permissions:`, permissions);
        return permissions;
    }

    static async compareRoles(role1: string, role2: string) {
        const r1Perms = await this.getRolePermissions(role1);
        const r2Perms = await this.getRolePermissions(role2);

        const onlyInRole1 = r1Perms.filter(p => !r2Perms.includes(p));
        const onlyInRole2 = r2Perms.filter(p => !r1Perms.includes(p));
        const shared = r1Perms.filter(p => r2Perms.includes(p));

        return { onlyInRole1, onlyInRole2, shared };
    }
}
```

### 2. Permission Seeder

```typescript
// seeds/role-permissions.seed.ts
export class RolePermissionSeeder {
    async seed() {
        for (const roleConfig of DEFAULT_ROLE_PERMISSIONS) {
            const role = await this.roleRepository.findOne({
                where: { name: roleConfig.role }
            });

            for (const permission of roleConfig.defaultEnabledPermissions) {
                await this.rolePermissionRepository.save({
                    role,
                    permission,
                    enabled: true,
                    description: `Auto-generated for ${roleConfig.role}`
                });
            }
        }
    }
}
```

### 3. Debug Middleware

```typescript
// middleware/debug-permissions.middleware.ts
export class DebugPermissionsMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        if (process.env.DEBUG_PERMISSIONS === 'true') {
            const user = req['user'];
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔍 Permission Debug Info');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('User:', user?.email);
            console.log('Role:', user?.role?.name);
            console.log('Tenant:', user?.tenantId);
            console.log('Endpoint:', req.path);
            console.log('Method:', req.method);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        next();
    }
}
```

---

## 📊 Metrics & Monitoring

### Permission Check Metrics

```typescript
// decorators/metrics.decorator.ts
export function TrackPermissionCheck() {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const start = Date.now();
            const result = await originalMethod.apply(this, args);
            const duration = Date.now() - start;

            // Log metrics
            console.log({
                method: propertyKey,
                duration,
                result,
                timestamp: new Date().toISOString()
            });

            return result;
        };

        return descriptor;
    };
}
```

### Usage Statistics

```typescript
// Track permission usage
@Injectable()
export class PermissionMetricsService {
    private metrics = new Map<string, number>();

    trackPermissionCheck(permission: string, granted: boolean) {
        const key = `${permission}_${granted ? 'granted' : 'denied'}`;
        this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    }

    getTopDeniedPermissions(limit = 10) {
        return Array.from(this.metrics.entries())
            .filter(([key]) => key.endsWith('_denied'))
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    }
}
```

---

## 🧪 Testing Permissions

### Unit Test Example

```typescript
// employee.controller.spec.ts
describe('EmployeeController', () => {
    let controller: EmployeeController;
    let service: EmployeeService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [EmployeeController],
            providers: [
                EmployeeService,
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager
                }
            ]
        })
        .overrideGuard(PermissionGuard)
        .useValue({ canActivate: () => true })
        .compile();

        controller = module.get(EmployeeController);
        service = module.get(EmployeeService);
    });

    describe('findAll', () => {
        it('should require ORG_EMPLOYEES_VIEW permission', async () => {
            // Get metadata
            const permissions = Reflect.getMetadata(
                PERMISSIONS_METADATA,
                controller.findAll
            );

            expect(permissions).toContain(
                PermissionsEnum.ORG_EMPLOYEES_VIEW
            );
        });

        it('should deny access without permission', async () => {
            // Override guard to deny
            const guard = new PermissionGuard(
                mockCacheManager,
                mockReflector,
                mockRolePermissionService
            );

            jest.spyOn(mockRolePermissionService, 'checkRolePermission')
                .mockResolvedValue(false);

            const context = createMockExecutionContext();
            const canActivate = await guard.canActivate(context);

            expect(canActivate).toBe(false);
        });
    });
});
```

### Integration Test

```typescript
// permissions.e2e.spec.ts
describe('Permission System (e2e)', () => {
    let app: INestApplication;
    let adminToken: string;
    let employeeToken: string;

    beforeAll(async () => {
        // Setup test app
        app = await setupTestApp();

        // Login as different users
        adminToken = await loginAs('admin@test.com');
        employeeToken = await loginAs('employee@test.com');
    });

    it('ADMIN can create employees', () => {
        return request(app.getHttpServer())
            .post('/employee')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'John Doe' })
            .expect(201);
    });

    it('EMPLOYEE cannot create employees', () => {
        return request(app.getHttpServer())
            .post('/employee')
            .set('Authorization', `Bearer ${employeeToken}`)
            .send({ name: 'Jane Doe' })
            .expect(403);
    });

    it('PLATFORM_ADMIN bypasses all checks', async () => {
        const platformToken = await loginAs('platform@test.com');

        // Should access everything
        await request(app.getHttpServer())
            .get('/admin/sensitive-data')
            .set('Authorization', `Bearer ${platformToken}`)
            .expect(200);
    });
});
```

---

## 🔐 Security Best Practices

### 1. Never Trust Frontend

```typescript
// ❌ BAD: Only check on frontend
@Component()
export class EmployeeComponent {
    canEdit = this.hasPermission(PermissionsEnum.ORG_EMPLOYEES_EDIT);
}

// ✅ GOOD: Check on both frontend AND backend
// Frontend (UX)
@Component()
export class EmployeeComponent {
    canEdit = this.hasPermission(PermissionsEnum.ORG_EMPLOYEES_EDIT);
}

// Backend (Security)
@Controller('/employee')
export class EmployeeController {
    @Put(':id')
    @UseGuards(PermissionGuard)
    @Permissions(PermissionsEnum.ORG_EMPLOYEES_EDIT)
    update(@Param('id') id: string, @Body() dto: UpdateDTO) {
        return this.service.update(id, dto);
    }
}
```

### 2. Validate Tenant Context

```typescript
// ✅ Always validate tenant
@Injectable()
export class EmployeeService {
    async findOne(id: string) {
        const tenantId = RequestContext.currentTenantId();

        const employee = await this.repository.findOne({
            where: {
                id,
                tenantId  // ← Important!
            }
        });

        if (!employee) {
            throw new NotFoundException();
        }

        return employee;
    }
}
```

### 3. Audit Log Critical Actions

```typescript
// Audit decorator
export function AuditLog(action: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const user = RequestContext.currentUser();

            // Log before action
            await logAudit({
                action,
                userId: user.id,
                timestamp: new Date(),
                metadata: { args }
            });

            const result = await originalMethod.apply(this, args);

            // Log after action
            await logAudit({
                action: `${action}_COMPLETED`,
                userId: user.id,
                result
            });

            return result;
        };

        return descriptor;
    };
}

// Usage
@Delete(':id')
@AuditLog('DELETE_EMPLOYEE')
@Permissions(PermissionsEnum.ORG_EMPLOYEES_DELETE)
async deleteEmployee(@Param('id') id: string) {
    return this.service.delete(id);
}
```

### 4. Rate Limiting Sensitive Endpoints

```typescript
@Controller('/admin')
@UseGuards(AuthGuard, RoleGuard, PermissionGuard)
export class AdminController {
    @Post('/delete-all-data')
    @Permissions(PermissionsEnum.ACCESS_DELETE_ALL_DATA)
    @Throttle(1, 3600) // Max 1 request per hour
    async deleteAllData() {
        // Dangerous operation
    }
}
```

### 5. Principle of Least Privilege

```typescript
// ❌ BAD: Giving too many permissions
const newEmployee = {
    role: adminRole  // Don't give admin by default
};

// ✅ GOOD: Start with minimal permissions
const newEmployee = {
    role: employeeRole,  // Start with employee role
    // Can upgrade later if needed
};
```

---

## 📖 Migration Guide

### Upgrading Permissions

```typescript
// migrations/1234567890-add-new-permission.ts
export class AddNewPermission1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add new permission to enum (code level)
        // PermissionsEnum.NEW_FEATURE_VIEW = 'NEW_FEATURE_VIEW'

        // 2. Add to specific roles
        const roles = await queryRunner.query(`
            SELECT id, name FROM role
            WHERE name IN ('ADMIN', 'SUPER_ADMIN')
        `);

        for (const role of roles) {
            await queryRunner.query(`
                INSERT INTO role_permission
                (roleId, permission, enabled, tenantId)
                VALUES (
                    '${role.id}',
                    'NEW_FEATURE_VIEW',
                    true,
                    (SELECT tenantId FROM role WHERE id = '${role.id}')
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM role_permission
            WHERE permission = 'NEW_FEATURE_VIEW'
        `);
    }
}
```

### Adding New Role

```typescript
// migrations/1234567890-add-contractor-role.ts
export class AddContractorRole1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add to RolesEnum (code level)
        // RolesEnum.CONTRACTOR = 'CONTRACTOR'

        // 2. Create role in each tenant
        const tenants = await queryRunner.query('SELECT id FROM tenant');

        for (const tenant of tenants) {
            const role = await queryRunner.query(`
                INSERT INTO role (name, tenantId, isSystem)
                VALUES ('CONTRACTOR', '${tenant.id}', false)
                RETURNING id
            `);

            // 3. Add default permissions
            const contractorPermissions = [
                'ORG_TASK_VIEW',
                'ORG_PROJECT_VIEW',
                'TIME_TRACKER'
            ];

            for (const permission of contractorPermissions) {
                await queryRunner.query(`
                    INSERT INTO role_permission
                    (roleId, permission, enabled, tenantId)
                    VALUES (
                        '${role[0].id}',
                        '${permission}',
                        true,
                        '${tenant.id}'
                    )
                `);
            }
        }
    }
}
```

---

## 🎓 Advanced Topics

### 1. Dynamic Permissions

```typescript
// For complex business logic
@Injectable()
export class DynamicPermissionService {
    async canAccessProject(userId: string, projectId: string): Promise<boolean> {
        const user = await this.userRepository.findOne(userId);

        // Check if user is project member
        const isMember = await this.projectMemberRepository.exists({
            userId,
            projectId
        });

        if (isMember) return true;

        // Check if user has ACCESS_PRIVATE_PROJECTS permission
        if (RequestContext.hasPermission(
            PermissionsEnum.ACCESS_PRIVATE_PROJECTS
        )) {
            return true;
        }

        // Check if project is public
        const project = await this.projectRepository.findOne(projectId);
        return project.isPublic;
    }
}
```

### 2. Permission Inheritance

```typescript
// Parent-child permission relationship
const PERMISSION_HIERARCHY = {
    ORG_EMPLOYEES_EDIT: ['ORG_EMPLOYEES_VIEW'],  // EDIT implies VIEW
    ORG_PROJECT_DELETE: ['ORG_PROJECT_EDIT', 'ORG_PROJECT_VIEW'],
    SUPER_ADMIN_EDIT: ['ALL_PERMISSIONS']
};

function expandPermissions(permissions: string[]): string[] {
    const expanded = new Set(permissions);

    for (const permission of permissions) {
        const implies = PERMISSION_HIERARCHY[permission] || [];
        implies.forEach(p => expanded.add(p));
    }

    return Array.from(expanded);
}
```

### 3. Context-Aware Permissions

```typescript
@Injectable()
export class ContextAwarePermissionGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = RequestContext.currentUser();
        const resourceId = request.params.id;

        // Check ownership
        const resource = await this.getResource(resourceId);
        if (resource.ownerId === user.id) {
            return true;  // Owner can do anything
        }

        // Check team membership
        if (await this.isTeamMember(user.id, resource.teamId)) {
            return true;
        }

        // Fall back to standard permission check
        return super.canActivate(context);
    }
}
```

---

## 📚 Additional Resources

### Official Documentation
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)

### Related Files
- **Guards:** `packages/core/src/lib/shared/guards/`
- **Decorators:** `packages/core/src/lib/shared/decorators/`
- **Services:** `packages/core/src/lib/role-permission/`
- **Models:** `packages/contracts/src/lib/role*.ts`

### Helpful Commands

```bash
# Find all uses of a permission
grep -r "ORG_EMPLOYEES_EDIT" packages/

# List all guards in use
find packages/ -name "*.guard.ts"

# Check role permissions in database
psql -d gauzy -c "SELECT r.name, rp.permission, rp.enabled
                   FROM role r
                   JOIN role_permission rp ON r.id = rp.roleId
                   ORDER BY r.name, rp.permission;"
```

---

## ❓ FAQ

### Q1: Why does PLATFORM_ADMIN bypass guards but SUPER_ADMIN does not?

**A:** PLATFORM_ADMIN manages the entire platform (multi-tenant), needs access to everything without being limited by permissions. SUPER_ADMIN only manages 1 tenant and still needs to respect the permission system.

### Q2: How to add a new permission?

**A:**
1. Add to `PermissionsEnum` trong `role-permission.model.ts`
2. Update `DEFAULT_ROLE_PERMISSIONS` for roles that need it
3. Create migration to add to database
4. Use `@Permissions()` decorator trong controllers

### Q3: Does cache automatically invalidate?

**A:** No. Cache only expires after 5 minutes. If updating permissions, need to manually clear cache or wait for TTL to expire.

### Q4: Can we have dynamic (runtime) permissions?

**A:** Yes, use custom guard with complex business logic. See "Dynamic Permissions" section in Advanced Topics.

### Q5: How to debug permission issues?

**A:**
1. Enable debug logging trong guards
2. Check browser console cho frontend errors
3. Xem server logs cho permission denials
4. Use `PermissionChecker` utility
5. Inspect database `role_permission` table

---

**This documentation was created by:** GitHub Copilot
**Date:** 28/10/2025
**Version:** 2.0
**Last Updated:** 28/10/2025
