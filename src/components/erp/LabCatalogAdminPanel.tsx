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
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, Delete, Edit, Save, DoneAll } from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import { type LabTestRow } from './MasterLabTestsTab';
import { useLanguage } from '../../contexts/LanguageContext';

type CategorySettingPayload = {
  is_hidden?: boolean;
  display_name?: string | null;
  sort_order?: number | null;
};

type TestCategoryRow = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  lab_id?: number | null;
  is_active?: boolean;
  display_name?: string;
  template_name?: string;
  category_setting?: CategorySettingPayload | null;
};

type OfferingRow = {
  id: number;
  lab_test_id: number;
  price: string | number;
  is_active: boolean;
  display_name?: string | null;
  lab_test?: LabTestRow;
};

type OfferingDraft = { price: string; is_active: boolean; display_name: string };

function paginatedItems<T>(res: { data?: { data?: T[] } }): T[] {
  const d = res.data?.data;
  return Array.isArray(d) ? d : [];
}

export default function LabCatalogAdminPanel({ labId }: { labId: number }) {
  const { t } = useLanguage();
  const [sub, setSub] = useState(0);

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs value={sub} onChange={(_, v) => setSub(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label={t('catalog.tab_categories')} />
        <Tab label={t('catalog.tab_offerings')} />
      </Tabs>
      {sub === 0 && <CategoriesTab labId={labId} />}
      {sub === 1 && <OfferingsTab labId={labId} />}
    </Box>
  );
}

function CategoriesTab({ labId }: { labId: number }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<TestCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'create' | 'edit' | 'override' | null>(null);
  const [editRow, setEditRow] = useState<TestCategoryRow | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [overrideForm, setOverrideForm] = useState({
    is_hidden: false,
    display_name: '',
    sort_order: '' as string | number,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/test-categories');
      const data = res.data?.data ?? res.data;
      setRows(Array.isArray(data) ? data : []);
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
    setForm({ name: '', code: '', description: '' });
    setDialog('create');
  };

  const openEdit = (r: TestCategoryRow) => {
    if (r.lab_id != null && r.lab_id !== labId) return;
    setEditRow(r);
    setForm({ name: r.name, code: r.code, description: r.description || '' });
    setDialog('edit');
  };

  const openOverride = (r: TestCategoryRow) => {
    if (r.lab_id != null) return;
    setEditRow(r);
    const st = r.category_setting;
    setOverrideForm({
      is_hidden: st?.is_hidden ?? false,
      display_name: st?.display_name ?? '',
      sort_order: st?.sort_order ?? '',
    });
    setDialog('override');
  };

  const saveCreate = async () => {
    try {
      await axios.post('/api/test-categories', {
        name: form.name,
        code: form.code,
        description: form.description || null,
        is_active: true,
      });
      toast.success(t('catalog.created_category'));
      setDialog(null);
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message || JSON.stringify(e.response?.data?.errors) : t('common.error');
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
      });
      toast.success(t('catalog.updated'));
      setDialog(null);
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : t('common.error');
      toast.error(String(msg));
    }
  };

  const saveOverride = async () => {
    if (!editRow) return;
    try {
      await axios.patch(`/api/labs/${labId}/catalog/category-settings/${editRow.id}`, {
        is_hidden: overrideForm.is_hidden,
        display_name: overrideForm.display_name || null,
        sort_order: overrideForm.sort_order === '' ? null : Number(overrideForm.sort_order),
      });
      toast.success(t('catalog.customization_saved'));
      setDialog(null);
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : t('common.error');
      toast.error(String(msg));
    }
  };

  const remove = async (r: TestCategoryRow) => {
    if (r.lab_id == null || r.lab_id !== labId) return;
    if (!window.confirm(t('catalog.delete_confirm'))) return;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('catalog.categories_intro')}
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          {t('catalog.new_lab_category')}
        </Button>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('common.name')}</TableCell>
            <TableCell>{t('common.code')}</TableCell>
            <TableCell>{t('catalog.col_source')}</TableCell>
            <TableCell align="right">{t('common.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.display_name || r.name}</TableCell>
              <TableCell>{r.code}</TableCell>
              <TableCell>
                {r.lab_id == null ? <Chip size="small" label={t('catalog.chip_platform')} color="primary" variant="outlined" /> : null}
                {r.lab_id === labId ? <Chip size="small" label={t('catalog.chip_lab')} sx={{ marginInlineStart: 0.5 }} /> : null}
              </TableCell>
              <TableCell align="right">
                {r.lab_id == null && (
                  <Tooltip title={t('catalog.tooltip_override')}>
                    <Button size="small" onClick={() => openOverride(r)}>
                      {t('catalog.customize_for_lab')}
                    </Button>
                  </Tooltip>
                )}
                {r.lab_id === labId && (
                  <>
                    <IconButton size="small" onClick={() => openEdit(r)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => remove(r)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialog === 'create' || dialog === 'edit'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'create' ? t('catalog.dialog_new_category') : t('catalog.dialog_edit_category')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label={t('common.name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth required />
          <TextField label={t('common.code')} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} fullWidth required />
          <TextField label={t('common.description')} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={dialog === 'create' ? saveCreate : saveEdit}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'override'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('catalog.dialog_override_title', { name: editRow?.template_name ?? editRow?.name ?? '' })}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={overrideForm.is_hidden}
                onChange={(e) => setOverrideForm((f) => ({ ...f, is_hidden: e.target.checked }))}
              />
            }
            label={t('catalog.switch_hide_catalog')}
          />
          <TextField
            label={t('catalog.field_display_name')}
            value={overrideForm.display_name}
            onChange={(e) => setOverrideForm((f) => ({ ...f, display_name: e.target.value }))}
            fullWidth
            helperText={t('catalog.helper_display_name')}
          />
          <TextField
            label={t('catalog.field_sort_order')}
            type="number"
            value={overrideForm.sort_order}
            onChange={(e) => setOverrideForm((f) => ({ ...f, sort_order: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={saveOverride}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function OfferingsTab({ labId }: { labId: number }) {
  const { t, locale } = useLanguage();
  const [rows, setRows] = useState<OfferingRow[]>([]);
  const [tests, setTests] = useState<LabTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newTestId, setNewTestId] = useState<number | ''>('');
  const [newPrice, setNewPrice] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [drafts, setDrafts] = useState<Record<number, OfferingDraft>>({});
  const [savingAll, setSavingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [offRes, testRes] = await Promise.all([
        axios.get(`/api/labs/${labId}/offerings`, { params: { per_page: 200 } }),
        axios.get('/api/tests', { params: { per_page: 200, active_only: true } }),
      ]);
      const list = paginatedItems<OfferingRow>(offRes);
      setRows(list);
      setTests(paginatedItems<LabTestRow>(testRes));
      const d: Record<number, OfferingDraft> = {};
      list.forEach((o) => {
        d[o.id] = {
          price: String(o.price),
          is_active: o.is_active,
          display_name: o.display_name ?? '',
        };
      });
      setDrafts(d);
    } catch {
      toast.error(t('catalog.load_offerings_error'));
    } finally {
      setLoading(false);
    }
  }, [labId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const saveRow = async (id: number) => {
    const d = drafts[id];
    if (!d) return;
    try {
      const dn = (d.display_name ?? '').trim();
      await axios.patch(`/api/labs/${labId}/offerings/${id}`, {
        price: parseFloat(d.price),
        is_active: d.is_active,
        display_name: dn === '' ? null : dn,
      });
      toast.success(t('catalog.price_saved'));
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : t('common.error');
      toast.error(String(msg));
    }
  };

  /** حفظ كل الصفوف المعروضة دفعة واحدة (احتياطي بعد تعديلات كثيرة). */
  const saveAllRows = async () => {
    if (rows.length === 0) {
      toast.info(t('catalog.no_offerings'));
      return;
    }
    setSavingAll(true);
    let ok = 0;
    let fail = 0;
    const failedLabels: string[] = [];

    for (const o of rows) {
      const d = drafts[o.id];
      const label = o.lab_test?.code || String(o.id);
      if (!d) {
        continue;
      }
      const priceNum = parseFloat(String(d.price).replace(',', '.'));
      if (Number.isNaN(priceNum) || priceNum < 0) {
        fail++;
        failedLabels.push(`${label} ${t('catalog.invalid_price_suffix')}`);
        continue;
      }
      try {
        const dn = (d.display_name ?? '').trim();
        await axios.patch(`/api/labs/${labId}/offerings/${o.id}`, {
          price: priceNum,
          is_active: d.is_active,
          display_name: dn === '' ? null : dn,
        });
        ok++;
      } catch {
        fail++;
        failedLabels.push(label);
      }
    }

    setSavingAll(false);

    const details =
      failedLabels.length > 0
        ? ` — ${failedLabels.slice(0, 6).join(locale === 'ar' ? '، ' : ', ')}${failedLabels.length > 6 ? '…' : ''}`
        : '';
    if (fail === 0) {
      toast.success(t('catalog.save_all_success', { ok }));
    } else {
      toast.warning(t('catalog.bulk_warn', { ok, fail, details }));
    }
    await load();
  };

  const addOffering = async () => {
    if (!newTestId) {
      toast.warning(t('catalog.select_test_warning'));
      return;
    }
    try {
      const ndn = newDisplayName.trim();
      await axios.post(`/api/labs/${labId}/offerings`, {
        lab_test_id: newTestId,
        price: newPrice ? parseFloat(newPrice) : undefined,
        is_active: true,
        display_name: ndn === '' ? undefined : ndn,
      });
      toast.success(t('catalog.added_to_catalog'));
      setAddOpen(false);
      setNewTestId('');
      setNewPrice('');
      setNewDisplayName('');
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : t('common.error');
      toast.error(String(msg));
    }
  };

  const offeredIds = new Set(rows.map((r) => r.lab_test_id));
  const testsNotOffered = tests.filter((t) => !offeredIds.has(t.id));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
          {t('catalog.offerings_intro')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Tooltip title={t('catalog.save_all_tooltip')}>
            <span>
              <Button
                variant="contained"
                color="secondary"
                startIcon={savingAll ? <CircularProgress size={18} color="inherit" /> : <DoneAll />}
                onClick={saveAllRows}
                disabled={savingAll || rows.length === 0}
              >
                {savingAll ? t('catalog.saving') : t('catalog.save_all')}
              </Button>
            </span>
          </Tooltip>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setAddOpen(true)}>
            {t('catalog.add_test_to_catalog')}
          </Button>
        </Box>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('catalog.col_reference_name')}</TableCell>
            <TableCell>
              <Tooltip title={t('catalog.helper_offering_display_name')}>
                <span>{t('catalog.field_display_name')}</span>
              </Tooltip>
            </TableCell>
            <TableCell>{t('common.code')}</TableCell>
            <TableCell>{t('catalog.col_price')}</TableCell>
            <TableCell>{t('common.active')}</TableCell>
            <TableCell align="right">{t('common.save')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell sx={{ maxWidth: 200 }}>{o.lab_test?.name ?? '—'}</TableCell>
              <TableCell sx={{ minWidth: 220 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={o.lab_test?.name ?? ''}
                  value={drafts[o.id]?.display_name ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [o.id]: {
                        price: prev[o.id]?.price ?? String(o.price),
                        is_active: prev[o.id]?.is_active ?? o.is_active,
                        display_name: e.target.value,
                      },
                    }))
                  }
                />
              </TableCell>
              <TableCell>{o.lab_test?.code}</TableCell>
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  value={drafts[o.id]?.price ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [o.id]: {
                        price: e.target.value,
                        is_active: prev[o.id]?.is_active ?? o.is_active,
                        display_name: prev[o.id]?.display_name ?? (o.display_name ?? ''),
                      },
                    }))
                  }
                  sx={{ width: 120 }}
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={drafts[o.id]?.is_active ?? o.is_active}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [o.id]: {
                        price: prev[o.id]?.price ?? String(o.price),
                        is_active: e.target.checked,
                        display_name: prev[o.id]?.display_name ?? (o.display_name ?? ''),
                      },
                    }))
                  }
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title={t('catalog.tooltip_save_row')}>
                  <IconButton color="primary" onClick={() => saveRow(o.id)}>
                    <Save />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('catalog.dialog_add_title')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('catalog.field_test')}</InputLabel>
            <Select
              label={t('catalog.field_test')}
              value={newTestId === '' ? '' : newTestId}
              onChange={(e) => setNewTestId(e.target.value === '' ? '' : (e.target.value as number))}
            >
              {testsNotOffered.length === 0 ? (
                <MenuItem value="" disabled>
                  {t('catalog.all_tests_added')}
                </MenuItem>
              ) : (
                testsNotOffered.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <TextField
            label={t('catalog.field_sale_price')}
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            fullWidth
          />
          <TextField
            label={t('catalog.field_display_name')}
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            fullWidth
            helperText={t('catalog.helper_offering_display_name')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={addOffering} disabled={!testsNotOffered.length}>
            {t('catalog.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
