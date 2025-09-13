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
  Business,
  Visibility,
  Delete,
  WhatsApp,
  Phone,
  Email,
} from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';

interface Organization {
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
  total_tests?: number;
  lab_numbers?: string[];
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

const Organizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [patientsOpen, setPatientsOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  useEffect(() => {
    // Fetch CSRF token when component loads
    const initializeCSRF = async () => {
      try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF cookie set for Organizations');
      } catch (error) {
        console.error('Failed to set CSRF cookie:', error);
      }
    };
    
    initializeCSRF();
    fetchOrganizations();
  }, [currentPage, search]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/organizations?page=${currentPage}&search=${search}`);
      setOrganizations(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationPatients = async (organizationId: number) => {
    try {
      setPatientsLoading(true);
      const response = await axios.get(`/api/organizations/${organizationId}/patients`);
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
      toast.error('Failed to fetch organization patients');
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Manually fetch CSRF token before the request
      console.log('Fetching CSRF token for organization submission...');
      await axios.get('/sanctum/csrf-cookie');
      const csrfResponse = await axios.get('/api/auth/csrf-token');
      const csrfToken = csrfResponse.data.csrf_token;

      if (editingOrganization) {
        await axios.put(`/api/organizations/${editingOrganization.id}`, formData, {
          headers: {
            'X-CSRF-TOKEN': csrfToken
          }
        });
        toast.success('Organization updated successfully');
      } else {
        await axios.post('/api/organizations', formData, {
          headers: {
            'X-CSRF-TOKEN': csrfToken
          }
        });
        toast.success('Organization created successfully');
      }
      
      setOpen(false);
      setEditingOrganization(null);
      resetForm();
      fetchOrganizations();
    } catch (error) {
      console.error('Failed to save organization:', error);
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        toast.error(`Failed to save: ${validationErrors.join(', ')}`);
      } else {
        toast.error('Failed to save organization');
      }
    }
  };

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization);
    setFormData({
      name: organization.name,
    });
    setOpen(true);
  };

  const handleDelete = async (organization: Organization) => {
    if (window.confirm(`Are you sure you want to delete ${organization.name}?`)) {
      try {
        // Manually fetch CSRF token before the request
        await axios.get('/sanctum/csrf-cookie');
        const csrfResponse = await axios.get('/api/auth/csrf-token');
        const csrfToken = csrfResponse.data.csrf_token;

        await axios.delete(`/api/organizations/${organization.id}`, {
          headers: {
            'X-CSRF-TOKEN': csrfToken
          }
        });
        toast.success('Organization deleted successfully');
        fetchOrganizations();
      } catch (error) {
        console.error('Failed to delete organization:', error);
        toast.error('Failed to delete organization');
      }
    }
  };

  const handleViewPatients = (organization: Organization) => {
    setSelectedOrganization(organization);
    setPatientsOpen(true);
    fetchOrganizationPatients(organization.id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
  };

  const handleOpen = () => {
    resetForm();
    setEditingOrganization(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingOrganization(null);
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
          Organizations Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ bgcolor: 'primary.main' }}
        >
          Add New Organization
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization Name</TableCell>
                  <TableCell>Patients Count</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Alert severity="info">No organizations found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((organization) => (
                    <TableRow key={organization.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business color="primary" />
                          {organization.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={organization.patients_count} color="primary">
                          <Chip 
                            label={`${organization.patients_count} patients`}
                            color={organization.patients_count > 0 ? 'primary' : 'default'}
                            size="small"
                          />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(organization.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Patients">
                            <IconButton
                              color="info"
                              onClick={() => handleViewPatients(organization)}
                              disabled={organization.patients_count === 0}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Organization">
                            <IconButton
                              color="primary"
                              onClick={() => handleEdit(organization)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Organization">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(organization)}
                              disabled={organization.patients_count > 0}
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Organization Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOrganization ? 'Edit Organization' : 'Add New Organization'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Organization Name *"
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
              {editingOrganization ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Organization Patients Dialog */}
      <Dialog open={patientsOpen} onClose={() => setPatientsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedOrganization?.name} - All Patients ({patients.length})
        </DialogTitle>
        <DialogContent>
          {patientsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : patients.length === 0 ? (
            <Alert severity="info">No patients found for this organization</Alert>
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
                    <TableCell>Total Paid</TableCell>
                    <TableCell>Tests</TableCell>
                    <TableCell>Lab Numbers</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business color="primary" />
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
                        <Chip 
                          label={`$${(Number(patient.total_paid) || 0).toFixed(2)}`}
                          color="success"
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
    </Box>
  );
};

export default Organizations;


