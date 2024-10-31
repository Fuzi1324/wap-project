import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorPage from './Pages/ErrorPage.jsx'
import LoginPage from './Pages/LoginPage.jsx'
import RegistrationPage from './Pages/RegistrationPage.jsx'
import AdminPage from './Pages/AdminPage.jsx'
import UserPage from './Pages/UserPage.jsx'


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegistrationPage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/user',
    element: <UserPage />,
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
