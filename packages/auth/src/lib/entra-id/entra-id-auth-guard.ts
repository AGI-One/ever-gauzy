import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Auth Guard for Entra ID (Azure AD) authentication
 * Protects routes that require enterprise SSO authentication
 */
@Injectable()
export class EntraIdAuthGuard extends AuthGuard('entra-id') {
    /**
     * Override canActivate to add custom logic if needed
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const result = (await super.canActivate(context)) as boolean;
        return result;
    }
}
