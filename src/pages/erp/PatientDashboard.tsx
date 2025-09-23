import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Assessment,
  CalendarToday,
  Receipt,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await axios.get('/api/patient/me');
        setPatientData(response.data);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPatientData();
    }
  }, [user]);

  const quickActions = [
    {
      title: 'My Reports',
      description: 'View your test reports (after payment)',
      icon: <Assessment />,
      color: '#1976d2',
      path: '/patient/reports',
    },
    {
      title: 'My Visits',
      description: 'View your visit history',
      icon: <CalendarToday />,
      color: '#388e3c',
      path: '/patient/visits',
    },
    {
      title: 'My Invoices',
      description: 'View and pay your invoices',
      icon: <Receipt />,
      color: '#f57c00',
      path: '/patient/invoices',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        {patientData ? (
          <>مرحباً {patientData.name}، مرحباً بك في بوابة المريض. يمكنك الوصول إلى معلوماتك الطبية أدناه.</>
        ) : (
          'Welcome to your patient portal. Access your medical information below.'
        )}
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Important:</strong> You can only view your test reports after you have paid the full amount and the admin has marked the report as completed.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: action.color,
                      color: 'white',
                      mr: 2,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6" component="h2">
                    {action.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(action.path)}
                  sx={{ bgcolor: action.color }}
                >
                  Access
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'success.light', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Patient Information
        </Typography>
        <Typography variant="body2" paragraph>
          • View your test results and reports
        </Typography>
        <Typography variant="body2" paragraph>
          • Track your visit history and appointments
        </Typography>
        <Typography variant="body2" paragraph>
          • Manage your invoices and payments
        </Typography>
        <Typography variant="body2">
          • Download your reports as PDF files
        </Typography>
      </Box>
    </Box>
  );
};

export default PatientDashboard;
