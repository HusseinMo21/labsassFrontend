import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import axios from '../../config/axios';

export type CatalogTestRow = {
  offering_id: number;
  lab_test_id: number;
  code: string;
  name: string;
  price: number;
  category_id: number | null;
  category_name: string | null;
};

export type CatalogPackageRow = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  package_price: number;
  items: { lab_test_id: number; quantity: number; test_name: string; test_code: string }[];
};

export type CatalogCategory = { id: number; name: string };

type Props = {
  labId: number | null;
  selectedTests: CatalogTestRow[];
  selectedPackages?: CatalogPackageRow[];
  onTestsChange: (tests: CatalogTestRow[]) => void;
  onPackagesChange?: (pkgs: CatalogPackageRow[]) => void;
  showPackages?: boolean;
  /** When false, hide the chip lists at the bottom (e.g. parent shows selection elsewhere). */
  showSelectedChips?: boolean;
};

export default function CatalogTestPicker({
  labId,
  selectedTests,
  selectedPackages = [],
  onTestsChange,
  onPackagesChange = () => {},
  showPackages = false,
  showSelectedChips = true,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [tests, setTests] = useState<CatalogTestRow[]>([]);
  const [packages, setPackages] = useState<CatalogPackageRow[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [categoryTab, setCategoryTab] = useState<string>('all');

  const activeCategoryId = categoryTab === 'all' ? null : Number(categoryTab);

  const fetchCatalog = useCallback(async () => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/labs/${labId}/catalog`, {
        headers: { Accept: 'application/json' },
      });
      setCategories(res.data.categories || []);
      setTests(res.data.tests || []);
      setPackages(res.data.packages || []);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message || e.message : 'فشل تحميل الكتالوج';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const testsForBrowse = useMemo(() => {
    let list = tests;
    if (activeCategoryId != null) {
      list = list.filter((t) => t.category_id === activeCategoryId);
    }
    return list;
  }, [tests, activeCategoryId]);

  const autocompleteOptions = useMemo(() => {
    let list = tests;
    if (activeCategoryId != null) {
      list = list.filter((t) => t.category_id === activeCategoryId);
    }
    const q = searchInput.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.category_name && t.category_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tests, activeCategoryId, searchInput]);

  const addTest = (t: CatalogTestRow) => {
    if (selectedTests.some((x) => x.offering_id === t.offering_id)) return;
    onTestsChange([...selectedTests, t]);
  };

  const removeTest = (offeringId: number) => {
    onTestsChange(selectedTests.filter((x) => x.offering_id !== offeringId));
  };

  const addPackage = (p: CatalogPackageRow) => {
    if (selectedPackages.some((x) => x.id === p.id)) return;
    onPackagesChange([...selectedPackages, p]);
  };

  const removePackage = (id: number) => {
    onPackagesChange(selectedPackages.filter((x) => x.id !== id));
  };

  const quickTests = useMemo(() => testsForBrowse.slice(0, 36), [testsForBrowse]);

  const isSelected = (offeringId: number) => selectedTests.some((x) => x.offering_id === offeringId);

  if (!labId) {
    return (
      <Typography color="text.secondary" sx={{ py: 1 }}>
        لا يوجد مختبر مرتبط بالحساب — لا يمكن تحميل الكتالوج.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {loading && (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={20} />
          <Typography variant="body2">جاري تحميل كتالوج المختبر…</Typography>
        </Box>
      )}
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <Typography variant="subtitle2" fontWeight={800}>
        بحث سريع — اكتب اسم أو كود ثم Enter
      </Typography>
      <Autocomplete
        options={autocompleteOptions}
        getOptionLabel={(o) => `${o.name} (${o.code}) — ${Number(o.price).toFixed(2)} ج.م`}
        inputValue={searchInput}
        onInputChange={(_, v) => setSearchInput(v)}
        onChange={(_, v) => {
          if (v) addTest(v);
          setSearchInput('');
        }}
        autoHighlight
        clearOnBlur={false}
        ListboxProps={{ style: { maxHeight: 360 } }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="ابحث وأضف تحليلاً"
            placeholder="مثال: CBP أو سكر"
            size="medium"
            autoFocus
          />
        )}
        loading={loading}
        noOptionsText="لا نتائج — غيّر التصنيف أو النص"
      />

      <Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
          تصنيف (ضغطة واحدة)
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label="الكل"
            onClick={() => setCategoryTab('all')}
            color={categoryTab === 'all' ? 'primary' : 'default'}
            variant={categoryTab === 'all' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700 }}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              onClick={() => setCategoryTab(String(c.id))}
              color={categoryTab === String(c.id) ? 'primary' : 'default'}
              variant={categoryTab === String(c.id) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          اختصارات بالكود (مرّر أفقياً)
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            pb: 0.5,
            mx: -0.5,
            px: 0.5,
          }}
        >
          {quickTests.map((t) => (
            <Tooltip key={t.offering_id} title={`${t.name} — ${Number(t.price).toFixed(2)} ج.م`} placement="top">
              <span>
                <Button
                  size="small"
                  variant={isSelected(t.offering_id) ? 'contained' : 'outlined'}
                  color={isSelected(t.offering_id) ? 'success' : 'primary'}
                  onClick={() => addTest(t)}
                  disabled={isSelected(t.offering_id)}
                  sx={{ flexShrink: 0, minWidth: 'auto', px: 1.25, fontWeight: 700 }}
                >
                  +{t.code}
                </Button>
              </span>
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            قائمة التحاليل — عمودان للاختيار السريع
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {testsForBrowse.length} تحليل
          </Typography>
        </Stack>
        <Box
          sx={{
            maxHeight: 340,
            overflow: 'auto',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 1,
            bgcolor: 'action.hover',
          }}
        >
          {testsForBrowse.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              لا توجد تحاليل في هذا التصنيف
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {testsForBrowse.map((t) => {
                const sel = isSelected(t.offering_id);
                return (
                  <Grid item xs={12} sm={6} key={t.offering_id}>
                    <Button
                      fullWidth
                      variant={sel ? 'contained' : 'outlined'}
                      color={sel ? 'success' : 'primary'}
                      onClick={() => (sel ? removeTest(t.offering_id) : addTest(t))}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        py: 1.1,
                        px: 1.25,
                        textTransform: 'none',
                        alignItems: 'flex-start',
                        minHeight: 56,
                        borderWidth: sel ? 0 : 1,
                      }}
                    >
                      <Box sx={{ width: '100%', minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap title={t.name}>
                          {t.name}
                        </Typography>
                        <Typography variant="caption" color={sel ? 'inherit' : 'text.secondary'} display="block">
                          {t.code} · {Number(t.price).toFixed(2)} ج.م
                          {t.category_name ? ` · ${t.category_name}` : ''}
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Box>

      {showPackages && packages.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }} fontWeight={800}>
            باقات
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {packages.map((p) => (
              <Button
                key={p.id}
                size="medium"
                variant={selectedPackages.some((x) => x.id === p.id) ? 'contained' : 'outlined'}
                color="secondary"
                onClick={() =>
                  selectedPackages.some((x) => x.id === p.id) ? removePackage(p.id) : addPackage(p)
                }
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {selectedPackages.some((x) => x.id === p.id) ? '✓ ' : '+ '}
                {p.name} ({Number(p.package_price).toFixed(2)})
              </Button>
            ))}
          </Stack>
        </Box>
      )}

      {showSelectedChips && (
        <>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              المختار (تحاليل)
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {selectedTests.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  لم يُختر تحليل بعد
                </Typography>
              )}
              {selectedTests.map((t) => (
                <Chip
                  key={t.offering_id}
                  label={`${t.name} (${Number(t.price).toFixed(2)})`}
                  onDelete={() => removeTest(t.offering_id)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          {showPackages && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                المختار (باقات)
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {selectedPackages.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
                {selectedPackages.map((p) => (
                  <Chip
                    key={p.id}
                    label={`${p.name} (${Number(p.package_price).toFixed(2)})`}
                    onDelete={() => removePackage(p.id)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
