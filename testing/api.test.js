// api.test.js
import {
    jest, expect, test, describe,
    beforeEach, afterEach,
} from '@jest/globals';
import { getResponse } from './api.js';
describe('function getResponse() mocking fetch', () => {
    beforeEach(() => {
        jest.spyOn(global, 'fetch').mockImplementation(() => {
            return {
                json: () => Promise.resolve({ message: 'Hello World!' }),
            };
        });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test('returns "Hello World!"', async () => {
        expect(getResponse()).resolves.toBe('Hello World!');
    });
});