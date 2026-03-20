import { expect, test, describe, jest, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import router from '../api.js';

const mockCollection = {
    findOne: jest.fn()
};

const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
};

const app = express();
app.use(express.json());
app.set('db', mockDb);

app.use('/', router);

describe('POST /check-email', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCollection.findOne.mockReset();
    });

    test('sollte 200 zurückgeben, wenn E-Mail verfügbar ist', async () => {
        mockCollection.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post('/check-email')
            .send({ email: 'neu@beispiel.de' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'E-Mail-Adresse ist verfügbar'
        });
        expect(mockCollection.findOne).toHaveBeenCalledWith({
            username: 'neu@beispiel.de'
        });
    });

    test('sollte 409 zurückgeben, wenn E-Mail bereits existiert', async () => {
        mockCollection.findOne.mockResolvedValue({
            username: 'existiert@beispiel.de'
        });

        const response = await request(app)
            .post('/check-email')
            .send({ email: 'existiert@beispiel.de' });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            message: 'E-Mail-Adresse bereits vergeben'
        });
    });

    test('sollte 400 zurückgeben, wenn keine E-Mail im Body', async () => {
        const response = await request(app)
            .post('/check-email')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'E-Mail ist erforderlich'
        });
    });

    test('sollte 500 zurückgeben bei Datenbankfehler', async () => {
        const mockError = new Error('DB Fehler');
        mockCollection.findOne.mockRejectedValue(mockError);

        const response = await request(app)
            .post('/check-email')
            .send({ email: 'test@beispiel.de' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'Interner Serverfehler: Error: DB Fehler'
        });
    });
});