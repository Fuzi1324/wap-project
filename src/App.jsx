import Logo from '/images/Logo.png'
import { Link, Routes, Route } from 'react-router-dom'
import { Layout, Typography, Space, Card, Button } from 'antd';
import './App.css'
import Navigation from './components/Navigation';
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegistrationPage';
import AdminPage from './Pages/AdminPage';
import UserPage from './Pages/UserPage';

const { Content } = Layout;
const { Title, Text } = Typography;

function HomePage() {
  return (
    <Content style={{ padding: '50px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <Title level={2}>Willkommen beim Dienstplaner</Title>
          <Text>
            Der Dienstplaner ist eine moderne Webanwendung zur effizienten Verwaltung von Mitarbeiterdienstplänen.
            Mit dieser Anwendung können Sie:
          </Text>
          <ul>
            <li>Arbeitszeiten und Urlaubstage einfach verwalten</li>
            <li>Dienstpläne automatisch generieren lassen</li>
            <li>Urlaubsanträge digital einreichen und verwalten</li>
            <li>Teamübersichten und Arbeitszeitstatistiken einsehen</li>
          </ul>
          <Space>
            <Link to="/login">
              <Button type="primary">Anmelden</Button>
            </Link>
            <Link to="/register">
              <Button type='secondary'>Registrieren</Button>
            </Link>
          </Space>
        </Card>
      </Space>
    </Content>
  );
}

function App() {
  return (
    <Layout style={{ minHeight: '90vh' }}>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/user/:userId" element={<UserPage />} />
      </Routes>
    </Layout>
  )
}

export default App
