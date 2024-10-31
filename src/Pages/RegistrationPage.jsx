import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    function saveUser(username, email, password) {
        localStorage.setItem('username', username)
        localStorage.setItem('email', email)
        localStorage.setItem('password', password)
    }

  return (
    <>
    <div className="register-page">
      <div className="form">
      <form className="register-form">
          <input type="text" placeholder="name" onChange={e => setUsername(e.target.value)} />
          <input type="text" placeholder="email address" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)} />
          <button onClick={ () => saveUser(username, email, password) }>create</button>
          <p className="message">Already registered? <Link to="/login">Sign In</Link></p>
        </form>
      </div>
    </div>
    </>
  )
}