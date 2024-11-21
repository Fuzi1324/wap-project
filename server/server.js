import express from 'express';
import { MongoClient } from 'mongodb';
import OAuthServer from 'express-oauth-server';
import 'dotenv/config';
import api from './api.js';
import register from './register.js';
import oAuthModel from './oAuthModel.js';

const app = express();
const port = 3000;
const connectionString = process.env.DB_CONNECTION_STRING;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware-Logger vor anderen Routen setzen
app.use((req, res, next) => {
    console.log(`${req.method}: ${req.url}`);
    next();
});

async function startServer() {
    try {
        const client = new MongoClient(connectionString);
        await client.connect();

        const db = client.db('demo');
        app.set('db', db);

        
        db.collection('token').createIndex({ accessTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });
        db.collection('token').createIndex({ refreshTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });
        db.collection('token').createIndex({ emailTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

        const oauth = new OAuthServer({ model: oAuthModel(db) });

        app.use('/api/token', oauth.token({ requireClientAuthentication: { password: false, refresh_token: false } }));
        app.use('/api/register', register);
        app.use('/api', oauth.authenticate(), api);

        // Serverstart
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });
    } catch (error) {
        console.error("Fehler bei der Datenbankverbindung:", error);
        process.exit(1);
    }
}

startServer();

app.get('/', (req, res) => {	
    res.send('Startseite');
});
