import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IPlatformTenantUpdateInput } from '@gauzy/contracts';

/**
 * DTO for updating a tenant from Platform Admin
 */
export class UpdateTenantDTO implements IPlatformTenantUpdateInput {
	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsString()
	readonly name?: string;

	@ApiPropertyOptional({ type: () => String })
	@IsOptional()
	@IsString()
	readonly logo?: string;

	@ApiPropertyOptional({ type: () => Date })
	@IsOptional()
	readonly expiresAt?: Date;

	@ApiPropertyOptional({ type: () => Boolean })
	@IsOptional()
	@IsBoolean()
	readonly isActive?: boolean;
}
