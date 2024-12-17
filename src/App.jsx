import { Link, Routes, Route } from 'react-router-dom'
import { Layout, Typography, Space, Card, Button } from 'antd';
import './App.css'
import Navigation from './components/Navigation';

const { Content } = Layout;
const { Title, Text } = Typography;

function App() {
  return (
    <Layout style={{ minHeight: '90vh' }}>
      <Navigation />
      <Content style={{ padding: '50px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <Title level={2}>Willkommen beim Dienstplaner</Title>
          <Text>
            Der Dienstplaner ist eine moderne Webanwendung zur effizienten Verwaltung von Mitarbeiterdienstplänen.
            Mit dieser Anwendung können Sie:
          </Text>
          <ul className='homepage-ul'>
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
    </Layout>
  )
}

export default App
