import { 
	Controller, 
	Get, 
	Post, 
	Put, 
	Delete, 
	Body, 
	Param, 
	Query,
	HttpCode,
	HttpStatus,
	UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { 
	IPlatformAdminDashboardStats, 
	ITenantWithStats,
	IPlatformTenantQuery
} from '@gauzy/contracts';
import { PlatformAdminService } from './platform-admin.service';
import { CreateTenantDTO, UpdateTenantDTO } from './dto';
import { PlatformAdminGuard } from '../shared/guards';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('PlatformAdmin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PlatformAdminGuard)
@Controller('platform-admin')
export class PlatformAdminController {
	constructor(private readonly platformAdminService: PlatformAdminService) {}

	/**
	 * Get dashboard statistics
	 */
	@ApiOperation({ summary: 'Get platform admin dashboard statistics' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Dashboard statistics retrieved successfully'
	})
	@Get('dashboard/stats')
	async getDashboardStats(): Promise<IPlatformAdminDashboardStats> {
		return this.platformAdminService.getDashboardStats();
	}

	/**
	 * Get all tenants with filtering
	 */
	@ApiOperation({ summary: 'Get all tenants' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Tenants retrieved successfully'
	})
	@Get('tenants')
	async getTenants(@Query() query: IPlatformTenantQuery): Promise<{ items: ITenantWithStats[]; total: number }> {
		return this.platformAdminService.getTenants(query);
	}

	/**
	 * Get tenants expiring soon
	 */
	@ApiOperation({ summary: 'Get tenants expiring within 7 days' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Expiring tenants retrieved successfully'
	})
	@Get('tenants/expiring-soon')
	async getExpiringSoonTenants(): Promise<ITenantWithStats[]> {
		return this.platformAdminService.getExpiringSoonTenants();
	}

	/**
	 * Get single tenant by ID
	 */
	@ApiOperation({ summary: 'Get tenant by ID' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Tenant retrieved successfully'
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Tenant not found'
	})
	@Get('tenants/:id')
	async getTenantById(@Param('id') id: string): Promise<ITenantWithStats> {
		return this.platformAdminService.getTenantById(id);
	}

	/**
	 * Create a new tenant with super admin
	 */
	@ApiOperation({ summary: 'Create new tenant with super admin user' })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Tenant created successfully'
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Invalid input or email already exists'
	})
	@Post('tenants')
	async createTenant(@Body() input: CreateTenantDTO): Promise<ITenantWithStats> {
		return this.platformAdminService.createTenant(input);
	}

	/**
	 * Update tenant
	 */
	@ApiOperation({ summary: 'Update tenant' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Tenant updated successfully'
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Tenant not found'
	})
	@Put('tenants/:id')
	async updateTenant(
		@Param('id') id: string,
		@Body() input: UpdateTenantDTO
	): Promise<ITenantWithStats> {
		return this.platformAdminService.updateTenant(id, input);
	}

	/**
	 * Delete tenant (soft delete)
	 */
	@ApiOperation({ summary: 'Delete tenant (soft delete)' })
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: 'Tenant deleted successfully'
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Tenant not found'
	})
	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete('tenants/:id')
	async deleteTenant(@Param('id') id: string): Promise<void> {
		return this.platformAdminService.deleteTenant(id);
	}
}
