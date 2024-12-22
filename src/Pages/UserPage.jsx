import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Layout, Button, Typography, Space, Divider, Row, Col, message, Card, Input, Form } from 'antd';
import './AuthPages.css';
import VacationDatesPicker from '../components/VacationDatesPicker';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const { Title, Text } = Typography;
const { Content } = Layout;

export default function UserPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [createOrgForm] = Form.useForm();
  const [joinOrgForm] = Form.useForm();
  const [adminName, setAdminName] = useState('');

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

        const adminResponse = await fetch('/api/user/organization-admin', {
          headers: {  
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if(adminResponse.ok){
          const adminData =  await adminResponse.json();
          setAdminName(adminData.name);
        }else if (adminResponse.status === 404) {
          message.info('Sie haben noch keine Organisation erstellt oder sind noch keiner Organisation beigetreten!');
        }else {
          message.error('Failed to fetch admin name');
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

    message.success('Organisation erfolgreich gelöscht!');
    
    // Lade die aktualisierten Benutzerdaten neu
    const userResponse = await fetch('/api/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (userResponse.ok) {
      const updatedUserData = await userResponse.json();
      setUserData(updatedUserData);
    } else {
      message.error('Fehler beim Aktualisieren der Benutzerdaten');
    }

  } catch (error) {
    console.error('Error deleting organisation:', error);
    message.error('Fehler beim Löschen der Organisation: ' + error.message);
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

      const response = await fetch(`/api/user/${userData._id}/create-organisation`, {
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

      createOrgForm.resetFields();
    } catch (error) {
      console.error('Error creating organisation:', error);
      message.error('Fehler beim Erstellen der Organisation: ' + error.message);
    }
  };

  const handleJoinOrganisation = async (values) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Nicht eingeloggt');
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/user/${userData._id}/join-organisation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          token: values.token
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

      joinOrgForm.resetFields();
    } catch (error) {
      console.error('Error joining organisation:', error);
      message.error('Fehler beim Beitritt zur Organisation: ' + error.message);
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
                            <Title level={3} className="auth-title">{adminName}</Title>
                            <Text type="secondary">Administrator</Text>
                            <Divider />
                            {userData.role === 'admin' ? (
                              <>
                                <div className="token-container">
                                  <Title level={3} className="auth-title mb-0">{orgData.token}</Title>
                                  <CopyToClipboard text={orgData.token} onCopy={() => this.setState({copied: true})}>
                                    <button className="copy-button">
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                        className="copy-icon"
                                      >
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                      </svg>
                                    </button>
                                  </CopyToClipboard>
                                </div>
                                <Text type="secondary">Organisations-TOKEN</Text>
                              </>
                            ) : (
                              <p></p>
                            )}
                            <Button type="primary" style={{ width: '100%', marginTop: '20px' }} onClick={handleDeleteOrganisation}>Organisation löschen / austreten</Button>
                          </>
                        ) : (
                          <Text type="secondary">Organisation nicht gefunden</Text>
                        )}
                      </div>
                        ): (
                        <>
                          <div>
                              <Form layout="vertical" form={createOrgForm} onFinish={handleCreateOrganisation}>
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
                            <Form layout="vertical" form={joinOrgForm} onFinish={handleJoinOrganisation}>
                              <Form.Item name="token" rules={[{ required: true, message: 'Bitte geben Sie einen Token ein' }]}>
                                <Input 
                                  placeholder="Organisations-TOKEN" 
                                  style={{ marginBottom: '10px' }}
                                />
                              </Form.Item>
                              <Form.Item>
                                <Button htmlType="submit" type="primary" style={{ width: '100%' }}>
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
                  <VacationDatesPicker 
                    onSave={handleSaveVacationDates} 
                    initialVacationPeriods={userData.vacationPeriods || []}
                    maxVacationDays={userData.vacationDays || 30}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        </Content>
      </Layout>
    </>
  );
}