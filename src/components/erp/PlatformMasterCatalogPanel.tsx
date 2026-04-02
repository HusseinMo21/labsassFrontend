import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import MasterLabTestsTab from './MasterLabTestsTab';
import { useLanguage } from '../../contexts/LanguageContext';

type TestCategoryRow = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  lab_id?: number | null;
  is_active?: boolean;
  report_type?: string | null;
};

const REPORT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'numeric', label: 'Numeric table' },
  { value: 'text', label: 'Text / descriptive' },
  { value: 'culture', label: 'Culture & sensitivity' },
  { value: 'paragraph', label: 'Paragraph (per-test fields)' },
  {
    value: 'pathology',
    label: 'Pathology visit report (clinical, specimen, gross, micro, conclusion)',
  },
  { value: 'single', label: 'Single analyte' },
  { value: 'pcr', label: 'Molecular / PCR' },
];

/**
 * منصة: التصنيفات والتحاليل المرجعية العامة (قوالب لكل المعامل).
 */
export default function PlatformMasterCatalogPanel() {
  const { t } = useLanguage();
  const [sub, setSub] = useState(0);

  return (
    <Box sx={{ mt: 1 }}>
      <Tabs value={sub} onChange={(_, v) => setSub(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label={t('platform_mc.tab_categories')} />
        <Tab label={t('platform_mc.tab_master')} />
      </Tabs>
      {sub === 0 && <PlatformGlobalCategoriesTab />}
      {sub === 1 && (
        <MasterLabTestsTab
          categoryScope="global_only"
          helperText={t('platform_mc.helper')}
        />
      )}
    </Box>
  );
}

function PlatformGlobalCategoriesTab() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<TestCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null);
  const [editRow, setEditRow] = useState<TestCategoryRow | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', report_type: 'numeric' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/test-categories');
      const data = res.data?.data ?? res.data;
      const list: TestCategoryRow[] = Array.isArray(data) ? data : [];
      setRows(list.filter((r) => r.lab_id == null));
    } catch {
      toast.error(t('catalog.load_categories_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({ name: '', code: '', description: '', report_type: 'numeric' });
    setDialog('create');
  };

  const openEdit = (r: TestCategoryRow) => {
    setEditRow(r);
    setForm({
      name: r.name,
      code: r.code,
      description: r.description || '',
      report_type: r.report_type || 'numeric',
    });
    setDialog('edit');
  };

  const saveCreate = async () => {
    try {
      await axios.post('/api/test-categories', {
        name: form.name,
        code: form.code,
        description: form.description || null,
        is_active: true,
        report_type: form.report_type,
      });
      toast.success('تم إنشاء التصنيف');
      setDialog(null);
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message || JSON.stringify(e.response?.data?.errors) : 'خطأ';
      toast.error(String(msg));
    }
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await axios.put(`/api/test-categories/${editRow.id}`, {
        name: form.name,
        code: form.code,
        description: form.description || null,
        is_active: editRow.is_active ?? true,
        report_type: form.report_type,
      });
      toast.success(t('catalog.updated'));
      setDialog(null);
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : t('common.error');
      toast.error(String(msg));
    }
  };

  const remove = async (r: TestCategoryRow) => {
    if (!window.confirm(t('platform_mc.delete_confirm', { name: r.name }))) return;
    try {
      await axios.delete(`/api/test-categories/${r.id}`);
      toast.success(t('catalog.deleted'));
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : t('common.error');
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
          {t('platform_mc.categories_intro')}
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          {t('platform_mc.new_template_category')}
        </Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('common.name')}</TableCell>
            <TableCell>{t('common.code')}</TableCell>
            <TableCell>{t('platform_mc.col_report_layout')}</TableCell>
            <TableCell align="right">{t('common.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.code}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={r.report_type || 'numeric'}
                  color="primary"
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openEdit(r)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => remove(r)}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialog === 'create' || dialog === 'edit'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'create' ? t('platform_mc.dialog_new_template') : t('platform_mc.dialog_edit_category')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label={t('common.name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth required />
          <TextField label={t('common.code')} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} fullWidth required />
          <TextField label={t('common.description')} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} fullWidth multiline rows={2} />
          <FormControl fullWidth size="small">
            <InputLabel id="mc-report-type-label">{t('platform_mc.report_layout')}</InputLabel>
            <Select
              labelId="mc-report-type-label"
              label={t('platform_mc.report_layout')}
              value={form.report_type}
              onChange={(e) => setForm((f) => ({ ...f, report_type: e.target.value }))}
            >
              {REPORT_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={dialog === 'create' ? saveCreate : saveEdit}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
