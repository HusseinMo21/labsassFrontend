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
  Avatar,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
      if (result.success && result.user) {
        // Redirect based on user role
        const role = result.user.role;
        let dashboardRoute = '/dashboard';
        
        switch (role) {
          case 'admin':
            dashboardRoute = '/admin/dashboard';
            break;
          case 'staff':
            dashboardRoute = '/staff/dashboard';
            break;
          case 'doctor':
            dashboardRoute = '/doctor/dashboard';
            break;
          case 'patient':
            dashboardRoute = '/patient/dashboard';
            break;
          case 'accountant':
            dashboardRoute = '/accountant/dashboard';
            break;
          default:
            dashboardRoute = '/dashboard';
        }
        
        navigate(dashboardRoute);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setLoginType(newValue);
    setFormData(prev => ({ ...prev, login: '' }));
    setError('');
  };

  return (
    <Box dir="rtl" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box
        sx={{
          minHeight: 'calc(100vh - 120px)',
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
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
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                }}
              >
                ساس
              </Avatar>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800, color: 'primary.main' }}>
                ساس لاب
              </Typography>
              <Typography variant="body1" color="text.secondary">
                تسجيل الدخول إلى حسابك
              </Typography>
            </Box>

            <Tabs
              value={loginType}
              onChange={handleTabChange}
              centered
              sx={{ mb: 3 }}
            >
              <Tab label="موظفين المعمل" value="staff" />
              <Tab label="مريض" value="patient" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={loginType === 'staff' ? 'البريد الإلكتروني' : 'اسم المستخدم'}
                name="login"
                type={loginType === 'staff' ? 'email' : 'text'}
                value={formData.login}
                onChange={handleChange}
                placeholder={loginType === 'staff' ? 'أدخل بريدك الإلكتروني' : 'أدخل اسم المستخدم'}
                required
                disabled={loading}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="كلمة المرور"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور"
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
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>بيانات تجريبية:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>مدير:</strong> admin@lab.com / password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>موظف:</strong> staff@lab.com / password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>دكتور:</strong> doctor@lab.com / password
              </Typography>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => navigate('/')}
                sx={{ color: 'primary.main' }}
              >
                ← العودة للرئيسية
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

