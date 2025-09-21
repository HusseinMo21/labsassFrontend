import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Pagination,
} from '@mui/material';
import {
  Download,
  Assessment,
  People,
  Science,
  AttachMoney,
  Description,
  Edit,
  Visibility,
  PictureAsPdf,
  Image,
  CloudUpload,
  Refresh,
  DateRange,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Visit {
  id: number;
  visit_number: string;
  visit_date: string;
  test_status: string;
  diagnosis?: string;
  clinical_data?: string;
  specimen_information?: string;
  gross_examination?: string;
  microscopic_description?: string;
  recommendations?: string;
  referred_doctor?: string;
  notes?: string;
  image_path?: string;
  image_filename?: string;
  image_mime_type?: string;
  image_size?: number;
  image_uploaded_at?: string;
  image_uploaded_by?: number;
  patient: {
    id: number;
    name: string;
    phone: string;
    gender: string;
    birth_date: string;
  };
  visit_tests: Array<{
    id: number;
    lab_test: {
      id: number;
      name: string;
      code: string;
      reference_range?: string;
    };
    result_value?: string;
    result_status?: string;
    result_notes?: string;
    status: string;
    price: number;
  }>;
}

interface PatientsData {
  summary: {
    total_patients: number;
    new_patients_today: number;
    new_patients_this_week: number;
    new_patients_this_month: number;
  };
  recent_patients: Array<{
    id: number;
    name: string;
    phone: string;
    created_at: string;
  }>;
}

interface TestsData {
  summary: {
    total_tests: number;
    completed_tests: number;
    pending_tests: number;
    under_review_tests: number;
  };
  recent_tests: Array<{
    id: number;
    test_name: string;
    patient_name: string;
    status: string;
    created_at: string;
  }>;
}

interface FinancialData {
  summary: {
    total_revenue: number;
    monthly_revenue: number;
    weekly_revenue: number;
    daily_revenue: number;
  };
  period: {
    start_date: string;
    end_date: string;
  };
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patientsData, setPatientsData] = useState<PatientsData | null>(null);
  const [testsData, setTestsData] = useState<TestsData | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageVisit, setSelectedImageVisit] = useState<Visit | null>(null);
  const [showReplaceImageModal, setShowReplaceImageModal] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const [resultsData, setResultsData] = useState<{ [key: number]: { result_value: string; result_status: string; result_notes: string } }>({});
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
    fetchVisits();
  }, [currentPage, searchTerm, statusFilter, dateRange]);

  const fetchVisits = async () => {
    try {
      let params: any = {
        page: currentPage,
        per_page: 15,
      };

      // Role-based filtering
      if (user?.role === 'doctor') {
        // Doctors can only see pending and under_review tests
        params.test_status = 'pending,under_review';
      } else if (user?.role === 'admin') {
        // Admins can see completed tests for final review
        params.status = 'completed';
        params.sample_completed = 'true'; // Only show visits with completed samples
      } else if (user?.role === 'staff') {
        // Staff can only see completed visits for viewing/printing
        params.status = 'completed';
        params.sample_completed = 'true'; // Only show visits with completed samples
      } else {
        // Others see all visits
        params.status = 'completed';
        params.sample_completed = 'true'; // Only show visits with completed samples
      }

      // Add search functionality
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add status filter
      if (statusFilter !== 'all') {
        params.test_status = statusFilter;
      }

      // Add date range
      if (dateRange.start_date && dateRange.end_date) {
        params.start_date = dateRange.start_date;
        params.end_date = dateRange.end_date;
      }

      const response = await axios.get('/api/visits', { params });
      setVisits(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch visits:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [patientsResponse, testsResponse, financialResponse] = await Promise.all([
        axios.get('/api/reports/patients'),
        axios.get('/api/reports/tests'),
        axios.get('/api/reports/financial')
      ]);

      setPatientsData(patientsResponse.data);
      setTestsData(testsResponse.data);
      setFinancialData(financialResponse.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestReport = (visit: Visit) => {
    // Navigate to the new ReportForm component
    navigate(`/reports/${visit.id}`);
  };

  const handleViewImage = (visit: Visit) => {
    setSelectedImageVisit(visit);
    setShowImageModal(true);
  };

  const handleReplaceImage = (visit: Visit) => {
    setSelectedImageVisit(visit);
    setShowReplaceImageModal(true);
  };

  const handleRemoveImage = async (visit: Visit) => {
    if (!window.confirm('Are you sure you want to remove this image? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.get('/sanctum/csrf-cookie');
      const csrfResponse = await axios.get('/api/auth/csrf-token');
      const csrfToken = csrfResponse.data.csrf_token;

      await axios.delete(`/api/visits/${visit.id}/image`, {
        headers: {
          'X-CSRF-TOKEN': csrfToken
        }
      });

      toast.success('Image removed successfully');
      setShowImageModal(false);
      fetchVisits(); // Refresh the visits list
    } catch (error) {
      console.error('Remove image error:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleReplaceImageSubmit = async () => {
    if (!newImageFile || !selectedImageVisit) return;

    try {
      const formData = new FormData();
      formData.append('image', newImageFile);

      await axios.get('/sanctum/csrf-cookie');
      const csrfResponse = await axios.get('/api/auth/csrf-token');
      const csrfToken = csrfResponse.data.csrf_token;

      await axios.post(`/api/visits/${selectedImageVisit.id}/image`, formData, {
        headers: {
          'X-CSRF-TOKEN': csrfToken
        }
      });

      toast.success('Image replaced successfully');
      setShowReplaceImageModal(false);
      setNewImageFile(null);
      setShowImageModal(false);
      fetchVisits(); // Refresh the visits list
    } catch (error) {
      console.error('Replace image error:', error);
      toast.error('Failed to replace image');
    }
  };

  const handleTestResults = (visit: Visit) => {
    setSelectedVisit(visit);
    const initialResults: { [key: number]: { result_value: string; result_status: string; result_notes: string } } = {};
    visit.visit_tests.forEach((vt) => {
      initialResults[vt.id] = {
        result_value: vt.result_value || '',
        result_status: vt.result_status || 'normal',
        result_notes: vt.result_notes || '',
      };
    });
    setResultsData(initialResults);
    setShowResultsModal(true);
  };

  const handleResultsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Updating test results for visit:', selectedVisit?.id);
      
      // Manually fetch CSRF token before the request
      console.log('Fetching CSRF token for test results update...');
      await axios.get('/sanctum/csrf-cookie');
      const csrfResponse = await axios.get('/api/auth/csrf-token');
      const csrfToken = csrfResponse.data.csrf_token;
      console.log('CSRF token received:', csrfToken);
      
      const visitTests = Object.keys(resultsData).map((testId) => ({
        id: parseInt(testId),
        result_value: resultsData[parseInt(testId)].result_value,
        result_status: resultsData[parseInt(testId)].result_status,
        result_notes: resultsData[parseInt(testId)].result_notes || '',
        status: 'completed', // Include the selected status
      }));

      await axios.put(`/api/visits/${selectedVisit?.id}/results`, {
        visit_tests: visitTests,
      }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken
        }
      });

      toast.success('Test results updated successfully');
      setShowResultsModal(false);
      setSelectedVisit(null);
      setResultsData({});
      fetchVisits();
    } catch (error) {
      const message = (error as any).response?.data?.message || 'Failed to update results';
      toast.error(message);
    }
  };

  const handleResultChange = (testId: number, field: string, value: string) => {
    setResultsData((prev) => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value,
      },
    }));
  };

  const handleExport = async (type: string) => {
    try {
      const response = await axios.get('/api/reports/export', {
        params: {
          type,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${type} report exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handlePrintReport = async (visit: Visit) => {
    try {
      const response = await axios.get(`/api/visits/${visit.id}/report/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${visit.visit_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report PDF generated successfully');
    } catch (error) {
      console.error('Print report error:', error);
      toast.error('Failed to generate report PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      default: return 'default';
    }
  };

  const getTestStatusChip = (status: string) => {
    return (
      <Chip
        label={status.replace('_', ' ').toUpperCase()}
        color={getStatusColor(status) as any}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleExport('patients')}
          >
            Export Patients
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleExport('tests')}
          >
            Export Tests
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleExport('financial')}
          >
            Export Financial
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {patientsData?.summary.total_patients || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Patients
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Science color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {testsData?.summary.total_tests || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Tests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {testsData?.summary.completed_tests || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Completed Tests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoney color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    ${financialData?.summary.total_revenue || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                placeholder="Search by patient name or visit number..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchReportData}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Visits" />
            <Tab label="Enhanced Reports" />
          </Tabs>

          {activeTab === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Visit Reports
              </Typography>
              {user?.role === 'staff' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Staff Access: You can view and print completed reports only. To create or modify reports, contact an administrator or doctor.
                </Alert>
              )}
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Visit #</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Tests</TableCell>
                      <TableCell>Test Status</TableCell>
                      <TableCell>Report Status</TableCell>
                      <TableCell>Image</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {visit.visit_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {visit.patient.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              #{visit.patient.id} • {visit.patient.phone}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(visit.visit_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {visit.visit_tests.length} tests
                          </Typography>
                          {visit.visit_tests.map((test) => (
                            <Typography key={test.id} variant="caption" display="block">
                              {test.lab_test.name}
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell>
                          {getTestStatusChip(visit.test_status)}
                        </TableCell>
                        <TableCell>
                          <Chip label="Pending Report" color="warning" size="small" />
                        </TableCell>
                        <TableCell>
                          {visit.image_path ? (
                            <Button
                              size="small"
                              startIcon={<Image />}
                              onClick={() => handleViewImage(visit)}
                            >
                              View
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No Image
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {user?.role !== 'staff' && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Description />}
                                onClick={() => handleTestReport(visit)}
                              >
                                Report
                              </Button>
                            )}
                            {user?.role !== 'staff' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                startIcon={<Assessment />}
                                onClick={() => handleTestResults(visit)}
                              >
                                Results
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<PictureAsPdf />}
                              onClick={() => handlePrintReport(visit)}
                            >
                              PDF
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(event, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            </>
          )}

          {activeTab === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Enhanced Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage laboratory reports with enhanced workflow
              </Typography>
              <Alert severity="info">
                Enhanced Reports functionality will be available in the Enhanced Reports section.
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Results Modal */}
      <Dialog open={showResultsModal} onClose={() => setShowResultsModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Test Results - Visit #{selectedVisit?.visit_number}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleResultsSubmit} sx={{ mt: 2 }}>
            {selectedVisit?.visit_tests.map((test) => (
              <Card key={test.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {test.lab_test.name}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Result Value"
                        value={resultsData[test.id]?.result_value || ''}
                        onChange={(e) => handleResultChange(test.id, 'result_value', e.target.value)}
                        placeholder="Enter result value..."
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Result Status</InputLabel>
                        <Select
                          value={resultsData[test.id]?.result_status || 'normal'}
                          onChange={(e) => handleResultChange(test.id, 'result_status', e.target.value)}
                          label="Result Status"
                        >
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="abnormal">Abnormal</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Notes"
                        value={resultsData[test.id]?.result_notes || ''}
                        onChange={(e) => handleResultChange(test.id, 'result_notes', e.target.value)}
                        placeholder="Enter notes..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultsModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleResultsSubmit}>
            Update Results
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Viewing Modal */}
      <Dialog open={showImageModal} onClose={() => setShowImageModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image color="primary" />
            Lab Result Image - Visit #{selectedImageVisit?.visit_number}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImageVisit && (
            <Box>
              {/* Patient Information */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>Patient Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedImageVisit.patient.name}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedImageVisit.patient.phone}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1">{selectedImageVisit.patient.gender}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Birth Date</Typography>
                    <Typography variant="body1">{selectedImageVisit.patient.birth_date}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Image Display */}
              {selectedImageVisit.image_path && (
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={`/storage/${selectedImageVisit.image_path}`}
                    alt="Lab Result"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      File: {selectedImageVisit.image_filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {(selectedImageVisit.image_size! / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {new Date(selectedImageVisit.image_uploaded_at!).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImageModal(false)}>Close</Button>
          {selectedImageVisit?.image_path && (
            <>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `/storage/${selectedImageVisit.image_path}`;
                  link.download = selectedImageVisit.image_filename || 'lab_result.jpg';
                  link.click();
                }}
              >
                Download
              </Button>
              {user?.role !== 'staff' && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<CloudUpload />}
                  onClick={() => handleReplaceImage(selectedImageVisit)}
                >
                  Replace
                </Button>
              )}
              {user?.role !== 'staff' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleRemoveImage(selectedImageVisit)}
                >
                  Remove
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Replace Image Modal */}
      <Dialog open={showReplaceImageModal} onClose={() => setShowReplaceImageModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload color="warning" />
            Replace Lab Result Image - Visit #{selectedImageVisit?.visit_number}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImageVisit && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a new image to replace the current lab result image for this visit.
              </Typography>
              
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="replace-image-upload"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (20MB limit)
                    if (file.size > 20 * 1024 * 1024) {
                      toast.error('File size must be less than 20MB');
                      return;
                    }
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      toast.error('Please select an image file');
                      return;
                    }
                    
                    setNewImageFile(file);
                    toast.success('New image selected');
                  }
                }}
              />
              <label htmlFor="replace-image-upload">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth>
                  Choose New Image
                </Button>
              </label>
              
              {newImageFile && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.main">
                    Selected: {newImageFile.name} ({(newImageFile.size / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReplaceImageModal(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleReplaceImageSubmit}
            disabled={!newImageFile}
          >
            Replace Image
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;


