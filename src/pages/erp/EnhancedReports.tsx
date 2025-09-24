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
  Divider,
  Pagination,
  Stack,
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Check,
  Send,
  Assessment,
  FilterList,
  Folder,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

interface EnhancedReport {
  id: number;
  nos?: string;
  reff?: string;
  clinical?: string;
  nature?: string;
  report_date?: string;
  lab_no: string;
  age?: string;
  gross?: string;
  micro?: string;
  conc?: string;
  reco?: string;
  type?: string;
  sex?: string;
  recieving?: string;
  discharge?: string;
  confirm: boolean;
  print: boolean;
  patient_id?: number;
  lab_request_id?: number;
  created_by?: number;
  reviewed_by?: number;
  approved_by?: number;
  status: 'draft' | 'under_review' | 'approved' | 'printed' | 'delivered';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  examination_details?: any;
  quality_control?: any;
  barcode?: string;
  digital_signature?: string;
  reviewed_at?: string;
  approved_at?: string;
  printed_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  patient?: {
    id: number;
    name: string;
    phone?: string;
  };
  labRequest?: {
    id: number;
    lab_no: string;
    visit?: {
      id: number;
    };
  };
  createdBy?: {
    id: number;
    name: string;
  };
  reviewedBy?: {
  id: number;
    name: string;
  };
  approvedBy?: {
  id: number;
    name: string;
  };
}

interface ReportStats {
  total_reports: number;
  draft_reports: number;
  under_review: number;
  approved_reports: number;
  printed_reports: number;
  delivered_reports: number;
  urgent_reports: number;
  reports_today: number;
}

const EnhancedReports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<EnhancedReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EnhancedReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: 0,
    to: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    lab_no: '',
    patient_name: '',
    date_from: '',
    date_to: ''
  });

  // Form state for creating new report
  const [newReport, setNewReport] = useState({
    nos: '',
    reff: '',
    clinical: '',
    nature: '',
    report_date: new Date().toISOString().split('T')[0],
    lab_no: '',
    age: '',
    gross: '',
    micro: '',
    conc: '',
    reco: '',
    type: '',
    sex: '',
    recieving: '',
    discharge: '',
    patient_id: '',
    lab_request_id: '',
    priority: 'normal'
  });

  useEffect(() => {
    
    fetchReports(1); // Reset to first page when filters change
    fetchStats();
  }, [filters]);

  const fetchReports = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', page.toString());
      
      const response = await axios.get(`/api/enhanced-reports?${params}`);
      
      // Use requestAnimationFrame to defer state updates and improve performance
      requestAnimationFrame(() => {
        setReports(response.data.data.data);
        setPagination({
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
          per_page: response.data.data.per_page,
          total: response.data.data.total,
          from: response.data.data.from,
          to: response.data.data.to
        });
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/enhanced-reports-statistics');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    fetchReports(page);
    // Scroll to top of table when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateReport = async () => {
    try {
      
      const response = await axios.post('/api/enhanced-reports', newReport, {
        headers: {
        }
      });
      setReports([response.data.data, ...reports]);
      setIsCreateDialogOpen(false);
      setNewReport({
        nos: '',
        reff: '',
        clinical: '',
        nature: '',
        report_date: new Date().toISOString().split('T')[0],
        lab_no: '',
        age: '',
        gross: '',
        micro: '',
        conc: '',
        reco: '',
        type: '',
        sex: '',
        recieving: '',
        discharge: '',
        patient_id: '',
        lab_request_id: '',
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  // const handleWorkflowAction = async (reportId: number, action: string) => {
  //   try {
  //     if (action === 'print') {
  //       // Handle print action like the existing Reports system
  //       await handlePrintReport(reportId);
  //     } else {
        
  //       await axios.post(`/api/enhanced-reports/${reportId}/${action}`, {}, {
  //         headers: {
  //         }
  //       });
  //       fetchReports(pagination.current_page);
  //       fetchStats();
  //     }
  //   } catch (error) {
  //     console.error(`Error ${action} report:`, error);
  //   }
  // };

  // const handlePrintReport = async (reportId: number): Promise<void> => {
  //   // Function commented out - not currently used
  // };
  // try {
  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'default',
      under_review: 'warning',
      approved: 'success',
      printed: 'info',
      delivered: 'secondary'
    };
    return badges[status as keyof typeof badges] || 'default';
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'default',
      normal: 'primary',
      high: 'warning',
      urgent: 'error'
    };
    return badges[priority as keyof typeof badges] || 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Enhanced Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage laboratory reports with enhanced workflow
        </Typography>
        </Box>
        {user?.role !== 'staff' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            New Report
          </Button>
        )}
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Reports
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.total_reports}
                    </Typography>
                  </Box>
                  <Assessment color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Draft
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.draft_reports}
                    </Typography>
                  </Box>
                  <Edit color="action" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Under Review
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.under_review}
                    </Typography>
                  </Box>
                  <Visibility color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.approved_reports}
                    </Typography>
                  </Box>
                  <Check color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="printed">Printed</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                >
                  <MenuItem value="">All Priority</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Lab Number"
                placeholder="Lab Number"
                value={filters.lab_no}
                onChange={(e) => setFilters({...filters, lab_no: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Patient Name"
                placeholder="Patient Name"
                value={filters.patient_name}
                onChange={(e) => setFilters({...filters, patient_name: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="From Date"
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="To Date"
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reports Table */}
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
          <Typography variant="h6" gutterBottom>
            Reports
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lab No</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Box>
                      <Typography variant="body2" fontWeight="medium">
                          {report.lab_no}
                        </Typography>
                        {report.barcode && (
                          <Typography variant="caption" color="text.secondary">
                            {report.barcode}
                        </Typography>
                      )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {report.patient ? report.patient.name : (report.nos || 'N/A')}
                    </TableCell>
                    <TableCell>{report.type || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={report.status.replace('_', ' ').toUpperCase()}
                        color={getStatusBadge(report.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.priority.toUpperCase()}
                        color={getPriorityBadge(report.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {report.report_date ? formatDate(report.report_date) : 'N/A'}
                    </TableCell>
                    <TableCell>{report.createdBy?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Report">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedReport(report);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Documents">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={async () => {
                              let visitId = report.labRequest?.visit?.id;
                              
                              // If visit is not loaded, try to fetch it
                              if (!visitId && report.lab_request_id) {
                                try {
                                  const visitResponse = await axios.get(`/api/lab-requests/${report.lab_request_id}/visit`);
                                  visitId = visitResponse.data?.id;
                                } catch (error) {
                                  console.error('Failed to fetch visit:', error);
                                }
                              }
                              
                              if (visitId) {
                                navigate(`/documents/${visitId}`);
                              } else {
                                toast.error(`Visit not found for report ${report.id}. Lab Request ID: ${report.lab_request_id || 'N/A'}`);
                              }
                            }}
                          >
                            <Folder />
                          </IconButton>
                        </Tooltip>

                        {/* Send to Patient button - only for staff users */}
                        {user?.role === 'staff' && (report.status === 'approved' || report.status === 'printed') && (
                          <Tooltip title="Send to Patient Dashboard">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={async () => {
                                try {
                                  await axios.post(`/api/enhanced-reports/${report.id}/send-to-patient`);
                                  toast.success('Report sent to patient dashboard successfully');
                                  // Refresh the reports list
                                  fetchReports();
                                } catch (error: any) {
                                  console.error('Failed to send report to patient:', error);
                                  toast.error(error.response?.data?.message || 'Failed to send report to patient');
                                }
                              }}
                            >
                              <Send />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {pagination.total > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {pagination.from} to {pagination.to} of {pagination.total} reports
              </Typography>
              <Stack spacing={2}>
                <Pagination
                  count={pagination.last_page}
                  page={pagination.current_page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lab Number"
                value={newReport.lab_no}
                onChange={(e) => setNewReport({...newReport, lab_no: e.target.value})}
                placeholder="Auto-generated if empty"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Number (NOS)"
                value={newReport.nos}
                onChange={(e) => setNewReport({...newReport, nos: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                value={newReport.reff}
                onChange={(e) => setNewReport({...newReport, reff: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={newReport.type}
                  label="Report Type"
                  onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                >
                  <MenuItem value="pathology">Pathology</MenuItem>
                  <MenuItem value="hematology">Hematology</MenuItem>
                  <MenuItem value="biochemistry">Biochemistry</MenuItem>
                  <MenuItem value="microbiology">Microbiology</MenuItem>
                  <MenuItem value="immunology">Immunology</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newReport.priority}
                  label="Priority"
                  onChange={(e) => setNewReport({...newReport, priority: e.target.value})}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Report Date"
                type="date"
                value={newReport.report_date}
                onChange={(e) => setNewReport({...newReport, report_date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Clinical History"
                value={newReport.clinical}
                onChange={(e) => setNewReport({...newReport, clinical: e.target.value})}
                placeholder="Enter clinical history and symptoms..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Nature of Specimen"
                value={newReport.nature}
                onChange={(e) => setNewReport({...newReport, nature: e.target.value})}
                placeholder="Describe the nature of the specimen..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Gross Examination"
                value={newReport.gross}
                onChange={(e) => setNewReport({...newReport, gross: e.target.value})}
                placeholder="Enter gross examination findings..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Microscopic Examination"
                value={newReport.micro}
                onChange={(e) => setNewReport({...newReport, micro: e.target.value})}
                placeholder="Enter microscopic examination findings..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Conclusion"
                value={newReport.conc}
                onChange={(e) => setNewReport({...newReport, conc: e.target.value})}
                placeholder="Enter the final conclusion..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Recommendation"
                value={newReport.reco}
                onChange={(e) => setNewReport({...newReport, reco: e.target.value})}
                placeholder="Enter recommendations for treatment/follow-up..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateReport} variant="contained">
            Create Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog 
        open={isViewDialogOpen} 
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Report Details</Typography>
            {selectedReport && (
              <Box display="flex" gap={1}>
                <Chip
                  label={selectedReport.status.replace('_', ' ').toUpperCase()}
                  color={getStatusBadge(selectedReport.status) as any}
                  size="small"
                />
                <Chip
                  label={selectedReport.priority.toUpperCase()}
                  color={getPriorityBadge(selectedReport.priority) as any}
                  size="small"
                />
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
                <Box>
              {/* Basic Information */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Basic Information
                          </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Lab Number</Typography>
                  <Typography variant="body1">{selectedReport.lab_no}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Barcode</Typography>
                  <Typography variant="body1">{selectedReport.barcode || 'Not generated'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Patient Number</Typography>
                  <Typography variant="body1">{selectedReport.nos || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Reference</Typography>
                  <Typography variant="body1">{selectedReport.reff || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body1">{selectedReport.type || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Report Date</Typography>
                  <Typography variant="body1">
                    {selectedReport.report_date ? formatDate(selectedReport.report_date) : 'N/A'}
                              </Typography>
                </Grid>
                    </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Clinical Information */}
                          <Typography variant="h6" gutterBottom>
                Clinical Information
              </Typography>
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Clinical History
                          </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {selectedReport.clinical || 'No clinical history provided'}
                          </Typography>
                </Paper>
              </Box>
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nature of Specimen
                          </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {selectedReport.nature || 'No specimen information provided'}
                          </Typography>
                </Paper>
                </Box>

              <Divider sx={{ my: 2 }} />

              {/* Examination Results */}
                  <Typography variant="h6" gutterBottom>
                Examination Results
              </Typography>
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Gross Examination
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {selectedReport.gross || 'No gross examination findings'}
                  </Typography>
                </Paper>
                </Box>
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Microscopic Examination
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {selectedReport.micro || 'No microscopic examination findings'}
                  </Typography>
                </Paper>
                </Box>

              <Divider sx={{ my: 2 }} />

              {/* Conclusion & Recommendation */}
                  <Typography variant="h6" gutterBottom>
                Conclusion & Recommendation
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Conclusion
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1">
                      {selectedReport.conc || 'No conclusion provided'}
                        </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recommendation
                        </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1">
                      {selectedReport.reco || 'No recommendations provided'}
                        </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>
            Close
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedReports;
