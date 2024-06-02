/**
 * @class OAuthResponse
 */
export declare class OAuthResponse {
    private value;
    private expiresAt;
    private refreshToken;
    private refreshExpiresAt;
    private fordConsumerId;
    constructor(accessToken: string, expiresIn: number, refreshToken: string, refreshExpiresIn: number, fordConsumerId: string);
    /**
     * Set the expiresAt based on passed timestamp
     *
     * @returns date
     */
    setExpiresAtFromTimeStamp(expiresIn: number): Date;
    /**
     * Check if access token is expired
     *
     * @returns boolean
     */
    isExpired(): boolean;
    /**
     * Check if refresh token is expired
     *
     * @returns boolean
     */
    refreshIsExpired(): boolean;
    /**
     * Get accessToken value
     *
     * @returns this.value
     */
    getValue(): string;
    /**
     * Get expiration date
     *
     * @returns this.expiresAt
     */
    getExpiresAt(): Date;
    /**
     * Get refresh expiration date
     *
     * @returns this.refreshExpiresAt
     */
    getRefreshExpiresAt(): Date;
    /**
     * Get refresh token
     *
     * @returns this.refreshToken
     */
    getRefreshToken(): string;
    /**
     * Get ford consumer id
     *
     * @returns this.fordConsumerId
     */
    getFordConsumerId(): string;
}
