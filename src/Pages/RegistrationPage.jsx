import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (event) => {
      event.preventDefault();
      try{
        const response = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers:{'Content-Type': 'application/json'},
          body: JSON.stringify({username, email, password})
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
    <div className="register-page">
      <div className="form">
      <form className="register-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="name" onChange={e => setUsername(e.target.value)} />
          <input type="text" placeholder="email address" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)} />
          <button>create</button>
          <p className="message">Already registered? <Link to="/login">Sign In</Link></p>
        </form>
      </div>
    </div>
    </>
  )
}