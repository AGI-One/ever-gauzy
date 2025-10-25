/**
 * Microsoft Entra ID (Azure AD) OAuth configuration
 * This is separate from standard Microsoft OAuth and requires organization-specific credentials
 */
export interface IEntraIdConfig {
    /** The Azure AD Tenant ID (Directory ID) */
    readonly tenantId: string;

    /** The Application (Client) ID from Azure AD App Registration */
    readonly clientId: string;

    /** The Object ID of the Enterprise Application */
    readonly objectId: string;

    /** The Client Secret value */
    readonly clientSecret: string;

    /** The Client Secret ID (Key ID) */
    readonly clientSecretId: string;

    /** The callback URL for Entra ID authentication */
    readonly callbackURL: string;

    /** The URL for the Microsoft Graph API */
    readonly graphApiURL: string;
}
