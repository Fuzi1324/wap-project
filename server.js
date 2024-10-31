import express from 'express';

const app = express();
const port = 3000;

// start server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})