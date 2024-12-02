import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { Layout, Button, Typography, Space, Divider, Row, Col, message, Card } from 'antd';
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

        // Always use /me endpoint for now, as we don't have user viewing permissions yet
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

      // Update local state
      setUserData(prev => ({
        ...prev,
        vacationPeriods
      }));
      
      return true; // Indicate success to the VacationDatesPicker
    } catch (error) {
      console.error('Error saving vacation dates:', error);
      throw error; // Re-throw to be handled by the VacationDatesPicker
    }
  };

  if (!userData) {
    return (
      <>
        <Navigation />
        <Layout style={{ minHeight: '100vh' }}>
          <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
            <Text>Loading...</Text>
          </Content>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Layout style={{ minHeight: '80vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
          <Space direction="vertical" style={{ width: '100%', maxWidth: '400px' }} size="large">
          <Text type="secondary" strong>Willkommen, {userData.first_name}! Zeit zu planen.</Text>
            <Title level={2}>Profile</Title>
            <Card style={{ width: '100%', textAlign: 'center' }} className="auth-card">
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
            <Card title="Urlaubsplanung" style={{ width: '100%' }}>
              <VacationDatesPicker
                initialVacations={userData.vacationPeriods || []}
                onSave={handleSaveVacationDates}
                maxVacationDays={userData.vacationDays || 25}
              />
            </Card>
          </Space>
        </Content>
      </Layout>
    </>
  );
}