import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import {
  People,
  PersonAdd,
  CreditCard,
  Science,
  LocalShipping,
  Receipt,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Patients',
      description: 'Manage patient records',
      icon: <People />,
      color: '#1976d2',
      path: '/patients',
    },
    {
      title: 'Check-In & Billing',
      description: 'Register patients and process payments',
      icon: <PersonAdd />,
      color: '#388e3c',
      path: '/check-in',
    },
    {
      title: 'Unpaid Invoices',
      description: 'View and manage unpaid invoices',
      icon: <CreditCard />,
      color: '#f57c00',
      path: '/unpaid-invoices',
    },
    {
      title: 'Lab Tests',
      description: 'Manage laboratory tests',
      icon: <Science />,
      color: '#7b1fa2',
      path: '/tests',
    },
    {
      title: 'Sample Tracking',
      description: 'Track sample processing',
      icon: <LocalShipping />,
      color: '#d32f2f',
      path: '/sample-tracking',
    },
    {
      title: 'Invoices',
      description: 'View and manage invoices',
      icon: <Receipt />,
      color: '#455a64',
      path: '/invoices',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Staff Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to the staff portal. Access your authorized features below.
      </Typography>

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
    </Box>
  );
};

export default StaffDashboard;


