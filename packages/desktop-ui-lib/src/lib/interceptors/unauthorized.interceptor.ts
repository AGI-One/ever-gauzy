import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStrategy } from '../auth';
import { ElectronService } from '../electron/services';
import { Router } from '@angular/router';
import { Store } from '../services';

@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
	constructor(
		private authStrategy: AuthStrategy,
		private electronService: ElectronService,
		private router: Router,
		private store: Store
	) { }

	intercept(
		request: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		return next.handle(request).pipe(
			catchError((error) => {
				// Early return if offline is triggered.
				if (this.store.isOffline) {
					return throwError(() => error);
				}
				// Unauthorized error occurred
				if (error.status === HttpStatusCode.Unauthorized) {
					// Extract error message from response
					const errorMessage = error.error?.message || 'Your session has expired. Please login again.';

					// Log out the user
					this.authStrategy.logout().subscribe({
						next: () => {
							// logout from desktop
							this.electronService.ipcRenderer.send('logout');

							// redirect to login page with error message
							this.router.navigate(['auth', 'login'], {
								queryParams: {
									returnUrl: this.router.url,
									error: encodeURIComponent(errorMessage)
								}
							});
						},
						error: (err) => {
							console.error('Error during logout:', err);
							// Still redirect even if logout fails
							this.electronService.ipcRenderer.send('logout');
							this.router.navigate(['auth', 'login'], {
								queryParams: {
									error: encodeURIComponent(errorMessage)
								}
							});
						}
					});
				}
				return throwError(() => error);
			})
		);
	}
}
