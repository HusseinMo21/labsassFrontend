import React, { useState } from 'react';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
} from '@mui/material';
import {
  Search,
  History,
  Description,
  AttachMoney,
  Print,
  Person,
  Phone,
  CalendarToday,
  Science,
  CheckCircle,
  Schedule,
  Error,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Patient {
  id: number;
  name: string;
  gender: string;
  age?: number;
  phone: string;
  email?: string;
  address?: string;
}

interface Visit {
  id: number;
  visit_date: string;
  visit_tests?: VisitTest[];
}

interface VisitTest {
  id: number;
  lab_test?: {
    name: string;
  };
  labTest?: {
    name: string;
  };
  result_value?: string;
  status: string;
}

interface Report {
  report_id: number;
  test_name: string;
  status: string;
  result_value?: string;
}

interface Payment {
  amount: number;
  method: string;
  paid_at: string;
  notes?: string;
}

interface PatientHistory {
  id: number;
  name: string;
  gender: string;
  phone: string;
  visits: Visit[];
}

interface PatientReports {
  reports: Report[];
}

interface PatientPayments {
  total_paid: number;
  total_due: number;
  payments: Payment[];
}

const PatientTestSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showHistory, setShowHistory] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);
  const [historyData, setHistoryData] = useState<PatientHistory | null>(null);
  const [reportsData, setReportsData] = useState<PatientReports | null>(null);
  const [paymentsData, setPaymentsData] = useState<PatientPayments | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await axios.get('/api/patients/by-test', {
        params: { test_name: query },
      });
      setResults(response.data.patients || []);
      
      if (response.data.patients?.length === 0) {
        toast.info('No patients found for this test/illness');
      } else {
        toast.success(`Found ${response.data.patients?.length || 0} patients`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch patients');
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (patient: Patient) => {
    setModalPatient(patient);
    setShowHistory(true);
    setModalLoading(true);
    setModalError('');

    try {
      const response = await axios.get(`/api/patients/${patient.id}/full-history`);
      setHistoryData(response.data.patient);
    } catch (err) {
      console.error('History error:', err);
      setModalError('Failed to load patient history');
      toast.error('Failed to load patient history');
    } finally {
      setModalLoading(false);
    }
  };

  const openReports = async (patient: Patient) => {
    setModalPatient(patient);
    setShowReports(true);
    setModalLoading(true);
    setModalError('');

    try {
      const response = await axios.get(`/api/patients/${patient.id}/reports`);
      setReportsData(response.data);
    } catch (err) {
      console.error('Reports error:', err);
      setModalError('Failed to load patient reports');
      toast.error('Failed to load patient reports');
    } finally {
      setModalLoading(false);
    }
  };

  const openPayments = async (patient: Patient) => {
    setModalPatient(patient);
    setShowPayments(true);
    setModalLoading(true);
    setModalError('');

    try {
      const response = await axios.get(`/api/patients/${patient.id}/payments`);
      setPaymentsData(response.data);
    } catch (err) {
      console.error('Payments error:', err);
      setModalError('Failed to load payment history');
      toast.error('Failed to load payment history');
    } finally {
      setModalLoading(false);
    }
  };

  const printAllReports = async (patient: Patient) => {
    try {
      console.log('Printing all reports for patient:', patient.id);
      
      // Make API request to get the PDF
      const response = await axios.get(`/api/patients/${patient.id}/print-reports`, {
        responseType: 'blob',
      });

      console.log('PDF response received:', response);
      console.log('Response status:', response.status);

      // Create blob URL and open in new tab for preview
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
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
            z-index: 1000;
            background: #1976d2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          `;
          downloadBtn.onclick = function() {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `all_reports_${patient.id}_${patient.name || 'patient'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
          };
          newWindow.document.body.appendChild(downloadBtn);
        };
        toast.success('All reports opened in new tab');
      } else {
        // Fallback: direct download if popup is blocked
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `all_reports_${patient.id}_${patient.name || 'patient'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('All reports downloaded (popup blocked)');
      }
      
      // Clean up the blob URL after 10 seconds
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
      
    } catch (err) {
      console.error('Print error:', err);
      console.error('Error response:', (err as any).response);
      console.error('Error status:', (err as any).response?.status);
      
      if ((err as any).response?.status === 404) {
        toast.error('PDF endpoint not found. Please check if the backend server is running.');
      } else if ((err as any).response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if ((err as any).response?.status === 500) {
        toast.error('Server error while generating PDF. Please try again.');
      } else {
        toast.error(`Failed to print reports: ${(err as any).response?.data?.message || (err as any).message}`);
      }
    }
  };

  const printSingleReport = async (reportId: number) => {
    try {
      console.log('Printing single report:', reportId);
      
      // Show loading toast
      const loadingToast = toast.loading('Generating PDF report...');
      
      // Make API request to get the PDF with timeout
      const response = await axios.get(`/api/reports/${reportId}/print`, {
        responseType: 'blob',
        timeout: 30000, // 30 second timeout for PDF generation
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      console.log('PDF response received:', response);
      console.log('Response status:', response.status);

      // Create blob URL and open in new tab for preview
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
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
            z-index: 1000;
            background: #1976d2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          `;
          downloadBtn.onclick = function() {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${reportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
          };
          newWindow.document.body.appendChild(downloadBtn);
        };
        toast.success('Report opened in new tab');
      } else {
        // Fallback: direct download if popup is blocked
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_${reportId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Report downloaded (popup blocked)');
      }
      
      // Clean up the blob URL after 10 seconds
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
      
    } catch (err: any) {
      console.error('Print error:', err);
      console.error('Error response:', (err as any).response);
      console.error('Error status:', (err as any).response?.status);
      
      // Dismiss loading toast if it exists
      toast.dismiss();
      
      if (err.code === 'ECONNABORTED') {
        toast.error('PDF generation timed out. Please try again.');
      } else if (err.response?.status === 404) {
        toast.error('PDF endpoint not found. Please check if the backend server is running.');
      } else if (err.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (err.response?.status === 500) {
        toast.error('Server error while generating PDF. Please try again.');
      } else {
        toast.error(`Failed to print report: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const closeModals = () => {
    setShowHistory(false);
    setShowReports(false);
    setShowPayments(false);
    setModalPatient(null);
    setHistoryData(null);
    setReportsData(null);
    setPaymentsData(null);
    setModalError('');
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      completed: { color: 'success' as const, icon: <CheckCircle />, label: 'Completed' },
      pending: { color: 'warning' as const, icon: <Schedule />, label: 'Pending' },
      cancelled: { color: 'error' as const, icon: <Error />, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Search Patients by Test/Illness
      </Typography>

      {/* Search Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter test or illness name (e.g., Complete Blood Count (CBC))"
              variant="outlined"
              size="medium"
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="medium"
              disabled={loading || !query.trim()}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Results ({results.length} patients found)
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((patient, idx) => (
                    <TableRow key={patient.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {patient.name?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {patient.name}
                            </Typography>
                            {patient.email && (
                              <Typography variant="body2" color="text.secondary">
                                {patient.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={patient.gender}
                          color={patient.gender === 'male' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{patient.age || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" color="action" />
                          {patient.phone}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Full History">
                            <IconButton
                              size="small"
                              onClick={() => openHistory(patient)}
                              color="primary"
                            >
                              <History />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Show All Reports">
                            <IconButton
                              size="small"
                              onClick={() => openReports(patient)}
                              color="error"
                            >
                              <Description />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="See Payments">
                            <IconButton
                              size="small"
                              onClick={() => openPayments(patient)}
                              color="success"
                            >
                              <AttachMoney />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print All Reports">
                            <IconButton
                              size="small"
                              onClick={() => printAllReports(patient)}
                              color="info"
                            >
                              <Print />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {!loading && results.length === 0 && query && !error && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Science sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No patients found for this test/illness
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try searching with a different test name or illness
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && !query && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Enter a test or illness name to search for patients
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search for patients who have undergone specific tests or have specific illnesses
            </Typography>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" color="primary">
              Searching for patients...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* History Modal */}
      <Dialog open={showHistory} onClose={closeModals} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Person color="primary" />
            Full History for {modalPatient?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : modalError ? (
            <Alert severity="error">{modalError}</Alert>
          ) : historyData ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Patient Information</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                  <Typography><strong>Gender:</strong> {historyData.gender}</Typography>
                  <Typography><strong>Phone:</strong> {historyData.phone}</Typography>
                </Box>
                <Typography><strong>Total Visits:</strong> {historyData.visits.length}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                <strong>All Visits & Tests</strong>
              </Typography>
              {historyData.visits.map((visit) => (
                <Card key={visit.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CalendarToday color="primary" />
                      <Typography variant="subtitle2">
                        <strong>Date:</strong> {formatDate(visit.visit_date)}
                      </Typography>
                      <Typography variant="subtitle2">
                        <strong>Tests:</strong> {visit.visit_tests?.length || 0}
                      </Typography>
                    </Box>
                    {visit.visit_tests && visit.visit_tests.length > 0 && (
                      <List dense>
                        {visit.visit_tests.map((test) => (
                          <ListItem key={test.id} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Science fontSize="small" />
                                  <Typography variant="body2">
                                    {(test as any).custom_test_name || test.lab_test?.name || test.labTest?.name}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                  <Typography variant="caption">
                                    Result: {test.result_value || '-'}
                                  </Typography>
                                  {getStatusChip(test.status)}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reports Modal */}
      <Dialog open={showReports} onClose={closeModals} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Description color="error" />
            All Reports for {modalPatient?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : modalError ? (
            <Alert severity="error">{modalError}</Alert>
          ) : reportsData ? (
            <List>
              {reportsData.reports.map((report) => (
                <ListItem key={report.report_id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Science fontSize="small" />
                        <Typography variant="subtitle2">
                          <strong>{report.test_name}</strong>
                        </Typography>
                        {getStatusChip(report.status)}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Result: {report.result_value || '-'}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={() => printSingleReport(report.report_id)}
                    >
                      Print
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Payments Modal */}
      <Dialog open={showPayments} onClose={closeModals} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AttachMoney color="success" />
            Payments for {modalPatient?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : modalError ? (
            <Alert severity="error">{modalError}</Alert>
          ) : paymentsData ? (
            <Box>
              <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(paymentsData.total_paid || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Paid
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(paymentsData.total_due || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Due
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                <strong>Payment History</strong>
              </Typography>
              <List>
                {paymentsData.payments.map((payment, index) => (
                  <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2">
                            {formatCurrency(payment.amount)}
                          </Typography>
                          <Chip label={payment.method} size="small" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(payment.paid_at)}
                          </Typography>
                          {payment.notes && (
                            <Typography variant="caption" color="text.secondary">
                              {payment.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientTestSearch;
