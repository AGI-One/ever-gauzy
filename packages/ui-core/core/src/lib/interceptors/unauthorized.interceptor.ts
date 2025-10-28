import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStrategy } from '../services/auth/auth-strategy.service';
import { Store } from '../services/store/store.service';

/**
 * Interceptor to handle 401 Unauthorized errors
 * When a 401 error occurs (e.g., token expired, tenant expired), automatically logout the user
 */
@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
    constructor(
        private readonly authStrategy: AuthStrategy,
        private readonly router: Router,
        private readonly store: Store
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Handle 401 Unauthorized errors
                if (error.status === HttpStatusCode.Unauthorized) {
                    // Skip logout for login/register endpoints to avoid infinite loops
                    const isAuthEndpoint = request.url.includes('/auth/login') ||
                        request.url.includes('/auth/register') ||
                        request.url.includes('/auth/refresh-token');

                    if (!isAuthEndpoint) {
                        this.handleUnauthorized(error);
                    }
                }

                return throwError(() => error);
            })
        );
    }

    /**
     * Handle unauthorized error by logging out user and redirecting to login
     * @param error - The HTTP error response
     */
    private handleUnauthorized(error: HttpErrorResponse): void {
        // Extract error message from response
        const errorMessage = error.error?.message || 'Your session has expired. Please login again.';

        // Logout user (async, but don't wait)
        this.authStrategy.logout().subscribe({
            next: () => {
                // Clear store
                this.store.clear();

                // Redirect to login page with error message
                this.router.navigate(['/auth/login'], {
                    queryParams: {
                        error: encodeURIComponent(errorMessage),
                        returnUrl: this.router.url
                    }
                });
            },
            error: (err) => {
                console.error('Error during logout:', err);
                // Still redirect even if logout fails
                this.router.navigate(['/auth/login'], {
                    queryParams: {
                        error: encodeURIComponent(errorMessage)
                    }
                });
            }
        });
    }
}
