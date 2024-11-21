import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { Layout, Form, Input, Button, Typography, message, Space } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

// Validierungsfunktionen
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    return errors;
};

const validateName = (name) => {
    const errors = [];
    if (name.length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    if (!/^[a-zA-Z\s-]+$/.test(name)) {
        errors.push('Name can only contain letters, spaces, and hyphens');
    }
    return errors;
};

export default function RegistrationPage() {
    const [email, setEmail] = useState('')
    const [registrationStep, setRegistrationStep] = useState(1)
    const [activationToken, setActivationToken] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const checkEmailExists = async (email) => {
        try {
            const response = await fetch('/api/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            
            const data = await response.json();
            return response.status === 409; // true wenn die Email bereits existiert (409 Conflict)
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    };

    const handleInitialRegistration = async () => {
        try {
            // Überprüfe zuerst, ob die E-Mail bereits existiert
            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                message.error('This email is already registered');
                return;
            }

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                message.success('Registration initiated. Please check the console for the activation link.');
                setRegistrationStep(2);
            } else {
                const data = await response.json();
                message.error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error(error);
            message.error('Registration failed');
        }
    }

    const handleCompleteRegistration = async () => {
        try {
            // Validiere Namen
            const firstNameErrors = validateName(firstName);
            const lastNameErrors = validateName(lastName);
            
            if (firstNameErrors.length > 0) {
                message.error(firstNameErrors[0]);
                return;
            }
            
            if (lastNameErrors.length > 0) {
                message.error(lastNameErrors[0]);
                return;
            }

            // Validiere Passwort
            const passwordErrors = validatePassword(password);
            if (passwordErrors.length > 0) {
                message.error(passwordErrors[0]);
                return;
            }

            // Überprüfe Passwort-Übereinstimmung
            if (password !== confirmPassword) {
                message.error('Passwords do not match');
                return;
            }

            const response = await fetch(`/api/register/${activationToken}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    password
                }),
            });

            if (response.ok) {
                message.success('Registration completed successfully');
                navigate('/login');
            } else {
                const data = await response.json();
                message.error(data.message || 'Failed to complete registration');
            }
        } catch (error) {
            console.error(error);
            message.error('Failed to complete registration');
        }
    }

    return (
        <>
            <Navigation />
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }}>
                    <Space direction="vertical" style={{ width: '100%', maxWidth: '400px' }} size="large">
                        <Title level={2} style={{ textAlign: 'center' }}>Register</Title>
                        {registrationStep === 1 ? (
                            <Form
                                form={form}
                                name="register-form-step1"
                                layout="vertical"
                                onFinish={handleInitialRegistration}
                                style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                            >
                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Please input your email!' },
                                        { type: 'email', message: 'Please enter a valid email!' },
                                        { 
                                            pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                            message: 'Please enter a valid email format!'
                                        }
                                    ]}
                                >
                                    <Input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" block>
                                        Start Registration
                                    </Button>
                                </Form.Item>
                            </Form>
                        ) : (
                            <Form
                                form={form}
                                name="register-form-step2"
                                layout="vertical"
                                onFinish={handleCompleteRegistration}
                                style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                            >
                                <Form.Item
                                    label="Activation Token"
                                    name="token"
                                    rules={[
                                        { required: true, message: 'Please input the activation token!' },
                                        { 
                                            pattern: /^[A-Za-z0-9-_]+$/,
                                            message: 'Token can only contain letters, numbers, hyphens, and underscores!'
                                        }
                                    ]}
                                >
                                    <Input
                                        placeholder="Activation Token"
                                        value={activationToken}
                                        onChange={e => setActivationToken(e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="First Name"
                                    name="firstName"
                                    rules={[
                                        { required: true, message: 'Please input your first name!' },
                                        { min: 2, message: 'First name must be at least 2 characters!' },
                                        { 
                                            pattern: /^[a-zA-Z\s-]+$/,
                                            message: 'First name can only contain letters, spaces, and hyphens!'
                                        }
                                    ]}
                                >
                                    <Input
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Last Name"
                                    name="lastName"
                                    rules={[
                                        { required: true, message: 'Please input your last name!' },
                                        { min: 2, message: 'Last name must be at least 2 characters!' },
                                        { 
                                            pattern: /^[a-zA-Z\s-]+$/,
                                            message: 'Last name can only contain letters, spaces, and hyphens!'
                                        }
                                    ]}
                                >
                                    <Input
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Password"
                                    name="password"
                                    tooltip="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)"
                                    rules={[
                                        { required: true, message: 'Please input your password!' },
                                        { min: 8, message: 'Password must be at least 8 characters!' },
                                        { 
                                            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
                                            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)!'
                                        }
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    dependencies={['password']}
                                    rules={[
                                        { required: true, message: 'Please confirm your password!' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('The passwords do not match!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" block>
                                        Complete Registration
                                    </Button>
                                </Form.Item>
                            </Form>
                        )}
                        
                        <Form.Item>
                            <p style={{ textAlign: 'center' }}>
                                Already registered? <Link to="/login">Sign In</Link>
                            </p>
                        </Form.Item>
                    </Space>
                </Content>
            </Layout>
        </>
    )
}
