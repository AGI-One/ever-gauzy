import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ICreateTenantInput } from '@gauzy/contracts';
import { PlatformAdminService } from '../../platform-admin.service';
import { ToastrService } from '@gauzy/ui-core/core';

@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'ga-create-tenant',
	templateUrl: './create-tenant.component.html',
	styleUrls: ['./create-tenant.component.scss'],
	standalone: false
})
export class CreateTenantComponent implements OnInit, OnDestroy {
	public form: FormGroup;
	public loading: boolean = false;

	constructor(
		private readonly formBuilder: FormBuilder,
		private readonly platformAdminService: PlatformAdminService,
		private readonly toastrService: ToastrService,
		private readonly router: Router
	) { }

	ngOnInit(): void {
		this.initializeForm();
	}

	/**
	 * Initialize the form
	 */
	private initializeForm(): void {
		this.form = this.formBuilder.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			logoUrl: [''],
			expiresAt: [null],
			superAdmin: this.formBuilder.group({
				email: ['', [Validators.required, Validators.email]],
				password: ['', [Validators.required, Validators.minLength(8)]],
				firstName: [''],
				lastName: ['']
			})
		});
	}

	/**
	 * Submit the form
	 */
	onSubmit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		this.loading = true;
		const input: ICreateTenantInput = this.form.value;

		this.platformAdminService
			.createTenant(input)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (tenant) => {
					this.toastrService.success('Tenant created successfully');
					this.router.navigate(['/platform-admin/tenants', tenant.id]);
				},
				error: (error) => {
					this.toastrService.danger(error?.message || 'Failed to create tenant', 'Error');
					this.loading = false;
				}
			});
	}

	/**
	 * Cancel and go back
	 */
	cancel(): void {
		this.router.navigate(['/platform-admin/tenants']);
	}

	/**
	 * Check if a field is invalid and touched
	 */
	isFieldInvalid(fieldName: string): boolean {
		const field = this.form.get(fieldName);
		return field && field.invalid && (field.dirty || field.touched);
	}

	/**
	 * Check if a nested field is invalid and touched
	 */
	isNestedFieldInvalid(groupName: string, fieldName: string): boolean {
		const field = this.form.get([groupName, fieldName]);
		return field && field.invalid && (field.dirty || field.touched);
	}

	ngOnDestroy(): void { }
}
