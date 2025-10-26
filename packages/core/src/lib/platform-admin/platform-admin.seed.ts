import { DataSource } from 'typeorm';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { Tenant } from '../tenant/tenant.entity';
import { Organization } from '../organization/organization.entity';
import { UserOrganization } from '../user-organization/user-organization.entity';
import { Employee } from '../employee/employee.entity';
import { RolesEnum, DefaultValueDateTypeEnum, BonusTypeEnum, PayPeriodEnum, CurrenciesEnum, WeekDaysEnum } from '@gauzy/contracts';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { environment } from '@gauzy/config';
import { createRolePermissions } from '../role-permission/role-permission.seed';

/**
 * Default Platform Admin credentials
 * IMPORTANT: Change these credentials in production!
 */
export const DEFAULT_PLATFORM_ADMIN = {
	email: environment.platformAdmin?.email || process.env.PLATFORM_ADMIN_EMAIL || 'platform-admin@gauzy.co',
	password: environment.platformAdmin?.password || process.env.PLATFORM_ADMIN_PASSWORD || 'PlatformAdmin@123',
	firstName: 'Platform',
	lastName: 'Admin'
};

/**
 * Platform Admin Tenant and Organization names
 */
export const PLATFORM_ADMIN_TENANT_NAME = 'Platform Administration';
export const PLATFORM_ADMIN_ORG_NAME = 'Platform Admin Organization';

/**
 * Create default Platform Admin tenant, organization, and user
 * Platform Admin has its own dedicated tenant and organization
 */
export const createDefaultPlatformAdmin = async (
	dataSource: DataSource
): Promise<User | null> => {
	const userRepository = dataSource.getRepository(User);
	const roleRepository = dataSource.getRepository(Role);
	const tenantRepository = dataSource.getRepository(Tenant);
	const organizationRepository = dataSource.getRepository(Organization);
	const userOrganizationRepository = dataSource.getRepository(UserOrganization);
	const employeeRepository = dataSource.getRepository(Employee);

	try {
		// Check if platform admin already exists
		const existingPlatformAdmin = await userRepository.findOne({
			where: {
				email: DEFAULT_PLATFORM_ADMIN.email
			},
			relations: ['role', 'tenant']
		});

		if (existingPlatformAdmin) {
			console.log('Platform Admin already exists, skipping creation');
			return existingPlatformAdmin;
		}

		// 1. Create Platform Admin Tenant
		let platformTenant = await tenantRepository.findOne({
			where: {
				name: PLATFORM_ADMIN_TENANT_NAME
			}
		});

		if (!platformTenant) {
			platformTenant = tenantRepository.create({
				name: PLATFORM_ADMIN_TENANT_NAME,
				isActive: true
			});
			await tenantRepository.save(platformTenant);
			console.log('✅ Created Platform Admin Tenant');
		}

		// 2. Create PLATFORM_ADMIN role for this tenant
		let platformAdminRole = await roleRepository.findOne({
			where: {
				name: RolesEnum.PLATFORM_ADMIN,
				tenantId: platformTenant.id
			}
		});

		if (!platformAdminRole) {
			platformAdminRole = roleRepository.create({
				name: RolesEnum.PLATFORM_ADMIN,
				tenant: platformTenant,
				tenantId: platformTenant.id,
				isSystem: true
			});
			await roleRepository.save(platformAdminRole);
			console.log('✅ Created PLATFORM_ADMIN role');
		}

		// 3. Create Platform Admin Organization with full configuration
		let platformOrganization = await organizationRepository.findOne({
			where: {
				name: PLATFORM_ADMIN_ORG_NAME,
				tenantId: platformTenant.id
			}
		});

		if (!platformOrganization) {
			platformOrganization = new Organization();

			// Basic organization info
			platformOrganization.name = PLATFORM_ADMIN_ORG_NAME;
			platformOrganization.tenant = platformTenant;
			platformOrganization.tenantId = platformTenant.id;
			platformOrganization.isActive = true;
			platformOrganization.isDefault = true;
			platformOrganization.totalEmployees = 1;

			// Profile and branding
			platformOrganization.profile_link = 'platform-administration';
			platformOrganization.officialName = 'Platform Administration';
			platformOrganization.overview = 'Central platform administration and management';
			platformOrganization.short_description = 'Platform Admin Organization for managing all tenants';
			platformOrganization.client_focus = 'Platform Administration & Management';
			platformOrganization.banner = 'Platform Administration - Managing Excellence';
			platformOrganization.brandColor = '#3366FF';

			// Financial and business settings
			platformOrganization.currency = CurrenciesEnum.USD;
			platformOrganization.numberFormat = 'USD';
			platformOrganization.defaultValueDateType = DefaultValueDateTypeEnum.TODAY;
			platformOrganization.bonusType = BonusTypeEnum.PROFIT_BASED_BONUS;
			platformOrganization.bonusPercentage = 10;

			// Date and time settings
			platformOrganization.timeZone = 'America/New_York';
			platformOrganization.dateFormat = 'L';
			platformOrganization.startWeekOn = WeekDaysEnum.MONDAY;
			platformOrganization.fiscalStartDate = moment().startOf('year').toDate(); // January 1st
			platformOrganization.fiscalEndDate = moment().endOf('year').toDate(); // December 31st
			platformOrganization.valueDate = new Date();
			platformOrganization.futureDateAllowed = true;

			// Display settings
			platformOrganization.show_profits = false;
			platformOrganization.show_bonuses_paid = false;
			platformOrganization.show_income = false;
			platformOrganization.show_total_hours = false;
			platformOrganization.show_projects_count = true;
			platformOrganization.show_minimum_project_size = true;
			platformOrganization.show_clients_count = true;
			platformOrganization.show_clients = true;
			platformOrganization.show_employees_count = true;

			// Invitation and policy settings
			platformOrganization.invitesAllowed = true;
			platformOrganization.inviteExpiryPeriod = 30;

			// Registration and compliance
			platformOrganization.registrationDate = new Date();
			platformOrganization.separateInvoiceItemTaxAndDiscount = false;

			await organizationRepository.save(platformOrganization);
			console.log('✅ Created Platform Admin Organization with full configuration');
		}

		// 4. Hash password
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(DEFAULT_PLATFORM_ADMIN.password, saltRounds);

		// 5. Create platform admin user
		const platformAdmin = userRepository.create({
			email: DEFAULT_PLATFORM_ADMIN.email,
			firstName: DEFAULT_PLATFORM_ADMIN.firstName,
			lastName: DEFAULT_PLATFORM_ADMIN.lastName,
			hash: hashedPassword,
			role: platformAdminRole,
			roleId: platformAdminRole.id,
			tenant: platformTenant,
			tenantId: platformTenant.id,
			isActive: true,
			preferredLanguage: 'en'
		});

		await userRepository.save(platformAdmin);
		console.log('✅ Created Platform Admin User');

		// 6. Link user to organization
		const userOrganization = userOrganizationRepository.create({
			user: platformAdmin,
			userId: platformAdmin.id,
			organization: platformOrganization,
			organizationId: platformOrganization.id,
			tenant: platformTenant,
			tenantId: platformTenant.id,
			isActive: true,
			isDefault: true
		});

		await userOrganizationRepository.save(userOrganization);
		console.log('✅ Linked Platform Admin to Organization');

		// 7. Create employee record for Platform Admin
		const platformEmployee = new Employee();
		platformEmployee.user = platformAdmin;
		platformEmployee.userId = platformAdmin.id;
		platformEmployee.organization = platformOrganization;
		platformEmployee.organizationId = platformOrganization.id;
		platformEmployee.tenant = platformTenant;
		platformEmployee.tenantId = platformTenant.id;
		platformEmployee.isActive = true;
		platformEmployee.startedWorkOn = new Date();
		platformEmployee.employeeLevel = null;
		platformEmployee.anonymousBonus = false;
		platformEmployee.acceptDate = new Date();
		platformEmployee.billRateValue = 0;
		platformEmployee.billRateCurrency = CurrenciesEnum.USD;
		platformEmployee.payPeriod = PayPeriodEnum.MONTHLY;
		platformEmployee.minimumBillingRate = 0;

		await employeeRepository.save(platformEmployee);
		console.log('✅ Created Platform Admin Employee Record');

		// 8. Create role permissions for Platform Admin role
		await createRolePermissions(dataSource, [platformAdminRole], [platformTenant]);
		console.log('✅ Created Platform Admin Role Permissions');

		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('✅ Platform Admin Setup Complete!');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log(`📧 Email: ${DEFAULT_PLATFORM_ADMIN.email}`);
		console.log(`🔑 Password: ${DEFAULT_PLATFORM_ADMIN.password}`);
		console.log(`🏢 Tenant: ${PLATFORM_ADMIN_TENANT_NAME}`);
		console.log(`🏛️  Organization: ${PLATFORM_ADMIN_ORG_NAME}`);
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('⚠️  IMPORTANT: Change this password in production!');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

		return platformAdmin;
	} catch (error) {
		console.error('Error creating Platform Admin:', error);
		return null;
	}
};

/**
 * Get existing Platform Admin user
 */
export const getPlatformAdmin = async (
	dataSource: DataSource
): Promise<User | null> => {
	const userRepository = dataSource.getRepository(User);

	try {
		const platformAdmin = await userRepository.findOne({
			where: {
				email: DEFAULT_PLATFORM_ADMIN.email
			},
			relations: ['role', 'tenant']
		});

		return platformAdmin;
	} catch (error) {
		console.error('Error getting Platform Admin:', error);
		return null;
	}
};

/**
 * Get the unique Platform Admin tenant
 * There should only be ONE tenant that has PLATFORM_ADMIN role
 */
export const getPlatformAdminTenant = async (
	dataSource: DataSource
): Promise<Tenant | null> => {
	const tenantRepository = dataSource.getRepository(Tenant);
	const roleRepository = dataSource.getRepository(Role);

	try {
		// Find the tenant that has PLATFORM_ADMIN role
		const platformAdminRole = await roleRepository.findOne({
			where: {
				name: RolesEnum.PLATFORM_ADMIN
			},
			relations: ['tenant']
		});

		if (!platformAdminRole || !platformAdminRole.tenant) {
			return null;
		}

		return platformAdminRole.tenant;
	} catch (error) {
		console.error('Error getting Platform Admin tenant:', error);
		return null;
	}
};

/**
 * Get the unique Platform Admin organization
 * There should only be ONE organization that belongs to Platform Admin tenant
 */
export const getPlatformAdminOrganization = async (
	dataSource: DataSource
): Promise<Organization | null> => {
	const organizationRepository = dataSource.getRepository(Organization);

	try {
		// First get the Platform Admin tenant
		const platformTenant = await getPlatformAdminTenant(dataSource);

		if (!platformTenant) {
			return null;
		}

		// Find organization in Platform Admin tenant
		const platformOrganization = await organizationRepository.findOne({
			where: {
				tenantId: platformTenant.id
			},
			relations: ['tenant']
		});

		return platformOrganization;
	} catch (error) {
		console.error('Error getting Platform Admin organization:', error);
		return null;
	}
};

/**
 * Validate if a user can be assigned PLATFORM_ADMIN role
 * Rules:
 * 1. User must belong to the Platform Admin tenant
 * 2. User must belong to the Platform Admin organization
 * 3. Only ONE tenant and ONE organization can have PLATFORM_ADMIN role
 */
export const canAssignPlatformAdminRole = async (
	dataSource: DataSource,
	userId: string
): Promise<{ valid: boolean; reason?: string }> => {
	const userRepository = dataSource.getRepository(User);
	const userOrganizationRepository = dataSource.getRepository(UserOrganization);

	try {
		// Get the user
		const user = await userRepository.findOne({
			where: { id: userId },
			relations: ['tenant']
		});

		if (!user) {
			return { valid: false, reason: 'User not found' };
		}

		// Get the unique Platform Admin tenant
		const platformTenant = await getPlatformAdminTenant(dataSource);

		if (!platformTenant) {
			return { valid: false, reason: 'Platform Admin tenant not found' };
		}

		// Check if user belongs to Platform Admin tenant
		if (user.tenantId !== platformTenant.id) {
			return {
				valid: false,
				reason: `User must belong to Platform Admin tenant (${platformTenant.name})`
			};
		}

		// Get the unique Platform Admin organization
		const platformOrganization = await getPlatformAdminOrganization(dataSource);

		if (!platformOrganization) {
			return { valid: false, reason: 'Platform Admin organization not found' };
		}

		// Check if user belongs to Platform Admin organization
		const userOrg = await userOrganizationRepository.findOne({
			where: {
				userId: user.id,
				organizationId: platformOrganization.id
			}
		});

		if (!userOrg) {
			return {
				valid: false,
				reason: `User must belong to Platform Admin organization (${platformOrganization.name})`
			};
		}

		return { valid: true };
	} catch (error) {
		console.error('Error validating Platform Admin role assignment:', error);
		return { valid: false, reason: 'Validation error' };
	}
};

/**
 * Get all users with PLATFORM_ADMIN role
 */
export const getPlatformAdminUsers = async (
	dataSource: DataSource
): Promise<User[]> => {
	const userRepository = dataSource.getRepository(User);

	try {
		const platformAdmins = await userRepository.find({
			where: {
				role: {
					name: RolesEnum.PLATFORM_ADMIN
				}
			},
			relations: ['role', 'tenant']
		});

		return platformAdmins;
	} catch (error) {
		console.error('Error getting Platform Admin users:', error);
		return [];
	}
};
