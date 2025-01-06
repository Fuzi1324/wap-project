import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegistrationPage from '../RegistrationPage';

describe('RegistrationPage', () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders RegistrationPage and submits valid email', async () => {
    localStorage.getItem.mockReturnValue('mock-access-token');
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Email sent' }),
      })
    );

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const submitButton = getByText('Start Registration');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Registration initiated. Please check the console for the activation link.')).toBeInTheDocument();
    });
  });

  test('displays error message for already registered email', async () => {
    localStorage.getItem.mockReturnValue('mock-access-token');
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'This email is already registered' }),
      })
    );

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const submitButton = getByText('Start Registration');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('This email is already registered')).toBeInTheDocument();
    });
  });

  test('validates password requirements', async () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    const passwordInput = getByPlaceholderText('Password');
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    const submitButton = getByText('Start Registration');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  test('displays error message for invalid password confirmation', async () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    const passwordInput = getByPlaceholderText('Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm Password');
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword!' } });
    const submitButton = getByText('Start Registration');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('The passwords do not match!')).toBeInTheDocument();
    });
  });

  test('handles unexpected errors gracefully', async () => {
    localStorage.getItem.mockReturnValue('mock-access-token');
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const submitButton = getByText('Start Registration');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Registration failed')).toBeInTheDocument();
    });
  });
});