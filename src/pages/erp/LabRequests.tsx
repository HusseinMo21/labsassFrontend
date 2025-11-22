import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
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
  Tooltip,
  Pagination,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

interface Sample {
  id?: number;
  sample_type?: string;
  case_type?: string;
  sample_size?: string;
  number_of_samples?: number;
  tsample?: string;
  nsample?: string;
  isample?: string;
  notes?: string;
}

interface LabRequest {
  id: number;
  lab_no: string;
  suffix?: string;
  full_lab_no: string;
  status: string;
  patient_id?: number;
  patient?: {
    id: number;
    name: string;
    phone: string;
  };
  samples: Sample[];
  created_at: string;
  barcode_url?: string;
  qr_code_url?: string;
  number_of_samples?: number;
}

interface PatientDetails {
  lab_request: {
    id: number;
    lab_no: string;
    full_lab_no: string;
    status: string;
    suffix?: string;
    created_at: string;
    updated_at: string;
    barcode_url?: string;
    qr_code_url?: string;
  };
  patient: {
    id: number;
    name: string;
    gender: string;
    birth_date: string;
    age: number;
    phone: string;
    whatsapp_number?: string;
    address: string;
    emergency_contact?: string;
    emergency_phone?: string;
    medical_history?: string;
    allergies?: string;
    national_id?: string;
    insurance_provider?: string;
    insurance_number?: string;
    has_insurance: boolean;
    insurance_coverage: string;
    billing_address?: string;
    emergency_relationship?: string;
    organization?: string;
  };
  doctor?: {
    id: number;
    name: string;
  };
  organization?: {
    id: number;
    name: string;
  };
  samples: Sample[];
  all_tests: Array<{
    visit_id: number;
    visit_date: string;
    visit_number: string;
    test_id: number;
    test_name: string;
    test_code: string;
    test_price: number;
    status: string;
    barcode_uid: string;
  }>;
  payment_history: Array<{
    visit_id: number;
    visit_date: string;
    invoice_number: string;
    total_amount: number;
    amount_paid: number;
    balance: number;
    status: string;
    payment_method: string;
    payment_breakdown?: {
      cash?: number;
      card?: number;
      card_method?: string;
    };
    created_at: string;
  }>;
  reports: Array<{
    id: number;
    title: string;
    content: string;
    status: string;
    generated_at: string;
    lab_test?: {
      name: string;
      code: string;
    };
  }>;
  visits_summary: {
    total_visits: number;
    total_tests: number;
    total_amount: number;
    total_paid: number;
    total_balance: number;
    last_visit?: string;
  };
}

interface Patient {
  id: number;
  name: string;
  phone: string;
}

const LabRequests: React.FC = () => {
  const { user } = useAuth();
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLabRequest, setEditingLabRequest] = useState<LabRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [suffixDialogOpen, setSuffixDialogOpen] = useState(false);
  const [selectedSuffix, setSelectedSuffix] = useState('');
  const [selectedLabRequest, setSelectedLabRequest] = useState<LabRequest | null>(null);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(15);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    samples: [{ 
      sample_type: '', 
      case_type: '', 
      sample_size: '', 
      number_of_samples: 1, 
      tsample: '', 
      nsample: '', 
      isample: '', 
      notes: '' 
    }],
  });

  const statusColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
    pending: 'warning',
    received: 'info',
    in_progress: 'primary',
    under_review: 'secondary',
    completed: 'success',
    delivered: 'default',
  };

  const statusLabels: { [key: string]: string } = {
    pending: 'Pending',
    received: 'Received',
    in_progress: 'In Progress',
    under_review: 'Under Review',
    completed: 'Completed',
    delivered: 'Delivered',
  };

  const suffixLabels: { [key: string]: string } = {
    '': 'None',
    m: 'Morning (M)',
    h: 'Afternoon (H)',
  };

  useEffect(() => {
    fetchLabRequests();
    fetchPatients();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchLabRequests(1);
      } else {
        setCurrentPage(1);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const fetchLabRequests = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
      });
      
      // Add search and filter parameters if they exist
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      console.log('Fetching lab requests with params:', params.toString());
      const response = await axios.get(`/api/lab-requests?${params.toString()}`);
      console.log('Lab requests response:', response.data);
      
      // Handle paginated response
      if (response.data.data) {
        setLabRequests(response.data.data);
        setTotalPages(response.data.last_page || 1);
        setTotalItems(response.data.total || 0);
        setCurrentPage(response.data.current_page || 1);
        console.log(`Loaded ${response.data.data.length} lab requests, total: ${response.data.total}`);
      } else {
        // Fallback for non-paginated response
        setLabRequests(response.data);
        setTotalPages(1);
        setTotalItems(response.data.length || 0);
        setCurrentPage(1);
        console.log(`Loaded ${response.data.length} lab requests (non-paginated)`);
      }
    } catch (error: any) {
      console.error('Error fetching lab requests:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch lab requests';
      console.error('Error details:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      setPatients(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchPatientDetails = async (labNo: string) => {
    try {
      setLoadingDetails(true);
      const response = await axios.get(`/api/lab-requests-patient-details?lab_no=${labNo}`);
      setPatientDetails(response.data);
      setPatientDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error('Failed to fetch patient details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateLabRequest = async () => {
    try {
      await axios.post('/api/lab-requests', formData);
      toast.success('Lab request created successfully');
      setOpenDialog(false);
      resetForm();
      setCurrentPage(1);
      fetchLabRequests(1);
    } catch (error: any) {
      console.error('Error creating lab request:', error);
      toast.error(error.response?.data?.message || 'Failed to create lab request');
    }
  };

  // const handleUpdateStatus = async (id: number, status: string) => {
  //   try {
  //     await axios.put(`/api/lab-requests/${id}`, { status });
  //     toast.success('Status updated successfully');
  //     fetchLabRequests(currentPage);
  //   } catch (error: any) {
  //     console.error('Error updating status:', error);
  //     toast.error(error.response?.data?.message || 'Failed to update status');
  //   }
  // };

  const handleUpdateSuffix = async () => {
    if (!selectedLabRequest) return;

    try {
      await axios.put(`/api/lab-requests/${selectedLabRequest.id}/suffix`, {
        suffix: selectedSuffix || null,
      });
      toast.success('Suffix updated successfully');
      setSuffixDialogOpen(false);
      setSelectedLabRequest(null);
      setSelectedSuffix('');
      fetchLabRequests(currentPage);
    } catch (error: any) {
      console.error('Error updating suffix:', error);
      toast.error(error.response?.data?.message || 'Failed to update suffix');
    }
  };

  const handleDeleteLabRequest = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this lab request?')) return;

    try {
      await axios.delete(`/api/lab-requests/${id}`);
      toast.success('Lab request deleted successfully');
      fetchLabRequests(currentPage);
    } catch (error: any) {
      console.error('Error deleting lab request:', error);
      toast.error(error.response?.data?.message || 'Failed to delete lab request');
    }
  };


  const resetForm = () => {
    setFormData({
      patient_id: '',
      samples: [{ 
        sample_type: '', 
        case_type: '', 
        sample_size: '', 
        number_of_samples: 1, 
        tsample: '', 
        nsample: '', 
        isample: '', 
        notes: '' 
      }],
    });
    setEditingLabRequest(null);
  };

  const addSample = () => {
    setFormData({
      ...formData,
      samples: [...formData.samples, { 
        sample_type: '', 
        case_type: '', 
        sample_size: '', 
        number_of_samples: 1, 
        tsample: '', 
        nsample: '', 
        isample: '', 
        notes: '' 
      }],
    });
  };

  const removeSample = (index: number) => {
    if (formData.samples.length > 1) {
      setFormData({
        ...formData,
        samples: formData.samples.filter((_, i) => i !== index),
      });
    }
  };

  const updateSample = (index: number, field: keyof Sample, value: string) => {
    const updatedSamples = [...formData.samples];
    updatedSamples[index] = { ...updatedSamples[index], [field]: value };
    setFormData({ ...formData, samples: updatedSamples });
  };

  const openSuffixDialog = (labRequest: LabRequest) => {
    setSelectedLabRequest(labRequest);
    setSelectedSuffix(labRequest.suffix || '');
    setSuffixDialogOpen(true);
  };

  // Pagination handlers
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    fetchLabRequests(page);
  };

  // No need for client-side filtering since we're using server-side search

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1">
            Lab Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage lab requests and view comprehensive patient details
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={() => fetchLabRequests(currentPage)}
              color="primary"
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Lab Request
          </Button>
        </Box>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search by Lab No, Patient Name, or Phone"
                value={searchTerm}
                onChange={(e) => {
                  console.log('Search term changed to:', e.target.value);
                  setSearchTerm(e.target.value);
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lab Requests Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Lab No</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {labRequests.map((labRequest) => (
                <TableRow 
                  key={labRequest.id}
                  onClick={() => fetchPatientDetails(labRequest.lab_no)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {labRequest.full_lab_no}
                      </Typography>
                      {labRequest.suffix && (
                        <Chip
                          size="small"
                          label={suffixLabels[labRequest.suffix]}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {labRequest.patient ? (
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {labRequest.patient.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {labRequest.patient.phone}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No Patient
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[labRequest.status]}
                      color={statusColors[labRequest.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(labRequest.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} alignItems="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchPatientDetails(labRequest.lab_no);
                        }}
                        color="primary"
                      >
                        View Details
                      </Button>
                      {user?.role === 'admin' && (
                        <>
                          <Tooltip title="Update Suffix">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSuffixDialog(labRequest);
                              }}
                              color="secondary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLabRequest(labRequest.id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
          </Typography>
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
          </Stack>
        </Box>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLabRequest ? 'Edit Lab Request' : 'Create New Lab Request'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Patient</InputLabel>
              <Select
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                label="Patient"
              >
                <MenuItem value="">Select Patient</MenuItem>
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name} - {patient.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="h6" sx={{ mb: 2 }}>
              Samples
            </Typography>
            {formData.samples.map((sample, index) => (
              <Card key={index} sx={{ mb: 2, p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  🧪 Sample Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="🧪 نوع العينة (Sample Type)"
                      value={sample.sample_type}
                      onChange={(e) => updateSample(index, 'sample_type', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="📊 نوع الحالة (Case Type)"
                      value={sample.case_type}
                      onChange={(e) => updateSample(index, 'case_type', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="📏 حجم العينة (Sample Size)"
                      value={sample.sample_size}
                      onChange={(e) => updateSample(index, 'sample_size', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="🔢 عدد العينات (Number of Samples)"
                      value={sample.number_of_samples}
                      onChange={(e) => updateSample(index, 'number_of_samples', String(parseInt(String(e.target.value)) || 1))}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle1" sx={{ mb: 2, mt: 3, fontWeight: 'bold' }}>
                  📋 Sample Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sample Type (Legacy)"
                      value={sample.tsample}
                      onChange={(e) => updateSample(index, 'tsample', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sample Name (Legacy)"
                      value={sample.nsample}
                      onChange={(e) => updateSample(index, 'nsample', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sample ID (Legacy)"
                      value={sample.isample}
                      onChange={(e) => updateSample(index, 'isample', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Notes"
                      value={sample.notes}
                      onChange={(e) => updateSample(index, 'notes', e.target.value)}
                    />
                  </Grid>
                  {formData.samples.length > 1 && (
                    <Grid item xs={12}>
                      <Button
                        color="error"
                        onClick={() => removeSample(index)}
                      >
                        Remove Sample
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Card>
            ))}
            <Button variant="outlined" onClick={addSample}>
              Add Sample
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateLabRequest} variant="contained">
            Create Lab Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suffix Update Dialog */}
      <Dialog open={suffixDialogOpen} onClose={() => setSuffixDialogOpen(false)}>
        <DialogTitle>Update Suffix</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Suffix</InputLabel>
              <Select
                value={selectedSuffix}
                onChange={(e) => setSelectedSuffix(e.target.value)}
                label="Suffix"
              >
                {Object.entries(suffixLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mt: 2 }}>
              Only staff and admin can update suffixes. This will regenerate the barcode and QR code.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuffixDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSuffix} variant="contained">
            Update Suffix
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Details Modal */}
      <Dialog 
        open={patientDetailsOpen} 
        onClose={() => setPatientDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                Patient Details - {patientDetails?.lab_request.full_lab_no}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patientDetails?.patient.name} • {patientDetails?.patient.phone}
              </Typography>
            </Box>
            <IconButton onClick={() => setPatientDetailsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading patient details...
              </Typography>
            </Box>
          ) : patientDetails ? (
            <Box>
              {/* Lab Request Info */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Lab Request Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Lab Number:</strong> {patientDetails.lab_request.full_lab_no}</Typography>
                      <Typography variant="body2"><strong>Status:</strong> {patientDetails.lab_request.status}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Created:</strong> {new Date(patientDetails.lab_request.created_at).toLocaleDateString()}</Typography>
                      <Typography variant="body2"><strong>Updated:</strong> {new Date(patientDetails.lab_request.updated_at).toLocaleDateString()}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Patient Information */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Patient Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Name:</strong> {patientDetails.patient.name}</Typography>
                      <Typography variant="body2"><strong>Gender:</strong> {patientDetails.patient.gender}</Typography>
                      <Typography variant="body2"><strong>Age:</strong> {patientDetails.patient.age}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {patientDetails.patient.phone}</Typography>
                      {patientDetails.patient.whatsapp_number && (
                        <Typography variant="body2"><strong>WhatsApp:</strong> {patientDetails.patient.whatsapp_number}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Address:</strong> {patientDetails.patient.address}</Typography>
                      {patientDetails.patient.emergency_contact && (
                        <Typography variant="body2"><strong>Emergency Contact:</strong> {patientDetails.patient.emergency_contact}</Typography>
                      )}
                      {patientDetails.patient.emergency_phone && (
                        <Typography variant="body2"><strong>Emergency Phone:</strong> {patientDetails.patient.emergency_phone}</Typography>
                      )}
                      {patientDetails.patient.allergies && (
                        <Typography variant="body2"><strong>Allergies:</strong> {patientDetails.patient.allergies}</Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Doctor & Organization */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Medical References</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      {patientDetails.doctor ? (
                        <Typography variant="body2"><strong>Doctor:</strong> {patientDetails.doctor.name}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No doctor assigned</Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {patientDetails.organization ? (
                        <Typography variant="body2"><strong>Organization:</strong> {patientDetails.organization.name}</Typography>
                      ) : patientDetails.patient.organization ? (
                        <Typography variant="body2"><strong>Organization:</strong> {patientDetails.patient.organization}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No organization assigned</Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Samples */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Samples ({patientDetails.samples.length})</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sample Type</TableCell>
                        <TableCell>Sample ID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patientDetails.samples.map((sample, index) => (
                        <TableRow key={index}>
                          <TableCell>{sample.sample_type || sample.tsample || 'N/A'}</TableCell>
                          <TableCell>{sample.sample_size || sample.isample || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* All Tests */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>All Tests ({patientDetails.all_tests.length})</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>نوع العينة</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patientDetails.all_tests.map((test, index) => (
                        <TableRow key={index}>
                          <TableCell>{test.test_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payment History & Financial Summary */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Payment History & Financial Status</Typography>
                  
                  {/* Financial Summary */}
                  {(() => {
                    // Calculate total paid in cash and other payment methods
                    // Use payment_breakdown if available, which contains the actual split
                    const totalPaidCash = patientDetails.payment_history.reduce((sum, p) => {
                      // First priority: use payment_breakdown.cash if available
                      if (p.payment_breakdown && typeof p.payment_breakdown.cash === 'number') {
                        return sum + p.payment_breakdown.cash;
                      }
                      // Fallback: if no breakdown, check payment_method
                      if (p.payment_method?.toLowerCase() === 'cash') {
                        return sum + (Number(p.amount_paid) || 0);
                      }
                      return sum;
                    }, 0);
                    
                    const totalPaidOther = patientDetails.payment_history.reduce((sum, p) => {
                      // First priority: use payment_breakdown.card if available
                      if (p.payment_breakdown && typeof p.payment_breakdown.card === 'number') {
                        return sum + p.payment_breakdown.card;
                      }
                      // Fallback: if no breakdown, check payment_method
                      if (p.payment_method?.toLowerCase() !== 'cash' && p.payment_method) {
                        return sum + (Number(p.amount_paid) || 0);
                      }
                      return sum;
                    }, 0);
                    
                    // Calculate total paid from all payments (should be cash + other)
                    const calculatedTotalPaid = totalPaidCash + totalPaidOther;

                    return (
                      <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={2.4}>
                            <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                            <Typography variant="h6" color="primary">${patientDetails.visits_summary.total_amount}</Typography>
                          </Grid>
                          <Grid item xs={2.4}>
                            <Typography variant="body2" color="text.secondary">Paid in Cash</Typography>
                            <Typography variant="h6" color="info.main">${totalPaidCash.toFixed(2)}</Typography>
                          </Grid>
                          <Grid item xs={2.4}>
                            <Typography variant="body2" color="text.secondary">Paid in Other Methods</Typography>
                            <Typography variant="h6" color="secondary.main">${totalPaidOther.toFixed(2)}</Typography>
                          </Grid>
                          <Grid item xs={2.4}>
                            <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                            <Typography variant="h6" color="success.main">${calculatedTotalPaid.toFixed(2)}</Typography>
                          </Grid>
                          <Grid item xs={2.4}>
                            <Typography variant="body2" color="text.secondary">Pending Balance</Typography>
                            <Typography variant="h6" color={patientDetails.visits_summary.total_balance > 0 ? 'error.main' : 'success.main'}>
                              ${patientDetails.visits_summary.total_balance}
                            </Typography>
                          </Grid>
                        </Grid>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Payment Status</Typography>
                              <Chip 
                                label={patientDetails.visits_summary.total_balance > 0 ? 'Pending Payment' : 'Fully Paid'} 
                                color={patientDetails.visits_summary.total_balance > 0 ? 'warning' : 'success'}
                                size="small"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    );
                  })()}

                  {/* Payment History Table */}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Visit Date</TableCell>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Paid in Cash</TableCell>
                        <TableCell>Paid in Other Methods</TableCell>
                        <TableCell>Total Paid</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payment Method</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patientDetails.payment_history.map((payment, index) => {
                        // Use payment_breakdown if available, otherwise fallback to payment_method
                        const paidCash = payment.payment_breakdown?.cash 
                          ? Number(payment.payment_breakdown.cash) || 0
                          : (payment.payment_method?.toLowerCase() === 'cash' ? Number(payment.amount_paid) || 0 : 0);
                        
                        const paidOther = payment.payment_breakdown?.card 
                          ? Number(payment.payment_breakdown.card) || 0
                          : (payment.payment_method?.toLowerCase() !== 'cash' && payment.payment_method ? Number(payment.amount_paid) || 0 : 0);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{new Date(payment.visit_date).toLocaleDateString()}</TableCell>
                            <TableCell>{payment.invoice_number}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                ${payment.total_amount}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color={paidCash > 0 ? "info.main" : "text.secondary"}>
                                ${paidCash.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color={paidOther > 0 ? "secondary.main" : "text.secondary"}>
                                ${paidOther.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="success.main" fontWeight="medium">
                                ${payment.amount_paid}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color={payment.balance > 0 ? 'error.main' : 'success.main'}>
                                ${payment.balance}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={payment.status} 
                                size="small" 
                                color={payment.status === 'paid' ? 'success' : payment.status === 'partial' ? 'warning' : 'error'}
                              />
                            </TableCell>
                            <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Reports & Test Results */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Reports & Test Results ({patientDetails.reports.length})</Typography>
                  {patientDetails.reports.length > 0 ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Report Title</TableCell>
                          <TableCell>نوع العينة</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Generated Date</TableCell>
                          <TableCell>Content Preview</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientDetails.reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {report.title}
                              </Typography>
                            </TableCell>
                            <TableCell>{patientDetails.all_tests && patientDetails.all_tests.length > 0 ? patientDetails.all_tests[0].test_name : 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={report.status} 
                                size="small" 
                                color={report.status === 'completed' ? 'success' : report.status === 'pending' ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell>{new Date(report.generated_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {report.content ? report.content.substring(0, 100) + '...' : 'No content'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No reports generated yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reports will appear here once tests are completed
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Patient Summary */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Patient Summary</Typography>
                  
                  {/* Key Metrics */}
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'primary.50', borderRadius: 1 }}>
                          <Typography variant="h4" color="primary.main" fontWeight="bold">
                            {patientDetails.visits_summary.total_visits}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Visits
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'info.50', borderRadius: 1 }}>
                          <Typography variant="h4" color="info.main" fontWeight="bold">
                            {patientDetails.visits_summary.total_tests}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Tests
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'success.50', borderRadius: 1 }}>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {patientDetails.reports.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reports Generated
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: patientDetails.visits_summary.total_balance > 0 ? 'warning.50' : 'success.50', borderRadius: 1 }}>
                          <Typography variant="h4" color={patientDetails.visits_summary.total_balance > 0 ? 'warning.main' : 'success.main'} fontWeight="bold">
                            ${patientDetails.visits_summary.total_balance}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {patientDetails.visits_summary.total_balance > 0 ? 'Pending Balance' : 'Fully Paid'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Additional Information */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Lab Request Status</Typography>
                      <Chip 
                        label={patientDetails.lab_request.status} 
                        color={patientDetails.lab_request.status === 'completed' ? 'success' : patientDetails.lab_request.status === 'pending' ? 'warning' : 'default'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Last Visit</Typography>
                      <Typography variant="body2">
                        {patientDetails.visits_summary.last_visit ? new Date(patientDetails.visits_summary.last_visit).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                      <Typography variant="body2" fontWeight="bold">${patientDetails.visits_summary.total_amount}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">${patientDetails.visits_summary.total_paid}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Typography>No patient details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabRequests;

