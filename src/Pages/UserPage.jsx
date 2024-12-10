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
  const [orgData, setOrgData] = useState(null);
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

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          message.error('Not logged in');
          navigate('/login');
          return;
        }

        const response = await fetch('/api/user/organization', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOrgData(data);
        } else if (response.status === 404) {
          message.error('Organisation not found');
        } else {
          message.error('Failed to fetch organisation data');
        }
      } catch (error) {
        console.error('Error fetching organisation data:', error);
        message.error('Error fetching organisation data');
      }
    };

    if(userData?.organisation){
      fetchOrgData(); 
    }
  }, [userData]);

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

  const handleDeleteOrganisation = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Nicht eingeloggt');
        navigate('/user:id');
        return;
      }

      const response = await fetch(`/api/user/${userData._id}/organisation`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
        message.error(errorMessage);
        throw new Error(errorMessage);
      }

      message.success('Organisation erfolgreich gelöscht!');
      setUserData(prev => ({
        ...prev,
        organisation: null
      }));
    } catch (error) {
      console.error('Error deleting organisation:', error);
      message.error('Fehler beim Löschen der Organisation: ' + error.message);
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

  const handleJoinOrganisation = async (values) => {
     /*
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Nicht eingeloggt');
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/user/${userData._id}/organisation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          token: orgData.token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
        message.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      message.success('Organisation erfolgreich beigetreten!');
      setUserData(prev => ({
        ...prev,
        organisation: data.organisationId
      }));
    } catch (error) {
      console.error('Error joining organisation:', error);
      message.error('Fehler beim Beitritt zur Organisation: ' + error.message);
    }
  */
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
      <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Content style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px'}}>
          <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: '1200px' }}>
            <Row gutter={[48, 48]} style={{ width: '100%', justifyContent: 'center' }}>
              <Col xs={24} sm={24} md={12} lg={12}>
                <Card title="Profil" style={{ height: '100%' }} className="auth-card">
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                      <Title level={3} className="auth-title">{userData.first_name} {userData.last_name}</Title>
                      <Text type="secondary">{userData.username}</Text>
                    </div>
                    
                    <Divider />

                    {userData.role && (
                      <div>
                        <Title level={3} className="auth-title">{userData.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}</Title>
                        <Text type ="secondary">Rolle</Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={24} md={12} lg={12}>
                <Card title="Organisation" style={{ height: '100%' }} className="auth-card">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      {userData.organisation ? (
                        <div>
                        {orgData ? (
                          <>
                            <Title level={3} className="auth-title">{orgData.name}</Title>
                            <Text type="secondary">{orgData.address}</Text>
                            <Divider />
                            <Title level={3} className="auth-title">Max Mustermann</Title>
                            <Text type="secondary">Administrator</Text>
                            <Button type="primary" style={{ width: '100%', marginTop: '20px' }} onClick={handleDeleteOrganisation}>Organisation löschen / austreten</Button>
                          </>
                        ) : (
                          <Text type="secondary">Organisation nicht gefunden</Text>
                        )}
                      </div>
                        ): (
                        <>
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
                                <Button type="primary" style={{ width: '100%' }} onClick={handleJoinOrganisation}>
                                  Beitreten
                                </Button>
                              </Form.Item>
                            </Form>
                          </div>
                        </>
                      )}
                    </Space>
                  </Card>
              </Col>
            </Row>
            <Row gutter={[48, 48]} style={{ width: '100%', justifyContent: 'center' }}>
              <Col span={24}>
                <Card title="Urlaubsplanung" style={{ height: '100%' }} className="auth-card_wide">
                  <VacationDatesPicker onSave={handleSaveVacationDates} initialVacationPeriods={userData.vacationPeriods} />
                </Card>
              </Col>
            </Row>
          </Space>
        </Content>
      </Layout>
    </>
  );
}