import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";
import { IRoleCreateInput } from "@gauzy/contracts";
import { IsRoleAlreadyExist } from "./../../shared/validators";
import { TenantBaseDTO } from "./../../core/dto";

/**
 * Create Role DTO validation
 */
export class CreateRoleDTO extends TenantBaseDTO implements IRoleCreateInput {

    @ApiProperty({ type: () => String })
    @IsNotEmpty()
    @IsRoleAlreadyExist()
    @Transform(({ value }) => {
        // Tự động uppercase và replace spaces với underscores
        if (typeof value === 'string') {
            return value.trim().toUpperCase().replace(/\s+/g, '_');
        }
        return value;
    })
    readonly name: string;
}
