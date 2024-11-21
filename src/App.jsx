import { useState } from 'react'
import Logo from '/images/Logo.png'
import { Link } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation';
import { Layout, Form, Input, Button, Typography, message, Space } from 'antd';

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
