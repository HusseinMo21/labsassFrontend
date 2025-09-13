import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Visibility,
  Download,
  CheckCircle,
  Cancel,
  Warning,
  Science,
  Assessment,
  Person,
  AdminPanelSettings,
  Print,
  Refresh,
} from '@mui/icons-material';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../config/axios';

interface Visit {
  id: number;
  visit_number: string;
  visit_date: string;
  status: string;
  patient: {
    id: number;
    name: string;
  };
  visit_tests: VisitTest[];
  labRequest?: {
    lab_no: string;
    full_lab_no: string;
  };
}

interface VisitTest {
  id: number;
  status: string;
  result_value?: string;
  lab_test: {
    id: number;
    name: string;
    code: string;
    reference_range?: string;
  };
  test_validations: TestValidation[];
  quality_controls: QualityControl[];
}

interface TestValidation {
  id: number;
  status: string;
  validation_type: string;
  clinical_correlation?: string;
  validated_by_user?: {
    name: string;
  };
  validated_at?: string;
}

interface QualityControl {
  id: number;
  status: string;
  qc_type: string;
  performed_by_user: {
    name: string;
  };
}

interface ReportStatus {
  visit_id: number;
  can_generate_report: boolean;
  tests_status: Array<{
    test_name: string;
    is_validated: boolean;
    validated_by?: string;
    validated_at?: string;
  }>;
  quality_control_status: Array<{
    test_name: string;
    qc_type: string;
    status: string;
    performed_by: string;
  }>;
  blocking_issues: string[];
}

const EnhancedReports: React.FC = () => {
  useDocumentTitle('Enhanced Reports - Lab System');
  const { user } = useAuth();
  
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/visits');
      setVisits(response.data.data || response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportStatus = async (visitId: number) => {
    try {
      const response = await axios.get(`/api/enhanced-reports/status/${visitId}`);
      setReportStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch report status');
    }
  };

  const handleOpenDialog = (visit: Visit) => {
    setSelectedVisit(visit);
    setOpenDialog(true);
    fetchReportStatus(visit.id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVisit(null);
    setReportStatus(null);
  };

  const handleGenerateReport = async () => {
    if (!selectedVisit) return;

    try {
      setGeneratingReport(true);
      const response = await axios.get(`/api/enhanced-reports/professional/${selectedVisit.id}`, {
        responseType: 'blob',
      });

      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pathology_report_${selectedVisit.labRequest?.full_lab_no || selectedVisit.visit_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'validated': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'validated': return <CheckCircle />;
      case 'failed': return <Cancel />;
      case 'pending': return <Warning />;
      default: return <Science />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Enhanced Report Generation
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchVisits}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Visit Number</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tests Count</TableCell>
                  <TableCell>Report Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {visit.visit_number}
                      </Typography>
                      {visit.labRequest && (
                        <Typography variant="caption" color="textSecondary">
                          Lab: {visit.labRequest.full_lab_no}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{visit.patient.name}</TableCell>
                    <TableCell>{new Date(visit.visit_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(visit.status)}
                        label={visit.status.toUpperCase()}
                        color={getStatusColor(visit.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{visit.visit_tests?.length || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={visit.status === 'completed' ? 'Ready' : 'Pending'}
                        color={visit.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Report Status">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(visit)}
                          >
                            <Visibility />
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

      {/* Report Status Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          Report Generation Status - {selectedVisit?.patient.name}
        </DialogTitle>
        <DialogContent>
          {reportStatus && (
            <Box sx={{ mt: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Test Validation" />
                <Tab label="Quality Control" />
                <Tab label="Workflow" />
              </Tabs>

              {activeTab === 0 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Report Status
                          </Typography>
                          <Chip
                            icon={reportStatus.can_generate_report ? <CheckCircle /> : <Warning />}
                            label={reportStatus.can_generate_report ? 'Ready to Generate' : 'Not Ready'}
                            color={reportStatus.can_generate_report ? 'success' : 'warning'}
                            sx={{ mb: 2 }}
                          />
                          {reportStatus.blocking_issues.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" color="error" gutterBottom>
                                Blocking Issues:
                              </Typography>
                              <List dense>
                                {reportStatus.blocking_issues.map((issue, index) => (
                                  <ListItem key={index}>
                                    <ListItemIcon>
                                      <Cancel color="error" />
                                    </ListItemIcon>
                                    <ListItemText primary={issue} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Summary
                          </Typography>
                          <Typography variant="body2">
                            Total Tests: {reportStatus.tests_status.length}
                          </Typography>
                          <Typography variant="body2">
                            Validated Tests: {reportStatus.tests_status.filter(t => t.is_validated).length}
                          </Typography>
                          <Typography variant="body2">
                            QC Records: {reportStatus.quality_control_status.length}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Test Validation Status
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Test Name</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Validated By</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportStatus.tests_status.map((test, index) => (
                          <TableRow key={index}>
                            <TableCell>{test.test_name}</TableCell>
                            <TableCell>
                              <Chip
                                icon={test.is_validated ? <CheckCircle /> : <Warning />}
                                label={test.is_validated ? 'Validated' : 'Pending'}
                                color={test.is_validated ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{test.validated_by || 'N/A'}</TableCell>
                            <TableCell>
                              {test.validated_at ? new Date(test.validated_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Quality Control Status
                  </Typography>
                  {reportStatus.quality_control_status.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Test Name</TableCell>
                            <TableCell>QC Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Performed By</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportStatus.quality_control_status.map((qc, index) => (
                            <TableRow key={index}>
                              <TableCell>{qc.test_name}</TableCell>
                              <TableCell>{qc.qc_type.replace('_', ' ').toUpperCase()}</TableCell>
                              <TableCell>
                                <Chip
                                  icon={getStatusIcon(qc.status)}
                                  label={qc.status.toUpperCase()}
                                  color={getStatusColor(qc.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{qc.performed_by}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">
                      No quality control records found for this visit.
                    </Alert>
                  )}
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Report Generation Workflow
                  </Typography>
                  <Stepper orientation="vertical">
                    <Step active={true}>
                      <StepLabel>Test Execution</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Laboratory tests are performed and results are entered.
                        </Typography>
                      </StepContent>
                    </Step>
                    <Step active={reportStatus.tests_status.some(t => t.is_validated)}>
                      <StepLabel>Doctor Validation</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Doctors review and validate test results with clinical correlation.
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {reportStatus.tests_status.filter(t => t.is_validated).length} of {reportStatus.tests_status.length} tests validated
                        </Typography>
                      </StepContent>
                    </Step>
                    <Step active={reportStatus.can_generate_report}>
                      <StepLabel>Admin Final Approval</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Head of Doctors (Admin) provides final approval for report generation.
                        </Typography>
                      </StepContent>
                    </Step>
                    <Step active={false}>
                      <StepLabel>Report Generation</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Professional pathology report is generated and ready for delivery.
                        </Typography>
                      </StepContent>
                    </Step>
                  </Stepper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {reportStatus?.can_generate_report && (
            <Button
              variant="contained"
              startIcon={generatingReport ? <CircularProgress size={20} /> : <Print />}
              onClick={handleGenerateReport}
              disabled={generatingReport}
            >
              {generatingReport ? 'Generating...' : 'Generate Report'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedReports;
