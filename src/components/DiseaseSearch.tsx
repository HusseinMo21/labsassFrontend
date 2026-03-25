import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Pagination,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Person,
  Assignment,
  CalendarToday,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

type CatalogCategory = { id: number; name: string };
type CatalogTestRow = {
  lab_test_id: number;
  name: string;
  code: string;
  category_id: number | null;
  category_name: string | null;
};

/** Labels for matched report keys in results (server searches all of these automatically). */
const searchFieldLabels: Record<string, string> = {
  clinical_data: 'Clinical Data',
  nature_of_specimen: 'Nature of Specimen',
  gross_pathology: 'Gross Pathology',
  microscopic_examination: 'Microscopic Examination',
  conclusion: 'Conclusion',
  recommendations: 'Recommendations',
};

interface SearchResult {
  id: number;
  patient_id: number;
  patient_name: string;
  lab_no: string;
  report_date: string;
  visit_id?: number | null;
  clinical?: string;
  nature?: string;
  gross?: string;
  micro?: string;
  conc?: string;
  reco?: string;
  matched_fields: string[];
}

interface SearchResponse {
  data: SearchResult[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const DiseaseSearch: React.FC = () => {
  const navigate = useNavigate();
  const { lab, user } = useAuth();
  const labId = lab?.id ?? user?.lab_id ?? null;

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const [catalogLoading, setCatalogLoading] = useState(false);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [catalogTests, setCatalogTests] = useState<CatalogTestRow[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [filterLabTestId, setFilterLabTestId] = useState<string>('');

  useEffect(() => {
    if (labId == null) {
      setCategories([]);
      setCatalogTests([]);
      setFilterCategoryId('');
      setFilterLabTestId('');
      return;
    }
    let cancelled = false;
    setCatalogLoading(true);
    axios
      .get<{ categories?: CatalogCategory[]; tests?: CatalogTestRow[] }>(`/api/labs/${labId}/catalog`)
      .then((res) => {
        if (cancelled) return;
        setCategories(res.data.categories || []);
        setCatalogTests(res.data.tests || []);
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
          setCatalogTests([]);
          toast.error('Could not load lab catalog for filters.');
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [labId]);

  const testsForFilter = useMemo(() => {
    const cid = filterCategoryId === '' ? null : Number(filterCategoryId);
    if (cid == null) return catalogTests;
    return catalogTests.filter((t) => t.category_id === cid);
  }, [catalogTests, filterCategoryId]);

  useEffect(() => {
    if (filterLabTestId === '') return;
    const tid = Number(filterLabTestId);
    const row = catalogTests.find((t) => t.lab_test_id === tid);
    if (!row) {
      setFilterLabTestId('');
      return;
    }
    if (filterCategoryId !== '' && row.category_id !== Number(filterCategoryId)) {
      setFilterLabTestId('');
    }
  }, [filterCategoryId, filterLabTestId, catalogTests]);

  const handleSearch = async (page: number = 1) => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      setCurrentPage(page);

      const params: Record<string, string | number> = {
        search_term: searchTerm.trim(),
        page: page,
        per_page: 15,
      };
      if (labId != null && filterCategoryId !== '') {
        params.category_id = Number(filterCategoryId);
      }
      if (labId != null && filterLabTestId !== '') {
        params.lab_test_id = Number(filterLabTestId);
      }

      const response = await axios.get<SearchResponse>('/api/reports/search', {
        params,
      });

      setResults(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalResults(response.data.total || 0);
      setHasSearched(true);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || 'Failed to search reports');
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    handleSearch(page);
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!text || !searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '2px 0' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Search color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Disease Search
            </Typography>
          </Box>

          {/* Search Input */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Search Term"
              placeholder="Enter search term (e.g., test, cancer, etc.)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(1);
                }
              }}
              sx={{ mb: 2 }}
            />
          </Box>

          {labId != null && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Lab catalog (optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Your lab&apos;s <strong>test categories</strong> and <strong>catalog tests</strong> (e.g. Hematology,
                CBC). Use this to only find reports for visits that included those tests. All results are still limited
                to your lab.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={catalogLoading}>
                    <InputLabel id="disease-search-category">Lab category</InputLabel>
                    <Select
                      labelId="disease-search-category"
                      label="Lab category"
                      value={filterCategoryId}
                      onChange={(e) => {
                        setFilterCategoryId(e.target.value as string);
                        setFilterLabTestId('');
                      }}
                    >
                      <MenuItem value="">
                        <em>All categories</em>
                      </MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={catalogLoading}>
                    <InputLabel id="disease-search-test">Catalog test</InputLabel>
                    <Select
                      labelId="disease-search-test"
                      label="Catalog test"
                      value={filterLabTestId}
                      onChange={(e) => setFilterLabTestId(e.target.value as string)}
                    >
                      <MenuItem value="">
                        <em>All tests in scope</em>
                      </MenuItem>
                      {testsForFilter.map((t) => (
                        <MenuItem key={t.lab_test_id} value={String(t.lab_test_id)}>
                          {t.name}
                          {t.code ? ` (${t.code})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}

          {labId == null && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No lab is assigned to your account — report search is not limited to a single lab. Connect as a lab user
              to scope results and enable category/test filters.
            </Alert>
          )}

          {/* Search Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setResults([]);
                setHasSearched(false);
                setCurrentPage(1);
                setFilterCategoryId('');
                setFilterLabTestId('');
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={() => handleSearch(1)}
              disabled={loading || !searchTerm.trim()}
            >
              Search
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <Alert severity="info">
          No results found. Try adjusting your search term or lab catalog filters.
        </Alert>
      )}

      {!loading && results.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Search Results
              </Typography>
              <Chip
                label={`${totalResults} result${totalResults !== 1 ? 's' : ''} found`}
                color="primary"
                variant="outlined"
              />
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Lab Number</TableCell>
                    <TableCell>Report Date</TableCell>
                    <TableCell>Matched Fields</TableCell>
                    <TableCell>Preview</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person color="primary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {result.patient_name || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Assignment color="secondary" fontSize="small" />
                          <Typography variant="body2">
                            {result.lab_no || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday color="action" fontSize="small" />
                          <Typography variant="body2">
                            {result.report_date
                              ? new Date(result.report_date).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {result.matched_fields?.map((field, idx) => {
                            const fieldLabel = searchFieldLabels[field] || field;
                            return (
                              <Chip
                                key={idx}
                                label={fieldLabel}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {result.matched_fields?.map((field) => {
                            const fieldData = result[field as keyof SearchResult] as string;
                            if (!fieldData) return null;
                            return (
                              <Typography
                                key={field}
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mb: 0.5,
                                  fontStyle: 'italic',
                                  color: 'text.secondary',
                                }}
                              >
                                <strong>
                                  {searchFieldLabels[field] || field}:
                                </strong>{' '}
                                {highlightText(truncateText(fieldData), searchTerm)}
                              </Typography>
                            );
                          })}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {result.visit_id ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/reports/${result.visit_id}`)}
                            color="primary"
                          >
                            View Report
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Stack spacing={2}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                  <Typography variant="body2" color="text.secondary" align="center">
                    Page {currentPage} of {totalPages}
                  </Typography>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DiseaseSearch;

