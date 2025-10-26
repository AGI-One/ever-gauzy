import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IPlatformTenantCreateInput } from '@gauzy/contracts';

/**
 * DTO for Super Admin user details
 */
export class SuperAdminDTO {
    @ApiProperty({ type: () => String })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ type: () => String })
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({ type: () => String })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({ type: () => String })
    @IsOptional()
    @IsString()
    lastName?: string;
}

/**
 * DTO for creating a tenant from Platform Admin
 */
export class CreateTenantDTO implements IPlatformTenantCreateInput {
    @ApiProperty({ type: () => String })
    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @ApiPropertyOptional({ type: () => String })
    @IsOptional()
    @IsString()
    readonly logo?: string;

    @ApiPropertyOptional({ type: () => Date })
    @IsOptional()
    readonly expiresAt?: Date;

    @ApiProperty({
        type: () => SuperAdminDTO,
        description: 'Super Admin user details'
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => SuperAdminDTO)
    readonly superAdmin: SuperAdminDTO;
}
