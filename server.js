import express from 'express';
import { MongoClient } from 'mongodb';
import 'dotenv/config';
import api from './api.js';

const app = express();
const port = 3000;

const connectionString = process.env.DB_CONNECTION_STRING;

app.use(express.json());

app.use('/api', api);

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
    console.error(error);
}


//Middleware-Logger
app.use((req, res, next) => {
    console.log(`${req.method}: ${req.url}`);
    next();
});

//CORS - Cross-Origin Resource Sharing (Protokoll für Cross-Site-Request-Forgery)
app.use((req, res, next) => {

});

//Root Pfad
app.get('/', (req, res) => {	
    res.send('Startseite');
});

//Mocked Authorization (nur wenn api/login/username==elias dann Zugriff)
app.get('/api/login/:value', (req, res, next) => {
      if (req.params.value === 'elias') {
        next();
      } else {
        res.status(403).send();
      }
    },
    (req, res) => {
      res.send('Success!');
    }
);

//Loginverarbeitung
app.post('/api/login', (req, res) => {
    const {email, password} = req.body;

    console.log('Empfangene Login-Daten:');
    console.log('Email:', email);
    console.log('Passwort:', password);

    res.json({ 
        message: 'Loginversuch empfangen', 
        status: 'success' 
    });
});

//Registrierungsverarbeitung
app.post('/api/register', (req, res) => {
    const {username, email, password} = req.body;

    console.log('Empfangene Register-Daten:');
    console.log('Name:', username);
    console.log('Email:', email);
    console.log('Passwort:', password);

    res.json({ 
        message: 'Loginversuch empfangen', 
        status: 'success' 
    });
});

//TODO: User & Admin Routes
    app.get('/api/user', (req, res) => {
        res.send('User');
        //User Logik hier
    });

    app.get('/api/admin', (req, res) => {
        res.send('Admin');
        //Admin Logik hier
    });

//404-Pfad
app.use((req, res) => {
    res.status(404).send('404: Page not found');
})