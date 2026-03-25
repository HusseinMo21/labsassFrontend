import { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { Add, Delete, Edit, ExpandMore, Save, DoneAll } from '@mui/icons-material';
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

type CatalogCategoryRow = {
  id: number;
  name: string;
  template_name?: string;
  code: string;
  lab_id?: number | null;
};

function OfferingsTab({ labId }: { labId: number }) {
  const { t, locale } = useLanguage();
  const [categories, setCategories] = useState<CatalogCategoryRow[]>([]);
  const [rows, setRows] = useState<OfferingRow[]>([]);
  const [masterTests, setMasterTests] = useState<LabTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, OfferingDraft>>({});
  const [savingAll, setSavingAll] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createCategoryId, setCreateCategoryId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    price: '',
    sale_price: '',
    display_name: '',
    unit: '',
    turnaround_time_hours: '24',
  });

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkCategoryId, setLinkCategoryId] = useState<number | null>(null);
  const [linkTestId, setLinkTestId] = useState<number | ''>('');
  const [linkPrice, setLinkPrice] = useState('');
  const [linkDisplayName, setLinkDisplayName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, offRes, testRes] = await Promise.all([
        axios.get('/api/test-categories'),
        axios.get(`/api/labs/${labId}/offerings`, { params: { per_page: 500 } }),
        axios.get('/api/tests', { params: { per_page: 500, active_only: true } }),
      ]);
      const cdata = catRes.data?.data ?? catRes.data;
      setCategories(Array.isArray(cdata) ? cdata : []);
      const list = paginatedItems<OfferingRow>(offRes);
      setRows(list);
      setMasterTests(paginatedItems<LabTestRow>(testRes));
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

  const offeredIds = new Set(rows.map((r) => r.lab_test_id));

  const openCreate = (categoryId: number) => {
    setCreateCategoryId(categoryId);
    setCreateForm({
      name: '',
      code: '',
      price: '',
      sale_price: '',
      display_name: '',
      unit: '',
      turnaround_time_hours: '24',
    });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!createCategoryId) return;
    if (!createForm.name.trim() || !createForm.code.trim()) {
      toast.warning(t('catalog.create_test_required'));
      return;
    }
    const refPrice = parseFloat(String(createForm.price).replace(',', '.'));
    if (Number.isNaN(refPrice) || refPrice < 0) {
      toast.error(t('catalog.ref_price_invalid'));
      return;
    }
    try {
      const saleRaw = createForm.sale_price.trim();
      const payload: Record<string, unknown> = {
        category_id: createCategoryId,
        name: createForm.name.trim(),
        code: createForm.code.trim(),
        price: refPrice,
        display_name: createForm.display_name.trim() || undefined,
        unit: createForm.unit.trim() || undefined,
        turnaround_time_hours: parseInt(createForm.turnaround_time_hours, 10) || 24,
      };
      if (saleRaw !== '') {
        const sp = parseFloat(saleRaw.replace(',', '.'));
        if (!Number.isNaN(sp) && sp >= 0) {
          payload.sale_price = sp;
        }
      }
      await axios.post(`/api/labs/${labId}/catalog/tests`, payload);
      toast.success(t('catalog.added_to_catalog'));
      setCreateOpen(false);
      setCreateCategoryId(null);
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.message || JSON.stringify(e.response?.data?.errors)
        : t('common.error');
      toast.error(String(msg));
    }
  };

  const openLink = (categoryId: number) => {
    setLinkCategoryId(categoryId);
    setLinkTestId('');
    setLinkPrice('');
    setLinkDisplayName('');
    setLinkOpen(true);
  };

  const submitLink = async () => {
    if (!linkTestId) {
      toast.warning(t('catalog.select_test_warning'));
      return;
    }
    try {
      await axios.post(`/api/labs/${labId}/offerings`, {
        lab_test_id: linkTestId,
        price: linkPrice ? parseFloat(String(linkPrice).replace(',', '.')) : undefined,
        is_active: true,
        display_name: linkDisplayName.trim() || undefined,
      });
      toast.success(t('catalog.added_to_catalog'));
      setLinkOpen(false);
      setLinkCategoryId(null);
      load();
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : t('common.error');
      toast.error(String(msg));
    }
  };

  const platformTestsToLink = (categoryId: number) =>
    masterTests.filter(
      (test) =>
        (test.lab_id == null || test.lab_id === undefined) &&
        test.category_id === categoryId &&
        !offeredIds.has(test.id)
    );

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
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
          {t('catalog.offerings_intro')}
        </Typography>
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
      </Box>

      {categories.map((cat) => {
        const catRows = rows.filter((o) => o.lab_test?.category_id === cat.id);
        const toLink = platformTestsToLink(cat.id);

        return (
          <Accordion key={cat.id} defaultExpanded disableGutters sx={{ mb: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {cat.name}
                </Typography>
                <Chip size="small" label={cat.code} variant="outlined" />
                {cat.lab_id === labId ? <Chip size="small" label={t('catalog.chip_lab')} /> : null}
                {cat.lab_id == null ? <Chip size="small" label={t('catalog.chip_platform')} variant="outlined" /> : null}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {catRows.length} {t('catalog.tests_in_section')}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Button variant="contained" startIcon={<Add />} size="small" onClick={() => openCreate(cat.id)}>
                  {t('catalog.add_new_test_in_category')}
                </Button>
                {toLink.length > 0 ? (
                  <Button variant="outlined" size="small" onClick={() => openLink(cat.id)}>
                    {t('catalog.link_platform_test')}
                  </Button>
                ) : null}
              </Box>

              {catRows.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  {t('catalog.no_tests_in_category')}
                </Typography>
              ) : (
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
                    {catRows.map((o) => (
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
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('catalog.dialog_new_test_in_category')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label={t('common.name')}
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label={t('common.code')}
            value={createForm.code}
            onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
            fullWidth
            required
            helperText={t('catalog.helper_lab_test_code')}
          />
          <TextField
            label={t('master.ref_price')}
            type="number"
            value={createForm.price}
            onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label={t('catalog.field_sale_price')}
            type="number"
            value={createForm.sale_price}
            onChange={(e) => setCreateForm((f) => ({ ...f, sale_price: e.target.value }))}
            fullWidth
            helperText={t('catalog.helper_sale_default_ref')}
          />
          <TextField
            label={t('catalog.field_display_name')}
            value={createForm.display_name}
            onChange={(e) => setCreateForm((f) => ({ ...f, display_name: e.target.value }))}
            fullWidth
          />
          <TextField
            label={t('master.unit')}
            value={createForm.unit}
            onChange={(e) => setCreateForm((f) => ({ ...f, unit: e.target.value }))}
            fullWidth
          />
          <TextField
            label={t('master.turnaround_hours')}
            type="number"
            value={createForm.turnaround_time_hours}
            onChange={(e) => setCreateForm((f) => ({ ...f, turnaround_time_hours: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={submitCreate}>
            {t('catalog.add')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('catalog.dialog_link_platform')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('catalog.field_test')}</InputLabel>
            <Select
              label={t('catalog.field_test')}
              value={linkTestId === '' ? '' : linkTestId}
              onChange={(e) => setLinkTestId(e.target.value === '' ? '' : (e.target.value as number))}
            >
              {linkCategoryId != null && platformTestsToLink(linkCategoryId).length === 0 ? (
                <MenuItem value="" disabled>
                  {t('catalog.all_tests_added')}
                </MenuItem>
              ) : null}
              {linkCategoryId != null &&
                platformTestsToLink(linkCategoryId).map((test) => (
                  <MenuItem key={test.id} value={test.id}>
                    {test.name} ({test.code})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label={t('catalog.field_sale_price')}
            type="number"
            value={linkPrice}
            onChange={(e) => setLinkPrice(e.target.value)}
            fullWidth
            helperText={t('catalog.helper_link_price')}
          />
          <TextField
            label={t('catalog.field_display_name')}
            value={linkDisplayName}
            onChange={(e) => setLinkDisplayName(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={submitLink}
            disabled={linkTestId === ''}
          >
            {t('catalog.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
