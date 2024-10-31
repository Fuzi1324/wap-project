import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault();
    try{
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
      });

      const data = await response.json();
      console.log(data);
    }
    catch (error) {
      console.error(error);
    }
  }

  return (
    <>
    <div className="login-page">
      <div className="form">
        <form className="login-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="email" onChange={e => setEmail(e.target.value)}/>
          <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)}/>
          <button>login</button>
          <p className="message">Not registered? <Link to="/register">Create an account</Link></p>
        </form>
      </div>
    </div>
    </>
  )
}