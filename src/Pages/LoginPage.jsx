import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault();
    try{
      const response = await fetch('/api/login');
      const data = await response.json();
      console.log(data);
    }
    catch (error) {
      console.error(error);
    }
  }

  return (
    <>
    <Navigation />
    <div className="login-page">
      <div className="form">
        <form className="login-form">
          <input type="text" placeholder="email" onChange={e => setEmail(e.target.value)}/>
          <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)}/>
          <button onClick={() => handleSubmit()}>login</button>
          <p className="message">Not registered? <Link to="/register">Create an account</Link></p>
        </form>
      </div>
    </div>
    </>
  )
}