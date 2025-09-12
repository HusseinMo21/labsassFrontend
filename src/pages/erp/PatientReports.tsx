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
  Chip,
  Button,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assessment,
  PictureAsPdf,
  Download,
  Visibility,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

interface PatientReport {
  id: number;
  visit_id: string;
  test_name: string;
  test_category: string;
  result_value?: string;
  result_status: string;
  visit_date: string;
  report_date?: string;
  status: string;
  patient_name: string;
  clinical_data?: string;
  microscopic_description?: string;
  diagnosis?: string;
  recommendations?: string;
}

const PatientReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatientReports();
  }, []);

  const fetchPatientReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/patient/my-reports');
      setReports(response.data.reports || []);
    } catch (err: any) {
      console.error('Error fetching patient reports:', err);
      setError('Failed to load your reports');
      toast.error('Failed to load your reports');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = async (report: PatientReport) => {
    try {
      console.log('Starting PDF generation for report:', report);
      const response = await axios.get(`/api/reports/${report.id}/print`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
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
            link.setAttribute('download', `my_report_${report.id}_${report.test_name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
          };
          newWindow.document.body.appendChild(downloadBtn);
        };
        toast.success('Report opened in new tab');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `my_report_${report.id}_${report.test_name}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Report downloaded (popup blocked)');
      }
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
    } catch (error: any) {
      console.error('PDF generation error:', error);
      if (error.response?.status === 404) {
        toast.error('Report not found or not yet completed');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You can only view reports after full payment and completion');
      } else {
        toast.error(`Failed to generate PDF report: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending' },
      in_progress: { color: 'info', label: 'In Progress' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color as any} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assessment sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1">
            My Test Reports
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View your completed test reports
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Important:</strong> You can only view and download your test reports after you have paid the full amount and the admin has marked the report as completed.
        </Typography>
      </Alert>

      {reports.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Reports Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any completed reports yet. Reports will appear here after payment and completion.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Test Reports ({reports.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Visit ID</TableCell>
                        <TableCell>Test Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Visit Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {report.visit_id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {report.test_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {report.test_category}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(report.visit_date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(report.status)}
                          </TableCell>
                          <TableCell>
                            {report.result_value ? (
                              <Typography variant="body2" fontWeight="medium">
                                {report.result_value}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Pending
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              {report.status === 'completed' ? (
                                <Tooltip title="Download Report">
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePrintReport(report)}
                                    color="primary"
                                  >
                                    <PictureAsPdf />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Report not yet completed">
                                  <IconButton size="small" disabled>
                                    <PictureAsPdf />
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PatientReports;

