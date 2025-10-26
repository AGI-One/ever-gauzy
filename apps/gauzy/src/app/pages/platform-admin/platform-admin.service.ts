import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_PREFIX } from '@gauzy/ui-core/common';
import {
	IPlatformAdminDashboardStats,
	ITenant,
	ITenantWithStats,
	ICreateTenantInput,
	IUpdateTenantInput
} from '@gauzy/contracts';

/**
 * Platform Admin Service
 * Handles all API calls for Platform Admin features
 */
@Injectable({ providedIn: 'root' })
export class PlatformAdminService {
	private readonly API_URL = `${API_PREFIX}/platform-admin`;

	constructor(private readonly http: HttpClient) { }

	/**
	 * Get dashboard statistics
	 */
	getDashboardStats(): Observable<IPlatformAdminDashboardStats> {
		return this.http.get<IPlatformAdminDashboardStats>(`${this.API_URL}/dashboard/stats`);
	}

	/**
	 * Get all tenants
	 */
	getTenants(): Observable<ITenantWithStats[]> {
		return this.http.get<{ items: ITenantWithStats[]; total: number }>(`${this.API_URL}/tenants`)
			.pipe(
				map(response => response.items || [])
			);
	}

	/**
	 * Get tenants expiring soon
	 */
	getExpiringTenants(): Observable<ITenantWithStats[]> {
		return this.http.get<ITenantWithStats[]>(`${this.API_URL}/tenants/expiring-soon`);
	}

	/**
	 * Get single tenant by ID
	 */
	getTenant(id: string): Observable<ITenantWithStats> {
		return this.http.get<ITenantWithStats>(`${this.API_URL}/tenants/${id}`);
	}

	/**
	 * Create new tenant
	 */
	createTenant(input: ICreateTenantInput): Observable<ITenant> {
		return this.http.post<ITenant>(`${this.API_URL}/tenants`, input);
	}

	/**
	 * Update tenant
	 */
	updateTenant(id: string, input: IUpdateTenantInput): Observable<ITenant> {
		return this.http.put<ITenant>(`${this.API_URL}/tenants/${id}`, input);
	}

	/**
	 * Delete tenant
	 */
	deleteTenant(id: string): Observable<void> {
		return this.http.delete<void>(`${this.API_URL}/tenants/${id}`);
	}
}
