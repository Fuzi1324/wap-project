import express from 'express';

const app = express();
const port = 3000;

// start server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// route definitions logger
app.use((req, res, next) => {
    console.log(`${req.method}: ${req.url}`);
    next();
});