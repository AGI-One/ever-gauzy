import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContext } from '../../core/context';
import { Tenant } from '../../tenant/tenant.entity';
import { RolesEnum } from '@gauzy/contracts';

/**
 * Guard to check if tenant subscription has expired
 * Compares expiresAt date with current date
 * This guard should be applied to auth routes (login, refresh token, etc.)
 */
@Injectable()
export class TenantExpirationGuard implements CanActivate {
	constructor(
		@InjectRepository(Tenant)
		private readonly tenantRepository: Repository<Tenant>,
		private readonly reflector: Reflector
	) { }

	/**
	 * Determines if the request can proceed based on tenant expiration
	 *
	 * @param context - The execution context of the request
	 * @returns A boolean indicating if access is allowed
	 * @throws ForbiddenException if tenant is expired
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		console.log('TenantExpirationGuard canActivate called');

		// Get current user and tenant from context
		const currentUser = RequestContext.currentUser();
		const tenantId = RequestContext.currentTenantId();

		// Allow public routes (no tenant context needed)
		// NOTE: This guard runs AFTER authentication, so it won't work for login routes
		// For login routes, tenant expiration must be checked in the service layer
		if (!tenantId) {
			console.log('⚠️ TenantExpirationGuard: No tenantId in context - allowing request (public route or pre-authentication)');
			return true;
		}

		// Platform admins bypass tenant expiration checks
		if (currentUser && currentUser.role?.name === RolesEnum.SUPER_ADMIN) {
			console.log('🚀 Platform Admin detected - bypassing tenant expiration check');
			return true;
		}

		try {
			// Fetch tenant from database to check expiration
			const tenant = await this.tenantRepository.findOne({
				where: { id: tenantId },
				select: ['id', 'expiresAt', 'name']
			});

			if (!tenant) {
				throw new ForbiddenException('Tenant not found');
			}

			// Check if tenant has expiration date and if it's expired
			if (tenant.expiresAt) {
				const now = new Date();
				const isExpired = tenant.expiresAt < now;

				if (isExpired) {
					console.log(`❌ Tenant ${tenantId} subscription has expired at ${tenant.expiresAt}`);
					throw new ForbiddenException(
						'Your organization subscription has expired. Please renew your subscription to continue.'
					);
				}
			}

			console.log(`✅ Tenant ${tenantId} is valid`);
			return true;
		} catch (error) {
			if (error instanceof ForbiddenException) {
				throw error;
			}

			console.error('TenantExpirationGuard: Error checking tenant expiration:', error);
			// In case of error, allow request to proceed to avoid blocking legitimate users
			// You can change this to throw ForbiddenException if you want strict checking
			return true;
		}
	}
}
