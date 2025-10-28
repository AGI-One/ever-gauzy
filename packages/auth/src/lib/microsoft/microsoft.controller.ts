import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { FeatureFlagEnabledGuard, FeatureFlag, Public } from '@gauzy/common';
import { FeatureEnum } from '@gauzy/contracts';
import { SocialAuthService } from './../social-auth.service';
import { IIncomingRequest, RequestCtx } from './../request-context.decorator';

@UseGuards(FeatureFlagEnabledGuard, AuthGuard('microsoft'))
@FeatureFlag(FeatureEnum.FEATURE_MICROSOFT_LOGIN)
@Public()
@Controller('/auth')
export class MicrosoftController {
	constructor(public readonly service: SocialAuthService) { }

	/**
	 * Initiates Microsoft login.
	 *
	 * @param req
	 */
	@Get('/microsoft')
	microsoftLogin(@Req() _: Request) { }

	/**
	 * Microsoft login callback endpoint.
	 *
	 * @param requestCtx - The context of the incoming request.
	 * @param res - The response object.
	 * @returns The result of the Microsoft login callback.
	 */
	@Get('/microsoft/callback')
	async microsoftLoginCallback(@RequestCtx() context: IIncomingRequest, @Res() res: Response): Promise<any> {
		const { user } = context;
		const { success, authData, error } = await this.service.validateOAuthLoginEmail(user.emails);

		// Use specific error message if available, otherwise use default
		const errorMessage = error || (!success ? 'Account does not exist. Please contact your administrator.' : undefined);
		return this.service.routeRedirect(success, authData, res, errorMessage);
	}
}
