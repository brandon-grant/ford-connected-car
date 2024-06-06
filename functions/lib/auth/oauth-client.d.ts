import { OAuthResponse } from './oauth-response';
export interface AuthInterface {
    username: string;
    password: string;
}
export declare class OAuth2Client {
    private username;
    private password;
    private fordLoginUrl;
    private fordGaurdUrl;
    private locale;
    private countryCode;
    private applicationId;
    private proxyHost;
    private proxyUsername;
    private proxyPassword;
    constructor(auth: AuthInterface);
    /**
     * Retrieves an OAuth token from Ford's API.
     *
     * @returns {Promise<OAuthResponse>}
     */
    getAccessTokenFromAuthCode(): Promise<OAuthResponse>;
    /**
     * Retrieves a new OAuth token from Ford's API using a refresh token.
     *
     * @param {string} refreshToken
     * @returns {Promise<OAuthResponse>}
     */
    getAccessTokenFromRefreshToken(refreshToken: string): Promise<OAuthResponse>;
    private getOAuthToken;
    private authorizeWithPuppeteer;
    private apiHeaders;
}
