import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import ConnectedCar from 'connected-car';
import { AuthRequest } from './models/request';

admin.initializeApp(functions.config().firebase);

const app = express.default();

app.use(express.json());

app.post('/auth', async (req, res, next): Promise<void> => {
    const request: AuthRequest = req.body;

    try {
        // create OAuth2Client object
        const client = ConnectedCar.AuthClient(request.clientId, {
            region: request.region as 'US' | 'CA' | 'EU' | 'AU'
        });

        // retrieve the user's auth token
        const token = await client.getAccessTokenFromCredentials({
            username: request.username,
            password: request.password,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 'access_token': token.getValue() }));
    } catch (error) {
        next(error);
    }
});

export const api = functions.https.onRequest(app);
