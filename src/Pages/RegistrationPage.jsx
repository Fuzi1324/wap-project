import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { Layout, Form, Input, Button, Typography, message, Space } from 'antd';

const { Content } = Layout;
const { Title } = Typography;


export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('/api/register');

            const data = await response.json();
            console.log(data);
        }
        catch (error) {
            console.error(error);
        }
    }

    return (
        <>
            <Navigation />
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
                    <Space direction="vertical" style={{ width: '100%', maxWidth: '400px' }} size="large">
                        <Title level={2} style={{ textAlign: 'center' }}>Register</Title>
                        <Form
                            name="register-form"
                            layout="vertical"
                            onFinish={handleSubmit}
                            style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                        >
                            <Form.Item
                                label="Name"
                                name="username"
                                rules={[{ required: true, message: 'Please input your name!' }]}
                            >
                                <Input
                                    type="text"
                                    placeholder="Name"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ required: true, message: 'Please input your email!' }]}
                            >
                                <Input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[{ required: true, message: 'Please input your password!' }]}
                            >
                                <Input.Password
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    Create Account
                                </Button>
                            </Form.Item>
                            
                            <Form.Item>
                                <p style={{ textAlign: 'center' }}>
                                    Already registered? <Link to="/login">Sign In</Link>
                                </p>
                            </Form.Item>
                        </Form>
                    </Space>
                </Content>
            </Layout>
        </>
    )
}
