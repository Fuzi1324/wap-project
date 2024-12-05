import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Navigation from '../Navigation';

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

test('handleSubmit', async () => {
  const { getByText } = render(<Navigation />);
  const form = getByText('Login').closest('form');
  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');
  const submitButton = form.querySelector('button[type="submit"]');

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(submitButton);

  await waitFor(() => expect(getByText('Login successful')).toBeInTheDocument());
});

test('fetchUserData', async () => {
  const { getByText } = render(<Navigation />);
  const accessToken = 'mock-access-token';
  localStorage.setItem('accessToken', accessToken);
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ _id: 'mock-user-id' }),
  }));
  await Navigation.fetchUserData();
  expect(localStorage.getItem('userId')).toBe('mock-user-id');
  expect(getByText('Login successful')).toBeInTheDocument();
});

test('clicking on navigation menu item', () => {
  const { getByText } = render(<Navigation />);
  const menuItem = getByText('Home');
  fireEvent.click(menuItem);
  expect(getByText('Home')).toBeInTheDocument();
});

test('submitting form with invalid email', async () => {
  const { getByText } = render(<Navigation />);
  const form = getByText('Login').closest('form');
  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');
  const submitButton = form.querySelector('button[type="submit"]');

  fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(submitButton);

  await waitFor(() => expect(getByText('Invalid email')).toBeInTheDocument());
});

test('submitting form with invalid password', async () => {
  const { getByText } = render(<Navigation />);
  const form = getByText('Login').closest('form');
  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');
  const submitButton = form.querySelector('button[type="submit"]');

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'invalid-password' } });
  fireEvent.click(submitButton);

  await waitFor(() => expect(getByText('Invalid password')).toBeInTheDocument());
});