import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, Subject } from 'rxjs';
import { ITenantWithStats } from '@gauzy/contracts';
import { PlatformAdminService } from '../platform-admin.service';
import { ToastrService } from '@gauzy/ui-core/core';
import { DeleteConfirmationComponent } from '@gauzy/ui-core/shared';

@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'ga-platform-admin-tenants',
	templateUrl: './tenants.component.html',
	styleUrls: ['./tenants.component.scss'],
	standalone: false
})
export class TenantsComponent implements OnInit, OnDestroy {
	public tenants: ITenantWithStats[] = [];
	public filteredTenants: ITenantWithStats[] = [];
	public loading: boolean = false;
	public searchTerm: string = '';
	public searchSubject: Subject<string> = new Subject();

	constructor(
		private readonly platformAdminService: PlatformAdminService,
		private readonly toastrService: ToastrService,
		private readonly dialogService: NbDialogService,
		private readonly router: Router,
		private readonly translateService: TranslateService
	) { }

	ngOnInit(): void {
		this.loadTenants();
		this.setupSearch();
	}

	/**
	 * Setup search with debounce
	 */
	private setupSearch(): void {
		this.searchSubject.pipe(debounceTime(300), untilDestroyed(this)).subscribe((term) => {
			this.filterTenants(term);
		});
	}

	/**
	 * Load all tenants
	 */
	private loadTenants(): void {
		this.loading = true;
		console.log('[TenantsComponent] Loading tenants...');
		this.platformAdminService
			.getTenants()
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (tenants) => {
					console.log('[TenantsComponent] Tenants loaded:', tenants);
					console.log('[TenantsComponent] Tenants count:', tenants?.length);
					console.log('[TenantsComponent] First tenant:', tenants?.[0]);
					this.tenants = tenants;
					this.filteredTenants = tenants;
					this.loading = false;
					console.log('[TenantsComponent] Loading complete. filteredTenants:', this.filteredTenants);
				},
				error: (error) => {
					console.error('[TenantsComponent] Error loading tenants:', error);
					this.toastrService.danger(error?.message || 'Failed to load tenants', 'Error');
					this.loading = false;
				}
			});
	}

	/**
	 * Filter tenants by search term
	 */
	private filterTenants(term: string): void {
		if (!term || term.trim() === '') {
			this.filteredTenants = this.tenants;
			return;
		}

		const searchLower = term.toLowerCase();
		this.filteredTenants = this.tenants.filter(
			(tenant) =>
				tenant.name?.toLowerCase().includes(searchLower) ||
				tenant.id?.toLowerCase().includes(searchLower)
		);
	}

	/**
	 * Handle search input
	 */
	onSearch(term: string): void {
		this.searchTerm = term;
		this.searchSubject.next(term);
	}

	/**
	 * Navigate to create tenant page
	 */
	createTenant(): void {
		this.router.navigate(['/platform-admin/tenants/create']);
	}

	/**
	 * Navigate to tenant details
	 */
	viewTenant(tenant: ITenantWithStats): void {
		this.router.navigate(['/platform-admin/tenants', tenant.id]);
	}

	/**
	 * Navigate to edit tenant
	 */
	editTenant(event: Event, tenant: ITenantWithStats): void {
		event.stopPropagation();
		this.router.navigate(['/platform-admin/tenants/edit', tenant.id]);
	}

	/**
	 * Delete tenant with confirmation
	 */
	deleteTenant(event: Event, tenant: ITenantWithStats): void {
		event.stopPropagation();

		this.dialogService
			.open(DeleteConfirmationComponent, {
				context: {
					recordType: this.translateService.instant('PLATFORM_ADMIN.TENANTS.TENANT')
				}
			})
			.onClose.pipe(untilDestroyed(this))
			.subscribe((result) => {
				if (result) {
					this.performDelete(tenant);
				}
			});
	}

	/**
	 * Perform delete operation
	 */
	private performDelete(tenant: ITenantWithStats): void {
		this.platformAdminService
			.deleteTenant(tenant.id)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					this.toastrService.success('Tenant deleted successfully');
					this.loadTenants();
				},
				error: (error) => {
					this.toastrService.danger(error?.message || 'Failed to delete tenant', 'Error');
				}
			});
	}

	/**
	 * Get status badge class
	 */
	getStatusBadge(tenant: ITenantWithStats): string {
		if (!tenant.isActive) {
			return 'danger';
		}
		if (tenant.daysUntilExpiration !== undefined && tenant.daysUntilExpiration <= 7) {
			return 'warning';
		}
		return 'success';
	}

	/**
	 * Get status text
	 */
	getStatusText(tenant: ITenantWithStats): string {
		if (!tenant.isActive) {
			return this.translateService.instant('PLATFORM_ADMIN.TENANTS.STATUS.INACTIVE');
		}
		if (tenant.daysUntilExpiration !== undefined && tenant.daysUntilExpiration <= 7) {
			return this.translateService.instant('PLATFORM_ADMIN.TENANTS.STATUS.EXPIRING_SOON');
		}
		return this.translateService.instant('PLATFORM_ADMIN.TENANTS.STATUS.ACTIVE');
	}

	/**
	 * Refresh tenants list
	 */
	refresh(): void {
		this.loadTenants();
	}

	ngOnDestroy(): void { }
}
