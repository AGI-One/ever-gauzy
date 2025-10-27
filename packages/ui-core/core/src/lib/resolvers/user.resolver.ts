import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { Observable, catchError, debounceTime, from, of, tap } from 'rxjs';
import { IUser } from '@gauzy/contracts';
import { ErrorHandlingService, UsersService } from '../services';

/**
 * Resolves the current user data and handles navigation based on the user's tenant status.
 *
 * @returns An observable of the user ID or an observable of error in case of failure.
 */
export const UserResolver: ResolveFn<Observable<IUser | null>> = (): Observable<IUser | null> => {
	const _router = inject(Router);
	const _usersService = inject(UsersService);
	const _errorHandlingService = inject(ErrorHandlingService);

	// Fetch user data with role and organizations relations
	const user$ = from(_usersService.getMe(['role', 'organizations', 'organizations.organization']));

	// Fetch user data from the service
	return user$.pipe(
		// Debounce the request to avoid excessive API calls
		debounceTime(100),
		// Check if the user has a tenant ID and at least one organization
		tap((user: IUser) => {
			// Redirect to onboarding if user doesn't have tenant OR doesn't have any organization
			if (!user.tenantId || !user.organizations || user.organizations.length === 0) {
				_router.navigate(['/onboarding/tenant']);
				return;
			}
		}),
		// Handle errors
		catchError((error) => {
			// Handle and log errors using the _errorHandlingService
			_errorHandlingService.handleError(error);
			// Return null to indicate an error
			return of(null);
		})
	);
};
