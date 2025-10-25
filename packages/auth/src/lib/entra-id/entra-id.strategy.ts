import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AxiosResponse } from 'axios';
import { Strategy, StrategyOptionsWithRequest } from 'passport-microsoft';
import { firstValueFrom, map } from 'rxjs';

/**
 * Entra ID (Azure AD) authentication strategy for enterprise SSO
 * This is separate from personal Microsoft account login
 */
@Injectable()
export class EntraIdStrategy extends PassportStrategy(Strategy, 'entra-id') {
    constructor(protected readonly configService: ConfigService, private readonly _httpService: HttpService) {
        super(parseEntraIdConfig(configService));
    }

    /**
     * Validates the provided tokens and retrieves the user's profile information
     * from the Microsoft Graph API using Entra ID authentication.
     *
     * @param req - The request object (when passReqToCallback is true).
     * @param accessToken - The access token for Microsoft Graph API.
     * @param refreshToken - The refresh token (unused in this example).
     * @param profile - The initial profile information (may be overwritten).
     * @param done - The callback to pass either the error or the user object.
     */
    async validate(
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (error: any, user: any, info?: any) => void
    ): Promise<void> {
        try {
            const url = `${this.configService.get<string>('entraId.graphApiURL')}/me`;

            // Fetch user profile from Microsoft Graph API
            profile = await firstValueFrom(
                this._httpService
                    .get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
                    .pipe(map((response: AxiosResponse<any>) => response.data))
            );

            const { userPrincipalName, displayName, id, mail } = profile;

            // Use mail if available, otherwise use userPrincipalName
            const email = mail || userPrincipalName;
            const emails = [{ value: email, verified: Boolean(email) }];

            /** Create the user object to pass to the done callback */
            const user = {
                emails,
                displayName,
                id, // Azure AD Object ID
                accessToken,
                refreshToken
            };

            done(null, user);
        } catch (error) {
            done(error, false);
        }
    }
}

/**
 * Parses the Entra ID (Azure AD) OAuth configuration using the provided ConfigService.
 *
 * Retrieves the Entra ID OAuth client ID, client secret, tenant ID, callback URL,
 * authorization URL, and token URL from the configuration service.
 * If any required configuration values are missing, a warning is logged and default values are applied.
 *
 * @param configService - An instance of ConfigService to access configuration values.
 * @returns An object containing the Entra ID OAuth configuration parameters.
 */
export const parseEntraIdConfig = (configService: ConfigService): StrategyOptionsWithRequest => {
    const tenantId = configService.get<string>('entraId.tenantId');
    const clientId = configService.get<string>('entraId.clientId');
    const clientSecret = configService.get<string>('entraId.clientSecret');
    const callbackURL = configService.get<string>('entraId.callbackURL');

    // Build tenant-specific URLs
    const authorizationURL = tenantId
        ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
        : 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

    const tokenURL = tenantId
        ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
        : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    // Log a warning if any required configuration values are missing.
    if (!clientId || !clientSecret || !callbackURL || !tenantId) {
        console.warn('⚠️ Entra ID OAuth configuration is incomplete. Defaulting to "disabled".');
    }

    // Return the configuration object for Entra ID OAuth.
    return {
        // Use the retrieved clientID, or default to 'disabled' if not provided.
        clientID: clientId || 'disabled',
        // Use the retrieved clientSecret, or default to 'disabled' if not provided.
        clientSecret: clientSecret || 'disabled',
        // Use the retrieved callbackURL, or default to the API_BASE_URL (or localhost) plus the callback path.
        callbackURL:
            callbackURL || `${process.env.API_BASE_URL ?? 'http://localhost:3000'}/api/auth/entra-id/callback`,
        // Authorization URL for Entra ID OAuth (tenant-specific).
        authorizationURL,
        // Token URL where Entra ID exchanges the authorization code for an access token (tenant-specific).
        tokenURL,
        // Include the request object in the callback.
        passReqToCallback: true,
        // Scope for Microsoft Graph API to read user profile
        scope: ['openid', 'profile', 'email', 'User.Read']
    };
};
