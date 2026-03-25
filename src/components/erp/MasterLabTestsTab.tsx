import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../../contexts/LanguageContext';

export type TestCategoryRow = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  lab_id?: number | null;
  is_active?: boolean;
  display_name?: string;
};

export type LabTestRow = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  price: string | number;
  unit?: string | null;
  reference_range?: string | null;
  preparation_instructions?: string | null;
  turnaround_time_hours: number;
  category_id: number;
  lab_id?: number | null;
  is_active?: boolean;
  category?: { id: number; name: string };
};

function paginatedItems<T>(res: { data?: { data?: T[] } }): T[] {
  const d = res.data?.data;
  return Array.isArray(d) ? d : [];
}

type Props = {
  /** Shown above the table */
  helperText?: string;
  /** Platform: only global template categories in the dropdown */
  categoryScope?: 'all_visible' | 'global_only';
};

export default function MasterLabTestsTab({
  helperText,
  categoryScope = 'all_visible',
}: Props) {
  const { t } = useLanguage();
  const displayHelper = helperText ?? t('master.helper_default');
  const [rows, setRows] = useState<LabTestRow[]>([]);
  const [categories, setCategories] = useState<TestCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
    unit: '',
    reference_range: '',
    preparation_instructions: '',
    turnaround_time_hours: '24',
    category_id: '' as string | number,
    is_active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [testsRes, catRes] = await Promise.all([
        axios.get('/api/tests', { params: { per_page: 200 } }),
        axios.get('/api/test-categories'),
      ]);
      setRows(paginatedItems<LabTestRow>(testsRes));
      let cdata = catRes.data?.data ?? catRes.data;
      let cats: TestCategoryRow[] = Array.isArray(cdata) ? cdata : [];
      if (categoryScope === 'global_only') {
        cats = cats.filter((c) => c.lab_id == null);
      }
      setCategories(cats);
    } catch {
      toast.error(t('master.load_error'));
    } finally {
      setLoading(false);
    }
  }, [categoryScope, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm({
      name: '',
      code: '',
      description: '',
      price: '',
      unit: '',
      reference_range: '',
      preparation_instructions: '',
      turnaround_time_hours: '24',
      category_id: categories[0]?.id ?? '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (r: LabTestRow) => {
    setEditId(r.id);
    setForm({
      name: r.name,
      code: r.code,
      description: r.description || '',
      price: String(r.price),
      unit: r.unit || '',
      reference_range: r.reference_range || '',
      preparation_instructions: r.preparation_instructions || '',
      turnaround_time_hours: String(r.turnaround_time_hours),
      category_id: r.category_id,
      is_active: r.is_active !== false,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      unit: form.unit || null,
      reference_range: form.reference_range || null,
      preparation_instructions: form.preparation_instructions || null,
      turnaround_time_hours: parseInt(String(form.turnaround_time_hours), 10) || 24,
      category_id: Number(form.category_id),
      is_active: form.is_active,
    };
    try {
      if (editId) {
        await axios.put(`/api/tests/${editId}`, payload);
        toast.success(t('master.updated'));
      } else {
        await axios.post('/api/tests', payload);
        toast.success(t('master.created'));
      }
      setDialogOpen(false);
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message || JSON.stringify(e.response?.data?.errors) : t('common.error');
      toast.error(String(msg));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
          {displayHelper}
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>
          {t('master.new_reference')}
        </Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('common.name')}</TableCell>
            <TableCell>{t('common.code')}</TableCell>
            <TableCell>{t('master.col_category')}</TableCell>
            <TableCell>{t('master.ref_price')}</TableCell>
            <TableCell>{t('common.active')}</TableCell>
            <TableCell align="right">{t('common.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.code}</TableCell>
              <TableCell>{r.category?.name || r.category_id}</TableCell>
              <TableCell>{r.price}</TableCell>
              <TableCell>{r.is_active === false ? t('common.no') : t('common.yes')}</TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openEdit(r)}>
                  <Edit fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? t('master.dialog_edit') : t('master.dialog_new')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label={t('common.name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth required />
          <TextField label={t('common.code')} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} fullWidth required />
          <FormControl fullWidth required>
            <InputLabel>{t('master.col_category')}</InputLabel>
            <Select
              label={t('master.col_category')}
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value as number }))}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.display_name || c.name} ({c.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label={t('master.ref_price')} type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} fullWidth required />
          <TextField label={t('master.unit')} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} fullWidth />
          <TextField label={t('master.turnaround_hours')} type="number" value={form.turnaround_time_hours} onChange={(e) => setForm((f) => ({ ...f, turnaround_time_hours: e.target.value }))} fullWidth required />
          <TextField label={t('master.reference_range')} value={form.reference_range} onChange={(e) => setForm((f) => ({ ...f, reference_range: e.target.value }))} fullWidth />
          <TextField label={t('master.preparation')} value={form.preparation_instructions} onChange={(e) => setForm((f) => ({ ...f, preparation_instructions: e.target.value }))} fullWidth multiline rows={2} />
          <TextField label={t('common.description')} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} fullWidth multiline rows={2} />
          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />}
            label={t('common.active')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={save}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
