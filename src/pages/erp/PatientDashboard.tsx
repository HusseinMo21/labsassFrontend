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
  Divider,
} from '@mui/material';
import {
  Assessment,
  Person,
  Phone,
  Email,
  Description,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    completedReports: 0,
    pendingReports: 0,
  });

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

    const fetchReportsStats = async () => {
      try {
        const reportsResponse = await axios.get('/api/patient/my-reports');
        console.log('Reports response:', reportsResponse.data);
        const reports = reportsResponse.data?.reports || reportsResponse.data || [];
        console.log('Parsed reports:', reports, 'Count:', reports.length);
        
        // Enhanced reports with status 'delivered' are the completed ones
        const completed = reports.filter((r: any) => r.status === 'delivered').length;
        const pending = reports.filter((r: any) => r.status !== 'delivered').length;
        
        console.log('Stats calculated:', { total: reports.length, completed, pending });
        
        setStats({
          totalReports: reports.length,
          completedReports: completed,
          pendingReports: pending,
        });
      } catch (error: any) {
        console.error('Error fetching reports stats:', error);
        console.error('Error response:', error.response?.data);
        // Set stats to 0 on error to avoid showing stale data
        setStats({
          totalReports: 0,
          completedReports: 0,
          pendingReports: 0,
        });
      }
    };

    if (user) {
      fetchPatientData();
      fetchReportsStats(); // Fetch stats separately to avoid blocking
    }
  }, [user]);

  const quickActions = [
    {
      title: 'My Reports',
      description: 'View your test reports and results',
      icon: <Assessment />,
      color: '#1976d2',
      path: '/patient/reports',
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
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          My Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {patientData ? (
            <>مرحباً <strong>{patientData.name}</strong>، مرحباً بك في بوابة المريض</>
          ) : (
            'Welcome to your patient portal'
          )}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.totalReports}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Reports
                </Typography>
              </Box>
              <Assessment sx={{ fontSize: 48, opacity: 0.3 }} />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.completedReports}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Completed Reports
                </Typography>
              </Box>
              <Description sx={{ fontSize: 48, opacity: 0.3 }} />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.pendingReports}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Pending Reports
                </Typography>
              </Box>
              <Assessment sx={{ fontSize: 48, opacity: 0.3 }} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
        Quick Access
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                  borderColor: action.color,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `${action.color}15`,
                      color: action.color,
                      mr: 2,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    {action.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(action.path)}
                  sx={{
                    bgcolor: action.color,
                    '&:hover': {
                      bgcolor: action.color,
                      opacity: 0.9,
                    },
                  }}
                >
                  View Reports
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Patient Information Card */}
      {patientData && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Patient Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {patientData.name || 'N/A'}
                </Typography>
              </Grid>
              {patientData.phone && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {patientData.phone}
                  </Typography>
                </Grid>
              )}
              {patientData.email && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {patientData.email}
                  </Typography>
                </Grid>
              )}
              {patientData.age && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Age
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {patientData.age} years
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Information Alert */}
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> You can view your test reports after payment is completed and the report is marked as completed by the administrator.
        </Typography>
      </Alert>
    </Box>
  );
};

export default PatientDashboard;
