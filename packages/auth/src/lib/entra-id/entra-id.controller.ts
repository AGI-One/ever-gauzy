import { Controller, ForbiddenException, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { FeatureFlagEnabledGuard, FeatureFlag, Public } from '@gauzy/common';
import { FeatureEnum } from '@gauzy/contracts';
import { SocialAuthService } from './../social-auth.service';
import { IIncomingRequest, RequestCtx } from './../request-context.decorator';

/**
 * Entra ID (Azure AD) authentication controller for enterprise SSO
 * This is separate from personal Microsoft account login
 * All users from the configured tenant can sign in
 */
@UseGuards(FeatureFlagEnabledGuard, AuthGuard('entra-id'))
@FeatureFlag(FeatureEnum.FEATURE_ENTRA_ID_LOGIN)
@Public()
@Controller('/auth')
export class EntraIdController {
    constructor(public readonly service: SocialAuthService) { }

    /**
     * Initiates Entra ID (Azure AD) login.
     *
     * @param req
     */
    @Get('/entra-id')
    entraIdLogin(@Req() _: Request) { }

    /**
     * Entra ID login callback endpoint.
     * Only allows login for existing users - registration is disabled for enterprise SSO.
     *
     * @param requestCtx - The context of the incoming request.
     * @param res - The response object.
     * @returns The result of the Entra ID login callback.
     */
    @Get('/entra-id/callback')
    async entraIdLoginCallback(@RequestCtx() context: IIncomingRequest, @Res() res: Response): Promise<any> {
        const { user } = context;

        // If signup is explicitly enabled, allow normal flow
        const { success, authData } = await this.service.validateOAuthLoginEmail(user.emails);
        return this.service.routeRedirect(success, authData, res);
    }
}
