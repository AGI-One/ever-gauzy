import { DataSource } from 'typeorm';
import { RolesEnum } from '@gauzy/contracts';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { DEFAULT_EVER_TENANT } from '../tenant/default-tenants';

/**
 * Validate if a user can be assigned PLATFORM_ADMIN role
 *
 * Rules:
 * 1. User must belong to 'Ever' tenant
 * 2. User must not already have PLATFORM_ADMIN role (unless updating same user)
 * 3. PLATFORM_ADMIN role only exists in 'Ever' tenant
 *
 * @param dataSource - TypeORM DataSource
 * @param userId - User ID being assigned the role
 * @returns Validation result with valid flag and optional reason
 */
export const canAssignPlatformAdminRole = async (
    dataSource: DataSource,
    userId: string
): Promise<{ valid: boolean; reason?: string }> => {
    try {
        // Find the user with their tenant and role
        const user = await dataSource.manager.findOne(User, {
            where: { id: userId },
            relations: ['tenant', 'role']
        });

        if (!user) {
            return {
                valid: false,
                reason: 'User not found'
            };
        }

        // Check if user belongs to 'Ever' tenant
        if (user.tenant.name !== DEFAULT_EVER_TENANT) {
            return {
                valid: false,
                reason: `Platform Admin role can only be assigned to users in '${DEFAULT_EVER_TENANT}' tenant`
            };
        }

        // Check if PLATFORM_ADMIN role exists in this tenant
        const platformAdminRole = await dataSource.manager.findOne(Role, {
            where: {
                tenantId: user.tenantId,
                name: RolesEnum.PLATFORM_ADMIN
            }
        });

        if (!platformAdminRole) {
            return {
                valid: false,
                reason: `Platform Admin role does not exist in this tenant`
            };
        }

        // If user already has PLATFORM_ADMIN role, allow update (no-op)
        if (user.role?.name === RolesEnum.PLATFORM_ADMIN) {
            return { valid: true };
        }

        // All validation passed
        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            reason: error.message || 'Validation error'
        };
    }
};
