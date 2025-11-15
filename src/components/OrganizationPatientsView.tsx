import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Badge,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Person,
  Phone,
  WhatsApp,
  ArrowBack,
  Business,
} from '@mui/icons-material';
import axios from '../config/axios';
import { toast } from 'react-toastify';

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

interface Organization {
  id: number;
  name: string;
  patients_count: number;
}

interface OrganizationPatientsViewProps {
  organization: Organization;
  onClose: () => void;
}

const OrganizationPatientsView: React.FC<OrganizationPatientsViewProps> = ({ organization, onClose }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [perPage] = useState(10);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, organization.id]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/organizations/${organization.id}/patients`, {
        params: {
          page: currentPage,
          per_page: perPage,
        },
      });
      
      setPatients(response.data.patients || []);
      setTotalPages(response.data.last_page || 1);
      setTotalPatients(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch organization patients:', error);
      toast.error('Failed to fetch organization patients');
    } finally {
      setLoading(false);
    }
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

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Business sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {organization.name} - All Patients ({totalPatients})
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? (
          <Alert severity="info">No patients found for this organization</Alert>
        ) : (
          <>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, totalPatients)} of {totalPatients} patients
                </Typography>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default OrganizationPatientsView;

