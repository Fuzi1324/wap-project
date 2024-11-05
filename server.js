import express from 'express';
import { MongoClient } from 'mongodb';
import 'dotenv/config';
import api from './api.js';

const app = express();
const port = 3000;
const connectionString = process.env.DB_CONNECTION_STRING;

app.use(express.json());

// Middleware-Logger vor anderen Routen setzen
app.use((req, res, next) => {
    console.log(`${req.method}: ${req.url}`);
    next();
});

app.use('/api', api);


async function startServer() {
    try {
        const client = new MongoClient(connectionString);
        await client.connect();

        const db = client.db('demo');
        app.set('db', db);

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

app.get('/api/login/:value', (req, res, next) => {
    if (req.params.value === 'elias') {
        next();
    } else {
        res.status(403).send();
    }
}, (req, res) => {
    res.send('Success!');
});


app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Empfangene Login-Daten:', email, password);
    res.json({ message: 'Loginversuch empfangen', status: 'success' });
});


app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    console.log('Empfangene Register-Daten:', username, email, password);
    res.json({ message: 'Registrierungsversuch empfangen', status: 'success' });
});


app.get('/api/user', (req, res) => {
    res.send('User');
});

app.get('/api/admin', (req, res) => {
    res.send('Admin');
});

app.use((req, res) => {
    res.status(404).send('404: Page not found');
});
