import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  WhatsApp,
  Phone,
  Email,
  Person,
  Schedule,
  Info,
  Refresh,
  FilterList,
  Search,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Patient {
  id: number;
  name: string;
  phone: string;
  whatsapp_number?: string;
  email?: string;
  gender?: string;
  birth_date?: string;
  address?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
  visits?: Array<{
    id: number;
    visit_number: string;
    visit_date: string;
    status: string;
  }>;
}

const Notifications: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const genderOptions = [
    { value: 'all', label: 'All Genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <Person sx={{ color: 'primary.main' }} />;
      case 'female':
        return <Person sx={{ color: 'secondary.main' }} />;
      default:
        return <Person sx={{ color: 'text.secondary' }} />;
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'primary';
      case 'female':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Egyptian phone numbers
    // If it starts with 0, remove it (Egyptian local format)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // If it doesn't start with country code (20), add Egypt's country code
    if (!cleaned.startsWith('20')) {
      cleaned = `20${cleaned}`;
    }
    
    return cleaned;
  };

  const handleWhatsAppContact = (patient: Patient) => {
    // Prioritize WhatsApp number over regular phone number
    const contactNumber = patient.whatsapp_number || patient.phone;
    
    if (!contactNumber) {
      toast.error('No phone number available for this patient');
      return;
    }

    const phoneNumber = formatPhoneNumber(contactNumber);
    const patientName = patient.name || 'Patient';
    
    // Default message
    const defaultMessage = `Hello ${patientName}, this is the lab team regarding your test request.`;
    const message = customMessage || defaultMessage;
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/patients');
      
      // Handle different response structures
      let patientsData = [];
      if (response.data.data) {
        patientsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        patientsData = response.data;
      } else {
        patientsData = [];
      }
      
      setPatients(patientsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
      
      // Mock data for development
      setPatients([
        {
          id: 1,
          name: 'Ahmed Yasser',
          phone: '01234567890',
          whatsapp_number: '01234567890',
          email: 'ahmed@example.com',
          gender: 'male',
          birth_date: '1990-05-15',
          address: 'Cairo, Egypt',
          emergency_contact: '01111111111',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          visits: [
            {
              id: 1,
              visit_number: 'V-2024-001',
              visit_date: '2024-01-20',
              status: 'completed',
            },
          ],
        },
        {
          id: 2,
          name: 'Sarah Mohamed',
          phone: '01098765432',
          whatsapp_number: '01098765432',
          email: 'sarah@example.com',
          gender: 'female',
          birth_date: '1985-08-22',
          address: 'Alexandria, Egypt',
          emergency_contact: '01222222222',
          created_at: '2024-01-16T09:15:00Z',
          updated_at: '2024-01-16T09:15:00Z',
          visits: [
            {
              id: 2,
              visit_number: 'V-2024-002',
              visit_date: '2024-01-21',
              status: 'pending_payment',
            },
          ],
        },
        {
          id: 3,
          name: 'Fatma Ali',
          phone: '01123456789',
          whatsapp_number: '01123456789',
          email: 'fatma@example.com',
          gender: 'female',
          birth_date: '1992-12-10',
          address: 'Giza, Egypt',
          emergency_contact: '01333333333',
          created_at: '2024-01-17T08:45:00Z',
          updated_at: '2024-01-17T08:45:00Z',
          visits: [
            {
              id: 3,
              visit_number: 'V-2024-003',
              visit_date: '2024-01-22',
              status: 'in_progress',
            },
          ],
        },
        {
          id: 4,
          name: 'Mohamed Hassan',
          phone: '01567890123',
          whatsapp_number: '01567890123',
          email: 'mohamed@example.com',
          gender: 'male',
          birth_date: '1988-03-18',
          address: 'Luxor, Egypt',
          emergency_contact: '01444444444',
          created_at: '2024-01-18T07:20:00Z',
          updated_at: '2024-01-18T07:20:00Z',
          visits: [
            {
              id: 4,
              visit_number: 'V-2024-004',
              visit_date: '2024-01-23',
              status: 'completed',
            },
          ],
        },
        {
          id: 5,
          name: 'Nour Ibrahim',
          phone: '01678901234',
          whatsapp_number: '01678901234',
          email: 'nour@example.com',
          gender: 'female',
          birth_date: '1995-07-05',
          address: 'Aswan, Egypt',
          emergency_contact: '01555555555',
          created_at: '2024-01-19T11:10:00Z',
          updated_at: '2024-01-19T11:10:00Z',
          visits: [],
        },
        {
          id: 6,
          name: 'Omar Farouk',
          phone: '01789012345',
          whatsapp_number: '01789012345',
          email: 'omar@example.com',
          gender: 'male',
          birth_date: '1987-11-30',
          address: 'Sharm El Sheikh, Egypt',
          emergency_contact: '01666666666',
          created_at: '2024-01-20T14:25:00Z',
          updated_at: '2024-01-20T14:25:00Z',
          visits: [
            {
              id: 5,
              visit_number: 'V-2024-005',
              visit_date: '2024-01-24',
              status: 'scheduled',
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
    
    return matchesSearch && matchesGender;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Patient Communications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Contact patients via WhatsApp and manage communications
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPatients}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Patients
                  </Typography>
                  <Typography variant="h4">
                    {patients.length}
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Male Patients
                  </Typography>
                  <Typography variant="h4">
                    {patients.filter(p => p.gender === 'male').length}
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Female Patients
                  </Typography>
                  <Typography variant="h4">
                    {patients.filter(p => p.gender === 'female').length}
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    With Visits
                  </Typography>
                  <Typography variant="h4">
                    {patients.filter(p => p.visits && p.visits.length > 0).length}
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search patients"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, email, or address"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={genderFilter}
                  label="Gender"
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  {genderOptions.map((gender) => (
                    <MenuItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setGenderFilter('all');
                }}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Grid container spacing={2}>
        {filteredPatients.map((patient) => (
          <Grid item xs={12} md={6} key={patient.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${getGenderColor(patient.gender || 'default')}.main` }}>
                    {getGenderIcon(patient.gender || 'default')}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {patient.name}
                      </Typography>
                      {patient.visits && patient.visits.length > 0 && (
                        <Badge badgeContent={patient.visits.length} color="primary" />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={patient.gender || 'Unknown'}
                        color={getGenderColor(patient.gender || 'default') as any}
                        size="small"
                      />
                      {patient.visits && patient.visits.length > 0 && (
                        <Chip
                          label={`${patient.visits.length} visit${patient.visits.length !== 1 ? 's' : ''}`}
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {patient.phone}
                      </Typography>
                    </Box>
                    {patient.whatsapp_number && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <WhatsApp sx={{ fontSize: 16, color: '#25D366' }} />
                        <Typography variant="body2" color="text.secondary">
                          {patient.whatsapp_number}
                        </Typography>
                      </Box>
                    )}
                    {patient.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {patient.email}
                        </Typography>
                      </Box>
                    )}
                    {patient.address && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {patient.address}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Added: {new Date(patient.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(patient)}
                      color="primary"
                    >
                      <Info />
                    </IconButton>
                  </Tooltip>
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
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredPatients.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No patients found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || genderFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No patients available'
            }
          </Typography>
        </Box>
      )}

      {/* Patient Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedPatient && getGenderIcon(selectedPatient.gender || 'default')}
            {selectedPatient?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Name" 
                        secondary={selectedPatient.name} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {getGenderIcon(selectedPatient.gender || 'default')}
                      </ListItemIcon>
                      <ListItemText 
                        primary="Gender" 
                        secondary={selectedPatient.gender || 'Not specified'} 
                      />
                    </ListItem>
                    {selectedPatient.birth_date && (
                      <ListItem>
                        <ListItemIcon>
                          <Schedule />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Birth Date" 
                          secondary={new Date(selectedPatient.birth_date).toLocaleDateString()} 
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Phone" 
                        secondary={selectedPatient.phone} 
                      />
                    </ListItem>
                    {selectedPatient.whatsapp_number && (
                      <ListItem>
                        <ListItemIcon>
                          <WhatsApp />
                        </ListItemIcon>
                        <ListItemText 
                          primary="WhatsApp" 
                          secondary={selectedPatient.whatsapp_number} 
                        />
                      </ListItem>
                    )}
                    {selectedPatient.email && (
                      <ListItem>
                        <ListItemIcon>
                          <Email />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email" 
                          secondary={selectedPatient.email} 
                        />
                      </ListItem>
                    )}
                    {selectedPatient.address && (
                      <ListItem>
                        <ListItemIcon>
                          <Schedule />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Address" 
                          secondary={selectedPatient.address} 
                        />
                      </ListItem>
                    )}
                    {selectedPatient.emergency_contact && (
                      <ListItem>
                        <ListItemIcon>
                          <Phone />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Emergency Contact" 
                          secondary={selectedPatient.emergency_contact} 
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Account Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Created" 
                        secondary={new Date(selectedPatient.created_at).toLocaleString()} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Last Updated" 
                        secondary={new Date(selectedPatient.updated_at).toLocaleString()} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Patient ID" 
                        secondary={selectedPatient.id} 
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
              
              {selectedPatient.visits && selectedPatient.visits.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Visit History ({selectedPatient.visits.length})
                  </Typography>
                  <List dense>
                    {selectedPatient.visits.map((visit) => (
                      <ListItem key={visit.id}>
                        <ListItemIcon>
                          <Schedule />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${visit.visit_number} - ${new Date(visit.visit_date).toLocaleDateString()}`}
                          secondary={`Status: ${visit.status}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <TextField
            fullWidth
            label="Custom WhatsApp Message (Optional)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Hello {patientName}, this is the lab team regarding your test request."
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
          {(selectedPatient?.whatsapp_number || selectedPatient?.phone) && (
            <Button 
              variant="contained" 
              startIcon={<WhatsApp />}
              onClick={() => {
                handleWhatsAppContact(selectedPatient);
                setDetailsOpen(false);
              }}
              sx={{ 
                bgcolor: '#25D366',
                '&:hover': { bgcolor: '#128C7E' }
              }}
            >
              Contact via WhatsApp
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;








