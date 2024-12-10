import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Layout, Button, Typography, Space, Divider, Row, Col, message, Card, Input, Form } from 'antd';
import './AuthPages.css';
import VacationDatesPicker from '../components/VacationDatesPicker';

const { Title, Text } = Typography;
const { Content } = Layout;

export default function UserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          message.error('Not logged in');
          navigate('/login');
          return;
        }

        const response = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else if (response.status === 404) {
          message.error('User not found');
          navigate('/');
        } else {
          message.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        message.error('Error fetching user data');
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleSaveVacationDates = async (vacationPeriods) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Nicht eingeloggt');
        navigate('/user:id');
        return;
      }

      const response = await fetch(`/api/user/${userData._id}/vacation-periods`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vacationPeriods })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      setUserData(prev => ({
        ...prev,
        vacationPeriods
      }));
      
      return true;
    } catch (error) {
      console.error('Error saving vacation dates:', error);
      throw error;
    }
  };

  const handleCreateOrganisation = async (values) => {
    const generateToken = (length) => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
  };

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Nicht eingeloggt');
        navigate('/login');
        return;
      }

      const token = generateToken(10);

      const response = await fetch(`/api/user/${userData._id}/organisation`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: values.name,
          address: values.address,
          token: token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
        message.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      message.success('Organisation erfolgreich erstellt!');
      setUserData(prev => ({
        ...prev,
        organisation: data.organisationId
      }));

      form.resetFields();
    } catch (error) {
      console.error('Error creating organisation:', error);
      message.error('Fehler beim Erstellen der Organisation: ' + error.message);
    }
  };

  if (!userData) {
    return (
      <>
        <Navigation />
        <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Content style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px' }}>
            <Text>Loading...</Text>
          </Content>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Layout style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <Content style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px' }}>
          <Row gutter={[48, 48]} style={{ maxWidth: '1600px', width: '100%' }}>
            <Col xs={24} sm={24} md={8} lg={8} style={{ display: 'flex', justifyContent: 'center' }}>
              <Card title="Profil" style={{ height: '100%' }} className="auth-card">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Title level={3}>{userData.first_name} {userData.last_name}</Title>
                    <Text type="secondary">{userData.username}</Text>
                  </div>
                  
                  <Divider />

                  {userData.role && (
                    <div>
                      <Title level={3}>{userData.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}</Title>
                      <Text type ="secondary">Rolle</Text>
                    </div>
                  )}

                  <Divider />
                  <div>
                    {userData.organisation ? (
                      <>
                        <Title level={3}>{userData.organisation}</Title>
                        <Text type="secondary">{userData.organisation}</Text>
                      </>
                    ) : (
                      <Text type="secondary">Sieht so aus als ob Sie noch keiner Organisation beigetreten sind. <br />Jetzt aber schnell!</Text>
                    )}
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} style={{ display: 'flex', justifyContent: 'center' }}>
              <Card title="Organisation" style={{ height: '100%' }} className="auth-card">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Form layout="vertical" form={form} onFinish={handleCreateOrganisation}>
                      <Form.Item
                        name="name"
                        rules={[{ required: true, message: 'Bitte geben Sie einen Namen ein' }]}
                      >
                        <Input 
                          placeholder="Name" 
                          style={{ marginBottom: '10px' }}
                        />
                      </Form.Item>
                      <Form.Item
                        name="address"
                        rules={[{ required: true, message: 'Bitte geben Sie eine Adresse ein' }]}
                      >
                        <Input 
                          placeholder="Adresse"
                          style={{ marginBottom: '10px' }}
                        />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                          Erstellen
                        </Button>
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                          Löschen
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                  <Divider />
                  <div>
                    <Form layout="vertical">
                      <Form.Item>
                        <Input 
                          placeholder="Organisations-TOKEN" 
                          style={{ marginBottom: '10px' }}
                        />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" style={{ width: '100%' }}>
                          Beitreten
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} style={{ display: 'flex', justifyContent: 'center' }}>
              <Card title="Urlaubsplanung" style={{ height: '100%' }} className="auth-card">
                <VacationDatesPicker
                  initialVacations={userData.vacationPeriods || []}
                  onSave={handleSaveVacationDates}
                  maxVacationDays={userData.vacationDays || 25}
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </>
  );
}