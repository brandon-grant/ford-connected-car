import * as admin from 'firebase-admin';
import express from 'express';
import { AuthInterface, OAuth2Client } from './auth/oauth-client';
import { logger, runWith } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import { encrypt, decrypt } from './helpers/crypto-helper';

admin.initializeApp();
const db = admin.firestore();

// Check if running in emulator
const isEmulator = process.env.FUNCTIONS_EMULATOR || process.env.FIRESTORE_EMULATOR_HOST;
const getServerTimestamp = () => {
    return isEmulator ? new Date() : admin.firestore.FieldValue.serverTimestamp();
};

const app = express();
app.use(express.json());

app.post('/auth', async (req, res, next): Promise<void> => {
    const creds: AuthInterface = req.body;

    try {
        const user = await db.collection('users').where('email', '==', creds.username).get();
        let userId: string | undefined;
        let refreshToken: string | null = null;

        if (user.empty) {
            const newUserRef = await db.collection('users').add({
                email: creds.username,
                executions: 1,
                created: getServerTimestamp(),
                updated: getServerTimestamp()
            });
            userId = newUserRef.id;
        } else {
            user.forEach(doc => {
                userId = doc.id;
                const encryptedRefreshToken = doc.get('refresh_token') ?? null;
                if (encryptedRefreshToken) {
                    try {
                        refreshToken = decrypt(encryptedRefreshToken, creds.password);
                    } catch (e) {
                        logger.warn(`Failed to decrypt refresh token for user ${creds.username} with provided password.`);
                        refreshToken = null;
                    }
                }
                const executions = doc.get('executions') ?? 1;
                doc.ref.update({
                    executions: executions + 1,
                    updated: getServerTimestamp()
                });
            });
        }

        if (!userId) {
            throw new Error('Failed to retrieve or create user ID.');
        }

        // Check the refresh_tokens collection for a valid refresh token
        const refreshTokenDoc = await db.collection('refresh_tokens').doc(userId).get();
        if (refreshTokenDoc.exists) {
            const encryptedRefreshToken = refreshTokenDoc.get('refresh_token');
            if (encryptedRefreshToken) {
                try {
                    refreshToken = decrypt(encryptedRefreshToken, creds.password);
                    const refreshExpiresAt = refreshTokenDoc.get('refresh_expires_at').toDate();
                    if (refreshExpiresAt <= new Date()) {
                        refreshToken = null; // Token expired
                    }
                } catch (e) {
                    logger.warn(`Failed to decrypt refresh token for user ${creds.username} with provided password.`);
                    refreshToken = null;
                }
            }
        }

        const client = new OAuth2Client(creds);
        let token;

        if (refreshToken) {
            try {
                token = await client.getAccessTokenFromRefreshToken(refreshToken);
                logger.info(`Used refresh token for user ${creds.username}`);
            } catch (error) {
                logger.warn(`Failed to use refresh token for user ${creds.username}. Falling back to auth code flow.`);
                token = await client.getAccessTokenFromAuthCode();
                // Re-encrypt and store the new refresh token
                const encryptedRefreshToken = encrypt(token.getRefreshToken(), creds.password);
                await db.collection('refresh_tokens').doc(userId).set({
                    refresh_token: encryptedRefreshToken,
                    refresh_expires_at: token.getRefreshExpiresAt(),
                    updated: getServerTimestamp()
                });
            }
        } else {
            token = await client.getAccessTokenFromAuthCode();
            // Encrypt and store the new refresh token
            const encryptedRefreshToken = encrypt(token.getRefreshToken(), creds.password);
            await db.collection('refresh_tokens').doc(userId).set({
                refresh_token: encryptedRefreshToken,
                refresh_expires_at: token.getRefreshExpiresAt(),
                updated: getServerTimestamp()
            });
        }

        res.status(200).json({
            status: 200,
            access_token: token.getValue(),
            expires_at: token.getExpiresAt(),
            refresh_token: token.getRefreshToken(), // Not encrypted when sent back to the client
            refresh_expires_at: token.getRefreshExpiresAt(),
            ford_consumer_id: token.getFordConsumerId()
        });
    } catch (error: any) {
        logger.error(error.message, {
            user: creds.username,
            status: error.status || 500,
            stack: error.stack,
        });

        res.status(error.status || 500).json({
            status: error.status || 500,
            message: error.message || 'Internal Server Error',
        });

        next(error);
    }
});

export const api = runWith({
    memory: '2GB',
    timeoutSeconds: 120
}).https.onRequest(app);

export const apiV2 = onRequest({
    region: 'us-central1',
    memory: '2GiB',
    timeoutSeconds: 120,
}, app);
