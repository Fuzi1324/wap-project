import Logo from '/images/Logo.png'
import { Link, Routes, Route } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation';
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegistrationPage';
import AdminPage from './Pages/AdminPage';
import UserPage from './Pages/UserPage';

function App() {
  return (
    <>
      <div>
        <Link to="/"><img src={Logo} className="logo" alt="Vite logo" /></Link>
        <div>
          <Navigation />
        </div>
      </div>

      <div>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/user/:userId" element={<UserPage />} />
        </Routes>
      </div>
      <div>
        <button onClick={async () => {
          const result = await fetch('/api/user');
          const data = await result.json();
          console.log(data);
        }}>Get Data</button>
      </div>
    </>
  )
}

export default App
