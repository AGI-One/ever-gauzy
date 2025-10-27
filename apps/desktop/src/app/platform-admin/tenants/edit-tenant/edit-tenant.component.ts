import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ITenantWithStats, IUpdateTenantInput } from '@gauzy/contracts';
import { PlatformAdminService } from '../../platform-admin.service';
import { ToastrService } from '@gauzy/ui-core/core';

@UntilDestroy({ checkProperties: true })
@Component({
    selector: 'ga-edit-tenant',
    templateUrl: './edit-tenant.component.html',
    styleUrls: ['./edit-tenant.component.scss'],
    standalone: false
})
export class EditTenantComponent implements OnInit, OnDestroy {
    public form: FormGroup;
    public loading: boolean = false;
    public tenant: ITenantWithStats;
    public tenantId: string;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly platformAdminService: PlatformAdminService,
        private readonly toastrService: ToastrService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
            this.tenantId = params['id'];
            if (this.tenantId) {
                this.loadTenant();
            }
        });
    }

    private initializeForm(): void {
        this.form = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            logoUrl: [''],
            expiresAt: [null],
            isActive: [true]
        });
    }

    private loadTenant(): void {
        this.loading = true;
        this.platformAdminService
            .getTenant(this.tenantId)
            .pipe(untilDestroyed(this))
            .subscribe({
                next: (tenant) => {
                    this.tenant = tenant;
                    this.form.patchValue({
                        name: tenant.name,
                        logoUrl: tenant.logo || '',
                        expiresAt: tenant.expiresAt ? new Date(tenant.expiresAt).toISOString().slice(0, 16) : null,
                        isActive: tenant.isActive !== false
                    });
                    this.loading = false;
                },
                error: (error) => {
                    this.toastrService.danger(error?.message || 'Failed to load tenant', 'Error');
                    this.loading = false;
                    this.cancel();
                }
            });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const input: IUpdateTenantInput = this.form.value; this.platformAdminService
            .updateTenant(this.tenantId, input)
            .pipe(untilDestroyed(this))
            .subscribe({
                next: () => {
                    this.toastrService.success('Tenant updated successfully');
                    this.router.navigate(['/platform-admin/tenants', this.tenantId]);
                },
                error: (error) => {
                    this.toastrService.danger(error?.message || 'Failed to update tenant', 'Error');
                    this.loading = false;
                }
            });
    }

    cancel(): void {
        this.router.navigate(['/platform-admin/tenants', this.tenantId]);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return field && field.invalid && (field.dirty || field.touched);
    }

    ngOnDestroy(): void { }
}
