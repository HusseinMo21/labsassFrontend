import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Search,
  Person,
  Visibility,
  Delete,
} from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import DoctorPatientsView from '../../components/DoctorPatientsView';

interface Doctor {
  id: number;
  name: string;
  patients_count: number;
  created_at: string;
  updated_at: string;
}

interface Patient {
  id: number;
  name: string;
  phone: string;
  whatsapp_number?: string;
  gender: string;
  visits_count: number;
  visits?: Visit[];
  total_paid?: number;
  total_amount?: number;
  remaining_balance?: number;
  total_tests?: number;
  lab_numbers?: string[];
  attendance_dates?: string[];
  delivery_dates?: string[];
}

interface Visit {
  id: number;
  visit_number: string;
  visit_date: string;
  final_amount: number;
  status: string;
  lab_request?: {
    lab_no: string;
  };
  visit_tests?: VisitTest[];
  invoice?: Invoice;
}

interface VisitTest {
  id: number;
  labTest: {
    name: string;
  };
  status: string;
}

interface Invoice {
  id: number;
  amount_paid: number | string;
  balance: number | string;
  status: string;
}

const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const itemsPerPage = 15;
  const [formData, setFormData] = useState({
    name: '',
  });
  const [viewingPatients, setViewingPatients] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    oldName: '',
    newName: '',
    affectedCount: 0,
    doctorId: 0
  });

  useEffect(() => {
    
    fetchDoctors();
  }, [currentPage, search]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await axios.get(`/api/doctors?${params.toString()}`);
      setDoctors(response.data.data);
      setTotalPages(response.data.last_page);
      setTotalDoctors(response.data.total);
    } catch (error) {
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
    setCurrentPage(1);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      // The useEffect will trigger fetchDoctors when search changes
    }, 500); // Wait 500ms after user stops typing
    
    setSearchTimeout(timeout);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        // First attempt to update doctor
        const response = await axios.put(`/api/doctors/${editingDoctor.id}`, formData, {
          headers: {}
        });
        
        // Check if confirmation is required
        if (response.data.confirmation_required) {
          // Show confirmation dialog instead of browser alert
          setConfirmationDialog({
            open: true,
            oldName: response.data.old_name,
            newName: response.data.new_name,
            affectedCount: response.data.affected_patients_count,
            doctorId: editingDoctor.id
          });
          return; // Don't close the form yet
        } else {
          toast.success('Doctor updated successfully');
        }
      } else {
        await axios.post('/api/doctors', formData, {
          headers: {}
        });
        toast.success('Doctor created successfully');
      }
      
      setOpen(false);
      setEditingDoctor(null);
      resetForm();
      fetchDoctors();
    } catch (error) {
      console.error('Failed to save doctor:', error);
      if ((error as any).response?.data?.errors) {
        const validationErrors = Object.values((error as any).response.data.errors).flat();
        toast.error(`Failed to save: ${validationErrors.join(', ')}`);
      } else {
        toast.error('Failed to save doctor');
      }
    }
  };

  const handleConfirmUpdate = async () => {
    try {
      // Send confirmed update
      await axios.put(`/api/doctors/${confirmationDialog.doctorId}`, {
        ...formData,
        confirmed: true
      }, {
        headers: {}
      });
      
      toast.success(`Doctor updated successfully. ${confirmationDialog.affectedCount} patients updated.`);
      
      // Close both dialogs and reset form
      setConfirmationDialog({
        open: false,
        oldName: '',
        newName: '',
        affectedCount: 0,
        doctorId: 0
      });
      setOpen(false);
      setEditingDoctor(null);
      resetForm();
      fetchDoctors();
    } catch (error) {
      console.error('Failed to confirm doctor update:', error);
      toast.error('Failed to update doctor');
    }
  };

  const handleCancelUpdate = () => {
    setConfirmationDialog({
      open: false,
      oldName: '',
      newName: '',
      affectedCount: 0,
      doctorId: 0
    });
    // Keep the form open so user can make changes
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
    });
    setOpen(true);
  };

  const handleDelete = async (doctor: Doctor) => {
    if (window.confirm(`Are you sure you want to delete ${doctor.name}?`)) {
      try {

        await axios.delete(`/api/doctors/${doctor.id}`, {
          headers: {
          }
        });
        toast.success('Doctor deleted successfully');
        fetchDoctors();
      } catch (error) {
        console.error('Failed to delete doctor:', error);
        toast.error('Failed to delete doctor');
      }
    }
  };

  const handleViewPatients = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setViewingPatients(true);
  };

  const handleClosePatientsView = () => {
    setViewingPatients(false);
    setSelectedDoctor(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
  };

  const handleOpen = () => {
    resetForm();
    setEditingDoctor(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDoctor(null);
    resetForm();
  };


  // If viewing patients, show the patients view component
  if (viewingPatients && selectedDoctor) {
    return (
      <DoctorPatientsView 
        doctor={selectedDoctor} 
        onClose={handleClosePatientsView}
      />
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Doctors Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ bgcolor: 'primary.main' }}
        >
          Add New Doctor
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search doctors..."
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doctor Name</TableCell>
                  <TableCell>Patients Count</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Alert severity="info">No doctors found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  doctors.map((doctor) => (
                    <TableRow key={doctor.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person color="primary" />
                          {doctor.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={doctor.patients_count} color="primary">
                          <Chip 
                            label={`${doctor.patients_count} patients`}
                            color={doctor.patients_count > 0 ? 'primary' : 'default'}
                            size="small"
                          />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(doctor.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Patients">
                            <IconButton
                              color="info"
                              onClick={() => handleViewPatients(doctor)}
                              disabled={doctor.patients_count === 0}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Doctor">
                            <IconButton
                              color="primary"
                              onClick={() => handleEdit(doctor)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Doctor">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(doctor)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalDoctors)} of {totalDoctors} doctors
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Doctor Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Doctor Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingDoctor ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmation Dialog for Doctor Name Update */}
      <Dialog 
        open={confirmationDialog.open} 
        onClose={handleCancelUpdate}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'warning.light', 
          color: 'warning.contrastText',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          ⚠️ Confirm Doctor Name Update
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              This action will affect patient records!
            </Typography>
          </Alert>
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" paragraph>
              Are you sure you want to update the doctor name?
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 2,
              mb: 2,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300'
            }}>
              <Typography variant="h6" color="error">
                "{confirmationDialog.oldName}"
              </Typography>
              <Typography variant="h6" color="text.secondary">
                →
              </Typography>
              <Typography variant="h6" color="success.main">
                "{confirmationDialog.newName}"
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>{confirmationDialog.affectedCount}</strong> patient{confirmationDialog.affectedCount !== 1 ? 's' : ''} 
                {confirmationDialog.affectedCount !== 1 ? ' are' : ' is'} currently associated with this doctor and 
                {confirmationDialog.affectedCount !== 1 ? ' will be' : ' will be'} automatically updated.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleCancelUpdate}
            variant="outlined"
            color="inherit"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmUpdate}
            variant="contained"
            color="warning"
            sx={{ minWidth: 100 }}
          >
            Update Doctor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Doctors;



