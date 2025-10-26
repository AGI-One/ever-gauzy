import { IBaseEntityModel, ID } from './base-entity.model';
import { ITenant } from './tenant.model';
import { IUser } from './user.model';

/**
 * Platform Admin Dashboard Statistics
 */
export interface IPlatformAdminDashboardStats {
    totalTenants: number;
    activeTenants: number;
    expiredTenants: number;
    expiringSoon: number; // Expiring within 7 days
    totalUsers: number;
    totalOrganizations: number;
    storageUsed?: number;
}

// Alias for backward compatibility
export type ICreateTenantInput = IPlatformTenantCreateInput;
export type IUpdateTenantInput = IPlatformTenantUpdateInput;

/**
 * Tenant creation input for Platform Admin
 */
export interface IPlatformTenantCreateInput {
    // Tenant info
    name: string;
    logo?: string;
    expiresAt?: Date;

    // Super Admin info
    superAdmin: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
    };
}

/**
 * Tenant update input for Platform Admin
 */
export interface IPlatformTenantUpdateInput {
    name?: string;
    logo?: string;
    expiresAt?: Date;
    isActive?: boolean;
}

/**
 * Tenant with statistics
 */
export interface ITenantWithStats extends ITenant {
    stats?: {
        userCount: number;
        organizationCount: number;
        projectCount?: number;
        storageUsed?: number;
    };
    superAdmins?: IUser[];
    lastActivityAt?: Date;
    daysUntilExpiration?: number;
}

/**
 * Tenant list query parameters
 */
export interface IPlatformTenantQuery {
    page?: number;
    limit?: number;
    status?: 'all' | 'active' | 'expired' | 'expiring-soon';
    search?: string;
    sortBy?: 'name' | 'createdAt' | 'expiresAt';
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * Tenant activity log
 */
export interface ITenantActivityLog extends IBaseEntityModel {
    tenantId: ID;
    tenant?: ITenant;
    userId?: ID;
    user?: IUser;
    action: string;
    description?: string;
    metadata?: any;
    ipAddress?: string;
}

/**
 * Platform Admin authentication response
 */
export interface IPlatformAdminAuthResponse {
    user: IUser;
    token: string;
    refresh_token?: string;
    expiresIn?: number;
}

/**
 * Expiring tenants response
 */
export interface IExpiringTenant {
    id: ID;
    name: string;
    expiresAt: Date;
    daysLeft: number;
    isActive: boolean;
}
