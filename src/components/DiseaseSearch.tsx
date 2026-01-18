import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
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
  FormGroup,
  Grid,
  Chip,
  Pagination,
  Stack,
} from '@mui/material';
import {
  Search,
  Person,
  Assignment,
  CalendarToday,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

interface SearchField {
  key: string;
  label: string;
  dbField: string;
}

const searchFields: SearchField[] = [
  { key: 'clinical_data', label: 'Clinical Data', dbField: 'clinical' },
  { key: 'nature_of_specimen', label: 'Nature of Specimen', dbField: 'nature' },
  { key: 'gross_pathology', label: 'Gross Pathology', dbField: 'gross' },
  { key: 'microscopic_examination', label: 'Microscopic Examination', dbField: 'micro' },
  { key: 'conclusion', label: 'Conclusion', dbField: 'conc' },
  { key: 'recommendations', label: 'Recommendations', dbField: 'reco' },
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((f) => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedFields.length === searchFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(searchFields.map((f) => f.key));
    }
  };

  const handleSearch = async (page: number = 1) => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to search in');
      return;
    }

    try {
      setLoading(true);
      setCurrentPage(page);

      const response = await axios.get<SearchResponse>('/api/reports/search', {
        params: {
          search_term: searchTerm.trim(),
          fields: selectedFields.join(','),
          page: page,
          per_page: 15,
        },
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

          {/* Field Selection */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Select Fields to Search In:
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleSelectAll}
              >
                {selectedFields.length === searchFields.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>
            <FormGroup>
              <Grid container spacing={2}>
                {searchFields.map((field) => (
                  <Grid item xs={12} sm={6} md={4} key={field.key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedFields.includes(field.key)}
                          onChange={() => handleFieldToggle(field.key)}
                        />
                      }
                      label={field.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </Box>

          {/* Search Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setSelectedFields([]);
                setResults([]);
                setHasSearched(false);
                setCurrentPage(1);
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={() => handleSearch(1)}
              disabled={loading || !searchTerm.trim() || selectedFields.length === 0}
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
          No results found. Try adjusting your search term or selecting different fields.
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
                            const fieldLabel = searchFields.find((f) => f.key === field)?.label || field;
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
                                  {searchFields.find((f) => f.key === field)?.label || field}:
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

