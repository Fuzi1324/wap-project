import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from '/images/Logo.png'
import { Layout, Menu, Typography, message } from 'antd'
import { useState, useEffect } from 'react'

const { Header } = Layout

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          setIsLoggedIn(false);
          return;
        }

        const response = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserId(data._id);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoggedIn(false);
        localStorage.removeItem('accessToken');
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUserId(null);
    setIsLoggedIn(false);
    message.success('Successfully logged out');
    navigate('/login');
  };

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#001529', padding: '0 20px', borderRadius: '10px', }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', marginRight: '20px', }}>
          <img src={Logo} alt="Logo" style={{ height: '40px', marginRight: '10px', borderRadius: '10px', }} />
        </Link>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{ flexGrow: 1, justifyContent: 'flex-end' }}
        >
          {!isLoggedIn ? (
            <>
              <Menu.Item key="/login">
                <Link to="/login">Login</Link>
              </Menu.Item>

              <Menu.Item key="/register">
                <Link to="/register">Register</Link>
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item key="/admin">
                <Link to="/admin">Admin</Link>
              </Menu.Item>
              <Menu.Item key={`/user/${userId}`}>
                <Link to={`/user/${userId}`}>Profil</Link>
              </Menu.Item>

              <Menu.Item key="logout" onClick={handleLogout}>
                Logout
              </Menu.Item>
            </>
          )}
        </Menu>
      </Header>
    </Layout>
  )
}