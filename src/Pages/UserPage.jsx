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
        navigate('/login');
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
      <Layout style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
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
                      <Title level={3}>{userData.role}</Title>
                      <Text type ="secondary">Role</Text>
                    </div>
                  )}
                  
                  {userData.department && (
                    <div>
                      <Title level={3}>{userData.department}</Title>
                      <Text type ="secondary">Department</Text>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} style={{ display: 'flex', justifyContent: 'center' }}>
              <Card title="Organisationen" style={{ height: '100%' }} className="auth-card">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Form layout="vertical">
                      <Form.Item>
                        <Input 
                          placeholder="Name" 
                          style={{ marginBottom: '10px' }}
                        />
                      </Form.Item>
                      <Form.Item>
                        <Input 
                          placeholder="Adresse"
                          style={{ marginBottom: '10px' }}
                        />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" style={{ width: '100%' }}>
                          Erstellen
                        </Button>
                      </Form.Item>
                    </Form>
                  </div>

                  <Divider />
                  <Text type="secondary">Ihre Organisationen auf einen Blick</Text>
                  <div>
                    <Title level={3}>Lorem ipsum GmbH</Title>
                    <Text type="secondary">Lorem Ipsum GmbH</Text>
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