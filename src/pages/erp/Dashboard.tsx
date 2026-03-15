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
  IconButton,
  Tooltip,
  useTheme,
  alpha,
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
  ArrowForward,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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
  patient: { name: string };
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
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
    const config: Record<string, { color: 'success' | 'warning' | 'info' | 'error' | 'default'; label: string }> = {
      pending: { color: 'warning', label: 'قيد الانتظار' },
      completed: { color: 'success', label: 'مكتمل' },
      'in-progress': { color: 'info', label: 'قيد التنفيذ' },
      'under-review': { color: 'info', label: 'قيد المراجعة' },
    };
    const c = config[status] || { color: 'default' as const, label: status };
    return <Chip label={c.label} color={c.color} size="small" sx={{ fontWeight: 500 }} />;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);

  const completionRate = stats.totalTests > 0 ? Math.round((stats.completedTests / stats.totalTests) * 100) : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const statCards = [
    { title: 'إجمالي المرضى', value: stats.totalPatients, icon: People, color: '#0d9488', path: '/patients' },
    { title: 'الزيارات', value: stats.totalVisits, icon: Schedule, color: '#0891b2', path: '/lab-requests' },
    { title: 'الإيرادات', value: formatCurrency(stats.totalRevenue), icon: Receipt, color: '#7c3aed', path: '/receipts' },
    { title: 'التحاليل', value: stats.totalTests, icon: Science, color: '#dc2626', path: '/reports' },
  ];

  const testStats = [
    { title: 'قيد الانتظار', value: stats.pendingTests, icon: Warning, color: '#f59e0b' },
    { title: 'قيد المراجعة', value: stats.underReviewTests, icon: TrendingUp, color: '#3b82f6' },
    { title: 'مكتمل', value: stats.completedTests, icon: CheckCircle, color: '#22c55e' },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            لوحة التحكم
          </Typography>
          <Typography variant="body1" color="text.secondary">
            نظرة عامة على أداء المعمل
          </Typography>
        </Box>
        <IconButton
          onClick={fetchDashboardData}
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map(({ title, value, icon: Icon, color, path }) => (
          <Grid item xs={12} sm={6} md={3} key={title}>
            <Card
              onClick={() => path && navigate(path)}
              sx={{
                height: '100%',
                cursor: path ? 'pointer' : 'default',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': path ? {
                  borderColor: color,
                  boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
                  transform: 'translateY(-2px)',
                } : {},
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {title}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: alpha(color, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color,
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
                {path && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>عرض</Typography>
                    <ArrowForward sx={{ fontSize: 16 }} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Test Status + Progress */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                حالة التحاليل
              </Typography>
              <Grid container spacing={2}>
                {testStats.map(({ title, value, icon: Icon, color }) => (
                  <Grid item xs={4} key={title}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(color, 0.08),
                        border: '1px solid',
                        borderColor: alpha(color, 0.2),
                        textAlign: 'center',
                      }}
                    >
                      <Icon sx={{ color, fontSize: 28, mb: 1 }} />
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
                      <Typography variant="caption" color="text.secondary">{title}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">نسبة الإنجاز</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{completionRate}%</Typography>
                </Box>
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${completionRate}%`,
                      bgcolor: 'success.main',
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                إجراءات سريعة
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { label: 'تسجيل مريض جديد', path: '/patient-registration' },
                  { label: 'طلبات المعمل', path: '/lab-requests' },
                  { label: 'التقارير', path: '/enhanced-reports' },
                  { label: 'الإيصالات', path: '/receipts' },
                ].map(({ label, path }) => (
                  <Box
                    key={path}
                    onClick={() => navigate(path)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
                    <ArrowForward sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Visits */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              آخر الزيارات
            </Typography>
            <Chip label={`${recentVisits.length}`} size="small" variant="outlined" />
          </Box>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>رقم الزيارة</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>المريض</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>التاريخ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>التحاليل</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>المبلغ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>الحالة</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>إجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Schedule sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                      <Typography color="text.secondary">لا توجد زيارات حديثة</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentVisits.map((visit) => (
                    <TableRow key={visit.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{visit.visit_number || `#${visit.id}`}</TableCell>
                      <TableCell>{visit.patient?.name || visit.patient_name}</TableCell>
                      <TableCell>{new Date(visit.visit_date).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell>{visit.visit_tests?.length || 0}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(visit.final_amount || visit.total_amount)}</TableCell>
                      <TableCell>{getStatusChip(visit.test_status || visit.status)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="عرض">
                          <IconButton size="small" onClick={() => navigate(`/reports/${visit.id}`)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="طباعة">
                          <IconButton size="small"><Print fontSize="small" /></IconButton>
                        </Tooltip>
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
