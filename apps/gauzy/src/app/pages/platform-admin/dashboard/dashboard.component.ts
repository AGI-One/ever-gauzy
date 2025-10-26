import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IPlatformAdminDashboardStats } from '@gauzy/contracts';
import { PlatformAdminService } from '../platform-admin.service';
import { ToastrService } from '@gauzy/ui-core/core';

@UntilDestroy({ checkProperties: true })
@Component({
    selector: 'ga-platform-admin-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy {
    public stats: IPlatformAdminDashboardStats;
    public loading: boolean = false;

    constructor(
        private readonly platformAdminService: PlatformAdminService,
        private readonly toastrService: ToastrService
    ) { }

    ngOnInit(): void {
        this.loadStats();
    }

    /**
     * Load dashboard statistics
     */
    private loadStats(): void {
        this.loading = true;
        this.platformAdminService
            .getDashboardStats()
            .pipe(untilDestroyed(this))
            .subscribe({
                next: (stats) => {
                    this.stats = stats;
                    this.loading = false;
                },
                error: (error) => {
                    this.toastrService.danger(error?.message || 'Failed to load dashboard stats', 'Error');
                    this.loading = false;
                }
            });
    }

    ngOnDestroy(): void { }
}
