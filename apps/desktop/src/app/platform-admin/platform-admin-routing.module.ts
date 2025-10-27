import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlatformAdminComponent } from './platform-admin.component';
import { PlatformAdminGuard } from './platform-admin.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TenantsComponent } from './tenants/tenants.component';
import { CreateTenantComponent } from './tenants/create-tenant/create-tenant.component';
import { EditTenantComponent } from './tenants/edit-tenant/edit-tenant.component';
import { TenantDetailsComponent } from './tenants/tenant-details/tenant-details.component';

const routes: Routes = [
    {
        path: '',
        component: PlatformAdminComponent,
        canActivate: [PlatformAdminGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: {
                    selectors: false // Disable header selectors for Platform Admin
                }
            },
            {
                path: 'tenants',
                children: [
                    {
                        path: '',
                        component: TenantsComponent,
                        data: {
                            selectors: false
                        }
                    },
                    {
                        path: 'create',
                        component: CreateTenantComponent,
                        data: {
                            selectors: false
                        }
                    },
                    {
                        path: 'edit/:id',
                        component: EditTenantComponent,
                        data: {
                            selectors: false
                        }
                    },
                    {
                        path: ':id',
                        component: TenantDetailsComponent,
                        data: {
                            selectors: false
                        }
                    }
                ]
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PlatformAdminRoutingModule { }
