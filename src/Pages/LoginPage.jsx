import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Layout, Form, Input, Button, Typography, message, Space } from 'antd';
import './AuthPages.css';

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
      <Layout style={{ minHeight: '80vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="auth-container">
            <div className="auth-card">
              <Title level={2} className="auth-title">Login</Title>
              <Form
                name="login"
                className="auth-form"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: 'Please input your email!' }]}
                >
                  <Input 
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" className="auth-button">
                    Log in
                  </Button>
                </Form.Item>
              </Form>

              <Form.Item>
                <p style={{ textAlign: 'center' }}>
                  Don't have an account? <Link to="/register">Register now</Link>
                </p>
              </Form.Item>
            </div>
          </div>
        </Content>
      </Layout>
    </>
  );
}