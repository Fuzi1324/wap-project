import { useState } from 'react'
import Logo from '/images/Logo.png'
import { Link } from 'react-router-dom'
import './App.css'

function App() {

  return (
    <>
      <div>
        <img src={Logo} className="logo" alt="Vite logo" />
        <div>
          <ul>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
          <li><Link to="/admin">Admin</Link></li>
          <li><Link to="/user">User</Link></li>
          </ul>
        </div>
      </div>
    </>
  )
}

export default App
