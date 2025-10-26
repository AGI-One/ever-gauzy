import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, IsNull } from 'typeorm';
import { RolesEnum, IPlatformAdminDashboardStats, ITenantWithStats, IPlatformTenantQuery } from '@gauzy/contracts';
import { Tenant, User, Organization, Role } from '../core/entities/internal';
import { RequestContext } from '../core/context';
import { CreateTenantDTO, UpdateTenantDTO } from './dto';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';

@Injectable()
export class PlatformAdminService {
    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,

        private readonly userService: UserService,
        private readonly roleService: RoleService
    ) { }

    /**
     * Get dashboard statistics for Platform Admin
     */
    async getDashboardStats(): Promise<IPlatformAdminDashboardStats> {
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const [
            totalTenants,
            activeTenants,
            expiredTenants,
            expiringSoon,
            totalUsers,
            totalOrganizations
        ] = await Promise.all([
            this.tenantRepository.count(),
            this.tenantRepository.count({
                where: { isActive: true }
            }),
            this.tenantRepository.count({
                where: {
                    expiresAt: LessThan(now),
                    isActive: true
                }
            }),
            this.tenantRepository.count({
                where: {
                    expiresAt: Between(now, sevenDaysFromNow),
                    isActive: true
                }
            }),
            this.userRepository.count(),
            this.organizationRepository.count()
        ]);

        return {
            totalTenants,
            activeTenants,
            expiredTenants,
            expiringSoon,
            totalUsers,
            totalOrganizations
        };
    }

    /**
     * Get list of tenants with optional filtering
     */
    async getTenants(query: IPlatformTenantQuery): Promise<{ items: ITenantWithStats[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            status = 'all',
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = query;

        const skip = (page - 1) * limit;
        const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

        // Search filter
        if (search) {
            queryBuilder.andWhere('tenant.name ILIKE :search', { search: `%${search}%` });
        }

        // Status filter
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        switch (status) {
            case 'active':
                queryBuilder.andWhere('tenant.isActive = :isActive', { isActive: true });
                queryBuilder.andWhere('(tenant.expiresAt IS NULL OR tenant.expiresAt > :now)', { now });
                break;
            case 'expired':
                queryBuilder.andWhere('tenant.expiresAt < :now', { now });
                break;
            case 'expiring-soon':
                queryBuilder.andWhere('tenant.expiresAt BETWEEN :now AND :sevenDays', {
                    now,
                    sevenDays: sevenDaysFromNow
                });
                queryBuilder.andWhere('tenant.isActive = :isActive', { isActive: true });
                break;
        }

        // Sorting
        queryBuilder.orderBy(`tenant.${sortBy}`, sortOrder);

        // Pagination
        queryBuilder.skip(skip).take(limit);

        // Load relations
        queryBuilder.leftJoinAndSelect('tenant.createdBy', 'createdBy');

        const [items, total] = await queryBuilder.getManyAndCount();

        // Enrich with stats
        const enrichedItems = await Promise.all(
            items.map(async (tenant) => {
                const userCount = await this.userRepository.count({
                    where: { tenantId: tenant.id }
                });

                const organizationCount = await this.organizationRepository.count({
                    where: { tenantId: tenant.id }
                });

                let daysUntilExpiration: number | undefined;
                if (tenant.expiresAt) {
                    const diffTime = tenant.expiresAt.getTime() - now.getTime();
                    daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                return {
                    ...tenant,
                    stats: {
                        userCount,
                        organizationCount
                    },
                    daysUntilExpiration
                };
            })
        );

        return { items: enrichedItems, total };
    }

    /**
     * Get single tenant with details
     */
    async getTenantById(id: string): Promise<ITenantWithStats> {
        const tenant = await this.tenantRepository.findOne({
            where: { id },
            relations: ['createdBy']
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        // Get stats
        const [userCount, organizationCount] = await Promise.all([
            this.userRepository.count({ where: { tenantId: id } }),
            this.organizationRepository.count({ where: { tenantId: id } })
        ]);

        // Get super admins
        const superAdmins = await this.userRepository.find({
            where: {
                tenantId: id,
                role: { name: RolesEnum.SUPER_ADMIN }
            },
            relations: ['role'],
            select: ['id', 'email', 'firstName', 'lastName', 'isActive']
        });

        let daysUntilExpiration: number | undefined;
        if (tenant.expiresAt) {
            const now = new Date();
            const diffTime = tenant.expiresAt.getTime() - now.getTime();
            daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
            ...tenant,
            stats: {
                userCount,
                organizationCount
            },
            superAdmins,
            daysUntilExpiration
        };
    }

    /**
     * Create a new tenant with super admin user
     */
    async createTenant(input: CreateTenantDTO): Promise<ITenantWithStats> {
        const currentUser = RequestContext.currentUser();

        // Check if email already exists
        const existingUser = await this.userRepository.findOne({
            where: { email: input.superAdmin.email }
        });

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        // Create tenant
        const tenant = this.tenantRepository.create({
            name: input.name,
            logo: input.logo,
            expiresAt: input.expiresAt,
            createdById: currentUser.id
        });

        const savedTenant = await this.tenantRepository.save(tenant);

        // Get or create SUPER_ADMIN role for this tenant
        const superAdminRole = await this.roleService.findOneByWhereOptions({
            name: RolesEnum.SUPER_ADMIN,
            tenantId: savedTenant.id
        });

        // Create super admin user
        const superAdmin = await this.userService.create({
            email: input.superAdmin.email,
            firstName: input.superAdmin.firstName,
            lastName: input.superAdmin.lastName,
            hash: input.superAdmin.password, // Will be hashed by UserService
            tenantId: savedTenant.id,
            roleId: superAdminRole.id
        });

        return this.getTenantById(savedTenant.id);
    }

    /**
     * Update tenant
     */
    async updateTenant(id: string, input: UpdateTenantDTO): Promise<ITenantWithStats> {
        const tenant = await this.tenantRepository.findOne({ where: { id } });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        // Update fields
        if (input.name) tenant.name = input.name;
        if (input.logo !== undefined) tenant.logo = input.logo;
        if (input.expiresAt !== undefined) tenant.expiresAt = input.expiresAt;
        if (input.isActive !== undefined) tenant.isActive = input.isActive;

        await this.tenantRepository.save(tenant);

        return this.getTenantById(id);
    }

    /**
     * Delete tenant (soft delete by setting isActive = false)
     */
    async deleteTenant(id: string): Promise<void> {
        const tenant = await this.tenantRepository.findOne({ where: { id } });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        tenant.isActive = false;
        await this.tenantRepository.save(tenant);
    }

    /**
     * Get tenants expiring soon (within 7 days)
     */
    async getExpiringSoonTenants(): Promise<ITenantWithStats[]> {
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const tenants = await this.tenantRepository.find({
            where: {
                expiresAt: Between(now, sevenDaysFromNow),
                isActive: true
            },
            relations: ['createdBy'],
            order: { expiresAt: 'ASC' }
        });

        return Promise.all(
            tenants.map(async (tenant) => {
                const userCount = await this.userRepository.count({
                    where: { tenantId: tenant.id }
                });

                const organizationCount = await this.organizationRepository.count({
                    where: { tenantId: tenant.id }
                });

                const diffTime = tenant.expiresAt!.getTime() - now.getTime();
                const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    ...tenant,
                    stats: {
                        userCount,
                        organizationCount
                    },
                    daysUntilExpiration
                };
            })
        );
    }
}
