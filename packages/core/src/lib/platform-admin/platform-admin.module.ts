import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { Tenant, User, Organization, Role } from '../core/entities/internal';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Tenant, User, Organization, Role]),
		CqrsModule,
		UserModule,
		RoleModule
	],
	controllers: [PlatformAdminController],
	providers: [PlatformAdminService],
	exports: [PlatformAdminService]
})
export class PlatformAdminModule { }
