import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteResult, In, Not } from 'typeorm';
import { IRole, ITenant, RolesEnum, IRoleMigrateInput, IImportRecord, SYSTEM_DEFAULT_ROLES } from '@gauzy/contracts';
import { TenantAwareCrudService } from './../core/crud';
import { Role } from './role.entity';
import { RequestContext } from './../core/context';
import { ImportRecordUpdateOrCreateCommand } from './../export-import/import-record';
import { MikroOrmRoleRepository } from './repository/mikro-orm-role.repository';
import { TypeOrmRoleRepository } from './repository/type-orm-role.repository';

@Injectable()
export class RoleService extends TenantAwareCrudService<Role> {
	constructor(
		readonly typeOrmRoleRepository: TypeOrmRoleRepository,
		readonly mikroOrmRoleRepository: MikroOrmRoleRepository,
		private readonly _commandBus: CommandBus
	) {
		super(typeOrmRoleRepository, mikroOrmRoleRepository);
	}

	/**
	 * Normalize role name: uppercase and replace spaces with underscores
	 * @param name - Role name to normalize
	 * @returns Normalized role name
	 */
	private normalizeRoleName(name: string): string {
		if (!name || typeof name !== 'string') {
			return name;
		}
		return name.trim().toUpperCase().replace(/\s+/g, '_');
	}

	/**
	 * Override create to normalize role name
	 */
	async create(entity: Partial<Role>): Promise<IRole> {
		if (entity.name) {
			entity.name = this.normalizeRoleName(entity.name);
		}
		return await super.create(entity);
	}

	/**
	 * Override update to normalize role name
	 */
	async update(id: string | number | Partial<Role>, entity: Partial<Role>): Promise<IRole> {
		if (entity.name) {
			entity.name = this.normalizeRoleName(entity.name);
		}
		return await super.update(id, entity);
	}

	/**
	 * Creates multiple roles for each tenant and saves them.
	 * @param tenants - An array of tenants for which roles will be created.
	 * @returns A promise that resolves to an array of created roles.
	 */
	async createBulk(tenants: ITenant[]): Promise<IRole[] & Role[]> {
		const roles: IRole[] = [];
		const rolesNames = Object.values(RolesEnum);

		// Check if PLATFORM_ADMIN role already exists in database
		const existingPlatformAdminRole = await this.typeOrmRepository.findOne({
			where: { name: RolesEnum.PLATFORM_ADMIN }
		});

		for await (const tenant of tenants) {
			for await (const name of rolesNames) {
				// Handle PLATFORM_ADMIN role creation logic
				if (name === RolesEnum.PLATFORM_ADMIN) {
					// If PLATFORM_ADMIN role doesn't exist yet, allow creation for this tenant
					if (!existingPlatformAdminRole) {
						const role = new Role();
						role.name = name;
						role.tenant = tenant;
						role.isSystem = SYSTEM_DEFAULT_ROLES.includes(name);
						roles.push(role);
					}
					// If PLATFORM_ADMIN role exists and belongs to this tenant, allow creation
					else if (existingPlatformAdminRole.tenantId === tenant.id) {
						const role = new Role();
						role.name = name;
						role.tenant = tenant;
						role.isSystem = SYSTEM_DEFAULT_ROLES.includes(name);
						roles.push(role);
					}
					// Otherwise, skip creation (PLATFORM_ADMIN already exists for different tenant)
					continue;
				}

				const role = new Role();
				role.name = name;
				role.tenant = tenant;
				role.isSystem = SYSTEM_DEFAULT_ROLES.includes(name);
				roles.push(role);
			}
		}
		return await this.typeOrmRepository.save(roles);
	}

	/**
	 * Find roles by tenant ID without TenantAwareCrudService filtering.
	 * This is used when Platform Admin creates a new tenant - we need to find roles
	 * for the newly created tenant, not the current user's tenant.
	 *
	 * @param tenantId - The tenant ID to find roles for
	 * @returns A promise that resolves to an array of roles
	 */
	async findRolesByTenantId(tenantId: string): Promise<IRole[]> {
		return await this.typeOrmRepository.find({
			where: {
				tenantId
			}
		});
	}

	async migrateRoles(): Promise<IRoleMigrateInput[]> {
		const roles: IRole[] = await this.typeOrmRepository.find({
			where: {
				tenantId: RequestContext.currentTenantId()
			}
		});
		const payload: IRoleMigrateInput[] = [];
		for await (const item of roles) {
			const { id: sourceId, name } = item;
			payload.push({
				name,
				isImporting: true,
				sourceId
			});
		}
		return payload;
	}

	async migrateImportRecord(roles: IRoleMigrateInput[]) {
		let records: IImportRecord[] = [];
		for await (const item of roles) {
			const { isImporting, sourceId, name } = item;
			if (isImporting && sourceId) {
				const destination = await this.typeOrmRepository.findOne({
					where: {
						tenantId: RequestContext.currentTenantId(),
						name
					},
					order: {
						createdAt: 'DESC'
					}
				});
				if (destination) {
					records.push(
						await this._commandBus.execute(
							new ImportRecordUpdateOrCreateCommand({
								entityType: this.typeOrmRepository.metadata.tableName,
								sourceId,
								destinationId: destination.id,
								tenantId: RequestContext.currentTenantId()
							})
						)
					);
				}
			}
		}
		return records;
	}

	/**
	 * Few Roles can't be removed/delete for tenant
	 * RolesEnum.SUPER_ADMIN, RolesEnum.ADMIN, RolesEnum.EMPLOYEE, RolesEnum.VIEWER, RolesEnum.CANDIDATE
	 *
	 * @param id
	 * @returns
	 */
	async delete(id: IRole['id']): Promise<DeleteResult> {
		return await super.delete({
			id,
			isSystem: false,
			name: Not(In(SYSTEM_DEFAULT_ROLES))
		});
	}
}
