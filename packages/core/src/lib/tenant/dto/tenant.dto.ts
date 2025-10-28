import { IImageAsset, ITenant } from "@gauzy/contracts";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDate } from "class-validator";
import { Type } from "class-transformer";

export class TenantDTO implements ITenant {

    @ApiProperty({ type: () => String, required: true })
    @IsNotEmpty()
    readonly name: string;

    @ApiPropertyOptional({ type: () => String })
    @IsOptional()
    @IsString()
    readonly logo: string;

    @ApiPropertyOptional({ type: () => Date })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    readonly expiresAt: Date;

    @ApiPropertyOptional({ type: () => String })
    @IsOptional()
    @IsUUID()
    readonly imageId: IImageAsset['id'];
}
