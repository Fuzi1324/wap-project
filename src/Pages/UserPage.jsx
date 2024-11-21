import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Layout, Button, Typography, Space, Divider, Row, Col, message, Card } from 'antd';

const { Title, Text } = Typography;
const { Content } = Layout;

export default function UserPage() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    setUsername(localStorage.getItem('username'));
  }, []);

  return (
    <>
      <Navigation />
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
          <Space direction="vertical" style={{ width: '100%', maxWidth: '400px' }} size="large">
            <Title level={2}>User Page</Title>
            <Card style={{ width: 250, textAlign: 'center' }}>
              <Text>Welcome back</Text>
              <Title level={3}>{username}</Title>
            </Card>
            <div style={{ minHeight: '300px', flexGrow: 1, backgroundColor: '#f4f4f5' }}>
            </div>
          </Space>
        </Content>
      </Layout>
    </>
  );
}