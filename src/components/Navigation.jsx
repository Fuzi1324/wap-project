import { Link } from 'react-router-dom'
import Logo from '/images/Logo.png'
export default function Navigation() {
    return (
        <>
        <div>
        <Link to="/"><img src={Logo} className="logo" alt="Vite logo" /></Link>
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