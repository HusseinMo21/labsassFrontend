import React, { useState, useEffect } from 'react';
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
  microscopic_description?: string;
  recommendations?: string;
  referred_doctor?: string;
  notes?: string;
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
    new_patients: number;
    active_patients: number;
    average_visits_per_patient: number;
  };
  demographics: Array<{
    gender: string;
    count: number;
  }>;
  age_distribution: Array<{
    age_group: string;
    count: number;
  }>;
  top_patients: Array<{
    id: number;
    name: string;
    visits_count: number;
    visits_sum_final_amount: number;
  }>;
}

interface TestsData {
  summary: {
    total_tests_ordered: number;
    completed_tests: number;
    pending_tests: number;
    total_test_revenue: number;
  };
  popular_tests: Array<{
    id: number;
    name: string;
    visit_tests_count: number;
    visit_tests_sum_price: number;
  }>;
  test_status: Array<{
    status: string;
    count: number;
  }>;
  daily_tests: Array<{
    date: string;
    count: number;
  }>;
}

interface FinancialData {
  summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    total_visits: number;
    total_expense_count: number;
    average_revenue_per_visit: number;
    average_expense_per_item: number;
  };
  expenses_by_category: Array<{
    category: string;
    count: number;
    total: number;
  }>;
  revenue_by_payment_method: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
  period: {
    start_date: string;
    end_date: string;
  };
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patientsData, setPatientsData] = useState<PatientsData | null>(null);
  const [testsData, setTestsData] = useState<TestsData | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);
  const [testFormData, setTestFormData] = useState({
    clinical_data: '',
    microscopic_description: '',
    diagnosis: '',
    recommendations: '',
    referred_doctor: '',
    test_status: 'pending',
  });
  const [resultsData, setResultsData] = useState<{ [key: number]: { result_value: string; result_status: string; result_notes: string } }>({});
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const tabLabels = ['Test Reports', 'Patients Report', 'Tests Report', 'Financial Report'];

  useEffect(() => {
    // Fetch CSRF token when component loads
    const initializeCSRF = async () => {
      try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF cookie set for Reports');
      } catch (error) {
        console.error('Failed to set CSRF cookie:', error);
      }
    };
    
    initializeCSRF();
    fetchReportData();
    fetchVisits();
  }, [activeTab, dateRange, currentPage, searchTerm, statusFilter]);

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
      switch (activeTab) {
        case 1: // Patients
          const patientsResponse = await axios.get('/api/reports/patients', {
            params: dateRange,
          });
          setPatientsData(patientsResponse.data);
          break;
        case 2: // Tests
          const testsResponse = await axios.get('/api/reports/tests', {
            params: dateRange,
          });
          setTestsData(testsResponse.data);
          break;
        case 3: // Financial
          const financialResponse = await axios.get('/api/reports/financial', {
            params: dateRange,
          });
          setFinancialData(financialResponse.data);
          break;
      }
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestReport = (visit: Visit) => {
    setSelectedVisit(visit);
    setTestFormData({
      clinical_data: visit.clinical_data || '',
      microscopic_description: visit.microscopic_description || '',
      diagnosis: visit.diagnosis || '',
      recommendations: visit.recommendations || visit.notes || '',
      referred_doctor: visit.referred_doctor || '',
      test_status: visit.test_status || 'pending',
    });
    setShowTestModal(true);
  };

  const handleTestResults = (visit: Visit) => {
    setSelectedVisit(visit);
    const initialResults: { [key: number]: { result_value: string; result_status: string; result_notes: string } } = {};
    visit.visit_tests?.forEach((vt) => {
      initialResults[vt.id] = {
        result_value: vt.result_value || '',
        result_status: vt.result_status || 'normal',
        result_notes: vt.result_notes || '',
      };
    });
    setResultsData(initialResults);
    setShowResultsModal(true);
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Updating test report for visit:', selectedVisit?.id);
      
      // Manually fetch CSRF token before the request
      console.log('Fetching CSRF token for test report update...');
      await axios.get('/sanctum/csrf-cookie');
      const csrfResponse = await axios.get('/api/auth/csrf-token');
      const csrfToken = csrfResponse.data.csrf_token;
      console.log('CSRF token received:', csrfToken);
      
      // Make the PUT request with CSRF token
      await axios.put(`/api/visits/${selectedVisit?.id}`, testFormData, {
        headers: {
          'X-CSRF-TOKEN': csrfToken
        }
      });
      
      toast.success('Test report updated successfully');
      setShowTestModal(false);
      fetchVisits();
    } catch (error) {
      console.error('Test report update error:', error);
      toast.error('Failed to update test report');
    }
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
        status: testFormData.test_status, // Include the selected status
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTestFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExport = async (type: string) => {
    try {
      const response = await axios.get('/api/reports/export', {
        params: {
          type,
          format: 'csv',
          ...dateRange,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handlePrintReport = async (visit: Visit) => {
    try {
      console.log('Starting PDF generation for visit:', visit);
      
      // Get the first completed test for this visit
      const completedTest = visit.visit_tests?.find(test => test.status === 'completed');
      console.log('Completed test found:', completedTest);
      
      if (!completedTest) {
        toast.error('No completed tests found for this visit');
        return;
      }

      console.log('Making request to:', `/api/reports/${completedTest.id}/print`);
      
      // Show loading toast
      const loadingToast = toast.loading('Generating PDF report...');
      
      // Generate PDF using the backend endpoint
      const response = await axios.get(`/api/reports/${completedTest.id}/print`, {
        responseType: 'blob',
        timeout: 30000, // 30 second timeout for PDF generation
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      console.log('PDF response received:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Create blob URL and open in new tab for preview
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Open PDF in new tab for preview
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        // Add download button to the new window
        newWindow.onload = function() {
          const downloadBtn = newWindow.document.createElement('button');
          downloadBtn.innerHTML = 'Download PDF';
          downloadBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #1976d2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
          `;
          downloadBtn.onclick = function() {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${visit.id}_${visit.patient?.name || 'patient'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
          };
          newWindow.document.body.appendChild(downloadBtn);
        };
        
        toast.success('PDF report opened in new tab');
      } else {
        // Fallback: direct download if popup blocked
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_${visit.id}_${visit.patient?.name || 'patient'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('PDF report downloaded (popup blocked)');
      }

      // Clean up the blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000); // 10 seconds delay to allow preview

    } catch (error: any) {
      console.error('PDF generation error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Dismiss loading toast if it exists
      toast.dismiss();
      
      if (error.code === 'ECONNABORTED') {
        toast.error('PDF generation timed out. Please try again.');
      } else if (error.response?.status === 404) {
        toast.error('PDF endpoint not found. Please check if the backend server is running.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error while generating PDF. Please try again.');
      } else {
        toast.error(`Failed to generate PDF report: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusChip = (status: string) => {
    const statusColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      completed: 'success',
      under_review: 'warning',
      pending: 'secondary',
    };
    
    return (
      <Chip
        label={status?.replace('_', ' ').toUpperCase() || 'PENDING'}
        color={statusColors[status] || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };

  const TestReports = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Test Reports Management
        </Typography>
        <Button
          variant="outlined"
          color="success"
          startIcon={<Download />}
          onClick={() => handleExport('test-reports')}
        >
          Export CSV
        </Button>
      </Box>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by visit number, patient name, phone, or patient ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant="contained"
                onClick={fetchVisits}
                fullWidth
                disabled={loading}
                startIcon={<Refresh />}
              >
                {loading ? <CircularProgress size={20} /> : 'Refresh'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {user?.role === 'staff' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Staff Access:</strong> You can view and print completed reports only. 
                To create or modify reports, contact an administrator or doctor.
              </Typography>
            </Alert>
          )}
          {visits.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Visit #</strong></TableCell>
                    <TableCell><strong>Patient</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Tests</strong></TableCell>
                    <TableCell><strong>Test Status</strong></TableCell>
                    <TableCell><strong>Report Status</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visits.map((visit) => (
                    <TableRow key={visit.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {visit.visit_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {visit.patient?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{visit.patient?.id} • {visit.patient?.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(visit.visit_date)}</TableCell>
                      <TableCell>
                        <Chip label={`${visit.visit_tests?.length || 0} tests`} size="small" color="info" />
                        {visit.visit_tests?.slice(0, 2).map((vt) => (
                          <Typography key={vt.id} variant="caption" display="block" color="text.secondary">
                            {vt.lab_test?.name}
                          </Typography>
                        ))}
                        {visit.visit_tests && visit.visit_tests.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{visit.visit_tests.length - 2} more
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{getStatusChip(visit.test_status)}</TableCell>
                      <TableCell>
                        <Chip
                          label={visit.diagnosis ? 'Report Complete' : 'Pending Report'}
                          color={visit.diagnosis ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
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
                          {visit.diagnosis && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<PictureAsPdf />}
                              onClick={() => handlePrintReport(visit)}
                            >
                              PDF
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No completed visits found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );

  const PatientsReport = () => (
    <Box>
      {patientsData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(patientsData.summary.total_patients)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Patients
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(patientsData.summary.new_patients)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New Patients
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(patientsData.summary.active_patients)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Patients
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {patientsData.summary.average_visits_per_patient?.toFixed(1) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Visits/Patient
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Demographics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Gender Distribution
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Gender</strong></TableCell>
                          <TableCell><strong>Count</strong></TableCell>
                          <TableCell><strong>Percentage</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientsData.demographics.map((demo) => (
                          <TableRow key={demo.gender}>
                            <TableCell>
                              <Chip
                                label={demo.gender?.toUpperCase() || 'N/A'}
                                color={demo.gender === 'male' ? 'primary' : 'secondary'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{formatNumber(demo.count)}</TableCell>
                            <TableCell>
                              {patientsData.summary.total_patients > 0
                                ? ((demo.count / patientsData.summary.total_patients) * 100).toFixed(1)
                                : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Age Distribution
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Age Group</strong></TableCell>
                          <TableCell><strong>Count</strong></TableCell>
                          <TableCell><strong>Percentage</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientsData.age_distribution.map((age) => (
                          <TableRow key={age.age_group}>
                            <TableCell>
                              <Chip label={age.age_group} color="info" size="small" />
                            </TableCell>
                            <TableCell>{formatNumber(age.count)}</TableCell>
                            <TableCell>
                              {patientsData.summary.total_patients > 0
                                ? ((age.count / patientsData.summary.total_patients) * 100).toFixed(1)
                                : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Patients */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Top Patients by Visits
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Patient</strong></TableCell>
                      <TableCell><strong>Visits</strong></TableCell>
                      <TableCell><strong>Total Spent</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientsData.top_patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{formatNumber(patient.visits_count)}</TableCell>
                        <TableCell>{formatCurrency(patient.visits_sum_final_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );

  const TestsReport = () => (
    <Box>
      {testsData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(testsData.summary.total_tests_ordered)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(testsData.summary.completed_tests)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(testsData.summary.pending_tests)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(testsData.summary.total_test_revenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Test Revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Popular Tests */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Most Requested Tests
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Test</strong></TableCell>
                          <TableCell><strong>Count</strong></TableCell>
                          <TableCell><strong>Revenue</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {testsData.popular_tests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell>{test.name}</TableCell>
                            <TableCell>{formatNumber(test.visit_tests_count)}</TableCell>
                            <TableCell>{formatCurrency(test.visit_tests_sum_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Test Status
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Count</strong></TableCell>
                          <TableCell><strong>Percentage</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {testsData.test_status.map((status) => (
                          <TableRow key={status.status}>
                            <TableCell>
                              <Chip
                                label={status.status?.toUpperCase() || 'N/A'}
                                color={
                                  status.status === 'completed'
                                    ? 'success'
                                    : status.status === 'pending'
                                    ? 'warning'
                                    : status.status === 'in_progress'
                                    ? 'info'
                                    : 'default'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{formatNumber(status.count)}</TableCell>
                            <TableCell>
                              {testsData.summary.total_tests_ordered > 0
                                ? ((status.count / testsData.summary.total_tests_ordered) * 100).toFixed(1)
                                : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Daily Test Volume */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Daily Test Volume
              </Typography>
              <Box sx={{ height: 300, overflowY: 'auto' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Tests</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {testsData.daily_tests.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell>{formatDate(day.date)}</TableCell>
                          <TableCell>{formatNumber(day.count)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );

  const FinancialReport = () => (
    <Box>
      {financialData && (
        <>
          {/* Financial Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ border: '2px solid', borderColor: 'success.main' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(financialData.summary.total_revenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(financialData.summary.total_expenses)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  border: '2px solid',
                  borderColor: financialData.summary.net_profit >= 0 ? 'success.main' : 'error.main',
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h4"
                    color={financialData.summary.net_profit >= 0 ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {formatCurrency(financialData.summary.net_profit)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Net Profit/Loss
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ border: '2px solid', borderColor: 'info.main' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {financialData.summary.profit_margin}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profit Margin
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Expenses by Category */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Expenses by Category
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell><strong>Count</strong></TableCell>
                          <TableCell><strong>Total</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {financialData.expenses_by_category.map((category) => (
                          <TableRow key={category.category}>
                            <TableCell>
                              <Chip label={category.category} color="secondary" size="small" />
                            </TableCell>
                            <TableCell>{formatNumber(category.count)}</TableCell>
                            <TableCell>{formatCurrency(category.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Revenue by Payment Method
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Method</strong></TableCell>
                          <TableCell><strong>Count</strong></TableCell>
                          <TableCell><strong>Total</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {financialData.revenue_by_payment_method.map((method) => (
                          <TableRow key={method.payment_method}>
                            <TableCell>
                              <Chip
                                label={method.payment_method?.toUpperCase() || 'N/A'}
                                color="primary"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{formatNumber(method.count)}</TableCell>
                            <TableCell>{formatCurrency(method.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Performance Metrics */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Performance Metrics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total Visits:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(financialData.summary.total_visits)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total Expenses:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(financialData.summary.total_expense_count)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Avg Revenue/Visit:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(financialData.summary.average_revenue_per_visit)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Avg Expense/Item:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(financialData.summary.average_expense_per_item)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Date Range
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">From:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatDate(financialData.period.start_date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">To:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatDate(financialData.period.end_date)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Reports & Analytics
        </Typography>
        <Button
          variant="outlined"
          color="success"
          startIcon={<Download />}
          onClick={() => handleExport(tabLabels[activeTab].toLowerCase().replace(' ', '-'))}
        >
          Export CSV
        </Button>
      </Box>

      {/* Date Range Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
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
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Test Reports" icon={<Description />} />
            <Tab label="Patients Report" icon={<People />} />
            <Tab label="Tests Report" icon={<Science />} />
            <Tab label="Financial Report" icon={<AttachMoney />} />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && <TestReports />}
              {activeTab === 1 && <PatientsReport />}
              {activeTab === 2 && <TestsReport />}
              {activeTab === 3 && <FinancialReport />}
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Report Modal */}
      <Dialog open={showTestModal} onClose={() => setShowTestModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Test Report for Visit #{selectedVisit?.visit_number}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleTestSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Test Status</InputLabel>
                  <Select
                    name="test_status"
                    value={testFormData.test_status}
                    onChange={(e) => setTestFormData({ ...testFormData, test_status: e.target.value })}
                    label="Test Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="under_review">Under Review</MenuItem>
                    {user?.role === 'admin' && (
                      <MenuItem value="completed">Completed</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Referred Doctor"
                  name="referred_doctor"
                  value={testFormData.referred_doctor}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Clinical Data"
              multiline
              rows={3}
              name="clinical_data"
              value={testFormData.clinical_data}
              onChange={handleInputChange}
              placeholder="Enter clinical data..."
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Microscopic Description"
              multiline
              rows={3}
              name="microscopic_description"
              value={testFormData.microscopic_description}
              onChange={handleInputChange}
              placeholder="Enter microscopic description..."
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Diagnosis"
              multiline
              rows={3}
              name="diagnosis"
              value={testFormData.diagnosis}
              onChange={handleInputChange}
              placeholder="Enter diagnosis..."
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Recommendations"
              multiline
              rows={3}
              name="recommendations"
              value={testFormData.recommendations}
              onChange={handleInputChange}
              placeholder="Enter recommendations..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTestSubmit}>
            Save Test Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Results Modal */}
      <Dialog open={showResultsModal} onClose={() => setShowResultsModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Enter Test Results - {selectedVisit?.visit_number}</DialogTitle>
        <DialogContent>
          {selectedVisit && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2">
                    <strong>Patient:</strong> {selectedVisit.patient?.name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2">
                    <strong>Visit Date:</strong> {formatDate(selectedVisit.visit_date)}
                  </Typography>
                </Grid>
              </Grid>

              <List>
                {selectedVisit.visit_tests?.map((visitTest, index) => (
                  <React.Fragment key={visitTest.id}>
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {visitTest.lab_test?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {visitTest.lab_test?.code}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Ref: {visitTest.lab_test?.reference_range || 'N/A'}
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Result"
                            value={resultsData[visitTest.id]?.result_value || ''}
                            onChange={(e) => handleResultChange(visitTest.id, 'result_value', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Result Status</InputLabel>
                            <Select
                              value={resultsData[visitTest.id]?.result_status || 'normal'}
                              onChange={(e) => handleResultChange(visitTest.id, 'result_status', e.target.value)}
                              label="Result Status"
                            >
                              <MenuItem value="normal">Normal</MenuItem>
                              <MenuItem value="high">High</MenuItem>
                              <MenuItem value="low">Low</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Test Status</InputLabel>
                            <Select
                              value={testFormData.test_status}
                              onChange={(e) => setTestFormData({ ...testFormData, test_status: e.target.value })}
                              label="Test Status"
                            >
                              <MenuItem value="pending">Pending</MenuItem>
                              <MenuItem value="under_review">Under Review</MenuItem>
                              {user?.role === 'admin' && (
                                <MenuItem value="completed">Completed</MenuItem>
                              )}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Notes"
                            value={resultsData[visitTest.id]?.result_notes || ''}
                            onChange={(e) => handleResultChange(visitTest.id, 'result_notes', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </ListItem>
                    {index < selectedVisit.visit_tests.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultsModal(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleResultsSubmit}>
            Save Results
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;


