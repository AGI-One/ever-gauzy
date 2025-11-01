# GAUZY SYSTEM ORGANIZATION STRUCTURE

## Overview

The Gauzy system is designed with a multi-tier model, supporting management from Platform/Tenant level down to individual employees. Below is the detailed organizational structure:

## Hierarchical Structure Diagram

```
Platform
    └── Tenant (Customer/Corporation)
        └── Organization (Company/Branch)
            ├── Organization Contact (Clients/Partners)
            ├── Organization Department (Departments)
            │   └── Employees (Department members)
            ├── Organization Position (Positions/Titles)
            │   └── Employees (Employees with positions)
            ├── Organization Team (Teams)
            │   └── Team Members
            ├── Organization Project (Projects)
            │   ├── Project Employees (Project participants)
            │   ├── Project Modules (Project modules)
            │   ├── Project Teams (Participating teams)
            │   └── Tasks (Work items)
            └── Employee (Staff)
                ├── User Account
                ├── Contact Info
                ├── Skills
                ├── Departments
                ├── Positions
                ├── Teams
                └── Projects
```

## Level Details

### 1. **Platform**
- **Role**: Highest level of the system
- **Function**: Manages the entire system and all tenants
- **Administrator**: Platform Admin (Super Admin)

### 2. **Tenant (Customer/Corporation)**
- **Definition**: Represents a customer or corporation using the system
- **Model**: Multi-tenant architecture
- **Key Attributes**:
  - `name`: Tenant name
  - `logo`: Logo
  - `expiresAt`: Subscription expiration date
  - `standardWorkHoursPerDay`: Standard work hours per day
  - `createdBy`: Admin who created the tenant (Platform Admin)

**Relationships**:
- One Tenant can have multiple Organizations (1-n)
- Each Tenant is created by Platform Admin

**Entity file**: `packages/core/src/lib/tenant/tenant.entity.ts`

---

### 3. **Organization (Company/Branch)**
- **Definition**: Represents a company or organization within a tenant
- **Key Attributes**:
  - `name`: Organization name
  - `currency`: Currency unit
  - `totalEmployees`: Total number of employees
  - `timeZone`: Time zone
  - `profile_link`, `banner`, `imageUrl`: Image information
  - `overview`, `short_description`: Description

**Relationships**:
- Belongs to one Tenant (n-1)
- Has many Employees (1-n)
- Has many Departments (1-n)
- Has many Positions (1-n)
- Has many Teams (1-n)
- Has many Projects (1-n)
- Has many Organization Contacts (1-n)

**Entity file**: `packages/core/src/lib/organization/organization.entity.ts`

---

### 4. **Organization Department**
- **Definition**: Departments within the organization (e.g., IT Department, Marketing Department, HR Department)
- **Key Attributes**:
  - `name`: Department name
  - `members`: List of employees in the department
  - `candidates`: List of candidates

**Relationships**:
- Belongs to one Organization (n-1)
- Has many Employees (many-to-many)
- Has many Candidates (many-to-many)
- Can have Tags (many-to-many)

**Entity file**: `packages/core/src/lib/organization-department/organization-department.entity.ts`

---

### 5. **Organization Position (Job Position/Title)**
- **Definition**: Job positions/titles within the organization (e.g., Developer, Manager, CEO, CTO)
- **Key Attributes**:
  - `name`: Position/title name
  - `tags`: Tags

**Relationships**:
- Belongs to one Organization (n-1)
- Has many Employees at this position (1-n)
- Can have Tags (many-to-many)

**Entity file**: `packages/core/src/lib/organization-position/organization-position.entity.ts`

---

### 6. **Organization Team**
- **Definition**: Work teams within the organization (e.g., Frontend Team, Backend Team, QA Team)
- **Key Attributes**:
  - `name`: Team name
  - `color`: Representative color
  - `emoji`: Representative icon
  - `teamSize`: Team size
  - `logo`: Team logo

**Relationships**:
- Belongs to one Organization (n-1)
- Has many Team Members through OrganizationTeamEmployee (1-n)
- Can participate in many Projects (many-to-many)
- Has many Tasks (1-n)
- Has many Goals (1-n)

**Entity file**: `packages/core/src/lib/organization-team/organization-team.entity.ts`

---

### 7. **Organization Project**
- **Definition**: Organization's projects
- **Key Attributes**:
  - `name`: Project name
  - `startDate`, `endDate`: Project timeline
  - `billing`: Payment type (FLAT_FEE, HOURLY, etc.)
  - `currency`: Currency unit
  - `budget`: Budget
  - `status`: Project status

**Relationships**:
- Belongs to one Organization (n-1)
- Has many participating Employees through OrganizationProjectEmployee (many-to-many)
- Has many participating Teams (many-to-many)
- Has many Project Modules (1-n)
- Has many Tasks (1-n)
- Has many Sprints (1-n)
- Related to Organization Contact (Client) (n-1)

**Entity file**: `packages/core/src/lib/organization-project/organization-project.entity.ts`

---

### 8. **Organization Contact (Client/Partner)**
- **Definition**: Clients or partners of the organization
- **Key Attributes**:
  - `name`: Contact/client name
  - `primaryEmail`: Primary email
  - `primaryPhone`: Primary phone number
  - `contactType`: Contact type (CLIENT, CUSTOMER, LEAD)
  - `budget`: Budget

**Relationships**:
- Belongs to one Organization (n-1)
- Has many Projects (1-n)
- Has many Invoices (1-n)
- Has many Payments (1-n)
- Has many responsible Employees (many-to-many)

**Entity file**: `packages/core/src/lib/organization-contact/organization-contact.entity.ts`

---

### 9. **Employee (Staff)**
- **Definition**: Organization's employees
- **Key Attributes**:
  - `startedWorkOn`: Start date
  - `endWork`: End date
  - `payPeriod`: Pay cycle
  - `billRateValue`: Billing rate value
  - `employeeLevel`: Employee level
  - `averageIncome`: Average income

**Relationships**:
- Belongs to one Organization (n-1)
- Linked to User Account (1-1)
- Belongs to multiple Departments (many-to-many)
- Has one Position (n-1)
- Belongs to multiple Teams through OrganizationTeamEmployee (many-to-many)
- Participates in multiple Projects through OrganizationProjectEmployee (many-to-many)
- Has many Skills (many-to-many)
- Has many Tasks (1-n)
- Has many TimeLogs (1-n)
- Has many TimeSheets (1-n)
- Has many Goals (1-n)
- Has Contact information (1-1)

**Additional Information**:
- Employment Type
- Availability
- Awards
- Phone numbers
- Settings

**Entity file**: `packages/core/src/lib/employee/employee.entity.ts`

---

## Important Relationships

### 1. **Many-to-Many Relationships**

#### Employee ↔ Department
- One employee can belong to multiple departments
- One department has multiple employees
- **Junction table**: `organization_department_employee`

#### Employee ↔ Team
- One employee can join multiple teams
- One team has multiple employees
- **Junction table**: `organization_team_employee` (OrganizationTeamEmployee)

#### Employee ↔ Project
- One employee can participate in multiple projects
- One project has multiple employees
- **Junction table**: `organization_project_employee` (OrganizationProjectEmployee)

#### Employee ↔ Skills
- One employee has multiple skills
- One skill can belong to multiple employees

### 2. **Many-to-One Relationships**

- **Employee → Organization**: Many employees belong to one organization
- **Employee → Position**: Many employees have the same position
- **Employee → User**: Each employee is linked to one user account
- **Department → Organization**: Many departments belong to one organization
- **Team → Organization**: Many teams belong to one organization
- **Project → Organization**: Many projects belong to one organization
- **Organization → Tenant**: Many organizations belong to one tenant

### 3. **One-to-Many Relationships**

- **Organization → Employees**: One organization has many employees
- **Organization → Departments**: One organization has many departments
- **Organization → Teams**: One organization has many teams
- **Organization → Projects**: One organization has many projects
- **Project → Tasks**: One project has many tasks
- **Employee → TimeLogs**: One employee has many time logs

---

## Real-World Examples

### Example 1: ABC Corporation

```
Platform Gauzy
└── Tenant: ABC Corporation
    ├── Organization: ABC Vietnam (Vietnam Branch)
    │   ├── Departments:
    │   │   ├── IT Department
    │   │   ├── Marketing Department
    │   │   └── HR Department
    │   ├── Positions:
    │   │   ├── CEO
    │   │   ├── CTO
    │   │   ├── Senior Developer
    │   │   ├── Junior Developer
    │   │   └── Marketing Manager
    │   ├── Teams:
    │   │   ├── Frontend Team (5 members)
    │   │   ├── Backend Team (7 members)
    │   │   └── Mobile Team (4 members)
    │   ├── Projects:
    │   │   ├── E-commerce Website
    │   │   │   ├── Employees: 10 people
    │   │   │   ├── Teams: Frontend Team, Backend Team
    │   │   │   └── Tasks: 150 tasks
    │   │   └── Mobile App
    │   │       ├── Employees: 8 people
    │   │       ├── Teams: Mobile Team, Backend Team
    │   │       └── Tasks: 80 tasks
    │   ├── Organization Contacts:
    │   │   ├── Client A (E-commerce project)
    │   │   └── Client B (Mobile app project)
    │   └── Employees:
    │       ├── John Smith
    │       │   ├── Position: Senior Developer
    │       │   ├── Department: IT Department
    │       │   ├── Teams: Frontend Team
    │       │   └── Projects: E-commerce Website
    │       ├── Jane Doe
    │       │   ├── Position: Junior Developer
    │       │   ├── Department: IT Department
    │       │   ├── Teams: Backend Team
    │       │   └── Projects: E-commerce Website, Mobile App
    │       └── Michael Johnson
    │           ├── Position: Marketing Manager
    │           ├── Department: Marketing Department
    │           ├── Teams: -
    │           └── Projects: -
    └── Organization: ABC Singapore (Singapore Branch)
        └── ... (similar structure)
```

### Example 2: XYZ Startup

```
Platform Gauzy
└── Tenant: XYZ Startup
    └── Organization: XYZ Company
        ├── Departments:
        │   ├── Engineering
        │   └── Sales
        ├── Positions:
        │   ├── Founder
        │   ├── Tech Lead
        │   └── Developer
        ├── Teams:
        │   └── Core Team (10 members)
        ├── Projects:
        │   └── Main Product
        │       ├── Employees: 10 people
        │       └── Tasks: 200 tasks
        └── Employees: 12 people
```

---

## Key Features

### 1. **Multi-tenant Architecture**
- Supports multiple customers/corporations on the same system
- Data is completely isolated between tenants
- Each tenant can have multiple organizations

### 2. **Flexible Organization Structure**
- Employees can belong to multiple departments, teams, and projects
- Supports matrix management
- Flexible resource allocation

### 3. **Hierarchical Permission**
- Platform Admin > Tenant Admin > Organization Admin > Manager > Employee
- Clear permission hierarchy

### 4. **Tag System**
- Most entities support tags
- Helps with categorization and easy searching

### 5. **Audit Trail**
- All entities inherit from BaseEntity
- Automatic tracking: `createdAt`, `updatedAt`, `deletedAt`
- Soft delete support

---

## Conclusion

The Gauzy system is designed with a clear hierarchical organization structure, from Platform → Tenant → Organization → Department/Team/Project → Employee. This structure:

1. **Flexible**: Supports various organizational models
2. **Scalable**: Easy to add new organizations, departments, teams
3. **Multi-dimensional**: Employees can belong to multiple units simultaneously
4. **Clear**: Relationships between entities are strictly defined

This structure is suitable for both small businesses and large corporations, from traditional management models to Agile/Scrum.

