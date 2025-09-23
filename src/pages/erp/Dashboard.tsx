import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People,
  Science,
  Receipt,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
  Refresh,
  Visibility,
  Print,
  Assessment,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface DashboardStats {
  totalPatients: number;
  totalVisits: number;
  totalRevenue: number;
  pendingTests: number;
  underReviewTests: number;
  completedTests: number;
  totalTests: number;
}

interface RecentVisit {
  id: number;
  visit_number: string;
  patient_name: string;
  visit_date: string;
  status: string;
  test_status: string;
  total_amount: number;
  final_amount: number;
  visit_tests: any[];
  patient: {
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalVisits: 0,
    totalRevenue: 0,
    pendingTests: 0,
    underReviewTests: 0,
    completedTests: 0,
    totalTests: 0,
  });
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/stats');
      setStats({
        totalPatients: response.data.totalPatients,
        totalVisits: response.data.totalVisits,
        totalRevenue: response.data.totalRevenue,
        pendingTests: response.data.pendingTests,
        completedTests: response.data.completedTests,
        underReviewTests: response.data.underReviewTests,
        totalTests: response.data.totalTests,
      });
      setRecentVisits(response.data.recentVisits || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: { [key: string]: { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; label: string } } = {
      pending: { color: 'warning', label: 'Pending' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
      'in-progress': { color: 'info', label: 'In Progress' },
      'under-review': { color: 'primary', label: 'Under Review' },
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactElement;
    color: string;
    trend?: number;
    subtitle?: string;
  }> = ({ title, value, icon, color, trend, subtitle }) => (
    <Card 
      sx={{ 
        height: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}20`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${color}30`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              bgcolor: color,
              borderRadius: 2,
              p: 1.5,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          {trend !== undefined && (
            <Chip
              label={`${trend > 0 ? '+' : ''}${trend}%`}
              color={trend > 0 ? 'success' : trend < 0 ? 'error' : 'default'}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {value}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" variant="caption" sx={{ mt: 1, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const completionRate = stats.totalTests > 0 ? Math.round((stats.completedTests / stats.totalTests) * 100) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening in your lab today.
          </Typography>
        </Box>
        <IconButton 
          onClick={fetchDashboardData}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Main Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<People />}
            color="#1976d2"
            trend={12}
            subtitle="Active patients"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Visits"
            value={stats.totalVisits}
            icon={<Schedule />}
            color="#388e3c"
            trend={8}
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<Receipt />}
            color="#f57c00"
            trend={15}
            subtitle="Monthly earnings"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tests"
            value={stats.totalTests}
            icon={<Science />}
            color="#7b1fa2"
            trend={5}
            subtitle="All time"
          />
        </Grid>
      </Grid>

      {/* Test Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tests"
            value={stats.pendingTests}
            icon={<Warning />}
            color="#ff9800"
            subtitle="Awaiting processing"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Under Review"
            value={stats.underReviewTests}
            icon={<TrendingUp />}
            color="#2196f3"
            subtitle="In progress"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Tests"
            value={stats.completedTests}
            icon={<CheckCircle />}
            color="#4caf50"
            subtitle="Ready for delivery"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            icon={<Assessment />}
            color="#9c27b0"
            subtitle="Success rate"
          />
        </Grid>
      </Grid>

      {/* Progress Overview */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Test Processing Overview
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Completed Tests</Typography>
              <Typography variant="body2">{completionRate}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={completionRate} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Chip icon={<CheckCircle />} label={`${stats.completedTests} Completed`} color="success" variant="outlined" />
            <Chip icon={<Warning />} label={`${stats.pendingTests} Pending`} color="warning" variant="outlined" />
            <Chip icon={<TrendingUp />} label={`${stats.underReviewTests} In Review`} color="info" variant="outlined" />
          </Box>
        </CardContent>
      </Card>

      {/* Recent Visits Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Recent Visits
            </Typography>
            <Chip 
              label={`${recentVisits.length} visits`} 
              color="primary" 
              variant="outlined" 
              size="small"
            />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Visit #</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Tests</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Avatar sx={{ bgcolor: 'grey.100', mx: 'auto', mb: 2 }}>
                          <Schedule color="disabled" />
                        </Avatar>
                        <Typography variant="body1" color="text.secondary">
                          No recent visits found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentVisits.map((visit) => (
                    <TableRow key={visit.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {visit.visit_number || `#${visit.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {visit.patient?.name?.charAt(0) || visit.patient_name?.charAt(0) || 'P'}
                          </Avatar>
                          <Typography variant="body2">
                            {visit.patient?.name || visit.patient_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${visit.visit_tests?.length || 0} tests`} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(visit.final_amount || visit.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(visit.test_status || visit.status)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary">
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Report">
                            <IconButton size="small" color="secondary">
                              <Print fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;

