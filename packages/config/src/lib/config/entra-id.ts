import { registerAs } from '@nestjs/config';
import { IEntraIdConfig } from '@gauzy/common';

/**
 * Register Microsoft Entra ID (Azure AD) OAuth configuration using @nestjs/config
 * This is for enterprise single sign-on, separate from personal Microsoft accounts
 */
export default registerAs(
    'entraId',
    (): IEntraIdConfig => ({
        /** The Azure AD Tenant ID (Directory ID) */
        tenantId: process.env.ENTRA_ID_TENANT_ID,

        /** The Application (Client) ID from Azure AD App Registration */
        clientId: process.env.ENTRA_ID_CLIENT_ID,

        /** The Object ID of the Enterprise Application */
        objectId: process.env.ENTRA_ID_OBJECT_ID,

        /** The Client Secret value */
        clientSecret: process.env.ENTRA_ID_CLIENT_SECRET,

        /** The Client Secret ID (Key ID) */
        clientSecretId: process.env.ENTRA_ID_CLIENT_SECRET_ID,

        /** Callback URL for handling the OAuth response after authentication */
        callbackURL: process.env.ENTRA_ID_CALLBACK_URL || `${process.env.API_BASE_URL}/api/auth/entra-id/callback`,

        /** The URL for the Microsoft Graph API */
        graphApiURL: process.env.ENTRA_ID_GRAPH_API_URL || 'https://graph.microsoft.com/v1.0'
    })
);
