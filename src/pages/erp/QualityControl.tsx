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
} from '@mui/icons-material';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import axios from '../../config/axios';

interface QualityControl {
  id: number;
  visit_test_id: number;
  qc_type: 'pre_test' | 'post_test' | 'batch_control';
  status: 'pending' | 'passed' | 'failed' | 'requires_review';
  control_sample_id?: string;
  expected_value?: number;
  actual_value?: number;
  tolerance_range?: number;
  performed_by: number;
  performed_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  notes?: string;
  equipment_used?: string;
  reagent_lot_number?: string;
  reagent_expiry_date?: string;
  visit_test: {
    id: number;
    lab_test: {
      id: number;
      name: string;
      code: string;
    };
    visit: {
      id: number;
      patient: {
        id: number;
        name: string;
      };
    };
  };
  performed_by_user: {
    id: number;
    name: string;
  };
  reviewed_by_user?: {
    id: number;
    name: string;
  };
}

const QualityControl: React.FC = () => {
  useDocumentTitle('Quality Control - Lab System');
  
  const [qualityControls, setQualityControls] = useState<QualityControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedQC, setSelectedQC] = useState<QualityControl | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view' | 'review'>('create');
  const [formData, setFormData] = useState({
    visit_test_id: '',
    qc_type: 'pre_test' as 'pre_test' | 'post_test' | 'batch_control',
    control_sample_id: '',
    expected_value: '',
    actual_value: '',
    tolerance_range: '',
    notes: '',
    equipment_used: '',
    reagent_lot_number: '',
    reagent_expiry_date: '',
  });

  useEffect(() => {
    fetchQualityControls();
  }, []);

  const fetchQualityControls = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/quality-controls');
      setQualityControls(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch quality controls');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'create' | 'edit' | 'view' | 'review', qc?: QualityControl) => {
    setDialogMode(mode);
    setSelectedQC(qc || null);
    
    if (mode === 'create') {
      setFormData({
        visit_test_id: '',
        qc_type: 'pre_test' as 'pre_test' | 'post_test' | 'batch_control',
        control_sample_id: '',
        expected_value: '',
        actual_value: '',
        tolerance_range: '',
        notes: '',
        equipment_used: '',
        reagent_lot_number: '',
        reagent_expiry_date: '',
      });
    } else if (qc) {
      setFormData({
        visit_test_id: qc.visit_test_id.toString(),
        qc_type: qc.qc_type,
        control_sample_id: qc.control_sample_id || '',
        expected_value: qc.expected_value?.toString() || '',
        actual_value: qc.actual_value?.toString() || '',
        tolerance_range: qc.tolerance_range?.toString() || '',
        notes: qc.notes || '',
        equipment_used: qc.equipment_used || '',
        reagent_lot_number: qc.reagent_lot_number || '',
        reagent_expiry_date: qc.reagent_expiry_date || '',
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedQC(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        expected_value: formData.expected_value ? parseFloat(formData.expected_value) : null,
        actual_value: formData.actual_value ? parseFloat(formData.actual_value) : null,
        tolerance_range: formData.tolerance_range ? parseFloat(formData.tolerance_range) : null,
      };

      if (dialogMode === 'create') {
        await axios.post('/api/quality-controls', payload);
      } else if (dialogMode === 'edit' && selectedQC) {
        await axios.put(`/api/quality-controls/${selectedQC.id}`, payload);
      }

      handleCloseDialog();
      fetchQualityControls();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save quality control');
    }
  };

  const handleReview = async (action: 'approve' | 'reject' | 'requires_review', notes?: string) => {
    if (!selectedQC) return;

    try {
      await axios.post(`/api/quality-controls/${selectedQC.id}/review`, {
        action,
        notes,
      });

      handleCloseDialog();
      fetchQualityControls();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to review quality control');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'requires_review': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle />;
      case 'failed': return <Cancel />;
      case 'requires_review': return <Warning />;
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
          Quality Control Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('create')}
        >
          Add QC Record
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
                  <TableCell>QC ID</TableCell>
                  <TableCell>Test</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expected</TableCell>
                  <TableCell>Actual</TableCell>
                  <TableCell>Performed By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qualityControls.map((qc) => (
                  <TableRow key={qc.id}>
                    <TableCell>QC-{qc.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {qc.visit_test.lab_test.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {qc.visit_test.lab_test.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{qc.visit_test.visit.patient.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={qc.qc_type.replace('_', ' ').toUpperCase()} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(qc.status)}
                        label={qc.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(qc.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{qc.expected_value || 'N/A'}</TableCell>
                    <TableCell>{qc.actual_value || 'N/A'}</TableCell>
                    <TableCell>{qc.performed_by_user.name}</TableCell>
                    <TableCell>
                      {new Date(qc.performed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('view', qc)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', qc)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        {qc.status === 'requires_review' && (
                          <Tooltip title="Review">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('review', qc)}
                            >
                              <Assessment />
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

      {/* QC Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' && 'Add Quality Control Record'}
          {dialogMode === 'edit' && 'Edit Quality Control Record'}
          {dialogMode === 'view' && 'Quality Control Details'}
          {dialogMode === 'review' && 'Review Quality Control'}
        </DialogTitle>
        <DialogContent>
          {dialogMode === 'review' ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review Quality Control Record
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Test: {selectedQC?.visit_test.lab_test.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Patient: {selectedQC?.visit_test.visit.patient.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Expected: {selectedQC?.expected_value} | Actual: {selectedQC?.actual_value}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Review Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                sx={{ mt: 2 }}
              />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Visit Test ID"
                  value={formData.visit_test_id}
                  onChange={(e) => setFormData({ ...formData, visit_test_id: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>QC Type</InputLabel>
                  <Select
                    value={formData.qc_type}
                    onChange={(e) => setFormData({ ...formData, qc_type: e.target.value as 'pre_test' | 'post_test' | 'batch_control' })}
                  >
                    <MenuItem value="pre_test">Pre Test</MenuItem>
                    <MenuItem value="post_test">Post Test</MenuItem>
                    <MenuItem value="batch_control">Batch Control</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Control Sample ID"
                  value={formData.control_sample_id}
                  onChange={(e) => setFormData({ ...formData, control_sample_id: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expected Value"
                  type="number"
                  value={formData.expected_value}
                  onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Actual Value"
                  type="number"
                  value={formData.actual_value}
                  onChange={(e) => setFormData({ ...formData, actual_value: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tolerance Range"
                  type="number"
                  value={formData.tolerance_range}
                  onChange={(e) => setFormData({ ...formData, tolerance_range: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Equipment Used"
                  value={formData.equipment_used}
                  onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reagent Lot Number"
                  value={formData.reagent_lot_number}
                  onChange={(e) => setFormData({ ...formData, reagent_lot_number: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode === 'review' && (
            <>
              <Button
                color="error"
                onClick={() => handleReview('reject')}
              >
                Reject
              </Button>
              <Button
                color="warning"
                onClick={() => handleReview('requires_review')}
              >
                Requires Review
              </Button>
              <Button
                color="success"
                variant="contained"
                onClick={() => handleReview('approve')}
              >
                Approve
              </Button>
            </>
          )}
          {(dialogMode === 'create' || dialogMode === 'edit') && (
            <Button variant="contained" onClick={handleSubmit}>
              {dialogMode === 'create' ? 'Create' : 'Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityControl;
