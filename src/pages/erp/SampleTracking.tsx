import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Pagination,
} from '@mui/material';
import {
  Search,
  Update,
  Science,
  Person,
  LocationOn,
  Schedule,
  Refresh,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface SampleTracking {
  id: number;
  sample_id: string;
  sample_type: string;
  status: string;
  location?: string;
  notes?: string;
  collection_date?: string;
  received_date?: string;
  processing_started_at?: string;
  analysis_started_at?: string;
  completed_at?: string;
  disposed_at?: string;
  lab_request_id: number;
  lab_request: {
    id: number;
    lab_no: string;
    patient_id: number;
    patient: {
      id: number;
      name: string;
      phone?: string;
      gender?: string;
    };
  };
  collected_by?: {
    id: number;
    name: string;
  };
  received_by?: {
    id: number;
    name: string;
  };
  processed_by?: {
    id: number;
    name: string;
  };
  analyzed_by?: {
    id: number;
    name: string;
  };
  disposed_by?: {
    id: number;
    name: string;
  };
}

interface Stats {
  total_samples: number;
  collected: number;
  received: number;
  processing: number;
  analyzing: number;
  completed: number;
  disposed: number;
  lost: number;
  rejected: number;
}

const SampleTracking: React.FC = () => {
  const [samples, setSamples] = useState<SampleTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total_samples: 0,
    collected: 0,
    received: 0,
    processing: 0,
    analyzing: 0,
    completed: 0,
    disposed: 0,
    lost: 0,
    rejected: 0,
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleTracking | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: '',
    location: '',
    notes: '',
  });
  const [filter, setFilter] = useState({
    status: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  useEffect(() => {
    
    fetchSamples();
    fetchStats();
  }, [currentPage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('per_page', '15');
      if (filter.status) params.append('status', filter.status);
      if (filter.search) params.append('search', filter.search);
      
      const response = await axios.get(`/api/sample-tracking?${params}`);
      setSamples(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      toast.error('Failed to fetch samples');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/sample-tracking/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      console.log('Updating sample status:', selectedSample?.id, statusForm);
      
      
      await axios.put(`/api/sample-tracking/${selectedSample?.id}/status`, statusForm, {
        headers: {
        }
      });
      
      toast.success('Sample status updated successfully');
      setShowStatusModal(false);
      setSelectedSample(null);
      setStatusForm({ status: '', location: '', notes: '' });
      fetchSamples();
      fetchStats();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update sample status');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchSamples();
  };

  const handleSearchInputChange = (value: string) => {
    setFilter(prev => ({ ...prev, search: value }));
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchSamples();
    }, 500); // Wait 500ms after user stops typing
    
    setSearchTimeout(timeout);
  };

  const openStatusModal = (sample: SampleTracking) => {
    setSelectedSample(sample);
    setStatusForm({
      status: sample.status,
      location: sample.location || '',
      notes: sample.notes || '',
    });
    setShowStatusModal(true);
  };

  const getStatusChip = (status: string) => {
    const statusColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      collected: 'primary',
      received: 'info',
      processing: 'warning',
      analyzing: 'secondary',
      completed: 'success',
      disposed: 'default',
      lost: 'error',
      rejected: 'error',
    };
    
    return (
      <Chip
        label={status.toUpperCase()}
        color={statusColors[status] || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };

  const getStatusOptions = () => [
    { value: 'collected', label: 'Collected' },
    { value: 'received', label: 'Received' },
    { value: 'processing', label: 'Processing' },
    { value: 'analyzing', label: 'Analyzing' },
    { value: 'completed', label: 'Completed' },
    { value: 'disposed', label: 'Disposed' },
    { value: 'lost', label: 'Lost' },
    { value: 'rejected', label: 'Rejected' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Sample Tracking
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {stats.total_samples}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Samples
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {stats.processing + stats.analyzing}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {stats.collected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  label="Status Filter"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {getStatusOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by sample ID or patient name..."
                value={filter.search}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // Clear timeout and search immediately on Enter
                    if (searchTimeout) {
                      clearTimeout(searchTimeout);
                    }
                    handleSearch();
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={fetchSamples}
                fullWidth
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Samples Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Sample Tracking
            </Typography>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchSamples}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Sample ID</strong></TableCell>
                  <TableCell><strong>Patient</strong></TableCell>
                  <TableCell><strong>Test</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell><strong>Collected</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {samples.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Alert severity="info">No samples found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  samples.map((sample) => (
                    <TableRow key={sample.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Science color="primary" />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {sample.sample_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person color="primary" />
                          <Typography variant="body2">
                            {sample.lab_request?.patient?.name || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {sample.sample_type || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(sample.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">
                            {sample.location || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2">
                            {sample.collection_date
                              ? new Date(sample.collection_date).toLocaleDateString()
                              : '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Update />}
                          onClick={() => openStatusModal(sample)}
                        >
                          Update Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Status Update Modal */}
      <Dialog open={showStatusModal} onClose={() => setShowStatusModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Sample Status</DialogTitle>
        <DialogContent>
          {selectedSample && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Sample ID:</strong> {selectedSample.sample_id}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Patient:</strong> {selectedSample.lab_request?.patient?.name || 'Unknown'}
              </Typography>
              <Typography variant="body2">
                <strong>Test:</strong> {selectedSample.sample_type || 'Unknown'}
              </Typography>
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusForm.status}
              onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              label="Status"
            >
              {getStatusOptions().map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Location"
            placeholder="Current location"
            value={statusForm.location}
            onChange={(e) => setStatusForm({ ...statusForm, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Notes"
            placeholder="Additional notes..."
            multiline
            rows={3}
            value={statusForm.notes}
            onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SampleTracking;




