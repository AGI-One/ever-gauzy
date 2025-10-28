import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Store } from '@gauzy/desktop-ui-lib';
import { RolesEnum } from '@gauzy/contracts';

/**
 * Platform Admin Guard for Desktop App
 * Ensures only users with PLATFORM_ADMIN role can access platform-admin routes
 * Redirects non-platform-admin users to time tracker
 */
@Injectable({ providedIn: 'root' })
export class PlatformAdminGuard implements CanActivate {
    constructor(private readonly store: Store, private readonly router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const user = this.store.user;

        // If user is not loaded yet, deny access and redirect to setup
        if (!user) {
            this.router.navigate(['/setup']);
            return false;
        }

        // Check if user has PLATFORM_ADMIN role
        const isPlatformAdmin = user.role?.name === RolesEnum.PLATFORM_ADMIN;

        if (!isPlatformAdmin) {
            // Redirect non-platform-admin users to time tracker
            this.router.navigate(['/time-tracker']);
            return false;
        }

        return true;
    }
}
