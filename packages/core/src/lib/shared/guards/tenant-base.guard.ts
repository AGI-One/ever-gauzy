import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { isJSON } from 'class-validator';
import { RequestMethodEnum, RolesEnum } from '@gauzy/contracts';
import { getRepository } from 'typeorm';
import { RequestContext } from './../../core/context';
import { Tenant } from './../../tenant/tenant.entity';

@Injectable()
export class TenantBaseGuard implements CanActivate {
	/**
	 *
	 * @param context
	 * @returns
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		console.log('TenantBaseGuard canActivate called');

		// 🌟 PLATFORM ADMIN BYPASS: Platform Admin has access to everything
		const currentUser = RequestContext.currentUser();
		if (currentUser && currentUser.role?.name === RolesEnum.SUPER_ADMIN) {
			console.log('🚀 Platform Admin detected - bypassing tenant base checks');
			return true;
		}

		const currentTenantId = RequestContext.currentTenantId();
		const request: any = context.switchToHttp().getRequest();
		const method: RequestMethodEnum = request.method;
		const { query, headers, rawHeaders } = request;

		let isAuthorized = false;

		if (!currentTenantId) {
			console.log('Guard TenantBase: Unauthorized access blocked. TenantId:', currentTenantId);
			return isAuthorized;
		}

		// ✅ CHECK TENANT EXPIRATION
		try {
			const tenantRepository = getRepository(Tenant);
			const tenant = await tenantRepository.findOne({
				where: { id: currentTenantId },
				select: ['id', 'expiresAt', 'name']
			});

			if (!tenant) {
				console.log('❌ Guard TenantBase: Tenant not found:', currentTenantId);
				throw new ForbiddenException('Tenant not found');
			}

			// Check if tenant has expiration date and if it's expired
			if (tenant.expiresAt) {
				const now = new Date();
				const isExpired = tenant.expiresAt < now;

				if (isExpired) {
					console.log(`❌ Guard TenantBase: Tenant ${currentTenantId} subscription has expired at ${tenant.expiresAt}`);
					throw new ForbiddenException(
						'Your organization subscription has expired. Please renew your subscription to continue.'
					);
				}
			}
		} catch (error) {
			if (error instanceof ForbiddenException) {
				throw error;
			}
			console.error('Guard TenantBase: Error checking tenant expiration:', error);
			// Don't block on DB errors
		}

		// Get tenant-id from request headers
		const headerTenantId = headers['tenant-id'];

		if (headerTenantId && (rawHeaders.includes('tenant-id') || rawHeaders.includes('Tenant-Id'))) {
			isAuthorized = currentTenantId === headerTenantId;
		} else {
			//If request to get/delete data using another tenantId then reject request.
			const httpMethods = [RequestMethodEnum.GET, RequestMethodEnum.DELETE];
			if (httpMethods.includes(method)) {
				if ('tenantId' in query) {
					const queryTenantId = query['tenantId'];
					isAuthorized = currentTenantId === queryTenantId;
				} else if (query.hasOwnProperty('data')) {
					const data: any = query.data;
					const isJson = isJSON(data);
					if (isJson) {
						try {
							const parse = JSON.parse(data);
							//Match provided tenantId with logged in tenantId
							if ('findInput' in parse && 'tenantId' in parse['findInput']) {
								const queryTenantId = parse['findInput']['tenantId'];
								isAuthorized = currentTenantId === queryTenantId;
							} else {
								//If tenantId not found in query params
								return false;
							}
						} catch (e) {
							console.log('Json Parser Error:', e);
							return isAuthorized;
						}
					}
				} else {
					// If tenantId not found in query params
					isAuthorized = false;
				}
			}

			// If request to save/update data using another tenantId then reject request.
			const payloadMethods = [RequestMethodEnum.POST, RequestMethodEnum.PUT, RequestMethodEnum.PATCH];

			if (payloadMethods.includes(method)) {
				const body: any = request.body;
				let bodyTenantId: string;
				if ('tenantId' in body) {
					bodyTenantId = body['tenantId'];
				} else if ('tenant' in body) {
					bodyTenantId = body['tenant']['id'];
				}
				isAuthorized = currentTenantId === bodyTenantId;
			}
		}

		if (!isAuthorized) {
			console.log('Guard TenantBase: Unauthorized access blocked. TenantId:', headerTenantId);
		} else {
			console.log('Guard TenantBase: Access Allowed. TenantId:', headerTenantId);
		}
		return isAuthorized;
	}
}
