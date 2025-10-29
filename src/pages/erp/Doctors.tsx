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
  WhatsApp,
  Phone,
} from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';

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
  const [patientsOpen, setPatientsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
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

  const fetchDoctorPatients = async (doctorId: number) => {
    try {
      setPatientsLoading(true);
      const response = await axios.get(`/api/doctors/${doctorId}/patients`);
      const patientsData = response.data.patients;
      
      // Fetch detailed information for each patient
      const patientsWithDetails = await Promise.all(
        patientsData.map(async (patient: Patient) => {
          try {
            const detailResponse = await axios.get(`/api/patients/${patient.id}`);
            const detailedPatient = detailResponse.data;
            
            // Calculate financial summary
            const totalPaid = detailedPatient.visits?.reduce((sum: number, visit: Visit) => {
              return sum + (Number(visit.invoice?.amount_paid) || 0);
            }, 0) || 0;
            
            const totalTests = detailedPatient.visits?.reduce((sum: number, visit: any) => {
              return sum + (visit.visit_tests?.length || 0);
            }, 0) || 0;
            
            const labNumbers = detailedPatient.visits?.map((visit: any) => {
              return visit.lab_request?.lab_no;
            }).filter(Boolean) || [];
            
            // Debug logging
            console.log(`Patient ${patient.name}:`, {
              visits: detailedPatient.visits?.length,
              totalPaid,
              totalTests,
              labNumbers,
              visitDetails: detailedPatient.visits?.map((v: any) => ({
                id: v.id,
                visitTests: v.visit_tests?.length,
                labRequest: v.lab_request?.lab_no,
                invoice: v.invoice?.amount_paid
              }))
            });
            
            return {
              ...patient,
              visits: detailedPatient.visits,
              total_paid: totalPaid,
              total_tests: totalTests,
              lab_numbers: labNumbers
            };
          } catch (error) {
            console.error(`Failed to fetch details for patient ${patient.id}:`, error);
            return patient;
          }
        })
      );
      
      setPatients(patientsWithDetails);
    } catch (error) {
      toast.error('Failed to fetch doctor patients');
    } finally {
      setPatientsLoading(false);
    }
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
    setPatientsOpen(true);
    fetchDoctorPatients(doctor.id);
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

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('20') && cleaned.length === 10) {
      return `20${cleaned}`;
    }
    return cleaned;
  };

  const handleWhatsAppContact = (patient: Patient) => {
    const contactNumber = patient.whatsapp_number || patient.phone;
    
    if (!contactNumber) {
      toast.error('No phone number available for this patient');
      return;
    }

    const phoneNumber = formatPhoneNumber(contactNumber);
    const patientName = patient.name || 'Patient';
    const defaultMessage = `Hello ${patientName}, this is the lab team regarding your test request.`;
    const encodedMessage = encodeURIComponent(defaultMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

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

      {/* Doctor Patients Dialog */}
      <Dialog open={patientsOpen} onClose={() => setPatientsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedDoctor?.name} - All Patients ({patients.length})
        </DialogTitle>
        <DialogContent>
          {patientsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : patients.length === 0 ? (
            <Alert severity="info">No patients found for this doctor</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>WhatsApp</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Visits</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Total Paid</TableCell>
                    <TableCell>Remaining</TableCell>
                    <TableCell>Tests</TableCell>
                    <TableCell>Lab Numbers</TableCell>
                    <TableCell>تاريخ الحضور</TableCell>
                    <TableCell>تاريخ الاستلام</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person color="primary" />
                          {patient.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone fontSize="small" color="action" />
                          {patient.phone}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {patient.whatsapp_number ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <WhatsApp fontSize="small" color="success" />
                            {patient.whatsapp_number}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No WhatsApp
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={patient.gender === 'male' ? 'Male' : 'Female'}
                          color={patient.gender === 'male' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={patient.visits_count} color="primary">
                          <Typography variant="body2">
                            {patient.visits_count} visits
                          </Typography>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          EGP {(Number(patient.total_amount) || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`EGP ${(Number(patient.total_paid) || 0).toFixed(2)}`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`EGP ${(Number(patient.remaining_balance) || 0).toFixed(2)}`}
                          color={Number(patient.remaining_balance) > 0 ? "error" : "success"}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${patient.total_tests || 0} tests`}
                          color="info"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patient.lab_numbers && patient.lab_numbers.length > 0 ? (
                            patient.lab_numbers.slice(0, 2).map((labNo, index) => (
                              <Chip 
                                key={index}
                                label={labNo}
                                color="secondary"
                                variant="outlined"
                                size="small"
                              />
                            ))
                          ) : (
                            <Chip 
                              label="No labs"
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                          {patient.lab_numbers && patient.lab_numbers.length > 2 && (
                            <Chip 
                              label={`+${patient.lab_numbers.length - 2}`}
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patient.attendance_dates && patient.attendance_dates.length > 0 ? (
                            patient.attendance_dates.slice(0, 2).map((date, index) => (
                              <Chip 
                                key={index}
                                label={new Date(date).toLocaleDateString('ar-EG')}
                                color="info"
                                variant="outlined"
                                size="small"
                              />
                            ))
                          ) : (
                            <Chip 
                              label="No dates"
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                          {patient.attendance_dates && patient.attendance_dates.length > 2 && (
                            <Chip 
                              label={`+${patient.attendance_dates.length - 2}`}
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patient.delivery_dates && patient.delivery_dates.length > 0 ? (
                            patient.delivery_dates.slice(0, 2).map((date, index) => (
                              <Chip 
                                key={index}
                                label={new Date(date).toLocaleDateString('ar-EG')}
                                color="warning"
                                variant="outlined"
                                size="small"
                              />
                            ))
                          ) : (
                            <Chip 
                              label="No dates"
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                          {patient.delivery_dates && patient.delivery_dates.length > 2 && (
                            <Chip 
                              label={`+${patient.delivery_dates.length - 2}`}
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {(patient.whatsapp_number || patient.phone) && (
                          <Tooltip title="Contact via WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => handleWhatsAppContact(patient)}
                              sx={{ 
                                color: '#25D366',
                                '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.1)' }
                              }}
                            >
                              <WhatsApp />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientsOpen(false)}>Close</Button>
        </DialogActions>
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



