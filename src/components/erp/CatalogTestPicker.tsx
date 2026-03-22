import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Button,
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
  selectedPackages: CatalogPackageRow[];
  onTestsChange: (tests: CatalogTestRow[]) => void;
  onPackagesChange: (pkgs: CatalogPackageRow[]) => void;
};

export default function CatalogTestPicker({
  labId,
  selectedTests,
  selectedPackages,
  onTestsChange,
  onPackagesChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [tests, setTests] = useState<CatalogTestRow[]>([]);
  const [packages, setPackages] = useState<CatalogPackageRow[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

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

  const autocompleteOptions = useMemo(() => {
    let list = tests;
    if (categoryFilter != null) {
      list = list.filter((t) => t.category_id === categoryFilter);
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
  }, [tests, categoryFilter, searchInput]);

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

  const quickTests = useMemo(() => {
    let list = tests;
    if (categoryFilter != null) list = list.filter((t) => t.category_id === categoryFilter);
    return list.slice(0, 10);
  }, [tests, categoryFilter]);

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

      <Typography variant="subtitle2">بحث وإضافة سريعة</Typography>
      <Autocomplete
        options={autocompleteOptions}
        getOptionLabel={(o) => `${o.name} (${o.code}) — ${Number(o.price).toFixed(2)}`}
        inputValue={searchInput}
        onInputChange={(_, v) => setSearchInput(v)}
        onChange={(_, v) => {
          if (v) addTest(v);
          setSearchInput('');
        }}
        renderInput={(params) => <TextField {...params} label="ابحث عن تحليل" placeholder="اسم أو كود" size="small" />}
        loading={loading}
        noOptionsText="لا نتائج"
      />

      <Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          تصفية سريعة بالتصنيف
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          <Chip
            label="الكل"
            size="small"
            onClick={() => setCategoryFilter(null)}
            color={categoryFilter === null ? 'primary' : 'default'}
            variant={categoryFilter === null ? 'filled' : 'outlined'}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              size="small"
              onClick={() => setCategoryFilter(c.id)}
              color={categoryFilter === c.id ? 'primary' : 'default'}
              variant={categoryFilter === c.id ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          إضافة سريعة (أول التحاليل)
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {quickTests.map((t) => (
            <Button
              key={t.offering_id}
              size="small"
              variant="outlined"
              onClick={() => addTest(t)}
              disabled={selectedTests.some((x) => x.offering_id === t.offering_id)}
            >
              + {t.code}
            </Button>
          ))}
        </Stack>
      </Box>

      {packages.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            باقات
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {packages.map((p) => (
              <Button
                key={p.id}
                size="small"
                variant="outlined"
                color="secondary"
                onClick={() => addPackage(p)}
                disabled={selectedPackages.some((x) => x.id === p.id)}
              >
                + {p.name} ({Number(p.package_price).toFixed(2)})
              </Button>
            ))}
          </Stack>
        </Box>
      )}

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
    </Stack>
  );
}
