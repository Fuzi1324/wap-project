import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('LoginPage', () => {
  it('renders the login form', () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(getByPlaceholderText('Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Password')).toBeInTheDocument();
    expect(getByText('Login')).toBeInTheDocument();
  });

  it('submits the login form with valid credentials', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }),
        });
      }
      if (url === '/api/user/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ _id: 'mock-user-id' }),
        });
      }
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Login successful')).toBeInTheDocument();
    });
  });

  it('displays an error message for invalid credentials', async () => {
    global.fetch.mockImplementation((url) => {
      if (url === '/api/token') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        });
      }
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Email'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('displays an error message for empty fields', async () => {
    const { getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Email is required')).toBeInTheDocument();
      expect(getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('displays an error message for invalid email format', async () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Email'), { target: { value: 'invalid-email' } });
    fireEvent.change(getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeInTheDocument();
    });
  });
});