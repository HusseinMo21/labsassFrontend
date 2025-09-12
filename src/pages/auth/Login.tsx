import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Tabs,
  Tab,
  Container,
  Paper,
  Avatar,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';

const Login: React.FC = () => {
  const [loginType, setLoginType] = useState('staff');
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.login, formData.password);
      if (result.success) {
        if (result.user && result.user.role === 'patient') {
          navigate('/patient/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setLoginType(newValue);
    setFormData(prev => ({ ...prev, login: '' }));
    setError('');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box
        sx={{
          minHeight: 'calc(100vh - 120px)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                LAB
              </Avatar>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                DR.Yasser Mohamed LAB
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to your account
              </Typography>
            </Box>

            <Tabs
              value={loginType}
              onChange={handleTabChange}
              centered
              sx={{ mb: 3 }}
            >
              <Tab label="Staff Login" value="staff" />
              <Tab label="Patient Login" value="patient" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={loginType === 'staff' ? 'Email Address' : 'Username'}
                name="login"
                type={loginType === 'staff' ? 'email' : 'text'}
                value={formData.login}
                onChange={handleChange}
                placeholder={loginType === 'staff' ? 'Enter your email' : 'Enter your username'}
                required
                disabled={loading}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
                sx={{ mb: 4 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Demo Credentials:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Admin: admin@lab.com / password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Staff: staff@lab.com / password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Doctor: doctor@lab.com / password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Patient: patient@lab.com / password
              </Typography>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => navigate('/')}
                sx={{ color: 'primary.main' }}
              >
                ← Back to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
      </Box>
    </Box>
  );
};

export default Login;
