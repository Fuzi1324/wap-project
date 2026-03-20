import { expect, test, describe, jest, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import router from '../api.js';

jest.mock('mongodb', () => ({
    ObjectId: jest.fn(id => id),
    isValid: jest.fn()
}));

const mockCollection = {
    findOne: jest.fn()
};

const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
};

const authMiddleware = (req, res, next) => {
    res.locals = {
        oauth: {
            token: {
                user: {
                    user_id: '507f1f77bcf86cd799439011'
                }
            }
        }
    };
    next();
};

const app = express();
app.use(express.json());
app.set('db', mockDb);
app.use(authMiddleware);
app.use('/', router);

describe('GET /user/me', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCollection.findOne.mockReset();
        mockDb.collection.mockClear();
        ObjectId.mockClear();
        ObjectId.isValid = jest.fn();
    });

    test('sollte 200 und Benutzerdaten mit Username zurückgeben', async () => {
        ObjectId.isValid.mockReturnValue(true);

        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            name: 'Test User',
            email: 'test@example.com'
        };

        const mockUserAuth = {
            user_id: '507f1f77bcf86cd799439011',
            username: 'testuser123'
        };

        mockDb.collection
            .mockReturnValueOnce({ findOne: jest.fn().mockResolvedValue(mockUser) })
            .mockReturnValueOnce({ findOne: jest.fn().mockResolvedValue(mockUserAuth) });

        const response = await request(app)
            .get('/user/me');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            ...mockUser,
            username: 'testuser123'
        });
        expect(mockDb.collection).toHaveBeenCalledWith('user');
        expect(mockDb.collection).toHaveBeenCalledWith('user_auth');
    });

    test('sollte 200 und Benutzerdaten ohne Username zurückgeben wenn kein UserAuth existiert', async () => {
        ObjectId.isValid.mockReturnValue(true);

        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            name: 'Test User',
            email: 'test@example.com'
        };

        mockDb.collection
            .mockReturnValueOnce({ findOne: jest.fn().mockResolvedValue(mockUser) })
            .mockReturnValueOnce({ findOne: jest.fn().mockResolvedValue(null) });

        const response = await request(app)
            .get('/user/me');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            ...mockUser,
            username: undefined
        });
    });

    test('sollte 400 bei ungültiger Benutzer-ID zurückgeben', async () => {
        ObjectId.isValid.mockReturnValue(false);

        const response = await request(app)
            .get('/user/me');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Ungültige Benutzer-ID'
        });
    });

    test('sollte 404 zurückgeben wenn Benutzer nicht gefunden', async () => {
        ObjectId.isValid.mockReturnValue(true);
        mockDb.collection
            .mockReturnValueOnce({ findOne: jest.fn().mockResolvedValue(null) });

        const response = await request(app)
            .get('/user/me');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            message: 'Benutzer nicht gefunden'
        });
    });

    test('sollte 500 bei Datenbankfehler zurückgeben', async () => {
        ObjectId.isValid.mockReturnValue(true);
        const mockError = new Error('DB Fehler');
        mockDb.collection
            .mockReturnValueOnce({ findOne: jest.fn().mockRejectedValue(mockError) });

        const response = await request(app)
            .get('/user/me');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'Interner Serverfehler: Error: DB Fehler'
        });
    });
});