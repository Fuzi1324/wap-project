import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Layout, Form, Input, Button, Typography, message, Space } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', email);
      formData.append('password', password);
      formData.append('client_id', 'client');

      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        message.success('Login successful');
        
        // Fetch user data to get ID
        const userResponse = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          navigate(`/user/${userData._id}`);
        } else {
          navigate('/');
        }
      } else {
        message.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error(error);
      message.error('Login failed');
    }
  };

  return (
    <>
      <Navigation />
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
          <Space direction="vertical" style={{ width: '100%', maxWidth: '400px' }} size="large">
            <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
            <Form
              name="login-form"
              layout="vertical"
              onFinish={handleSubmit}
              style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
              </Form.Item>
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Login
                </Button>
              </Form.Item>
              <Form.Item>
                <p style={{ textAlign: 'center' }}>
                  Not registered? <Link to="/register">Create an account</Link>
                </p>
              </Form.Item>
            </Form>
          </Space>
        </Content>
      </Layout>
    </>
  );
}