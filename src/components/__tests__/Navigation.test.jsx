import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Navigation from '../Navigation';

describe('Navigation Component', () => {
  test('renders navigation menu', () => {
    const { getByText, getAllByRole } = render(<Navigation />);
    const links = getAllByRole('link');

    expect(links[0].getAttribute('href')).toBe('/home');
    expect(links[1].getAttribute('href')).toBe('/about');
    expect(links[2].getAttribute('href')).toBe('/contact');

    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('About')).toBeInTheDocument();
    expect(getByText('Contact')).toBeInTheDocument();
  });

  test('handles form submission successfully', async () => {
    const { getByText, getByPlaceholderText } = render(<Navigation />);
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const submitButton = getByText('Login');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('userId')).toBe('mock-user-id');
      expect(getByText('Login successful')).toBeInTheDocument();
    });
  });

  test('displays error message on failed form submission', async () => {
    const { getByText, getByPlaceholderText } = render(<Navigation />);
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const submitButton = getByText('Login');

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});