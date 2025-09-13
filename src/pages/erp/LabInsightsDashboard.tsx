import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  People,
  Science,
  AttachMoney,
  Schedule,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import axios from '../../config/axios';

interface InsightsData {
  overview: {
    visits: { current: number; previous: number; change: number };
    patients: { current: number; previous: number; change: number };
    tests: { current: number; previous: number; change: number };
    revenue: { current: number; previous: number; change: number };
  };
  revenue: {
    total_revenue: number;
    total_discounts: number;
    net_revenue: number;
    upfront_payments: number;
    outstanding_balance: number;
    average_visit_value: number;
    payment_methods: Array<{ payment_method: string; count: number; amount: number }>;
  };
  tests: {
    status_breakdown: Array<{ status: string; count: number }>;
    average_turnaround_hours: number;
    total_tests: number;
  };
  patients: {
    gender_distribution: Array<{ gender: string; count: number }>;
    age_groups: Record<string, number>;
    insurance_stats: Array<{ has_insurance: boolean; count: number }>;
    new_patients: number;
    returning_patients: number;
  };
  performance: {
    completion_rate: number;
    average_processing_time_hours: number;
    completed_tests: number;
    total_tests: number;
  };
  trends: {
    daily_visits: Array<{ date: string; count: number; revenue: number }>;
    daily_tests: Array<{ date: string; count: number }>;
  };
  categories: Array<{
    id: number;
    name: string;
    test_count: number;
    revenue: number;
  }>;
  top_tests: Array<{
    id: number;
    name: string;
    code: string;
    category: string;
    count: number;
    revenue: number;
    price: number;
  }>;
  recent_activity: {
    recent_visits: Array<{
      id: number;
      patient_name: string;
      visit_date: string;
      test_count: number;
      total_amount: number;
      status: string;
    }>;
    recent_reports: Array<{
      id: number;
      patient_name: string;
      generated_at: string;
      status: string;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LabInsightsDashboard: React.FC = () => {
  useDocumentTitle('Lab Insights Dashboard - Lab System');
  
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    // Initialize CSRF token and fetch data
    const initCSRF = async () => {
      try {
        await axios.get('/sanctum/csrf-cookie');
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
      }
    };
    
    initCSRF().then(() => {
      fetchInsightsData();
    });
  }, [period]);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/lab-insights?period=${period}`);
      
      if (response.data.success) {
        setInsightsData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch insights data');
      }
    } catch (err: any) {
      console.error('Error fetching insights data:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp color="success" />;
    if (change < 0) return <TrendingDown color="error" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!insightsData) {
    return (
      <Box>
        <Alert severity="info">
          No insights data available.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      bgcolor: 'grey.50',
      p: 0
    }}>
      {/* Header Section */}
      <Box sx={{ 
        bgcolor: 'white', 
        borderBottom: 1, 
        borderColor: 'grey.200',
        px: 4,
        py: 3,
        mb: 0
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" maxWidth="100%">
    <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 0.5
            }}>
        Lab Insights Dashboard
      </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive analytics and performance metrics for your laboratory
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={period}
              label="Time Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 4, py: 3 }}>

        {/* Overview Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-4px)',
                transition: 'transform 0.3s ease-in-out',
                boxShadow: 4
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Visits
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {formatNumber(insightsData.overview.visits.current)}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {getChangeIcon(insightsData.overview.visits.change)}
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: 'white', 
                          ml: 0.5,
                          fontWeight: 'medium'
                        }}
                      >
                        {insightsData.overview.visits.change > 0 ? '+' : ''}
                        {insightsData.overview.visits.change}% vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <People sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-4px)',
                transition: 'transform 0.3s ease-in-out',
                boxShadow: 4
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Patients
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {formatNumber(insightsData.overview.patients.current)}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {getChangeIcon(insightsData.overview.patients.change)}
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: 'white', 
                          ml: 0.5,
                          fontWeight: 'medium'
                        }}
                      >
                        {insightsData.overview.patients.change > 0 ? '+' : ''}
                        {insightsData.overview.patients.change}% vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <People sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-4px)',
                transition: 'transform 0.3s ease-in-out',
                boxShadow: 4
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Tests
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {formatNumber(insightsData.overview.tests.current)}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {getChangeIcon(insightsData.overview.tests.change)}
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: 'white', 
                          ml: 0.5,
                          fontWeight: 'medium'
                        }}
                      >
                        {insightsData.overview.tests.change > 0 ? '+' : ''}
                        {insightsData.overview.tests.change}% vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <Science sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              '&:hover': {
                transform: 'translateY(-4px)',
                transition: 'transform 0.3s ease-in-out',
                boxShadow: 4
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Revenue
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {formatCurrency(insightsData.overview.revenue.current)}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {getChangeIcon(insightsData.overview.revenue.change)}
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: 'white', 
                          ml: 0.5,
                          fontWeight: 'medium'
                        }}
                      >
                        {insightsData.overview.revenue.change > 0 ? '+' : ''}
                        {insightsData.overview.revenue.change}% vs last period
                      </Typography>
                    </Box>
                  </Box>
                  <AttachMoney sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
      </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} mb={4}>
          {/* Daily Visits Trend */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transition: 'box-shadow 0.3s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 3
                }}>
                  Daily Visits & Revenue Trend
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={insightsData.trends.daily_visits}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="left" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'count' ? formatNumber(Number(value)) : formatCurrency(Number(value)),
                        name === 'count' ? 'Visits' : 'Revenue'
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      stackId="1"
                      stroke="#667eea"
                      fill="url(#colorVisits)"
                      name="Visits"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stackId="2"
                      stroke="#43e97b"
                      fill="url(#colorRevenue)"
                      name="Revenue"
                    />
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#43e97b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#43e97b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Test Status Distribution */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transition: 'box-shadow 0.3s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 3
                }}>
                  Test Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={insightsData.tests.status_breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {insightsData.tests.status_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatNumber(Number(value))}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance & Revenue Row */}
        <Grid container spacing={3} mb={4}>
          {/* Performance Metrics */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transition: 'box-shadow 0.3s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 3
                }}>
                  Performance Metrics
                </Typography>
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight="medium">Test Completion Rate</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {insightsData.performance.completion_rate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={insightsData.performance.completion_rate}
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                      }
                    }}
                  />
                </Box>
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight="medium">Average Processing Time</Typography>
                    <Typography variant="body2" fontWeight="bold" color="secondary.main">
                      {insightsData.performance.average_processing_time_hours.toFixed(1)} hours
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (insightsData.performance.average_processing_time_hours / 24) * 100)}
                    color="secondary"
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
                      }
                    }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Box textAlign="center" sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, flex: 1, mr: 1 }}>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {formatNumber(insightsData.performance.completed_tests)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completed Tests
                    </Typography>
                  </Box>
                  <Box textAlign="center" sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, flex: 1, ml: 1 }}>
                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                      {formatNumber(insightsData.performance.total_tests)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Tests
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Revenue Breakdown */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transition: 'box-shadow 0.3s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 3
                }}>
                  Revenue Breakdown
                </Typography>
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight="medium">Net Revenue</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(insightsData.revenue.net_revenue)}
                    </Typography>
                  </Box>
                </Box>
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight="medium">Upfront Payments</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(insightsData.revenue.upfront_payments)}
                    </Typography>
                  </Box>
                </Box>
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight="medium">Outstanding Balance</Typography>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      {formatCurrency(insightsData.revenue.outstanding_balance)}
                    </Typography>
                  </Box>
                </Box>
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight="medium">Average Visit Value</Typography>
                    <Typography variant="body2" fontWeight="bold" color="info.main">
                      {formatCurrency(insightsData.revenue.average_visit_value)}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  Payment Methods
                </Typography>
                {insightsData.revenue.payment_methods.map((method, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" mb={2} sx={{ 
                    p: 1.5, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transition: 'background-color 0.2s ease-in-out'
                    }
                  }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                      {method.payment_method}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(method.amount)} ({method.count})
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Tests & Recent Activity */}
        <Grid container spacing={3} mb={4}>
          {/* Top Performing Tests */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transition: 'box-shadow 0.3s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 3
                }}>
                  Top Performing Tests
                </Typography>
                <TableContainer sx={{ 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Test Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Count</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Revenue</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {insightsData.top_tests.map((test, index) => (
                        <TableRow 
                          key={test.id}
                          sx={{ 
                            '&:hover': { bgcolor: 'grey.50' },
                            '&:nth-of-type(even)': { bgcolor: 'grey.25' }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {test.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {test.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={test.category} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ fontWeight: 'medium' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                              {formatNumber(test.count)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {formatCurrency(test.revenue)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(test.price)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transition: 'box-shadow 0.3s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 3
                }}>
                  Recent Activity
                </Typography>
                <Typography variant="subtitle1" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: 'text.primary',
                  mb: 2
                }}>
                  Recent Visits
                </Typography>
                {insightsData.recent_activity.recent_visits.slice(0, 5).map((visit) => (
                  <Box key={visit.id} mb={3} sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      bgcolor: 'grey.100',
                      transition: 'background-color 0.2s ease-in-out'
                    }
                  }}>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {visit.patient_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                      {visit.visit_date} • {visit.test_count} tests • {formatCurrency(visit.total_amount)}
          </Typography>
                    <Box mt={1}>
                      <Chip
                        label={visit.status}
                        size="small"
                        color={visit.status === 'completed' ? 'success' : 'default'}
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Box>
                  </Box>
                ))}
        </CardContent>
      </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LabInsightsDashboard;