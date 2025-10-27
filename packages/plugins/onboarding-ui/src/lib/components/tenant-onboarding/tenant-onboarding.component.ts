import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { filter, firstValueFrom, tap } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IOrganization, IOrganizationCreateInput, IUser, FeatureEnum } from '@gauzy/contracts';
import {
	AuthService,
	EmployeesService,
	ErrorHandlingService,
	OrganizationsService,
	Store,
	TenantService,
	UsersService
} from '@gauzy/ui-core/core';

@UntilDestroy()
@Component({
	selector: 'ga-tenant-onboarding',
	templateUrl: './tenant-onboarding.component.html',
	styleUrls: ['./tenant-onboarding.component.scss'],
	standalone: false
})
export class TenantOnboardingComponent implements OnInit, OnDestroy {
	public loading: boolean = true;
	public user: IUser;

	constructor(
		private readonly _router: Router,
		private readonly _activatedRoute: ActivatedRoute,
		private readonly _organizationsService: OrganizationsService,
		private readonly _tenantService: TenantService,
		private readonly _usersService: UsersService,
		private readonly _store: Store,
		private readonly _authService: AuthService,
		private readonly _employeesService: EmployeesService,
		private readonly _errorHandlingService: ErrorHandlingService
	) { }

	ngOnInit() {
		this._activatedRoute.data
			.pipe(
				filter(({ user }: Data) => !!user),
				tap(({ user }: Data) => {
					this._store.user = user;
					this.user = user;
				}),
				tap(() => (this.loading = false)),
				// Handle component lifecycle to avoid memory leaks
				untilDestroyed(this)
			)
			.subscribe();
	}

	/**
	 * Onboard a user by creating a tenant, fetching the user details, and setting up the organization.
	 *
	 * @param {IOrganizationCreateInput} organization - The organization input data required for onboarding.
	 */
	async onboardUser(organization: IOrganizationCreateInput): Promise<void> {
		this.loading = true;

		try {
			// Check if FEATURE_PLATFORM_ADMIN is enabled
			const isPlatformAdminFeatureEnabled = this._store.hasFeatureEnabled(FeatureEnum.FEATURE_PLATFORM_ADMIN);

			let tenant;
			let shouldUpdateTenant = false;

			// If platform admin feature is enabled AND user already has a tenant
			if (isPlatformAdminFeatureEnabled && this.user?.tenantId) {
				// User already has a tenant created by platform admin, use it
				this.user = await this._usersService.getMe(['tenant']);
				tenant = this.user.tenant;
				this._store.user = this.user;
				shouldUpdateTenant = true; // Flag to update tenant info later
			} else if (isPlatformAdminFeatureEnabled && !this.user?.tenantId) {
				// Platform admin feature is enabled but user has no tenant - not allowed
				throw new Error('Only platform administrators can create tenants. Please contact your administrator.');
			} else {
				// Platform admin feature is disabled, allow self-service tenant creation
				tenant = await this._tenantService.create({ name: organization.name });
				this.user = await this._usersService.getMe(['tenant']);
				this._store.user = this.user;
			}

			try {
				// Create organization
				const createdOrganization = await this._organizationsService.create({
					...organization,
					tenant,
					isDefault: true
				});

				// Update tenant info if needed (when user already had a tenant from platform admin)
				if (shouldUpdateTenant && organization.name) {
					// Update tenant with organization name or other details
					await this._tenantService.update({
						name: organization.name
						// Add other fields from organization if needed
					});
				}

				await this.getAccessTokenFromRefreshToken();
				this.registerEmployeeFeature(organization, createdOrganization); // Process in the background

				this._router.navigate(['/onboarding/complete']);
			} catch (error) {
				console.error('Error while creating organization:', error);
			}
		} catch (error) {
			console.error('Error while onboarding user:', error);
			// Handle and log errors using the _errorHandlingService
			this._errorHandlingService.handleError(error);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Registers the user as an employee during the initial onboarding process.
	 *
	 * @param {IOrganizationCreateInput} organization - The organization input data required for registration.
	 * @param {IOrganization} createdOrganization - The created organization entity.
	 */
	async registerEmployeeFeature(
		organization: IOrganizationCreateInput,
		createdOrganization: IOrganization
	): Promise<void> {
		if (!createdOrganization || !this.user) {
			return;
		}

		if (organization.registerAsEmployee) {
			const { id: organizationId } = createdOrganization;
			const { id: userId, tenantId } = this.user;

			try {
				await firstValueFrom(
					this._employeesService.create({
						startedWorkOn: organization.startedWorkOn ? new Date(organization.startedWorkOn) : null,
						userId,
						organizationId,
						tenantId
					})
				);
			} catch (error) {
				console.error('Error while registering employee:', error);
			}
		}
	}

	/**
	 * Get new access token using refresh token stored in _store
	 */
	async getAccessTokenFromRefreshToken() {
		try {
			const { refresh_token } = this._store;
			if (refresh_token) {
				const { token } = await this._authService.refreshToken(refresh_token);
				if (token) {
					this._store.token = token;
				}
			}
		} catch (error) {
			console.error('Error while retrieving refresh token', error);
		}
	}

	ngOnDestroy() { }
}
