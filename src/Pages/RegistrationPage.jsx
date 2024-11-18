import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { Input, Button, Form, Typography, message } from 'antd';

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
            <div className="register-page">
                <div className="form" style={{ maxWidth: '400px', margin: 'auto' }}>
                    <Form 
                        name="register-form" 
                        onFinish={handleSubmit} 
                        layout="vertical"
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
                                type="text" 
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

                        <Typography.Text className="message">
                            Already registered? <Link to="/login">Sign In</Link>
                        </Typography.Text>
                    </Form>
                </div>
            </div>
        </>
    )
}
