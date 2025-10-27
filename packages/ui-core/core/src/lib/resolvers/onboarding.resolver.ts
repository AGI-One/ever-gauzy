import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { Observable, from, map, catchError, of } from 'rxjs';
import { IUser } from '@gauzy/contracts';
import { UsersService, ErrorHandlingService } from '../services';

/**
 * Retrieves the user data and performs onboarding-related navigation.
 *
 * @returns Observable<IUser | null> - An observable that emits the user data or null in case of an error.
 */
export const OnboardingResolver: ResolveFn<Observable<IUser | null>> = (): Observable<IUser | null> => {
	// Inject the necessary services
	const _router = inject(Router);
	const _usersService = inject(UsersService);
	const _errorHandlingService = inject(ErrorHandlingService);

	// Fetch the user data with organizations to check if onboarding is complete
	const user$ = _usersService.getMe(['organizations', 'organizations.organization']);

	// Fetch the user data from the service
	return from(user$).pipe(
		// Map the user object to the user data
		map((user: IUser) => {
			// Only redirect to complete if user has BOTH tenant and at least one organization
			// Users with only tenant (no org) should stay on onboarding to create their organization
			if (user.tenantId && user.organizations && user.organizations.length > 0) {
				_router.navigate(['/onboarding/complete']);
				return user; // User has completed onboarding
			}
			return user; // Return the user object if onboarding is not complete
		}),
		// Handle any errors
		catchError((error) => {
			// Handle and log any errors
			_errorHandlingService.handleError(error);
			// Return null to indicate an error
			return of(null);
		})
	);
};
