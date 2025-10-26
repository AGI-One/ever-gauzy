import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesEnum } from '@gauzy/contracts';
import { RequestContext } from '../../core/context';

/**
 * Platform Admin Guard
 *
 * Restricts access to routes that require Platform Admin role.
 * Platform Admins have their own dedicated tenant and can manage all other tenants.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Get the current user from RequestContext
        const currentUser = RequestContext.currentUser();

        // Check if user is authenticated
        if (!currentUser) {
            throw new UnauthorizedException('User not authenticated');
        }

        // Check if user has PLATFORM_ADMIN role
        const hasPlatformAdminRole = currentUser.role?.name === RolesEnum.PLATFORM_ADMIN;

        if (!hasPlatformAdminRole) {
            throw new ForbiddenException('Access restricted to Platform Administrators only');
        }

        // Platform Admin must have a tenant (their dedicated Platform Admin tenant)
        if (!currentUser.tenantId) {
            throw new ForbiddenException('Platform Administrator must belong to Platform Admin tenant');
        }

        return true;
    }
}
