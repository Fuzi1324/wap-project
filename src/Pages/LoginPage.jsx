import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
  return (
    <>
    <div className="login-page">
      <div className="form">
        <form className="login-form">
          <input type="text" placeholder="email" />
          <input type="password" placeholder="password" />
          <button>login</button>
          <p className="message">Not registered? <Link to="/register">Create an account</Link></p>
        </form>
      </div>
    </div>
    </>
  )
}