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
  Assessment,
  CheckCircle,
  Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'View Reports',
      description: 'Review and approve patient reports',
      icon: <Assessment />,
      color: '#1976d2',
      path: '/doctor/reports',
    },
    {
      title: 'Approve Reports',
      description: 'Approve completed reports',
      icon: <CheckCircle />,
      color: '#388e3c',
      path: '/doctor/reports',
    },
    {
      title: 'Fill Report Data',
      description: 'Add clinical findings and diagnosis',
      icon: <Edit />,
      color: '#f57c00',
      path: '/doctor/reports',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Doctor Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to the doctor portal. Review and approve patient reports.
      </Typography>

      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
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

      <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Doctor Guidelines
        </Typography>
        <Typography variant="body2" paragraph>
          • You can view all patient reports that have been completed by the lab
        </Typography>
        <Typography variant="body2" paragraph>
          • You can approve reports after reviewing the results
        </Typography>
        <Typography variant="body2" paragraph>
          • You can fill in clinical data, diagnosis, and recommendations
        </Typography>
        <Typography variant="body2">
          • Only admins can mark reports as completed and ready for patients
        </Typography>
      </Box>
    </Box>
  );
};

export default DoctorDashboard;

