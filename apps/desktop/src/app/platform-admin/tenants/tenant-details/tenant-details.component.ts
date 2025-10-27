import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ITenantWithStats } from '@gauzy/contracts';
import { PlatformAdminService } from '../../platform-admin.service';
import { ToastrService } from '@gauzy/ui-core/core';

@UntilDestroy({ checkProperties: true })
@Component({
    selector: 'ga-tenant-details',
    templateUrl: './tenant-details.component.html',
    styleUrls: ['./tenant-details.component.scss'],
    standalone: false
})
export class TenantDetailsComponent implements OnInit, OnDestroy {
    public tenant: ITenantWithStats;
    public loading: boolean = false;
    public tenantId: string;

    constructor(
        private readonly platformAdminService: PlatformAdminService,
        private readonly toastrService: ToastrService,
        private readonly route: ActivatedRoute,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
            this.tenantId = params['id'];
            if (this.tenantId) {
                this.loadTenant();
            }
        });
    }

    /**
     * Load tenant details
     */
    private loadTenant(): void {
        this.loading = true;
        this.platformAdminService
            .getTenant(this.tenantId)
            .pipe(untilDestroyed(this))
            .subscribe({
                next: (tenant) => {
                    this.tenant = tenant;
                    this.loading = false;
                },
                error: (error) => {
                    this.toastrService.danger(error?.message || 'Failed to load tenant details', 'Error');
                    this.loading = false;
                    this.goBack();
                }
            });
    }

    /**
     * Navigate to edit page
     */
    edit(): void {
        this.router.navigate(['/platform-admin/tenants/edit', this.tenantId]);
    }

    /**
     * Go back to tenants list
     */
    goBack(): void {
        this.router.navigate(['/platform-admin/tenants']);
    }

    /**
     * Get status badge class
     */
    getStatusBadge(): string {
        if (!this.tenant?.isActive) {
            return 'danger';
        }
        if (this.tenant.daysUntilExpiration !== undefined && this.tenant.daysUntilExpiration <= 7) {
            return 'warning';
        }
        return 'success';
    }

    ngOnDestroy(): void { }
}
