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
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

interface Lab {
  id: number;
  name: string;
  slug: string;
  subdomain: string | null;
  is_active: boolean;
  created_at: string;
}

const LabsPage: React.FC = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', subdomain: '', is_active: true });

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/labs', { params: { search, per_page: 100 } });
      const paginated = res.data;
      const data = paginated?.data ?? (Array.isArray(paginated) ? paginated : []);
      setLabs(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('فشل تحميل المعامل');
      setLabs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingLab(null);
    setForm({ name: '', slug: '', subdomain: '', is_active: true });
    setDialogOpen(true);
  };

  const handleOpenEdit = (lab: Lab) => {
    setEditingLab(lab);
    setForm({
      name: lab.name,
      slug: lab.slug,
      subdomain: lab.subdomain || lab.slug,
      is_active: lab.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingLab) {
        await axios.put(`/api/labs/${editingLab.id}`, form);
        toast.success('تم تحديث المعمل');
      } else {
        await axios.post('/api/labs', { ...form, subdomain: form.subdomain || form.slug });
        toast.success('تم إنشاء المعمل');
      }
      setDialogOpen(false);
      fetchLabs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل الحفظ');
    }
  };

  const handleDelete = async (lab: Lab) => {
    if (!window.confirm(`حذف المعمل "${lab.name}"؟`)) return;
    try {
      await axios.delete(`/api/labs/${lab.id}`);
      toast.success('تم الحذف');
      fetchLabs();
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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>المعامل</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
            إضافة معمل
          </Button>
        </Box>
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
                    <TableCell>Slug</TableCell>
                    <TableCell>Subdomain</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell align="left">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        لا توجد معامل
                      </TableCell>
                    </TableRow>
                  ) : (
                    labs.map((lab) => (
                      <TableRow key={lab.id}>
                        <TableCell sx={{ fontWeight: 500 }}>{lab.name}</TableCell>
                        <TableCell>{lab.slug}</TableCell>
                        <TableCell>{lab.subdomain || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={lab.is_active ? 'نشط' : 'غير نشط'}
                            color={lab.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="left">
                          <IconButton size="small" onClick={() => handleOpenEdit(lab)}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(lab)}>
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
        <DialogTitle>{editingLab ? 'تعديل المعمل' : 'إضافة معمل'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="الاسم"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))}
              fullWidth
              required
              placeholder="مثال: cairo-lab"
            />
            <TextField
              label="Subdomain"
              value={form.subdomain}
              onChange={(e) => setForm((f) => ({ ...f, subdomain: e.target.value }))}
              fullWidth
              placeholder="اختياري"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <label htmlFor="is_active">نشط</label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.slug}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabsPage;
