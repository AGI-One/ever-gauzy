import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeModule } from '@gauzy/ui-core/theme';
import { CommonNavModule } from '@gauzy/ui-core/core';
import {
    NbButtonModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbSelectModule,
    NbSpinnerModule,
    NbBadgeModule,
    NbTooltipModule,
    NbDialogModule,
    NbCheckboxModule,
    NbDatepickerModule,
    NbLayoutModule
} from '@nebular/theme';
import { SharedModule } from '@gauzy/ui-core/shared';

import { PlatformAdminRoutingModule } from './platform-admin-routing.module';
import { PlatformAdminComponent } from './platform-admin.component';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminGuard } from './platform-admin.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TenantsComponent } from './tenants/tenants.component';
import { CreateTenantComponent } from './tenants/create-tenant/create-tenant.component';
import { EditTenantComponent } from './tenants/edit-tenant/edit-tenant.component';
import { TenantDetailsComponent } from './tenants/tenant-details/tenant-details.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PlatformAdminRoutingModule,
        ThemeModule,
        CommonNavModule,
        NbLayoutModule,
        NbButtonModule,
        NbCardModule,
        NbIconModule,
        NbInputModule,
        NbSelectModule,
        NbSpinnerModule,
        NbBadgeModule,
        NbTooltipModule,
        NbDialogModule.forChild(),
        NbCheckboxModule,
        NbDatepickerModule,
        TranslateModule.forChild(),
        SharedModule
    ],
    declarations: [
        PlatformAdminComponent,
        DashboardComponent,
        TenantsComponent,
        CreateTenantComponent,
        EditTenantComponent,
        TenantDetailsComponent
    ],
    providers: [PlatformAdminService, PlatformAdminGuard]
})
export class PlatformAdminModule { }
