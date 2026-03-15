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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
  price_period: 'monthly' | 'yearly';
  max_users: number | null;
  max_tests_per_month: number | null;
  is_active: boolean;
  created_at: string;
}

const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    price: 0,
    price_period: 'monthly' as 'monthly' | 'yearly',
    max_users: '' as number | '',
    max_tests_per_month: '' as number | '',
    is_active: true,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/plans');
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error('فشل تحميل الخطط');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      slug: '',
      price: 0,
      price_period: 'monthly',
      max_users: '',
      max_tests_per_month: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      price_period: plan.price_period,
      max_users: plan.max_users ?? '',
      max_tests_per_month: plan.max_tests_per_month ?? '',
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        max_users: form.max_users === '' ? null : Number(form.max_users),
        max_tests_per_month: form.max_tests_per_month === '' ? null : Number(form.max_tests_per_month),
      };
      if (editingPlan) {
        await axios.put(`/api/plans/${editingPlan.id}`, payload);
        toast.success('تم تحديث الخطة');
      } else {
        await axios.post('/api/plans', payload);
        toast.success('تم إنشاء الخطة');
      }
      setDialogOpen(false);
      fetchPlans();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل الحفظ');
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!window.confirm(`حذف الخطة "${plan.name}"؟`)) return;
    try {
      await axios.delete(`/api/plans/${plan.id}`);
      toast.success('تم الحذف');
      fetchPlans();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل الحذف');
    }
  };

  if (user?.role === 'admin' && user?.lab_id != null) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>خطط الاشتراك</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          إضافة خطة
        </Button>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>الاسم</TableCell>
                    <TableCell>السعر</TableCell>
                    <TableCell>الفترة</TableCell>
                    <TableCell>حد المستخدمين</TableCell>
                    <TableCell>حد التحاليل/شهر</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell align="left">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        لا توجد خطط
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell sx={{ fontWeight: 500 }}>{plan.name}</TableCell>
                        <TableCell>{plan.price} ج.م</TableCell>
                        <TableCell>{plan.price_period === 'yearly' ? 'سنوي' : 'شهري'}</TableCell>
                        <TableCell>{plan.max_users ?? '∞'}</TableCell>
                        <TableCell>{plan.max_tests_per_month ?? '∞'}</TableCell>
                        <TableCell>
                          <Chip
                            label={plan.is_active ? 'نشط' : 'غير نشط'}
                            color={plan.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="left">
                          <IconButton size="small" onClick={() => handleOpenEdit(plan)}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(plan)}>
                            <Delete fontSize="small" />
                          </IconButton>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPlan ? 'تعديل الخطة' : 'إضافة خطة'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="الاسم"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/\s/g, '-') }))}
              fullWidth
              required
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))}
              fullWidth
              placeholder="مثال: basic-plan"
            />
            <TextField
              label="السعر (ج.م)"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={form.price_period === 'monthly' ? 'contained' : 'outlined'}
                onClick={() => setForm((f) => ({ ...f, price_period: 'monthly' }))}
              >
                شهري
              </Button>
              <Button
                variant={form.price_period === 'yearly' ? 'contained' : 'outlined'}
                onClick={() => setForm((f) => ({ ...f, price_period: 'yearly' }))}
              >
                سنوي
              </Button>
            </Box>
            <TextField
              label="حد المستخدمين"
              type="number"
              value={form.max_users}
              onChange={(e) => setForm((f) => ({ ...f, max_users: e.target.value === '' ? '' : Number(e.target.value) }))}
              fullWidth
              placeholder="فارغ = غير محدود"
              inputProps={{ min: 0 }}
            />
            <TextField
              label="حد التحاليل شهرياً"
              type="number"
              value={form.max_tests_per_month}
              onChange={(e) => setForm((f) => ({ ...f, max_tests_per_month: e.target.value === '' ? '' : Number(e.target.value) }))}
              fullWidth
              placeholder="فارغ = غير محدود"
              inputProps={{ min: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
              }
              label="نشط"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlansPage;
