import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Pagination,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Assignment,
  Person,
  Science,
  Schedule,
  Warning,
  CheckCircleOutline,
  CancelOutlined,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ReviewReport {
  visit_id: number;
  visit_number: string;
  lab_number: string;
  patient_name: string;
  patient_id: number;
  visit_date: string;
  test_count: number;
  completed_tests: number;
  report_status: 'pending' | 'draft' | 'rejected' | 'approved';
  report_created_at: string | null;
  report_updated_at: string | null;
  can_approve: boolean;
  blocking_issues: string[];
}

interface ReportDetails {
  visit: {
    id: number;
    visit_number: string;
    lab_number: string;
    visit_date: string;
    visit_time: string;
  };
  patient: {
    id: number;
    name: string;
    phone: string;
    gender: string;
    birth_date: string;
  };
  tests: Array<{
    id: number;
    test_name: string;
    category: string;
    category_code: string;
    result_value: string;
    result_status: string;
    status: string;
    completed_at: string;
    price: number | string;
  }>;
  report: {
    id: number;
    status: string;
    created_at: string;
    updated_at: string;
    notes: string;
  } | null;
  can_approve: boolean;
  blocking_issues: string[];
}

const ReviewReports: React.FC = () => {
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: 15,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axios.get('/api/admin/review-reports', { params });
      setReports(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (visitId: number) => {
    try {
      const response = await axios.get(`/api/admin/review-reports/${visitId}`);
      setSelectedReport(response.data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Failed to fetch report details:', error);
      toast.error('Failed to fetch report details');
    }
  };

  const handleApprove = async (visitId: number) => {
    try {
      await axios.post(`/api/admin/review-reports/${visitId}/approve`);
      toast.success('Report approved successfully');
      setApproveOpen(false);
      setDetailsOpen(false);
      fetchReports();
    } catch (error) {
      console.error('Failed to approve report:', error);
      toast.error('Failed to approve report');
    }
  };

  const handleReject = async (visitId: number) => {
    if (!rejectNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    try {
      await axios.post(`/api/admin/review-reports/${visitId}/reject`, {
        notes: rejectNotes.trim()
      });
      toast.success('Report rejected successfully');
      setRejectOpen(false);
      setRejectNotes('');
      setDetailsOpen(false);
      fetchReports();
    } catch (error) {
      console.error('Failed to reject report:', error);
      toast.error('Failed to reject report');
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending Review' },
      draft: { color: 'info', label: 'Draft' },
      rejected: { color: 'error', label: 'Rejected' },
      approved: { color: 'success', label: 'Approved' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Chip
        label={config.label}
        color={config.color as any}
        size="small"
        variant="outlined"
      />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Assignment color="primary" />
        Review Reports
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review and approve pathology reports as the Head of Doctors
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by visit number, patient name, phone, or patient ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={fetchReports}
                fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Refresh'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : reports.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No reports found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All reports have been reviewed or no completed tests found
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Visit #</TableCell>
                      <TableCell>Lab #</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Tests</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.visit_id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {report.visit_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                            {report.lab_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {report.patient_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {report.patient_id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(report.visit_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Science fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {report.completed_tests}/{report.test_count}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(report.report_status)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => fetchReportDetails(report.visit_id)}
                                color="primary"
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {report.can_approve && (
                              <>
                                <Tooltip title="Approve Report">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedReport(null);
                                      setApproveOpen(true);
                                    }}
                                    color="success"
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject Report">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedReport(null);
                                      setRejectOpen(true);
                                    }}
                                    color="error"
                                  >
                                    <Cancel />
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
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assignment color="primary" />
            Report Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              {/* Visit & Patient Info */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person color="primary" />
                        Patient Information
                      </Typography>
                      <Typography variant="body2"><strong>Name:</strong> {selectedReport.patient.name}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedReport.patient.phone}</Typography>
                      <Typography variant="body2"><strong>Gender:</strong> {selectedReport.patient.gender}</Typography>
                      <Typography variant="body2"><strong>Birth Date:</strong> {formatDate(selectedReport.patient.birth_date)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule color="primary" />
                        Visit Information
                      </Typography>
                      <Typography variant="body2"><strong>Visit #:</strong> {selectedReport.visit.visit_number}</Typography>
                      <Typography variant="body2"><strong>Lab #:</strong> {selectedReport.visit.lab_number}</Typography>
                      <Typography variant="body2"><strong>Date:</strong> {formatDate(selectedReport.visit.visit_date)}</Typography>
                      <Typography variant="body2"><strong>Time:</strong> {selectedReport.visit.visit_time}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Tests */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Science color="primary" />
                    Test Results ({selectedReport.tests.length})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Test Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Result</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedReport.tests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell>{test.test_name || 'Unknown Test'}</TableCell>
                            <TableCell>{test.category || 'Unknown'} ({test.category_code || 'N/A'})</TableCell>
                            <TableCell>{test.result_value || 'N/A'}</TableCell>
                            <TableCell>{getStatusChip(test.result_status || test.status || 'Pending')}</TableCell>
                            <TableCell>EGP {Number(test.price || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Blocking Issues */}
              {selectedReport.blocking_issues.length > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Issues to Address:
                  </Typography>
                  <List dense>
                    {selectedReport.blocking_issues.map((issue, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Warning fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={issue} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Report Status */}
              {selectedReport.report && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Report Status
                    </Typography>
                    <Typography variant="body2"><strong>Status:</strong> {getStatusChip(selectedReport.report.status)}</Typography>
                    <Typography variant="body2"><strong>Created:</strong> {formatDateTime(selectedReport.report.created_at)}</Typography>
                    <Typography variant="body2"><strong>Updated:</strong> {formatDateTime(selectedReport.report.updated_at)}</Typography>
                    {selectedReport.report.notes && (
                      <Typography variant="body2"><strong>Notes:</strong> {selectedReport.report.notes}</Typography>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedReport?.can_approve && (
            <>
              <Button
                onClick={() => {
                  setDetailsOpen(false);
                  setApproveOpen(true);
                }}
                color="success"
                startIcon={<CheckCircleOutline />}
              >
                Approve
              </Button>
              <Button
                onClick={() => {
                  setDetailsOpen(false);
                  setRejectOpen(true);
                }}
                color="error"
                startIcon={<CancelOutlined />}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)}>
        <DialogTitle>Approve Report</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this report? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedReport) {
                handleApprove(selectedReport.visit.id);
              }
            }}
            color="success"
            variant="contained"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Report</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Please provide a reason for rejecting this report:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Enter rejection reason..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedReport) {
                handleReject(selectedReport.visit.id);
              }
            }}
            color="error"
            variant="contained"
            disabled={!rejectNotes.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewReports;

