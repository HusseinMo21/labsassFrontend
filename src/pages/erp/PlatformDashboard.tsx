import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import {
  Business,
  Science,
  AttachMoney,
  People,
  Assignment,
  CreditCard,
  Person,
  Warning,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PlatformStats {
  labs: number;
  active_labs: number;
  total_subscription_income: number;
  active_subscriptions_count: number;
  trials_count: number;
  expiring_soon_count: number;
  total_users: number;
  active_users: number;
  total_patients: number;
  total_visits: number;
  total_invoices: number;
  total_revenue: number;
  visits_this_month: number;
  patients_this_month: number;
  subscription_income_this_month: number;
  income_by_lab: { lab_id: number; lab_name: string; total: number }[];
  visits_by_lab: { lab_id: number; lab_name: string; visits_count: number }[];
  patients_by_lab: { lab_id: number; lab_name: string; patients_count: number }[];
  revenue_by_lab: { lab_id: number; lab_name: string; revenue: number }[];
  labs_without_subscription: { id: number; name: string; slug: string }[];
}

const PlatformDashboard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'admin' && user?.lab_id != null) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/platform/dashboard/stats');
        setStats(res.data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const s = stats || ({} as PlatformStats);

  const cards = [
    { title: 'إجمالي المعامل', value: s.labs ?? 0, icon: Business, color: '#0d9488', path: '/platform/labs' },
    { title: 'معامل نشطة', value: s.active_labs ?? 0, icon: Science, color: '#0891b2', path: '/platform/labs' },
    { title: 'إجمالي دخل الاشتراكات', value: `${(s.total_subscription_income ?? 0).toLocaleString('ar-EG')} ج.م`, icon: CreditCard, color: '#059669', path: '/platform/subscriptions' },
    { title: 'اشتراكات نشطة', value: s.active_subscriptions_count ?? 0, icon: AttachMoney, color: '#7c3aed', path: '/platform/subscriptions' },
    { title: 'اشتراكات تجريبية', value: s.trials_count ?? 0, icon: Science, color: '#d97706', path: '/platform/subscriptions' },
    { title: 'تنتهي خلال أسبوع', value: s.expiring_soon_count ?? 0, icon: Warning, color: '#dc2626', path: '/platform/subscriptions' },
    { title: 'إجمالي المستخدمين', value: s.total_users ?? 0, icon: Person, color: '#2563eb', path: '/platform/labs' },
    { title: 'إجمالي المرضى', value: s.total_patients ?? 0, icon: People, color: '#0ea5e9', path: '/platform/labs' },
    { title: 'إجمالي الزيارات', value: s.total_visits ?? 0, icon: Assignment, color: '#6366f1', path: '/platform/labs' },
    { title: 'إجمالي الإيرادات (فواتير)', value: `${(s.total_revenue ?? 0).toLocaleString('ar-EG')} ج.م`, icon: AttachMoney, color: '#10b981', path: '/platform/labs' },
    { title: 'زيارات هذا الشهر', value: s.visits_this_month ?? 0, icon: TrendingUp, color: '#14b8a6', path: '/platform/labs' },
    { title: 'مرضى جدد هذا الشهر', value: s.patients_this_month ?? 0, icon: People, color: '#06b6d4', path: '/platform/labs' },
    { title: 'دخل اشتراكات هذا الشهر', value: `${(s.subscription_income_this_month ?? 0).toLocaleString('ar-EG')} ج.م`, icon: CreditCard, color: '#8b5cf6', path: '/platform/subscriptions' },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        لوحة تحكم المنصة
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        إدارة النظام والمعامل — تحليلات شاملة لمالك النظام
      </Typography>

      <Card
        sx={{
          mb: 4,
          border: '2px solid',
          borderColor: 'primary.main',
          background: (t) => alpha(t.palette.primary.main, 0.06),
        }}
      >
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              التحاليل والتصنيفات المرجعية (Master catalog)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              أضف هنا تصنيفات المنصة (دم، بول، …) والتحاليل المرجعية التي يرثها كل معمل ثم يفعّلها ويحدد أسعار البيع من لوحة المعمل.
            </Typography>
          </Box>
          <Button variant="contained" size="large" startIcon={<Science />} onClick={() => navigate('/platform/master-catalog')}>
            فتح إدارة التحاليل المرجعية
          </Button>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {cards.map(({ title, value, icon: Icon, color, path }) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={title}>
            <Card
              onClick={() => path && navigate(path)}
              sx={{
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
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>{value}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{title}</Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: alpha(color, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analysis Tables */}
      <Grid container spacing={3}>
        {s.income_by_lab && s.income_by_lab.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>دخل الاشتراكات حسب المعمل</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>المعمل</TableCell>
                        <TableCell align="left">الإجمالي (ج.م)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {s.income_by_lab.map((row) => (
                        <TableRow key={row.lab_id}>
                          <TableCell>{row.lab_name}</TableCell>
                          <TableCell align="left">{row.total.toLocaleString('ar-EG')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {s.visits_by_lab && s.visits_by_lab.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>الزيارات حسب المعمل (أعلى 10)</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>المعمل</TableCell>
                        <TableCell align="left">عدد الزيارات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {s.visits_by_lab.map((row) => (
                        <TableRow key={row.lab_id}>
                          <TableCell>{row.lab_name}</TableCell>
                          <TableCell align="left">{row.visits_count.toLocaleString('ar-EG')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {s.revenue_by_lab && s.revenue_by_lab.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>إيرادات الفواتير حسب المعمل (أعلى 10)</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>المعمل</TableCell>
                        <TableCell align="left">الإيرادات (ج.م)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {s.revenue_by_lab.map((row) => (
                        <TableRow key={row.lab_id}>
                          <TableCell>{row.lab_name}</TableCell>
                          <TableCell align="left">{row.revenue.toLocaleString('ar-EG')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {s.patients_by_lab && s.patients_by_lab.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>المرضى حسب المعمل (أعلى 10)</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>المعمل</TableCell>
                        <TableCell align="left">عدد المرضى</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {s.patients_by_lab.map((row) => (
                        <TableRow key={row.lab_id}>
                          <TableCell>{row.lab_name}</TableCell>
                          <TableCell align="left">{row.patients_count.toLocaleString('ar-EG')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {s.labs_without_subscription && s.labs_without_subscription.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ borderColor: 'warning.main', borderWidth: 1, borderStyle: 'solid' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'warning.dark' }}>
                  معامل نشطة بدون اشتراك ({s.labs_without_subscription.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  هذه المعامل قد تحتاج لمتابعة أو تجديد اشتراك
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>المعمل</TableCell>
                        <TableCell>Slug</TableCell>
                        <TableCell align="left">إجراء</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {s.labs_without_subscription.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.slug}</TableCell>
                          <TableCell align="left">
                            <Typography
                              component="span"
                              sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => navigate('/platform/subscriptions')}
                            >
                              إضافة اشتراك
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
        )}
      </Grid>
    </Box>
  );
};

export default PlatformDashboard;
