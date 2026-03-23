import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  IconButton,
  Tooltip,
  Pagination,
  CircularProgress,
} from '@mui/material';
import {
  Download,
  Assessment,
  People,
  Science,
  AttachMoney,
  Description,
  Image,
  CloudUpload,
  Refresh,
  Search as SearchIcon,
  Folder,
  CheckCircle,
  Person,
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
  lab_number?: string;
  checked_by_doctors?: string[];
  last_checked_at?: string;
  labRequest?: {
    id: number;
    lab_no: string;
    suffix?: string;
    full_lab_no: string;
    reports?: Array<{
      id: number;
      content: string;
      title: string;
      status: string;
    }>;
  };
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

// Memoized table row component for better performance
const VisitTableRow = React.memo<{
  visit: Visit & { formattedDate: string };
  userRole?: string;
  userName?: string;
  onTestReport: (visit: Visit) => void;
  onViewDocuments: (visit: Visit) => void;
  onViewImage: (visit: Visit) => void;
  onMarkCompleted: (visit: Visit) => void;
  onReportedBy: (visit: Visit) => void;
  onCheckedBy: (visit: Visit) => void;
}>(({ 
  visit, 
  userRole, 
  userName,
  onTestReport, 
  onViewDocuments, 
  onViewImage, 
  onMarkCompleted, 
  onReportedBy, 
  onCheckedBy 
}) => {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" fontWeight="bold">
          {visit.lab_number || visit.labRequest?.full_lab_no || 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {visit.patient?.name || 'Unknown Patient'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            #{visit.patient?.id || 'N/A'} • {visit.patient?.phone || 'N/A'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {visit.formattedDate}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {visit.visit_tests?.length || 0} tests
        </Typography>
        {visit.visit_tests?.map((test) => (
          <Typography key={test.id} variant="caption" display="block">
            {test.lab_test?.name || 'Unknown Test'}
          </Typography>
        ))}
      </TableCell>
      <TableCell>
        {visit.image_path ? (
          <Button
            size="small"
            startIcon={<Image />}
            onClick={() => onViewImage(visit)}
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
          <Button
            size="small"
            variant="outlined"
            startIcon={<Description />}
            onClick={() => onTestReport(visit)}
          >
            Report
          </Button>
          {userRole === 'admin' ? (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => onMarkCompleted(visit)}
              >
                Completed
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<Person />}
                onClick={() => onReportedBy(visit)}
              >
                Reported By
              </Button>
            </>
          ) : userRole === 'doctor' ? (
            <>
              {/* Only show "Checked By" button if the current user has already checked this report */}
              {visit.checked_by_doctors && 
               userName && 
               visit.checked_by_doctors.includes(userName) && (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<Person />}
                  onClick={() => onCheckedBy(visit)}
                >
                  Checked By
                </Button>
              )}
            </>
          ) : null}
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<Folder />}
            onClick={() => onViewDocuments(visit)}
          >
            Documents
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
});

VisitTableRow.displayName = 'VisitTableRow';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
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
  
  // Initialize state from URL parameters
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page, 10) : 1;
  });
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [visitToComplete, setVisitToComplete] = useState<Visit | null>(null);
  const [showCheckedByModal, setShowCheckedByModal] = useState(false);
  const [visitToCheck, setVisitToCheck] = useState<Visit | null>(null);
  const [showReportedByModal, setShowReportedByModal] = useState(false);
  const [visitToShowReportedBy, setVisitToShowReportedBy] = useState<Visit | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('search') || '';
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    return searchParams.get('status') || 'all';
  });

  // Track if we're updating URL from state (to avoid loops)
  const isUpdatingUrl = useRef(false);
  const isInitialLoad = useRef(true);
  const prevSearchTerm = useRef(searchTerm);
  const prevStatusFilter = useRef(statusFilter);

  // Sync state from URL when URL changes (e.g., browser back/forward, navigation)
  useEffect(() => {
    // Skip on initial load - state is already initialized from URL
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    // Skip if we're the ones updating the URL
    if (isUpdatingUrl.current) {
      return;
    }
    
    const pageFromUrl = searchParams.get('page');
    const searchFromUrl = searchParams.get('search') || '';
    const statusFromUrl = searchParams.get('status') || 'all';
    
    const newPage = pageFromUrl ? parseInt(pageFromUrl, 10) : 1;
    const newSearch = searchFromUrl;
    const newStatus = statusFromUrl;
    
    // Update state from URL
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
    if (newSearch !== searchTerm) {
      setSearchTerm(newSearch);
    }
    if (newStatus !== statusFilter) {
      setStatusFilter(newStatus);
    }
  }, [searchParams]);

  // Update URL parameters when state changes (user actions)
  useEffect(() => {
    isUpdatingUrl.current = true;
    
    const params = new URLSearchParams();
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    setSearchParams(params, { replace: true });
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingUrl.current = false;
    }, 0);
  }, [currentPage, searchTerm, statusFilter, setSearchParams]);

  // Reset pagination when search or filter changes (user action only)
  useEffect(() => {
    // Only reset if user actually changed search or filter
    if (prevSearchTerm.current !== searchTerm || prevStatusFilter.current !== statusFilter) {
      prevSearchTerm.current = searchTerm;
      prevStatusFilter.current = statusFilter;
      // Only reset if not initial load
      if (!isInitialLoad.current) {
        setCurrentPage(1);
      }
    }
  }, [searchTerm, statusFilter]);

  const [resultsData, setResultsData] = useState<{ [key: number]: { result_value: string; result_status: string; result_notes: string } }>({});
  const [dateRange, setDateRange] = useState({
    start_date: '', // Empty by default to show all visits
    end_date: '', // Empty by default to show all visits
  });

  // Load visits first (priority), then summary data
  useEffect(() => {
    // Fetch visits immediately on mount (without debounce)
    const loadInitialData = async () => {
      try {
        setLoading(true);
        let params: any = {
          page: currentPage,
          per_page: 15,
        };

        // Role-based filtering
        if (user?.role === 'doctor') {
          params.exclude_completed = 'true';
        } else {
          params.exclude_completed = 'true';
        }

        // Add status filter
        if (statusFilter !== 'all') {
          params.test_status = statusFilter;
        }

        // Add date range (only if both dates are provided)
        if (dateRange.start_date && dateRange.end_date) {
          params.start_date = dateRange.start_date;
          params.end_date = dateRange.end_date;
        }

        const response = await axios.get('/api/visits', { params });
        setVisits(response.data.data || []);
        setTotalPages(response.data.last_page || 1);
      } catch (error) {
        console.error('Failed to fetch visits:', error);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    
    // Fetch summary data after a short delay (non-blocking)
    // This allows the main table to render first
    const summaryTimeout = setTimeout(() => {
      fetchReportData();
    }, 200);

    return () => clearTimeout(summaryTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      let params: any = {
        page: currentPage,
        per_page: 15,
      };

      // Role-based filtering
      if (user?.role === 'doctor') {
        // Doctors can see all visits except completed ones (completed reports go to Enhanced Reports)
        // They need to see pending, in_progress, and under_review visits
        params.exclude_completed = 'true';
        // Doctor user detected, showing non-completed visits
      } else {
        // Both admin and staff can see all visits
        // No role-based filtering
      }

      // Exclude completed visits from Reports & Analytics (only for admin/staff)
      // Completed visits should only appear in Enhanced Reports
      if (user?.role !== 'doctor') {
        params.exclude_completed = 'true';
      }

      // Add search functionality
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add status filter
      if (statusFilter !== 'all') {
        params.test_status = statusFilter;
      }

      // Add date range (only if both dates are provided)
      if (dateRange.start_date && dateRange.end_date) {
        params.start_date = dateRange.start_date;
        params.end_date = dateRange.end_date;
      }

      const response = await axios.get('/api/visits', { params });
      
      setVisits(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch visits:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, dateRange, user?.role]);

  // Track if initial load is done
  const initialLoadDone = useRef(false);

  // Debounce search term and date range to reduce API calls (only after initial load)
  useEffect(() => {
    // Skip debounce on initial mount - initial load is handled separately
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchVisits();
    }, searchTerm || dateRange.start_date || dateRange.end_date ? 300 : 0); // 300ms delay for search/date changes, immediate for other filters

    return () => clearTimeout(timeoutId);
  }, [fetchVisits, searchTerm, dateRange.start_date, dateRange.end_date, statusFilter, currentPage]);

  const fetchReportData = useCallback(async () => {
    setLoadingSummary(true);
    try {
      // Match /api/visits: this page hides completed visits, so summaries must too
      const reportParams: Record<string, string> = {
        exclude_completed: 'true',
      };
      if (dateRange.start_date && dateRange.end_date) {
        reportParams.start_date = dateRange.start_date;
        reportParams.end_date = dateRange.end_date;
      }
      const patientsParams =
        dateRange.start_date && dateRange.end_date
          ? { start_date: dateRange.start_date, end_date: dateRange.end_date }
          : {};

      const [patientsResponse, testsResponse, financialResponse] = await Promise.all([
        axios.get('/api/reports/patients', { params: patientsParams }),
        axios.get('/api/reports/tests', { params: reportParams }),
        axios.get('/api/reports/financial', { params: reportParams }),
      ]);

      setPatientsData(patientsResponse.data);
      setTestsData(testsResponse.data);
      setFinancialData(financialResponse.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Don't show error toast for summary data - it's not critical
    } finally {
      setLoadingSummary(false);
    }
  }, [dateRange.start_date, dateRange.end_date]);

  const summaryDateEffectRan = useRef(false);
  useEffect(() => {
    if (!summaryDateEffectRan.current) {
      summaryDateEffectRan.current = true;
      return;
    }
    const t = setTimeout(() => {
      fetchReportData();
    }, 300);
    return () => clearTimeout(t);
  }, [dateRange.start_date, dateRange.end_date, fetchReportData]);

  // Memoize sorted and formatted visits for performance
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => 
      new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
    );
  }, [visits]);

  // Memoize formatted visits with pre-formatted dates
  const formattedVisits = useMemo(() => {
    return sortedVisits.map(visit => ({
      ...visit,
      formattedDate: new Date(visit.visit_date).toLocaleDateString(),
    }));
  }, [sortedVisits]);

  const handleTestReport = useCallback((visit: Visit) => {
    // Navigate to the new ReportForm component with return URL
    // Build return URL with current state
    const params = new URLSearchParams();
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    const returnUrl = `/reports${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(`/reports/${visit.id}`, { state: { returnUrl } });
  }, [currentPage, searchTerm, statusFilter, navigate]);

  const handleViewDocuments = useCallback((visit: Visit) => {
    // Navigate to the documents component
    navigate(`/documents/${visit.id}`);
  }, [navigate]);

  const handleViewImage = useCallback((visit: Visit) => {
    setSelectedImageVisit(visit);
    setShowImageModal(true);
  }, []);

  const handleReplaceImage = useCallback((visit: Visit) => {
    setSelectedImageVisit(visit);
    setShowReplaceImageModal(true);
  }, []);

  const handleRemoveImage = async (visit: Visit) => {
    if (!window.confirm('Are you sure you want to remove this image? This action cannot be undone.')) {
      return;
    }

    try {

      await axios.delete(`/api/visits/${visit.id}/image`, {
        headers: {
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


      await axios.post(`/api/visits/${selectedImageVisit.id}/image`, formData, {
        headers: {
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

  // Removed handleTestResults - no longer used after removing Results button

  const handleResultsSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
      
    try {
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
  }, [selectedVisit, resultsData, fetchVisits]);

  const handleResultChange = useCallback((testId: number, field: string, value: string) => {
    setResultsData((prev) => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value,
      },
    }));
  }, []);

  const handleMarkCompleted = useCallback((visit: Visit) => {
    setVisitToComplete(visit);
    setShowCompleteModal(true);
  }, []);

  const confirmMarkCompleted = useCallback(async () => {
    if (!visitToComplete) return;

    setLoading(true);
    try {
      // Mark the visit as completed
      await axios.put(`/api/visits/${visitToComplete.id}/complete`);

      toast.success('Report marked as completed and moved to Enhanced Reports');
      
      // Close modal and refresh the visits list
      setShowCompleteModal(false);
      setVisitToComplete(null);
      fetchVisits();
    } catch (error) {
      console.error('Failed to mark report as completed:', error);
      toast.error('Failed to mark report as completed');
    } finally {
      setLoading(false);
    }
  }, [visitToComplete, fetchVisits]);

  const handleCheckedBy = useCallback((visit: Visit) => {
    setVisitToCheck(visit);
    setShowCheckedByModal(true);
  }, []);


  const handleReportedBy = useCallback((visit: Visit) => {
    setVisitToShowReportedBy(visit);
    setShowReportedByModal(true);
  }, []);

  const handleExport = useCallback(async (type: string) => {
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
  }, [dateRange]);

  // const handlePrintReport = async (_: Visit) => {
  //   try {
  //     const response = await axios.get(`/api/visits/${_.id}/report/pdf`, {
  //       responseType: 'blob',
  //     });

  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //           const link = document.createElement('a');
  //           link.href = url;
  //     link.setAttribute('download', `report_${_.visit_number}.pdf`);
  //           document.body.appendChild(link);
  //           link.click();
  //           link.remove();
  //       window.URL.revokeObjectURL(url);

  //     toast.success('Report PDF generated successfully');
  //   } catch (error) {
  //     console.error('Print report error:', error);
  //     toast.error('Failed to generate report PDF');
  //   }
  // };

  // const getStatusColor = (status: string) => {
  //   const safeStatus = status || 'pending';
  //   switch (safeStatus) {
  //     case 'completed': return 'success';
  //     case 'pending': return 'warning';
  //     case 'under_review': return 'info';
  //     default: return 'default';
  //   }
  // };

  // const getTestStatusChip = (_: string) => {
  //   const safeStatus = _ || 'pending';
  //   return (
  //     <Chip
  //       label={safeStatus.replace('_', ' ').toUpperCase()}
  //       color={getStatusColor(safeStatus) as any}
  //       size="small"
  //     />
  //   );
  // };

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
                  {loadingSummary ? (
                    <CircularProgress size={24} />
                  ) : (
                  <Typography variant="h4" component="div">
                    {patientsData?.summary.total_patients || 0}
                  </Typography>
                  )}
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
                  {loadingSummary ? (
                    <CircularProgress size={24} />
                  ) : (
                  <Typography variant="h4" component="div">
                    {testsData?.summary.total_tests || 0}
                  </Typography>
                  )}
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
                  {loadingSummary ? (
                    <CircularProgress size={24} />
                  ) : (
                  <Typography variant="h4" component="div">
                    {testsData?.summary.completed_tests || 0}
                  </Typography>
                  )}
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
                  {loadingSummary ? (
                    <CircularProgress size={24} />
                  ) : (
                  <Typography variant="h4" component="div">
                    ${financialData?.summary.total_revenue || 0}
                  </Typography>
                  )}
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

      {/* Visit Reports */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Visit Reports
          </Typography>
              
              <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                      <TableCell>Lab No</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Tests</TableCell>
                      <TableCell>Image</TableCell>
                      <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formattedVisits.map((visit) => (
                    <VisitTableRow
                      key={visit.id}
                      visit={visit}
                      userRole={user?.role}
                      userName={user?.name}
                      onTestReport={handleTestReport}
                      onViewDocuments={handleViewDocuments}
                      onViewImage={handleViewImage}
                      onMarkCompleted={handleMarkCompleted}
                      onReportedBy={handleReportedBy}
                      onCheckedBy={handleCheckedBy}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
      
      {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
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
              <Button
                variant="outlined"
                color="warning"
                startIcon={<CloudUpload />}
                onClick={() => handleReplaceImage(selectedImageVisit)}
              >
                Replace
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleRemoveImage(selectedImageVisit)}
              >
                Remove
              </Button>
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

      {/* Complete Report Confirmation Modal */}
      <Dialog 
        open={showCompleteModal} 
        onClose={() => setShowCompleteModal(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="h6">Mark Report as Completed</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to mark this report as completed?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action will move the report to Enhanced Reports and it will no longer appear in Reports & Analytics.
          </Typography>
          {visitToComplete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Report Details:
              </Typography>
              <Typography variant="body2">
                <strong>Visit:</strong> {visitToComplete.visit_number}
              </Typography>
              <Typography variant="body2">
                <strong>Patient:</strong> {visitToComplete.patient?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {new Date(visitToComplete.visit_date).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success"
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            onClick={confirmMarkCompleted}
            disabled={loading}
          >
            {loading ? 'Marking as Completed...' : 'Mark as Completed'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checked By Modal */}
      <Dialog 
        open={showCheckedByModal} 
        onClose={() => setShowCheckedByModal(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" />
            <Typography variant="h6">Checked By Doctors</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {visitToCheck && (
            <>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Report Details:
                </Typography>
                <Typography variant="body2">
                  <strong>Visit:</strong> {visitToCheck.visit_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Lab No:</strong> {visitToCheck.lab_number || visitToCheck.labRequest?.full_lab_no || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Patient:</strong> {visitToCheck.patient?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(visitToCheck.visit_date).toLocaleDateString()}
                </Typography>
              </Box>
              
              {visitToCheck.checked_by_doctors && visitToCheck.checked_by_doctors.length > 0 ? (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Checked by {visitToCheck.checked_by_doctors.length} doctor(s):
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {visitToCheck.checked_by_doctors.map((doctor: string, index: number) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                        <Person color="primary" />
                        <Typography variant="body1">{doctor}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {visitToCheck.last_checked_at && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Last checked: {new Date(visitToCheck.last_checked_at).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Person sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No doctors have checked this report yet
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCheckedByModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reported By Modal */}
      <Dialog 
        open={showReportedByModal} 
        onClose={() => setShowReportedByModal(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="info" />
            <Typography variant="h6">Reported By Doctors</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {visitToShowReportedBy && (
            <>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Report Details:
                </Typography>
                <Typography variant="body2">
                  <strong>Visit:</strong> {visitToShowReportedBy.visit_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Lab No:</strong> {visitToShowReportedBy.lab_number || visitToShowReportedBy.labRequest?.full_lab_no || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Patient:</strong> {visitToShowReportedBy.patient?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(visitToShowReportedBy.visit_date).toLocaleDateString()}
                </Typography>
              </Box>
              
              {visitToShowReportedBy.checked_by_doctors && visitToShowReportedBy.checked_by_doctors.length > 0 ? (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Checked by {visitToShowReportedBy.checked_by_doctors.length} doctor(s):
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {visitToShowReportedBy.checked_by_doctors.map((doctor: string, index: number) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                        <Person color="primary" />
                        <Typography variant="body1">{doctor}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {visitToShowReportedBy.last_checked_at && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Last checked: {new Date(visitToShowReportedBy.last_checked_at).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Person sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No doctors have checked this report yet
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportedByModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;

