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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  CheckCircle,
  Cancel,
  Warning,
  Science,
  Assessment,
  Person,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../config/axios';

interface TestValidation {
  id: number;
  visit_test_id: number;
  validation_type: 'initial' | 'review' | 'final';
  status: 'pending' | 'validated' | 'rejected' | 'requires_correction';
  validated_by?: number;
  validated_at?: string;
  rejection_reason?: string;
  correction_notes?: string;
  clinical_correlation?: string;
  reference_range_check: boolean;
  critical_value_check: boolean;
  delta_check: boolean;
  technical_quality: boolean;
  result_consistency: boolean;
  validation_notes?: string;
  visit_test: {
    id: number;
    result_value?: string;
    result_status?: string;
    lab_test: {
      id: number;
      name: string;
      code: string;
      reference_range?: string;
    };
    visit: {
      id: number;
      patient: {
        id: number;
        name: string;
      };
    };
  };
  validated_by_user?: {
    id: number;
    name: string;
  };
}

const TestValidation: React.FC = () => {
  useDocumentTitle('Test Validation - Lab System');
  const { user } = useAuth();
  
  const [validations, setValidations] = useState<TestValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState<TestValidation | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'doctor_review' | 'admin_approval' | 'view'>('create');
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    visit_test_id: '',
    clinical_correlation: '',
    validation_notes: '',
    rejection_reason: '',
    correction_notes: '',
    final_notes: '',
  });

  useEffect(() => {
    fetchValidations();
  }, []);

  const fetchValidations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/test-validations');
      setValidations(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch test validations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDoctorReview = async () => {
    try {
      const response = await axios.get('/api/test-validations/pending-doctor-review');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch pending doctor reviews');
      return [];
    }
  };

  const fetchPendingAdminApproval = async () => {
    try {
      const response = await axios.get('/api/test-validations/pending-admin-approval');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch pending admin approvals');
      return [];
    }
  };

  const handleOpenDialog = (mode: 'create' | 'doctor_review' | 'admin_approval' | 'view', validation?: TestValidation) => {
    setDialogMode(mode);
    setSelectedValidation(validation || null);
    
    if (mode === 'create') {
      setFormData({
        visit_test_id: '',
        clinical_correlation: '',
        validation_notes: '',
        rejection_reason: '',
        correction_notes: '',
        final_notes: '',
      });
    } else if (validation) {
      setFormData({
        visit_test_id: validation.visit_test_id.toString(),
        clinical_correlation: validation.clinical_correlation || '',
        validation_notes: validation.validation_notes || '',
        rejection_reason: validation.rejection_reason || '',
        correction_notes: validation.correction_notes || '',
        final_notes: '',
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedValidation(null);
  };

  const handleCreateInitialValidation = async () => {
    try {
      await axios.post('/api/test-validations/create-initial', {
        visit_test_id: parseInt(formData.visit_test_id),
      });

      handleCloseDialog();
      fetchValidations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create initial validation');
    }
  };

  const handleDoctorReview = async (action: 'validate' | 'reject' | 'require_correction') => {
    if (!selectedValidation) return;

    try {
      await axios.post(`/api/test-validations/${selectedValidation.id}/doctor-review`, {
        action,
        clinical_correlation: formData.clinical_correlation,
        validation_notes: formData.validation_notes,
        rejection_reason: formData.rejection_reason,
        correction_notes: formData.correction_notes,
      });

      handleCloseDialog();
      fetchValidations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete doctor review');
    }
  };

  const handleAdminApproval = async (action: 'approve' | 'reject') => {
    if (!selectedValidation) return;

    try {
      await axios.post(`/api/test-validations/${selectedValidation.id}/admin-approval`, {
        action,
        final_notes: formData.final_notes,
        rejection_reason: formData.rejection_reason,
      });

      handleCloseDialog();
      fetchValidations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete admin approval');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'success';
      case 'rejected': return 'error';
      case 'requires_correction': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'requires_correction': return <Warning />;
      default: return <Science />;
    }
  };

  const getValidationChecks = (validation: TestValidation) => {
    const checks = [];
    if (validation.reference_range_check) checks.push('Reference Range');
    if (validation.critical_value_check) checks.push('Critical Value');
    if (validation.delta_check) checks.push('Delta Check');
    if (validation.technical_quality) checks.push('Technical Quality');
    if (validation.result_consistency) checks.push('Result Consistency');
    return checks.join(', ') || 'None';
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
          Test Validation Management
        </Typography>
        {user?.role === 'doctor' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('create')}
          >
            Create Initial Validation
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="All Validations" />
            {user?.role === 'doctor' && <Tab label="Pending Doctor Review" />}
            {user?.role === 'admin' && <Tab label="Pending Admin Approval" />}
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Validation ID</TableCell>
                  <TableCell>Test</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Result Value</TableCell>
                  <TableCell>Validation Checks</TableCell>
                  <TableCell>Validated By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validations.map((validation) => (
                  <TableRow key={validation.id}>
                    <TableCell>VAL-{validation.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {validation.visit_test.lab_test.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {validation.visit_test.lab_test.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{validation.visit_test.visit.patient.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={validation.validation_type.toUpperCase()} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(validation.status)}
                        label={validation.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(validation.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{validation.visit_test.result_value || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {getValidationChecks(validation)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {validation.validated_by_user?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {validation.validated_at 
                        ? new Date(validation.validated_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('view', validation)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {user?.role === 'doctor' && validation.status === 'pending' && (
                          <Tooltip title="Doctor Review">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('doctor_review', validation)}
                            >
                              <Person />
                            </IconButton>
                          </Tooltip>
                        )}
                        {user?.role === 'admin' && validation.status === 'validated' && (
                          <Tooltip title="Admin Approval">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('admin_approval', validation)}
                            >
                              <AdminPanelSettings />
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

      {/* Validation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' && 'Create Initial Validation'}
          {dialogMode === 'doctor_review' && 'Doctor Review'}
          {dialogMode === 'admin_approval' && 'Admin Final Approval'}
          {dialogMode === 'view' && 'Validation Details'}
        </DialogTitle>
        <DialogContent>
          {dialogMode === 'create' && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Visit Test ID"
                type="number"
                value={formData.visit_test_id}
                onChange={(e) => setFormData({ ...formData, visit_test_id: e.target.value })}
              />
            </Box>
          )}

          {dialogMode === 'doctor_review' && selectedValidation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Review Test Results
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Test: {selectedValidation.visit_test.lab_test.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Patient: {selectedValidation.visit_test.visit.patient.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Result: {selectedValidation.visit_test.result_value}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Reference Range: {selectedValidation.visit_test.lab_test.reference_range || 'N/A'}
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Clinical Correlation"
                value={formData.clinical_correlation}
                onChange={(e) => setFormData({ ...formData, clinical_correlation: e.target.value })}
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Validation Notes"
                value={formData.validation_notes}
                onChange={(e) => setFormData({ ...formData, validation_notes: e.target.value })}
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Rejection Reason (if rejecting)"
                value={formData.rejection_reason}
                onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Correction Notes (if requiring correction)"
                value={formData.correction_notes}
                onChange={(e) => setFormData({ ...formData, correction_notes: e.target.value })}
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {dialogMode === 'admin_approval' && selectedValidation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Final Approval - Head of Doctors
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Test: {selectedValidation.visit_test.lab_test.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Patient: {selectedValidation.visit_test.visit.patient.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Result: {selectedValidation.visit_test.result_value}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Clinical Correlation: {selectedValidation.clinical_correlation || 'N/A'}
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Final Notes"
                value={formData.final_notes}
                onChange={(e) => setFormData({ ...formData, final_notes: e.target.value })}
                sx={{ mt: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Rejection Reason (if rejecting)"
                value={formData.rejection_reason}
                onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {dialogMode === 'view' && selectedValidation && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Test Name:</Typography>
                  <Typography variant="body2">{selectedValidation.visit_test.lab_test.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Patient:</Typography>
                  <Typography variant="body2">{selectedValidation.visit_test.visit.patient.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Result Value:</Typography>
                  <Typography variant="body2">{selectedValidation.visit_test.result_value || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    icon={getStatusIcon(selectedValidation.status)}
                    label={selectedValidation.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedValidation.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Clinical Correlation:</Typography>
                  <Typography variant="body2">{selectedValidation.clinical_correlation || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Validation Notes:</Typography>
                  <Typography variant="body2">{selectedValidation.validation_notes || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode === 'create' && (
            <Button variant="contained" onClick={handleCreateInitialValidation}>
              Create Validation
            </Button>
          )}
          {dialogMode === 'doctor_review' && (
            <>
              <Button
                color="error"
                onClick={() => handleDoctorReview('reject')}
              >
                Reject
              </Button>
              <Button
                color="warning"
                onClick={() => handleDoctorReview('require_correction')}
              >
                Require Correction
              </Button>
              <Button
                color="success"
                variant="contained"
                onClick={() => handleDoctorReview('validate')}
              >
                Validate
              </Button>
            </>
          )}
          {dialogMode === 'admin_approval' && (
            <>
              <Button
                color="error"
                onClick={() => handleAdminApproval('reject')}
              >
                Reject
              </Button>
              <Button
                color="success"
                variant="contained"
                onClick={() => handleAdminApproval('approve')}
              >
                Final Approval
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestValidation;
