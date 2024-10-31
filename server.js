import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

// Serverstart
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

//Middleware-Logger
app.use((req, res, next) => {
    console.log(`${req.method}: ${req.url}`);
    next();
});

//CORS - Cross-Origin Resource Sharing (Protokoll für Cross-Site-Request-Forgery)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
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