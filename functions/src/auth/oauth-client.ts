import axios from 'axios';
import crypto from 'crypto';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { OAuthResponse } from './oauth-response';
import { FordConnectException } from '../exceptions/ford-connect-exception';
import { generateHash } from '../helpers/crypto-helper';
import * as functions from 'firebase-functions';

export interface AuthInterface {
    username: string;
    password: string;
}

export class OAuth2Client {
    private username: string;
    private password: string;
    private fordLoginUrl = 'https://login.ford.com';
    private fordGaurdUrl = 'https://api.mps.ford.com';
    private locale = 'en-US';
    private countryCode = 'USA';
    private applicationId = '71A3AD0A-CF46-4CCF-B473-FC7FE5BC4592';
    private proxyHost = process.env.PROXY_HOST || '';
    private proxyUsername = process.env.PROXY_USERNAME || '';
    private proxyPassword = process.env.PROXY_PASSWORD || '';

    constructor(auth: AuthInterface) {
        this.username = auth.username;
        this.password = auth.password;
    }

    /**
     * Retrieves an OAuth token from Ford's API.
     * 
     * @returns {Promise<OAuthResponse>}
     */
    public async getAccessTokenFromAuthCode(): Promise<OAuthResponse> {
        let tokens;
        try {
            tokens = await this.getOAuthToken();
        } catch (error: any) {
            functions.logger.error('Error getting OAuth token:', error);
            throw new FordConnectException(error.status, error.message);
        }

        if (!tokens) {
            throw new FordConnectException(500, "Failed to retrieve OAuth token.");
        }

        try {
            const res = await axios.post(`${this.fordGaurdUrl}/api/token/v2/cat-with-b2c-access-token`, {
                idpToken: tokens.access_token,
            }, {
                headers: this.apiHeaders()
            });

            return new OAuthResponse(
                res.data.access_token,
                res.data.expires_in,
                res.data.refresh_token,
                res.data.refresh_expires_in,
                res.data.ford_consumer_id
            );
        } catch (error) {
            functions.logger.error('Error getting access token:', error);
            throw new FordConnectException(500, "Failed to retrieve access token.");
        }
    }

    /**
     * Retrieves a new OAuth token from Ford's API using a refresh token.
     * 
     * @param {string} refreshToken
     * @returns {Promise<OAuthResponse>}
     */
    public async getAccessTokenFromRefreshToken(refreshToken: string): Promise<OAuthResponse> {
        try {
            const res = await axios.post(`${this.fordGaurdUrl}/api/token/v2/cat-with-refresh-token`, {
                refresh_token: refreshToken,
            }, {
                headers: this.apiHeaders()
            });

            return new OAuthResponse(
                res.data.access_token,
                res.data.expires_in,
                res.data.refresh_token,
                res.data.refresh_expires_in,
                res.data.ford_consumer_id
            );
        } catch (error) {
            functions.logger.error('Error refreshing access token:', error);
            throw new FordConnectException(500, "Failed to refresh access token.");
        }
    }

    private async getOAuthToken(): Promise<any> {
        const code = crypto.randomBytes(32).toString('hex');

        let newCode;
        try {
            newCode = await this.authorizeWithPuppeteer(code);
        } catch (error: any) {
            if (error instanceof FordConnectException) {
                throw error;
            }
            functions.logger.error('Failed to retrieve authorization code:', error);
            throw new FordConnectException(500, "Failed to retrieve authorization code.");
        }

        try {
            const response = await axios.post(
                `${this.fordLoginUrl}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${this.locale}/oauth2/v2.0/token`,
                new URLSearchParams({
                    scope: '09852200-05fd-41f6-8c21-d36d3497dc64 openid',
                    client_id: '09852200-05fd-41f6-8c21-d36d3497dc64',
                    grant_type: 'authorization_code',
                    code_verifier: code,
                    code: newCode,
                    redirect_uri: 'fordapp://userauthorized',
                }).toString(),
                {
                    headers: {
                        'User-Agent': 'okhttp/4.11.0',
                        'Accept-Encoding': 'gzip',
                        'X-Dynatrace': 'NA=NA',
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            functions.logger.error('Error exchanging authorization code for tokens:', error);
            throw new FordConnectException(error.status, error.message);
        }
    }

    private async authorizeWithPuppeteer(code: string): Promise<string> {
        let browser;
        try {
            browser = await puppeteer.launch({
                args: [
                    ...chromium.args,
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    `--proxy-server=${this.proxyHost}` // Set the proxy server for Puppeteer
                ],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
                timeout: 30000
            });
        } catch (error) {
            functions.logger.error('Error launching browser:', error);
            throw new Error('Error launching browser');
        }

        let authorizedCodeResolve: any;
        const authorizedCodePromise = new Promise<string>(r => (authorizedCodeResolve = r));

        const page = await browser.newPage();

        // Set up proxy authentication
        await page.authenticate({
            username: this.proxyUsername,
            password: this.proxyPassword
        });

        page.on('response', async response => {
            if (response.status() === 302 && response.headers()['location']?.includes('fordapp://userauthorized/?code=')) {
                const locationHeader = response.headers()['location'];
                const code = locationHeader.replace('fordapp://userauthorized/?code=', '');
                authorizedCodeResolve(code);
            }
        });

        const authUrl = `${this.fordLoginUrl}/4566605f-43a7-400a-946e-89cc9fdb0bd7/B2C_1A_SignInSignUp_${this.locale}/oauth2/v2.0/authorize`
            + `?redirect_uri=fordapp://userauthorized`
            + `&response_type=code`
            + `&max_age=3600`
            + `&scope=09852200-05fd-41f6-8c21-d36d3497dc64%20openid`
            + `&client_id=09852200-05fd-41f6-8c21-d36d3497dc64`
            + `&code_challenge=${generateHash(code)}`
            + `&code_challenge_method=S256`
            + `&ui_locales=${this.locale}`
            + `&language_code=${this.locale}`
            + `&country_code=${this.countryCode}`
            + `&ford_application_id=${this.applicationId}`;

        try {
            await page.goto(authUrl, { waitUntil: 'networkidle0', timeout: 60000 });
        } catch (error) {
            functions.logger.error('Error navigating to URL:', error);
            await browser.close();
            throw new Error('Error navigating to URL');
        }

        try {
            await page.waitForNetworkIdle({ idleTime: Math.random() * 10000, timeout: 60000 });
        } catch (error) {
            functions.logger.error('Error waiting for network idle:', error);
            await browser.close();
            throw new Error('Error waiting for network idle');
        }

        try {
            const usernameField = await page.$('input#signInName');
            const passwordField = await page.$('input#password');

            if (!usernameField || !passwordField) {
                functions.logger.error('Username or password field not found.');
                await browser.close();
                throw new Error('Username or password field not found');
            }

            await usernameField.type(this.username, { delay: Math.random() * 1000 });
            await new Promise(r => setTimeout(r, Math.random() * 10000));
            await passwordField.type(this.password, { delay: Math.random() * 1000 });
            await new Promise(r => setTimeout(r, Math.random() * 10000));

            const submitButton = await page.$('form#localAccountForm [type=submit]');
            if (!submitButton) {
                functions.logger.error('Submit button not found.');
                await browser.close();
                throw new Error('Submit button not found');
            }

            await submitButton.click();
        } catch (error) {
            functions.logger.error('Error filling in self asserted form or handling redirect:', error);
            await browser.close();
            throw new Error('Error filling in self asserted form or handling redirect');
        }

        // Add error handling for incorrect password or other errors
        try {
            const response = await page.waitForResponse(response => {
                return response.url().includes('SelfAsserted');
            }, { timeout: 10000 });

            const json = await response.json();

            if (json && json.errorCode) {
                await browser.close();
                throw new FordConnectException(json.status, json.message);
            }
        } catch (error) {
            if (error instanceof FordConnectException) {
                throw error;
            }
            functions.logger.error('Error checking for self asserted response:', error);
            await browser.close();
            throw new Error('Error checking for self asserted response');
        }

        try {
            const resolvedCode = await authorizedCodePromise;
            await browser.close();
            return resolvedCode;
        } catch (error) {
            functions.logger.error('Error resolving authorization code:', error);
            await browser.close();
            throw new Error('Error resolving authorization code');
        }
    }

    private apiHeaders() {
        return {
            "Accept": "*/*",
            "Accept-Language": "en-us",
            "User-Agent": "FordPass/26 CFNetwork/1485 Darwin/23.1.0",
            "Accept-Encoding": "gzip, deflate, br",
            "Content-Type": "application/json",
            "Application-Id": this.applicationId,
            "Dynatrace": "NA=NA",
        };
    }
}
