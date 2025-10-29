import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { tap, switchMap, filter, catchError, map, distinctUntilChanged } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IIntegrationTenant, IOrganization, IntegrationEnum } from '@gauzy/contracts';
import {
	ActivepiecesService,
	IntegrationsService,
	IntegrationTenantService,
	Store,
	ToastrService
} from '@gauzy/ui-core/core';
import { TranslationBaseComponent } from '@gauzy/ui-core/i18n';
import { TranslateService } from '@ngx-translate/core';

@UntilDestroy({ checkProperties: true })
@Component({
	selector: 'ngx-activepieces-authorize',
	templateUrl: './activepieces-authorize.component.html',
	styleUrls: ['./activepieces-authorize.component.scss'],
	standalone: false
})
export class ActivepiecesAuthorizeComponent extends TranslationBaseComponent implements OnInit, OnDestroy {
	public rememberState = false;
	public organization!: IOrganization;
	public hasTenantSettings = false;
	public loading = false;

	readonly form: UntypedFormGroup = ActivepiecesAuthorizeComponent.buildForm(this._fb);

	static buildForm(fb: UntypedFormBuilder): UntypedFormGroup {
		return fb.group({
			client_id: [null, [Validators.required, Validators.pattern(/\S/)]],
		    client_secret: [null, [Validators.required, Validators.pattern(/\S/)]],
		});
	}

	constructor(
		private readonly _fb: UntypedFormBuilder,
		private readonly _activepiecesService: ActivepiecesService,
		private readonly _integrationTenantService: IntegrationTenantService,
		private readonly _activatedRoute: ActivatedRoute,
		private readonly _router: Router,
		readonly _store: Store,
		private readonly _integrationsService: IntegrationsService,
		private readonly _toastrService: ToastrService,
		public readonly translateService: TranslateService
	) {
		super(translateService);
	}

	ngOnInit() {
		this._store.selectedOrganization$
			.pipe(
				filter((organization: IOrganization) => !!organization),
				tap((organization: IOrganization) => (this.organization = organization)),
				tap(() => this._checkTenantSettings()),
				untilDestroyed(this)
			)
			.subscribe();

		this._activatedRoute.data
			.pipe(
				map(({ state }) => !!state),
				distinctUntilChanged(),
				tap((state) => (this.rememberState = state)),
				tap(() => this._checkRememberState()),
				untilDestroyed(this)
			)
			.subscribe();
	}

	/**
	 * Check if tenant has OAuth settings configured
	 */
	private _checkTenantSettings() {
		if (!this.organization) {
			return;
		}

		const { id: organizationId, tenantId } = this.organization;

		this._integrationTenantService
			.getAll(
				{
					name: IntegrationEnum.ACTIVE_PIECES,
					organizationId,
					tenantId
				},
				['settings']
			)
			.pipe(
				tap((integrationTenants) => {
				const integrationTenant = integrationTenants?.items?.[0];
				const settings = integrationTenant?.settings ?? [];
				this.hasTenantSettings =
					settings.some((s) => s.settingsName === 'client_id') &&
					settings.some((s) => s.settingsName === 'client_secret');
				}),
				catchError((error) => {
					console.error('Failed to check tenant settings:', error);
					this._toastrService.error(
						this.getTranslation('INTEGRATIONS.ACTIVEPIECES_PAGE.AUTHORIZE.ERRORS.CHECK_TENANT_SETTINGS')
					);
					return EMPTY;
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

	/**
	 * ActivePieces integration remember state API call
	 */
	private _checkRememberState() {
		if (!this.organization || !this.rememberState) {
			return;
		}

		const { id: organizationId, tenantId } = this.organization;
		this._integrationsService
			.getIntegrationByOptions({
				name: IntegrationEnum.ACTIVE_PIECES,
				organizationId,
				tenantId
			})
			.pipe(
				filter((integration: IIntegrationTenant) => !!integration && !!integration.id),
				tap((integration: IIntegrationTenant) => {
					this._redirectToActivepiecesIntegration(integration.id);
				}),
				catchError((error) => {
					console.error('Failed to check remember state:', error);
					this._toastrService.error(
						this.getTranslation('INTEGRATIONS.ACTIVEPIECES_PAGE.AUTHORIZE.ERRORS.CHECK_REMEMBER_STATE')
					);
					return EMPTY;
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

	/**
	 * Save tenant settings and start OAuth flow
	 * POST /integration/activepieces/oauth/settings
	 */
	setupAndAuthorize() {
		if (this.form.invalid || !this.organization) {
			this._toastrService.error(this.getTranslation('INTEGRATIONS.ACTIVEPIECES_PAGE.AUTHORIZE.ERRORS.INVALID_FORM'));
			return;
		}

		this.loading = true;
		const { id: organizationId } = this.organization;
		const client_id = (this.form.value?.client_id ?? '').trim();
		const client_secret = (this.form.value?.client_secret ?? '').trim();

		this._activepiecesService
			.saveOAuthSettings(client_id, client_secret, organizationId)
			.pipe(
				tap(() => {
					this._toastrService.success(this.getTranslation('INTEGRATIONS.ACTIVEPIECES_PAGE.AUTHORIZE.SUCCESS.SETTINGS_SAVED'));
					this.hasTenantSettings = true;
				}),
				switchMap(() => this._startAuthorization()),
				catchError((error) => {
					console.error('Failed to save OAuth settings:', error);
					this._toastrService.error(
						this.getTranslation('INTEGRATIONS.ACTIVEPIECES_PAGE.AUTHORIZE.ERRORS.SAVE_SETTINGS')
					);
					this.loading = false;
					return EMPTY;
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

	/**
	 * Start OAuth authorization flow (if tenant settings already exist)
	 */
	startAuthorization() {
		if (!this.organization) {
			this._toastrService.error(this.getTranslation('INTEGRATIONS.ACTIVEPIECES_PAGE.AUTHORIZE.ERRORS.ORGANIZATION_NOT_FOUND'));
			return;
		}
		this.loading = true;
		this._startAuthorization()
			.pipe(
				catchError((error) => {
					console.error('Failed to start authorization:', error);
					this._toastrService.error(
						this.getTranslation('INTEGRATIONS.ACTIVEPIECES_PAGE.AUTHORIZE.ERRORS.START_AUTHORIZATION')
					);
					this.loading = false;
					return EMPTY;
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

	/**
	 * Internal method to start authorization
	 */
	private _startAuthorization() {
		if (!this.organization) {
			return EMPTY;
		}

		const { id: organizationId, tenantId } = this.organization;

		// GET /integration/activepieces/authorize?tenantId={tenantId}&organizationId={orgId}
		return this._activepiecesService.authorize(tenantId, organizationId).pipe(
			tap((response: { authorizationUrl: string; state: string }) => {
				// Redirect to ActivePieces OAuth page
				window.location.assign(response.authorizationUrl);
			})
		);
	}

	/**
	 * Redirect to ActivePieces integration page
	 */
	private _redirectToActivepiecesIntegration(integrationId: string) {
		this._router.navigate(['/pages/integrations/activepieces', integrationId], { replaceUrl: true });
	}

	ngOnDestroy(): void {}
}
