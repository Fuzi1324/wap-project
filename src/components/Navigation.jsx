import { Link, useLocation } from 'react-router-dom'
import Logo from '/images/Logo.png'
import { Layout, Menu, Typography } from 'antd'

const { Header } = Layout

export default function Navigation() {
  const location = useLocation();
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

          <Menu.Item key="/login">
            <Link to="/login">Login</Link>
          </Menu.Item>

          <Menu.Item key="/register">
            <Link to="/register">Register</Link>
          </Menu.Item>

          <Menu.Item key="/admin">
            <Link to="/admin">Admin</Link>
          </Menu.Item>

          <Menu.Item key="/user">
            <Link to="/user">User</Link>
          </Menu.Item>
        </Menu>
      </Header>
    </Layout>
  )
}