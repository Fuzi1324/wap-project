import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

export default function UserPage() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    setUsername(localStorage.getItem('username'));
  }, []);
  
  return (
    <div style={{ padding: '2rem' }}>
      <Navigation />
      <Space direction="vertical" style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={2}>User Page</Title>
        <Card style={{ width: 300, textAlign: 'center' }}>
          <Text>Welcome back,</Text>
          <Title level={3}>{username}</Title>
        </Card>
      </Space>
    </div>
  );
}
