# DETAILED REPORT: ORGANIZATIONAL STRUCTURE AND DATA RELATIONSHIPS

## TABLE OF CONTENTS
1. [Architecture Overview](#architecture-overview)
2. [Entity Details](#entity-details)
3. [Database Relationships](#database-relationships)
4. [Junction Tables](#junction-tables)
5. [Code Examples](#code-examples)
6. [Best Practices](#best-practices)

---

## ARCHITECTURE OVERVIEW

### Complete Hierarchical Model

```
┌─────────────────────────────────────────────────────────────┐
│                      PLATFORM LEVEL                         │
│                  (Managed by Super Admin)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ├─► Tenant 1 (ABC Corp)
                           ├─► Tenant 2 (XYZ Ltd)
                           └─► Tenant 3 (DEF Inc)
                                      │
        ┌─────────────────────────────┴──────────────────────────┐
        │                    TENANT LEVEL                        │
        │               (Managed by Tenant Admin)                │
        └──────────────────────────┬─────────────────────────────┘
                                   │
                                   ├─► Organization 1 (Vietnam Branch)
                                   ├─► Organization 2 (Singapore Branch)
                                   └─► Organization 3 (Thailand Branch)
                                              │
        ┌─────────────────────────────────────┴────────────────────────┐
        │                   ORGANIZATION LEVEL                         │
        │              (Managed by Organization Admin)                 │
        └──────┬──────────┬──────────┬──────────┬──────────┬───────────┘
               │          │          │          │          │
         Departments   Teams    Projects   Positions   Contacts
               │          │          │          │          │
        ┌──────┴──────────┴──────────┴──────────┴──────────┴──────┐
        │                   EMPLOYEE LEVEL                         │
        │                  (Staff - User)                          │
        └──────────────────────────────────────────────────────────┘
               │
         ┌─────┴─────────────────────────────────────┐
         │                                            │
    TimeLogs, Tasks, TimeSheets,              Skills, Awards,
    Expenses, Goals, DailyPlans               Phones, Settings
```

---

## ENTITY DETAILS

### 1. TENANT (Enterprise Customer)

**Purpose**: Represents a customer using the system (multi-tenant SaaS model)

**Key Attributes**:
```typescript
{
  id: string;                          // UUID
  name: string;                        // Tenant name (e.g., "ABC Corporation")
  logo?: string;                       // Logo URL
  expiresAt?: Date;                    // Subscription expiration date
  standardWorkHoursPerDay?: number;    // Standard work hours (default: 8)
  createdById?: string;                // Platform Admin ID who created the tenant
  imageId?: string;                    // ImageAsset ID
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;                    // Soft delete
}
```

**Relationships**:
- **1:N** with Organization (One tenant has many organizations)
- **1:N** with RolePermission (Permissions by tenant)
- **1:N** with FeatureOrganization (Features by tenant)
- **N:1** with User (Creator - Platform Admin)
- **N:1** with ImageAsset (Logo)

**File**: `packages/core/src/lib/tenant/tenant.entity.ts`

---

### 2. ORGANIZATION (Company/Branch)

**Purpose**: Represents a company, branch, or business unit

**Key Attributes**:
```typescript
{
  id: string;
  tenantId: string;                    // Which tenant it belongs to
  name: string;                        // Organization name
  isDefault: boolean;                  // Is default organization?
  currency: CurrenciesEnum;            // Currency (USD, VND, etc.)
  totalEmployees?: number;             // Total number of employees
  timeZone?: string;                   // Time zone
  regionCode?: string;                 // Region code
  profile_link?: string;               // Profile link
  banner?: string;                     // Banner URL
  imageUrl?: string;                   // Logo URL
  overview?: string;                   // Overview description
  short_description?: string;          // Short description
  
  // Work configuration
  standardWorkHoursPerDay?: number;    // Standard work hours/day
  defaultStartTime?: string;           // Default start time
  defaultEndTime?: string;             // Default end time
  
  // Holiday configuration
  startWeekOn?: WeekDaysEnum;          // Week starts on which day
  
  // Financial configuration
  bonusType?: BonusTypeEnum;           // Bonus type
  bonusPercentage?: number;            // Bonus percentage
  invitesAllowed?: boolean;            // Allow user invitations?
  inviteExpiryPeriod?: number;         // Invitation expiry period
}
```

**Relationships**:
- **N:1** with Tenant
- **1:N** with Employee (Many employees)
- **1:N** with OrganizationDepartment (Many departments)
- **1:N** with OrganizationPosition (Many positions)
- **1:N** with OrganizationTeam (Many teams)
- **1:N** with OrganizationProject (Many projects)
- **1:N** with OrganizationContact (Many clients/partners)
- **1:N** with Invoice, Payment, Deal, Skill, Tag, etc.

**File**: `packages/core/src/lib/organization/organization.entity.ts`

---

### 3. ORGANIZATION DEPARTMENT

**Purpose**: Manage departments within the organization

**Key Attributes**:
```typescript
{
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;                        // Department name (e.g., "IT", "Marketing")
  members: IEmployee[];                // Employee list (many-to-many)
  candidates: ICandidate[];            // Candidate list
  tags: ITag[];                        // Tags for categorization
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships**:
- **N:1** with Organization
- **M:N** with Employee (via `organization_department_employee` table)
- **M:N** with Candidate (via `candidate_department` table)
- **M:N** with Tag (via `tag_organization_department` table)

**Real-world Example**:
```
IT Department
├── Members:
│   ├── John Smith (Senior Dev)
│   ├── Jane Doe (Junior Dev)
│   └── Michael Lee (QA)
└── Tags: ["Technology", "Development", "Core"]
```

**File**: `packages/core/src/lib/organization-department/organization-department.entity.ts`

---

### 4. ORGANIZATION POSITION (Job Title)

**Purpose**: Define positions/titles within the organization

**Key Attributes**:
```typescript
{
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;                        // Position name (e.g., "CEO", "Developer", "Manager")
  tags: ITag[];
}
```

**Relationships**:
- **N:1** with Organization
- **1:N** with Employee (One position has many employees)
- **M:N** with Tag (via `tag_organization_position` table)

**Real-world Example**:
```
Company Positions:
├── C-Level
│   ├── CEO (1 employee)
│   ├── CTO (1 employee)
│   └── CFO (1 employee)
├── Management
│   ├── Engineering Manager (3 employees)
│   ├── Product Manager (2 employees)
│   └── Marketing Manager (1 employee)
└── Individual Contributors
    ├── Senior Developer (8 employees)
    ├── Junior Developer (12 employees)
    └── QA Engineer (5 employees)
```

**File**: `packages/core/src/lib/organization-position/organization-position.entity.ts`

---

### 5. ORGANIZATION TEAM

**Purpose**: Manage work teams (can be cross-functional, cross-department)

**Key Attributes**:
```typescript
{
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;                        // Team name
  color?: string;                      // Representative color (#FF5733)
  emoji?: string;                      // Representative emoji (🚀)
  teamSize?: string;                   // Team size
  logo?: string;                       // Team logo
  prefix?: string;                     // Task prefix (e.g., "FE-")
  
  // Relations
  members: IOrganizationTeamEmployee[]; // Team members
  projects: IOrganizationProject[];     // Projects team participates in
  tasks: ITask[];                       // Team tasks
  goals: IGoal[];                       // Team goals
}
```

**Relationships**:
- **N:1** with Organization
- **1:N** with OrganizationTeamEmployee (Team members)
- **M:N** with OrganizationProject (Team participates in projects)
- **1:N** with Task (Team tasks)
- **1:N** with Goal (Team goals)
- **M:N** with Tag

**Real-world Example**:
```
Frontend Team
├── Name: "Frontend Development Team"
├── Color: "#FF5733"
├── Emoji: "⚛️"
├── Size: "5 members"
├── Members:
│   ├── John Smith (Team Lead)
│   ├── Jane Doe (Senior Dev)
│   ├── Michael Lee (Mid-level Dev)
│   ├── Sarah Johnson (Junior Dev)
│   └── David Brown (Intern)
├── Projects:
│   ├── E-commerce Website
│   └── Admin Dashboard
└── Tasks: 45 active tasks
```

**File**: `packages/core/src/lib/organization-team/organization-team.entity.ts`

---

### 6. ORGANIZATION PROJECT

**Purpose**: Manage organization's projects

**Key Attributes**:
```typescript
{
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;                                  // Project name
  
  // Timeline
  startDate?: Date;
  endDate?: Date;
  
  // Financial
  billing?: ProjectBillingEnum;                  // FLAT_FEE, HOURLY, TASK_BASED
  currency?: CurrenciesEnum;
  budget?: number;
  budgetType?: OrganizationProjectBudgetTypeEnum; // COST, HOURS
  
  // Status & Management
  status?: ProjectStatusEnum;                    // OPEN, IN_PROGRESS, COMPLETED
  owner?: ProjectOwnerEnum;                      // CLIENT, INTERNAL
  taskListType?: TaskListTypeEnum;               // GRID, SPRINT
  
  // Client
  organizationContactId?: string;                // Project client
  
  // Relations
  members: IOrganizationProjectEmployee[];       // Participating employees
  teams: IOrganizationTeam[];                    // Participating teams
  modules: IOrganizationProjectModule[];         // Project modules
  tasks: ITask[];                                // Tasks
  sprints: IOrganizationSprint[];                // Sprints (if using Agile)
  
  // Description
  description?: string;
  code?: string;                                 // Project code
  color?: string;                                // Project color
  imageUrl?: string;                             // Project logo
}
```

**Relationships**:
- **N:1** with Organization
- **N:1** with OrganizationContact (Client)
- **M:N** with Employee (via `organization_project_employee`)
- **M:N** with OrganizationTeam
- **1:N** with OrganizationProjectModule
- **1:N** with Task
- **1:N** with OrganizationSprint
- **1:N** with TimeLog, Expense, Payment, Invoice, etc.

**Real-world Example**:
```
E-commerce Website Project
├── Name: "E-commerce Platform v2.0"
├── Code: "ECOM-2024"
├── Status: IN_PROGRESS
├── Duration: 2024-01-01 → 2024-06-30
├── Budget: $150,000 (COST based)
├── Billing: HOURLY
├── Client: "ABC Retail Company"
├── Teams:
│   ├── Frontend Team (5 members)
│   ├── Backend Team (7 members)
│   └── QA Team (3 members)
├── Employees: 15 people
├── Modules:
│   ├── User Authentication
│   ├── Product Catalog
│   ├── Shopping Cart
│   ├── Payment Gateway
│   └── Admin Panel
├── Sprints: 12 sprints (2 weeks each)
└── Tasks: 250 tasks (120 completed, 80 in-progress, 50 todo)
```

**File**: `packages/core/src/lib/organization-project/organization-project.entity.ts`

---

### 7. ORGANIZATION CONTACT (Client/Partner)

**Purpose**: Manage clients, partners, and leads

**Key Attributes**:
```typescript
{
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;                        // Client/company name
  primaryEmail?: string;
  primaryPhone?: string;
  
  // Contact type
  contactType: ContactType;            // CLIENT, CUSTOMER, LEAD
  
  // Financial
  budget?: number;
  budgetType?: OrganizationContactBudgetTypeEnum;
  
  // Status
  inviteStatus?: ContactOrganizationInviteStatus;
  
  // Additional info
  website?: string;
  fiscalInformation?: string;
  notes?: string;
  
  // Relations
  contactInfo?: IContact;              // Detailed contact information
  projects: IOrganizationProject[];    // Client's projects
  invoices: IInvoice[];                // Invoices
  payments: IPayment[];                // Payments
  employees: IEmployee[];              // Account managers
}
```

**Relationships**:
- **N:1** with Organization
- **1:1** with Contact (Contact info)
- **1:N** with OrganizationProject
- **1:N** with Invoice
- **1:N** with Payment
- **M:N** with Employee (Account managers)

**Real-world Example**:
```
ABC Retail Company (Client)
├── Type: CLIENT
├── Email: contact@abc-retail.com
├── Phone: +1-555-123-4567
├── Website: www.abc-retail.com
├── Budget: $500,000/year
├── Projects:
│   ├── E-commerce Website ($150K)
│   ├── Mobile App ($200K)
│   └── CRM System ($150K)
├── Invoices: 12 invoices (Total: $480K)
├── Payments: Received $450K
└── Account Managers:
    ├── John Smith (Primary)
    └── Jane Doe (Secondary)
```

**File**: `packages/core/src/lib/organization-contact/organization-contact.entity.ts`

---

### 8. EMPLOYEE (Staff)

**Purpose**: Represents employees in the system

**Key Attributes**:
```typescript
{
  id: string;
  tenantId: string;
  organizationId: string;
  userId: string;                      // Link to User account
  
  // Work timeline
  startedWorkOn?: Date;                // Start date
  endWork?: Date;                      // End date
  
  // Financial
  payPeriod?: PayPeriodEnum;           // WEEKLY, MONTHLY, BI_WEEKLY
  billRateValue?: number;              // Billing rate value
  billRateCurrency?: CurrenciesEnum;
  minimumBillingRate?: number;
  averageIncome?: number;              // Average income
  
  // Personal info
  short_description?: string;
  description?: string;
  employeeLevel?: string;              // Junior, Senior, Lead, etc.
  
  // Settings
  reWeeklyLimit?: number;              // Hours limit per week
  anonymousBonus?: boolean;
  
  // Important dates
  offerDate?: Date;
  acceptDate?: Date;
  rejectDate?: Date;
  
  // Relations
  user: IUser;                         // User account
  contact?: IContact;                  // Contact information
  organizationPosition?: IOrganizationPosition; // Position
  organizationDepartments: IOrganizationDepartment[]; // Departments
  organizationEmploymentType: IOrganizationEmploymentType[]; // Employment types
  teams: IOrganizationTeamEmployee[];  // Teams participated
  projects: IOrganizationProjectEmployee[]; // Projects participated
  
  // Activities
  skills: ISkill[];                    // Skills
  tasks: ITask[];                      // Tasks
  timeLogs: ITimeLog[];                // Time logs
  timesheets: ITimesheet[];            // Timesheets
  expenses: IExpense[];                // Expenses
  goals: IGoal[];                      // Goals
  awards: IEmployeeAward[];            // Awards
}
```

**Main Relationships**:
- **N:1** with Organization
- **N:1** with User (1-1 bidirectional)
- **1:1** with Contact (Contact info)
- **N:1** with OrganizationPosition
- **M:N** with OrganizationDepartment (via `organization_department_employee`)
- **M:N** with OrganizationEmploymentType (via `organization_employment_type_employee`)
- **M:N** with OrganizationTeam (via `organization_team_employee`)
- **M:N** with OrganizationProject (via `organization_project_employee`)
- **M:N** with Skill
- **1:N** with Task, TimeLog, Timesheet, Expense, Goal, Award, etc.

**Real-world Example**:
```
Employee: John Smith
├── User: john.smith@company.com
├── Position: Senior Full-stack Developer
├── Level: Senior (5 years experience)
├── Departments:
│   └── IT Department
├── Employment Type: Full-time
├── Teams:
│   ├── Frontend Team (Team Lead)
│   └── Backend Team (Member)
├── Projects:
│   ├── E-commerce Website (40 hours/week)
│   └── Mobile App (10 hours/week)
├── Skills:
│   ├── React (Expert)
│   ├── Node.js (Advanced)
│   ├── TypeScript (Advanced)
│   ├── MongoDB (Intermediate)
│   └── AWS (Intermediate)
├── Work Info:
│   ├── Started: 2020-01-15
│   ├── Pay Period: Monthly
│   ├── Bill Rate: $50/hour
│   ├── Average Income: $8,500/month
│   └── Weekly Limit: 40 hours
└── Stats:
    ├── Tasks: 245 (210 completed)
    ├── Time Logged: 4,280 hours
    └── Awards: 3 (Employee of the Month x2, Best Performer 2023)
```

**File**: `packages/core/src/lib/employee/employee.entity.ts`

---

## DATABASE RELATIONSHIPS

### Main ERD Diagram

```
┌──────────┐
│  Tenant  │
└────┬─────┘
     │ 1:N
     ▼
┌────────────────┐
│ Organization   │
└────┬───────────┘
     │
     ├─────────► 1:N ──────► Department
     │                          │
     │                          │ M:N (junction table)
     │                          ▼
     ├─────────► 1:N ──────► Employee ◄───┐
     │                          │          │
     │                          │ M:N      │ M:N
     │                          ▼          │
     ├─────────► 1:N ──────► Team ────────┘
     │                          │
     │                          │ M:N
     │                          ▼
     ├─────────► 1:N ──────► Project
     │                          │
     │                          │ 1:N
     │                          ▼
     ├─────────► 1:N ──────► Task
     │
     ├─────────► 1:N ──────► Position
     │                          │
     │                          │ 1:N
     │                          └──────────► Employee
     │
     └─────────► 1:N ──────► OrganizationContact
                                │
                                │ 1:N
                                └──────────► Project
```

---

## JUNCTION TABLES

### 1. organization_department_employee
Links Employee with Department (Many-to-Many)

```sql
CREATE TABLE organization_department_employee (
    organizationDepartmentId UUID NOT NULL,
    employeeId UUID NOT NULL,
    PRIMARY KEY (organizationDepartmentId, employeeId),
    FOREIGN KEY (organizationDepartmentId) REFERENCES organization_department(id),
    FOREIGN KEY (employeeId) REFERENCES employee(id)
);
```

**Meaning**: An employee can belong to multiple departments

**Example**:
```typescript
// Employee A belongs to both IT Department and R&D Department
{
  employeeId: "uuid-employee-a",
  departments: [
    { id: "uuid-it-dept", name: "IT Department" },
    { id: "uuid-rd-dept", name: "R&D Department" }
  ]
}
```

---

### 2. organization_team_employee
Links Employee with Team (Many-to-Many)

```sql
CREATE TABLE organization_team_employee (
    id UUID PRIMARY KEY,
    tenantId UUID NOT NULL,
    organizationId UUID NOT NULL,
    organizationTeamId UUID NOT NULL,
    employeeId UUID NOT NULL,
    roleId UUID,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,
    FOREIGN KEY (organizationTeamId) REFERENCES organization_team(id),
    FOREIGN KEY (employeeId) REFERENCES employee(id),
    FOREIGN KEY (roleId) REFERENCES role(id)
);
```

**Meaning**: An employee can join multiple teams, with specific roles in each team

**Example**:
```typescript
// Employee A is Team Lead of Frontend Team and Member of Backend Team
{
  employeeId: "uuid-employee-a",
  teams: [
    { 
      teamId: "uuid-frontend-team",
      teamName: "Frontend Team",
      role: "Team Lead",
      isActive: true
    },
    {
      teamId: "uuid-backend-team",
      teamName: "Backend Team", 
      role: "Member",
      isActive: true
    }
  ]
}
```

---

### 3. organization_project_employee
Links Employee with Project (Many-to-Many)

```sql
CREATE TABLE organization_project_employee (
    id UUID PRIMARY KEY,
    tenantId UUID NOT NULL,
    organizationId UUID NOT NULL,
    organizationProjectId UUID NOT NULL,
    employeeId UUID NOT NULL,
    isManager BOOLEAN DEFAULT false,
    assignedAt TIMESTAMP,
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,
    FOREIGN KEY (organizationProjectId) REFERENCES organization_project(id),
    FOREIGN KEY (employeeId) REFERENCES employee(id)
);
```

**Meaning**: An employee can participate in multiple projects, and each project has multiple employees

**Example**:
```typescript
// Employee A is Manager of E-commerce project and Member of Mobile App project
{
  employeeId: "uuid-employee-a",
  projects: [
    {
      projectId: "uuid-ecommerce-project",
      projectName: "E-commerce Website",
      isManager: true,
      assignedAt: "2024-01-01"
    },
    {
      projectId: "uuid-mobile-project",
      projectName: "Mobile App",
      isManager: false,
      assignedAt: "2024-02-15"
    }
  ]
}
```

---

### 4. organization_employment_type_employee
Links Employee with Employment Type (Many-to-Many)

```sql
CREATE TABLE organization_employment_type_employee (
    organizationEmploymentTypeId UUID NOT NULL,
    employeeId UUID NOT NULL,
    PRIMARY KEY (organizationEmploymentTypeId, employeeId),
    FOREIGN KEY (organizationEmploymentTypeId) REFERENCES organization_employment_type(id),
    FOREIGN KEY (employeeId) REFERENCES employee(id)
);
```

**Meaning**: Employees can have multiple employment contract types (Full-time, Part-time, Contract)

---

### 5. tag_organization_department
Links Tag with Department

```sql
CREATE TABLE tag_organization_department (
    tagId UUID NOT NULL,
    organizationDepartmentId UUID NOT NULL,
    PRIMARY KEY (tagId, organizationDepartmentId),
    FOREIGN KEY (tagId) REFERENCES tag(id),
    FOREIGN KEY (organizationDepartmentId) REFERENCES organization_department(id)
);
```

---

## CODE EXAMPLES

### Example 1: Query employee with all relationships

```typescript
// Repository: EmployeeRepository
async findEmployeeWithAllRelations(employeeId: string): Promise<Employee> {
  return await this.employeeRepository.findOne({
    where: { id: employeeId },
    relations: [
      'user',
      'contact',
      'organizationPosition',
      'organizationDepartments',
      'organizationEmploymentTypes',
      'teams',
      'teams.organizationTeam',
      'projects',
      'projects.organizationProject',
      'skills',
      'tasks',
      'tags'
    ]
  });
}

// Result
{
  id: "uuid-123",
  user: {
    email: "john.smith@company.com",
    firstName: "John",
    lastName: "Smith"
  },
  organizationPosition: {
    name: "Senior Developer"
  },
  organizationDepartments: [
    { name: "IT Department" },
    { name: "R&D Department" }
  ],
  teams: [
    {
      organizationTeam: { name: "Frontend Team" },
      role: "Team Lead"
    },
    {
      organizationTeam: { name: "Backend Team" },
      role: "Member"
    }
  ],
  projects: [
    {
      organizationProject: { name: "E-commerce Website" },
      isManager: true
    }
  ],
  skills: [
    { name: "React" },
    { name: "Node.js" }
  ]
}
```

---

### Example 2: Create Organization with complete structure

```typescript
// Service: OrganizationService
async createOrganizationWithStructure(dto: CreateOrganizationDto) {
  // 1. Create Organization
  const organization = await this.organizationRepository.save({
    tenantId: dto.tenantId,
    name: dto.name,
    currency: dto.currency,
    timeZone: dto.timeZone
  });

  // 2. Create default Departments
  const departments = await this.departmentRepository.save([
    { organizationId: organization.id, name: 'Engineering' },
    { organizationId: organization.id, name: 'Sales' },
    { organizationId: organization.id, name: 'Marketing' },
    { organizationId: organization.id, name: 'Human Resources' }
  ]);

  // 3. Create default Positions
  const positions = await this.positionRepository.save([
    { organizationId: organization.id, name: 'CEO' },
    { organizationId: organization.id, name: 'CTO' },
    { organizationId: organization.id, name: 'Manager' },
    { organizationId: organization.id, name: 'Senior Developer' },
    { organizationId: organization.id, name: 'Junior Developer' }
  ]);

  // 4. Create default Employment Types
  const employmentTypes = await this.employmentTypeRepository.save([
    { organizationId: organization.id, name: 'Full-time' },
    { organizationId: organization.id, name: 'Part-time' },
    { organizationId: organization.id, name: 'Contract' }
  ]);

  return {
    organization,
    departments,
    positions,
    employmentTypes
  };
}
```

---

### Example 3: Assign employee to Team, Department, Project

```typescript
// Service: EmployeeService
async assignEmployeeToUnits(
  employeeId: string,
  dto: AssignEmployeeDto
) {
  const employee = await this.employeeRepository.findOne({
    where: { id: employeeId }
  });

  // 1. Assign to Departments
  if (dto.departmentIds?.length) {
    const departments = await this.departmentRepository.findByIds(
      dto.departmentIds
    );
    employee.organizationDepartments = departments;
  }

  // 2. Assign to Teams (with role)
  if (dto.teamAssignments?.length) {
    const teamEmployees = dto.teamAssignments.map(assignment => ({
      employeeId: employeeId,
      organizationTeamId: assignment.teamId,
      roleId: assignment.roleId,
      isActive: true
    }));
    await this.teamEmployeeRepository.save(teamEmployees);
  }

  // 3. Assign to Projects (with isManager flag)
  if (dto.projectAssignments?.length) {
    const projectEmployees = dto.projectAssignments.map(assignment => ({
      employeeId: employeeId,
      organizationProjectId: assignment.projectId,
      isManager: assignment.isManager,
      assignedAt: new Date()
    }));
    await this.projectEmployeeRepository.save(projectEmployees);
  }

  // 4. Set Position
  if (dto.positionId) {
    employee.organizationPositionId = dto.positionId;
  }

  await this.employeeRepository.save(employee);
  
  return employee;
}
```

---

### Example 4: Complex Query - Find all projects of a department

```typescript
// Service: ProjectService
async findProjectsByDepartment(
  organizationId: string,
  departmentId: string
): Promise<OrganizationProject[]> {
  return await this.projectRepository
    .createQueryBuilder('project')
    .leftJoinAndSelect('project.members', 'projectEmployee')
    .leftJoinAndSelect('projectEmployee.employee', 'employee')
    .leftJoinAndSelect('employee.organizationDepartments', 'department')
    .where('project.organizationId = :organizationId', { organizationId })
    .andWhere('department.id = :departmentId', { departmentId })
    .getMany();
}
```

---

### Example 5: Dashboard Statistics

```typescript
// Service: DashboardService
async getOrganizationStatistics(organizationId: string) {
  const [
    totalEmployees,
    totalDepartments,
    totalTeams,
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks
  ] = await Promise.all([
    this.employeeRepository.count({ organizationId }),
    this.departmentRepository.count({ organizationId }),
    this.teamRepository.count({ organizationId }),
    this.projectRepository.count({ organizationId }),
    this.projectRepository.count({ 
      organizationId,
      status: ProjectStatusEnum.IN_PROGRESS 
    }),
    this.taskRepository.count({ organizationId }),
    this.taskRepository.count({ 
      organizationId,
      status: TaskStatusEnum.COMPLETED 
    })
  ]);

  return {
    employees: {
      total: totalEmployees,
      byDepartment: await this.getEmployeesByDepartment(organizationId),
      byPosition: await this.getEmployeesByPosition(organizationId)
    },
    departments: {
      total: totalDepartments
    },
    teams: {
      total: totalTeams,
      averageSize: await this.getAverageTeamSize(organizationId)
    },
    projects: {
      total: totalProjects,
      active: activeProjects,
      completion: (activeProjects / totalProjects) * 100
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      completion: (completedTasks / totalTasks) * 100
    }
  };
}
```

---

## BEST PRACTICES

### 1. Data Isolation

**Tenant Level Isolation**:
```typescript
// Always filter by tenantId in queries
@Injectable()
export class TenantAwareRepository<T extends TenantBaseEntity> {
  async find(tenantId: string, options?: FindOptions<T>): Promise<T[]> {
    return await this.repository.find({
      where: {
        tenantId,
        ...options?.where
      },
      ...options
    });
  }
}
```

### 2. Soft Delete
```typescript
// Use soft delete instead of hard delete
@MultiORMColumn({ nullable: true })
deletedAt?: Date;

// Delete method
async softDelete(id: string) {
  return await this.repository.update(id, {
    deletedAt: new Date()
  });
}
```

### 3. Audit Trail
```typescript
// All entities have audit fields
@MultiORMColumn()
createdAt: Date;

@MultiORMColumn()
updatedAt: Date;

@MultiORMColumn({ nullable: true })
createdById?: string;

@MultiORMColumn({ nullable: true })
updatedById?: string;
```

### 4. Query Optimization
```typescript
// Use DataLoader to avoid N+1 problem
@Injectable()
export class EmployeeDataLoader {
  constructor(private employeeRepository: EmployeeRepository) {}

  createLoaders() {
    return {
      batchEmployees: new DataLoader(async (ids: string[]) => {
        const employees = await this.employeeRepository.findByIds(ids, {
          relations: ['user', 'organizationPosition']
        });
        return ids.map(id => employees.find(e => e.id === id));
      })
    };
  }
}
```

### 5. Permission Checks
```typescript
// Guard to check permissions
@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.params.organizationId;
    
    // Check if user belongs to organization
    return user.employee?.organizationId === organizationId;
  }
}
```

---

## CONCLUSION

Gauzy's organizational structure is designed to be:

1. **Clearly Hierarchical**: Platform → Tenant → Organization → Units → Employee
2. **Flexible**: Supports matrix organization (employees belong to multiple units)
3. **Scalable**: Multi-tenant architecture allows expansion
4. **Feature-rich**: Supports comprehensive modern management features
5. **Type-safe**: Uses TypeScript and TypeORM

Important files:
- `/packages/core/src/lib/tenant/` - Tenant management
- `/packages/core/src/lib/organization/` - Organization management
- `/packages/core/src/lib/organization-department/` - Department management
- `/packages/core/src/lib/organization-team/` - Team management
- `/packages/core/src/lib/organization-project/` - Project management
- `/packages/core/src/lib/employee/` - Employee management

