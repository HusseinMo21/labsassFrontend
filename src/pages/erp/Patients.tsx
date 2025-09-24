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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material';
import {
  Edit,
  Delete,
  Search,
  Person,
  Phone,
  LocationOn,
  WhatsApp,
} from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';

interface Patient {
  id: number;
  name: string;
  gender: string;
  birth_date?: string;
  age?: number;
  phone: string;
  whatsapp_number?: string;
  address: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_history?: string;
  allergies?: string;
  // Original database fields
  entry?: string;
  deli?: string;
  time?: string;
  tsample?: string;
  nsample?: string;
  isample?: string;
  paid?: number;
  had?: string;
  sender?: string; // Doctor name
  pleft?: number;
  total?: number;
  lab?: string;
  entryday?: string;
  deliday?: string;
  type?: string;
  doctor_id?: number;
  organization_id?: number;
  doctor?: any;
  organization?: any;
  doctor_name?: string; // Computed doctor name from sender field
}

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState('');
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{username: string, password: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    doctor: '',
    gender: 'male',
    age: '',
    address_required: '',
    address_optional: '',
    organization: '',
    status: '',
    phone: '',
    whatsapp_number: '',
    sender: '', // Doctor name
    // Keep existing fields for compatibility
    birth_date: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_history: '',
    allergies: '',
  });

  useEffect(() => {
    fetchPatients();
  }, [currentPage, search]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/patients?page=${currentPage}&search=${search}`);
      setPatients(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Map Arabic form fields to backend expected fields
      const patientData = {
        name: formData.name,
        gender: formData.gender,
        birth_date: formData.birth_date || (formData.age ? new Date(new Date().getFullYear() - parseInt(formData.age), 0, 1).toISOString().split('T')[0] : null),
        phone: formData.phone,
        whatsapp_number: formData.whatsapp_number || null,
        address: formData.address_required || formData.address,
        emergency_contact: '',
        emergency_phone: '',
        medical_history: `Doctor: ${formData.doctor}, Organization: ${formData.organization}, Status: ${formData.status}`,
        allergies: '', // Not in Arabic form
        // Additional fields for the new Arabic form
        doctor: formData.doctor,
        age: formData.age,
        address_required: formData.address_required,
        address_optional: formData.address_optional,
        organization: formData.organization,
        status: formData.status,
        sender: formData.sender, // Doctor name from sender field
      };

      console.log('Submitting patient data:', patientData);


      if (editingPatient) {
        await axios.put(`/api/patients/${editingPatient.id}`, patientData, {
          headers: {
          }
        });
        toast.success('تم تحديث بيانات المريض بنجاح');
        setOpen(false);
        setEditingPatient(null);
        resetForm();
        fetchPatients();
      } else {
        const response = await axios.post('/api/patients', patientData, {
          headers: {
          }
        });
        toast.success('تم إنشاء المريض بنجاح');
        
        // Show credentials modal for new patients
        if (response.data.user_credentials) {
          setGeneratedCredentials(response.data.user_credentials);
          setCredentialsModalOpen(true);
        }
        
        setOpen(false);
        setEditingPatient(null);
        resetForm();
        fetchPatients();
      }
    } catch (error) {
      console.error('Failed to save patient:', error);
      if ((error as any).response?.data?.errors) {
        const validationErrors = Object.values((error as any).response.data.errors).flat();
        toast.error(`فشل في الحفظ: ${validationErrors.join(', ')}`);
      } else {
        toast.error('فشل في حفظ بيانات المريض');
      }
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    
    // Extract additional info from medical_history if it contains our custom format
    let doctor = '';
    let organization = '';
    let status = '';
    
    if (patient.medical_history && patient.medical_history.includes('Doctor:')) {
      const parts = patient.medical_history.split(', ');
      parts.forEach(part => {
        if (part.startsWith('Doctor: ')) doctor = part.replace('Doctor: ', '');
        if (part.startsWith('Organization: ')) organization = part.replace('Organization: ', '');
        if (part.startsWith('Status: ')) status = part.replace('Status: ', '');
      });
    }
    
    // Calculate age from birth_date
    const age = patient.birth_date ? 
      new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : '';
    
    setFormData({
      name: patient.name,
      doctor: doctor,
      gender: patient.gender,
      age: age.toString(),
      address_required: patient.address,
      address_optional: '',
      organization: organization,
      status: status,
      phone: patient.phone,
      whatsapp_number: patient.whatsapp_number || '',
      sender: patient.sender || patient.doctor_name || '', // Use sender field as doctor name
      // Keep existing fields for compatibility
      birth_date: patient.birth_date || '',
      address: patient.address,
      emergency_contact: patient.emergency_contact || '',
      emergency_phone: patient.emergency_phone || '',
      medical_history: patient.medical_history || '',
      allergies: patient.allergies || '',
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      doctor: '',
      gender: 'male',
      age: '',
      address_required: '',
      address_optional: '',
      organization: '',
      status: '',
      phone: '',
      whatsapp_number: '',
      sender: '', // Doctor name
      // Keep existing fields for compatibility
      birth_date: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      medical_history: '',
      allergies: '',
    });
  };

  // const handleOpen = (): void => {
  //   resetForm();
  //   setEditingPatient(null);
  //   setOpen(true);
  // };

  const handleClose = () => {
    setOpen(false);
    setEditingPatient(null);
    resetForm();
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    setDeleting(true);
    try {
      const response = await axios.delete(`/api/patients/${patientToDelete.id}`);
      
      if (response.data.message) {
        toast.success(response.data.message);
        
        // Show details of what was deleted
        if (response.data.deleted_data) {
          const deletedData = response.data.deleted_data;
          const summary = Object.entries(deletedData)
            .filter(([_, count]) => (count as any) > 0)
            .map(([key, count]) => `${count} ${key}`)
            .join(', ');
          
          if (summary) {
            toast.info(`Deleted: ${summary}`);
          }
        }
        
        // Refresh the patients list
        fetchPatients();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete patient');
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const getGenderChip = (gender: string) => {
    // Handle Arabic gender values
    const isMale = gender === 'male' || gender === 'ذكر';
    const isFemale = gender === 'female' || gender === 'انثي' || gender === 'انثى';
    
    let label = 'Unknown';
    let color: 'primary' | 'secondary' | 'default' = 'default';
    
    if (isMale) {
      label = 'Male';
      color = 'primary';
    } else if (isFemale) {
      label = 'Female';
      color = 'secondary';
    }
    
    return (
      <Chip
        label={label}
        color={color}
        size="small"
      />
    );
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
          Patients
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Birth Date</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Emergency Contact</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Alert severity="info">No patients found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow key={patient.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person color="primary" />
                          {patient.name}
                        </Box>
                      </TableCell>
                      <TableCell>{getGenderChip(patient.gender)}</TableCell>
                      <TableCell>
                        {patient.birth_date ? 
                          new Date(patient.birth_date).toLocaleDateString() : 
                          patient.age ? 
                            `Age: ${patient.age}` : 
                            '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone fontSize="small" color="action" />
                          {patient.phone}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" color="action" />
                          {patient.address || '-'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person fontSize="small" color="action" />
                          {patient.doctor_name || patient.sender || '-'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {patient.emergency_contact || '-'} 
                        {patient.emergency_phone && ` (${patient.emergency_phone})`}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(patient)}
                            title="Edit Patient"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(patient)}
                            title="Delete Patient"
                          >
                            <Delete />
                          </IconButton>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Patient Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPatient ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              {/* الاسم */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الاسم *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* الدكتور */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الدكتور (اسم المرسل)"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                  placeholder="اسم الطبيب أو المرسل"
                />
              </Grid>
              
              {/* النوع */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>النوع *</InputLabel>
                  <Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    label="النوع *"
                  >
                    <MenuItem value="male">ذكر</MenuItem>
                    <MenuItem value="female">أنثى</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* السن */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="السن"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  inputProps={{ min: 0, max: 120 }}
                />
              </Grid>
              
              {/* العنوان المطلوب */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="العنوان (مطلوب) *"
                  value={formData.address_required}
                  onChange={(e) => setFormData({ ...formData, address_required: e.target.value })}
                  multiline
                  rows={2}
                  required
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* العنوان الاختياري */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="العنوان (اختياري)"
                  value={formData.address_optional}
                  onChange={(e) => setFormData({ ...formData, address_optional: e.target.value })}
                  multiline
                  rows={2}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* الجهة */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الجهة"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* الحالة */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الحالة"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* رقم التليفون */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="رقم التليفون *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              
              {/* رقم الواتساب */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="رقم الواتساب (اختياري)"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="مثال: 01234567890"
                  InputProps={{
                    startAdornment: <WhatsApp sx={{ mr: 1, color: '#25D366' }} />,
                  }}
                />
              </Grid>
              
              {/* Additional fields for compatibility */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Birth Date (for system compatibility)"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>إلغاء</Button>
            <Button type="submit" variant="contained">
              {editingPatient ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Patient Credentials Modal */}
      <Dialog open={credentialsModalOpen} onClose={() => setCredentialsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" />
            Patient Portal Credentials
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Patient created successfully!</strong> Here are the login credentials for the patient portal.
            </Typography>
          </Alert>
          
          {generatedCredentials && (
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'inherit' }}>
                  🔐 Portal Access Information
                </Typography>
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  p: 2, 
                  borderRadius: 1, 
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>
                  <Box sx={{ mb: 1 }}>
                    <strong>Username:</strong> {generatedCredentials.username}
                  </Box>
                  <Box>
                    <strong>Password:</strong> {generatedCredentials.password}
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 2, color: 'inherit', opacity: 0.9 }}>
                  These credentials will also appear on the patient's invoice and receipt.
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCredentialsModalOpen(false);
              setGeneratedCredentials(null);
            }} 
            variant="contained"
            fullWidth
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete color="error" />
            Delete Patient
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone!
            </Typography>
          </Alert>
          
          {patientToDelete && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete patient <strong>"{patientToDelete.name}"</strong>?
              </Typography>
              
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>This will permanently delete:</strong>
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  • All patient visits and lab requests<br/>
                  • All test results and samples<br/>
                  • All invoices and payments<br/>
                  • All reports and enhanced reports<br/>
                  • Patient credentials and portal access
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={deleting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete Patient'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;

