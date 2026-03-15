import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add, Cancel, Search, AttachMoney, Business } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

interface Lab {
  id: number;
  name: string;
  slug: string;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  price_period: string;
}

interface Subscription {
  id: number;
  lab_id: number;
  plan_id: number;
  status: string;
  starts_at: string;
  expires_at: string;
  amount: number;
  notes: string | null;
  lab?: Lab;
  plan?: Plan;
}

interface Stats {
  total_income: number;
  income_by_lab: { lab_id: number; lab_name: string; lab_slug: string | null; total: number }[];
  labs_with_active_subscription: {
    subscription_id: number;
    lab_id: number;
    lab_name: string;
    lab_slug: string | null;
    plan_name: string;
    plan_price: number;
    status: string;
    expires_at: string;
  }[];
  active_subscriptions_count: number;
}

const SubscriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchLab, setSearchLab] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    lab_id: '' as number | '',
    plan_id: '' as number | '',
    status: 'active' as string,
    starts_at: new Date().toISOString().slice(0, 10),
    expires_at: '',
    amount: '' as number | '',
    notes: '',
    add_initial_payment: false,
    payment_amount: '' as number | '',
    payment_method: '',
    transaction_id: '',
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { per_page: 50 };
      if (searchLab) params.lab_id = searchLab;
      if (statusFilter) params.status = statusFilter;
      const res = await axios.get('/api/subscriptions', { params });
      const data = res.data?.data ?? res.data;
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('فشل تحميل الاشتراكات');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await axios.get('/api/subscriptions/stats');
      setStats(res.data);
    } catch (e) {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const res = await axios.get('/api/labs', { params: { per_page: 200 } });
      const data = res.data?.data ?? res.data;
      setLabs(Array.isArray(data) ? data : []);
    } catch {
      setLabs([]);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await axios.get('/api/plans');
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPlans([]);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [searchLab, statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchLabs();
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setForm({
      lab_id: '',
      plan_id: '',
      status: 'active',
      starts_at: new Date().toISOString().slice(0, 10),
      expires_at: nextMonth.toISOString().slice(0, 10),
      amount: '',
      notes: '',
      add_initial_payment: false,
      payment_amount: '',
      payment_method: '',
      transaction_id: '',
    });
    setDialogOpen(true);
  };

  const handlePlanChange = (planId: number | '') => {
    const plan = plans.find((p) => p.id === planId);
    setForm((f) => ({
      ...f,
      plan_id: planId,
      amount: plan ? plan.price : '',
    }));
  };

  const handleSave = async () => {
    if (!form.lab_id || !form.plan_id) {
      toast.error('اختر المعمل والخطة');
      return;
    }
    try {
      const payload = {
        lab_id: form.lab_id,
        plan_id: form.plan_id,
        status: form.status,
        starts_at: form.starts_at,
        expires_at: form.expires_at,
        amount: form.amount || undefined,
        notes: form.notes || undefined,
        add_initial_payment: form.add_initial_payment,
        payment_amount: form.payment_amount || undefined,
        payment_method: form.payment_method || undefined,
        transaction_id: form.transaction_id || undefined,
      };
      await axios.post('/api/subscriptions', payload);
      toast.success('تم إضافة الاشتراك');
      setDialogOpen(false);
      fetchSubscriptions();
      fetchStats();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل الحفظ');
    }
  };

  const handleCancel = async (sub: Subscription) => {
    if (!window.confirm(`إلغاء اشتراك "${sub.lab?.name}" - "${sub.plan?.name}"؟`)) return;
    try {
      await axios.post(`/api/subscriptions/${sub.id}/cancel`);
      toast.success('تم إلغاء الاشتراك');
      fetchSubscriptions();
      fetchStats();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل الإلغاء');
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { active: 'نشط', expired: 'منتهي', cancelled: 'ملغي', trial: 'تجريبي' };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    const map: Record<string, 'success' | 'error' | 'default' | 'warning'> = {
      active: 'success',
      expired: 'default',
      cancelled: 'error',
      trial: 'warning',
    };
    return map[s] || 'default';
  };

  if (user?.role === 'admin' && user?.lab_id != null) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>الاشتراكات</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          إضافة اشتراك
        </Button>
      </Box>

      {/* Stats */}
      {!statsLoading && stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AttachMoney />
                  <Typography variant="body2">إجمالي الدخل</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {stats.total_income.toLocaleString('ar-EG')} ج.م
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Business />
                  <Typography variant="body2">اشتراكات نشطة</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {stats.active_subscriptions_count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Income by lab */}
      {stats?.income_by_lab && stats.income_by_lab.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>الدخل حسب المعمل</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>المعمل</TableCell>
                    <TableCell align="left">إجمالي الدخل (ج.م)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.income_by_lab.map((row) => (
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
      )}

      {/* Labs with active subscription */}
      {stats?.labs_with_active_subscription && stats.labs_with_active_subscription.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>معامل لديها اشتراك نشط</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>المعمل</TableCell>
                    <TableCell>الخطة</TableCell>
                    <TableCell>السعر</TableCell>
                    <TableCell>ينتهي في</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.labs_with_active_subscription.map((row) => (
                    <TableRow key={row.subscription_id}>
                      <TableCell>{row.lab_name}</TableCell>
                      <TableCell>{row.plan_name}</TableCell>
                      <TableCell>{row.plan_price} ج.م</TableCell>
                      <TableCell>{new Date(row.expires_at).toLocaleDateString('ar-EG')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>المعمل</InputLabel>
              <Select
                value={searchLab}
                label="المعمل"
                onChange={(e) => setSearchLab(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <MenuItem value="">الكل</MenuItem>
                {labs.map((l) => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={statusFilter}
                label="الحالة"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="expired">منتهي</MenuItem>
                <MenuItem value="cancelled">ملغي</MenuItem>
                <MenuItem value="trial">تجريبي</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>المعمل</TableCell>
                    <TableCell>الخطة</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell>من</TableCell>
                    <TableCell>إلى</TableCell>
                    <TableCell>المبلغ</TableCell>
                    <TableCell align="left">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        لا توجد اشتراكات
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.lab?.name ?? '-'}</TableCell>
                        <TableCell>{sub.plan?.name ?? '-'}</TableCell>
                        <TableCell>
                          <Chip label={statusLabel(sub.status)} color={statusColor(sub.status)} size="small" />
                        </TableCell>
                        <TableCell>{new Date(sub.starts_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{new Date(sub.expires_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{sub.amount} ج.م</TableCell>
                        <TableCell align="left">
                          {sub.status === 'active' && (
                            <IconButton size="small" color="error" onClick={() => handleCancel(sub)} title="إلغاء الاشتراك">
                              <Cancel fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add subscription dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة اشتراك (مجاني أو مدفوع)</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>المعمل</InputLabel>
              <Select
                value={form.lab_id}
                label="المعمل"
                onChange={(e) => setForm((f) => ({ ...f, lab_id: e.target.value === '' ? '' : Number(e.target.value) }))}
              >
                <MenuItem value="">اختر المعمل</MenuItem>
                {labs.map((l) => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>الخطة</InputLabel>
              <Select
                value={form.plan_id}
                label="الخطة"
                onChange={(e) => handlePlanChange(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <MenuItem value="">اختر الخطة</MenuItem>
                {plans.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name} - {p.price} ج.م ({p.price_period === 'yearly' ? 'سنوي' : 'شهري'})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={form.status}
                label="الحالة"
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="trial">تجريبي (مجاني)</MenuItem>
                <MenuItem value="expired">منتهي</MenuItem>
                <MenuItem value="cancelled">ملغي</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="تاريخ البداية"
              type="date"
              value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="تاريخ الانتهاء"
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="المبلغ (0 للمجاني)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value === '' ? '' : Number(e.target.value) }))}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="ملاحظات"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="add_payment"
                checked={form.add_initial_payment}
                onChange={(e) => setForm((f) => ({ ...f, add_initial_payment: e.target.checked }))}
              />
              <label htmlFor="add_payment">إضافة دفعة أولى</label>
            </Box>
            {form.add_initial_payment && (
              <>
                <TextField
                  label="مبلغ الدفعة"
                  type="number"
                  value={form.payment_amount}
                  onChange={(e) => setForm((f) => ({ ...f, payment_amount: e.target.value === '' ? '' : Number(e.target.value) }))}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="طريقة الدفع"
                  value={form.payment_method}
                  onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="رقم المعاملة"
                  value={form.transaction_id}
                  onChange={(e) => setForm((f) => ({ ...f, transaction_id: e.target.value }))}
                  fullWidth
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.lab_id || !form.plan_id}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionsPage;
