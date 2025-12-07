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
  TextField,
  Card,
  CardContent,
  Grid,
  Button,
} from '@mui/material';
import {
  Person,
  Phone,
  WhatsApp,
  ArrowBack,
  Business,
  FilterList,
  Clear,
  Print,
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
  const [filters, setFilters] = useState({
    lab_no: '',
    attendance_date: '',
    delivery_date: '',
  });

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters.lab_no, filters.attendance_date, filters.delivery_date]);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, organization.id, filters.lab_no, filters.attendance_date, filters.delivery_date]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage,
      };
      
      if (filters.lab_no.trim()) {
        params.lab_no = filters.lab_no.trim();
      }
      if (filters.attendance_date) {
        params.attendance_date = filters.attendance_date;
      }
      if (filters.delivery_date) {
        params.delivery_date = filters.delivery_date;
      }
      
      const response = await axios.get(`/api/organizations/${organization.id}/patients`, {
        params,
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

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      lab_no: '',
      attendance_date: '',
      delivery_date: '',
    });
  };

  const handlePrint = async () => {
    try {
      // Fetch all filtered patients (without pagination)
      const params: any = {
        page: 1,
        per_page: 10000, // Large number to get all results
      };
      
      if (filters.lab_no.trim()) {
        params.lab_no = filters.lab_no.trim();
      }
      if (filters.attendance_date) {
        params.attendance_date = filters.attendance_date;
      }
      if (filters.delivery_date) {
        params.delivery_date = filters.delivery_date;
      }
      
      const response = await axios.get(`/api/organizations/${organization.id}/patients`, {
        params,
      });
      
      const allPatients = response.data.patients || [];
      
      if (allPatients.length === 0) {
        toast.info('No patients to print');
        return;
      }

      // Build filter info text
      const filterInfo = [];
      if (filters.lab_no) filterInfo.push(`Lab No: ${filters.lab_no}`);
      if (filters.attendance_date) filterInfo.push(`تاريخ الحضور: ${new Date(filters.attendance_date).toLocaleDateString('ar-EG')}`);
      if (filters.delivery_date) filterInfo.push(`تاريخ الاستلام: ${new Date(filters.delivery_date).toLocaleDateString('ar-EG')}`);

      // Create print HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      const tableRows = allPatients.map((patient: Patient) => {
        const labNumbers = patient.lab_numbers && patient.lab_numbers.length > 0
          ? patient.lab_numbers.join(', ')
          : 'No labs';
        
        const attendanceDates = patient.attendance_dates && patient.attendance_dates.length > 0
          ? patient.attendance_dates.map((d: string) => new Date(d).toLocaleDateString('ar-EG')).join(', ')
          : 'No dates';
        
        const deliveryDates = patient.delivery_dates && patient.delivery_dates.length > 0
          ? patient.delivery_dates.map((d: string) => new Date(d).toLocaleDateString('ar-EG')).join(', ')
          : 'No dates';

        return `
          <tr>
            <td>${labNumbers}</td>
            <td>${patient.name || 'N/A'}</td>
            <td>${attendanceDates}</td>
            <td>${deliveryDates}</td>
            <td>EGP ${(Number(patient.total_paid) || 0).toFixed(2)}</td>
            <td>EGP ${(Number(patient.remaining_balance) || 0).toFixed(2)}</td>
            <td>${patient.phone || 'N/A'}</td>
            <td>${patient.gender === 'male' ? 'Male' : 'Female'}</td>
            <td>${patient.visits_count || 0} visits</td>
            <td>EGP ${(Number(patient.total_amount) || 0).toFixed(2)}</td>
            <td>${patient.total_tests || 0} tests</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Patients Report - ${organization.name}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 18px;
              color: #666;
            }
            .filter-info {
              margin: 10px 0;
              font-size: 14px;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              position: sticky;
              top: 0;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Patients Report</h1>
            ${filterInfo.length > 0 ? `<div class="filter-info"><strong>Filters:</strong> ${filterInfo.join(' | ')}</div>` : ''}
            <div class="filter-info"><strong>Total Patients:</strong> ${allPatients.length}</div>
            <div class="filter-info"><strong>Print Date:</strong> ${new Date().toLocaleString('ar-EG')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Lab No</th>
                <th>Patient Name</th>
                <th>تاريخ الحضور</th>
                <th>تاريخ الاستلام</th>
                <th>Total Paid</th>
                <th>Remaining</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Visits</th>
                <th>Total Amount</th>
                <th>Tests</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Generated on ${new Date().toLocaleString('ar-EG')}
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
    } catch (error: any) {
      console.error('Error printing patients:', error);
      toast.error('Failed to print patients');
    }
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
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterList color="primary" />
              <Typography variant="h6">Filters</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Lab No"
                  value={filters.lab_no}
                  onChange={(e) => handleFilterChange('lab_no', e.target.value)}
                  placeholder="Search by lab number..."
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="تاريخ الحضور"
                  type="date"
                  value={filters.attendance_date}
                  onChange={(e) => handleFilterChange('attendance_date', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="تاريخ الاستلام"
                  type="date"
                  value={filters.delivery_date}
                  onChange={(e) => handleFilterChange('delivery_date', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {(filters.lab_no || filters.attendance_date || filters.delivery_date) && (
                <Button
                  size="small"
                  onClick={clearFilters}
                  color="error"
                  variant="outlined"
                  startIcon={<Clear />}
                >
                  Clear Filters
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                startIcon={<Print />}
                onClick={handlePrint}
                sx={{ ml: 'auto' }}
              >
                Print
              </Button>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? (
          <Alert severity="info">No patients found for this organization</Alert>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
              <Table size="small" sx={{ tableLayout: 'auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Lab No</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Patient Name</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>تاريخ الحضور</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>تاريخ الاستلام</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Paid</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Remaining</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Gender</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Visits</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Total</TableCell>
                    <TableCell sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Tests</TableCell>
                    <TableCell align="center" sx={{ padding: '12px 8px', fontSize: '0.95rem', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id} hover>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patient.lab_numbers && patient.lab_numbers.length > 0 ? (
                            patient.lab_numbers.slice(0, 2).map((labNo, index) => (
                              <Chip 
                                key={index}
                                label={labNo}
                                color="secondary"
                                variant="outlined"
                                size="small"
                                sx={{ height: '28px', fontSize: '0.85rem' }}
                              />
                            ))
                          ) : (
                            <Chip 
                              label="No labs"
                              color="default"
                              variant="outlined"
                              size="small"
                              sx={{ height: '28px', fontSize: '0.85rem' }}
                            />
                          )}
                          {patient.lab_numbers && patient.lab_numbers.length > 2 && (
                            <Chip 
                              label={`+${patient.lab_numbers.length - 2}`}
                              color="default"
                              variant="outlined"
                              size="small"
                              sx={{ height: '28px', fontSize: '0.85rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person color="primary" sx={{ fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{patient.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patient.attendance_dates && patient.attendance_dates.length > 0 ? (
                            patient.attendance_dates.slice(0, 2).map((date, index) => (
                              <Chip 
                                key={index}
                                label={new Date(date).toLocaleDateString('ar-EG', { month: '2-digit', day: '2-digit' })}
                                color="info"
                                variant="outlined"
                                size="small"
                                sx={{ height: '28px', fontSize: '0.85rem' }}
                              />
                            ))
                          ) : (
                            <Chip 
                              label="-"
                              color="default"
                              variant="outlined"
                              size="small"
                              sx={{ height: '28px', fontSize: '0.85rem' }}
                            />
                          )}
                          {patient.attendance_dates && patient.attendance_dates.length > 2 && (
                            <Chip 
                              label={`+${patient.attendance_dates.length - 2}`}
                              color="default"
                              variant="outlined"
                              size="small"
                              sx={{ height: '28px', fontSize: '0.85rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patient.delivery_dates && patient.delivery_dates.length > 0 ? (
                            patient.delivery_dates.slice(0, 2).map((date, index) => (
                              <Chip 
                                key={index}
                                label={new Date(date).toLocaleDateString('ar-EG', { month: '2-digit', day: '2-digit' })}
                                color="warning"
                                variant="outlined"
                                size="small"
                                sx={{ height: '28px', fontSize: '0.85rem' }}
                              />
                            ))
                          ) : (
                            <Chip 
                              label="-"
                              color="default"
                              variant="outlined"
                              size="small"
                              sx={{ height: '28px', fontSize: '0.85rem' }}
                            />
                          )}
                          {patient.delivery_dates && patient.delivery_dates.length > 2 && (
                            <Chip 
                              label={`+${patient.delivery_dates.length - 2}`}
                              color="default"
                              variant="outlined"
                              size="small"
                              sx={{ height: '28px', fontSize: '0.85rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500, color: 'success.main' }}>
                          {(Number(patient.total_paid) || 0).toFixed(0)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500, color: Number(patient.remaining_balance) > 0 ? 'error.main' : 'success.main' }}>
                          {(Number(patient.remaining_balance) || 0).toFixed(0)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{patient.phone}</Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Chip
                          label={patient.gender === 'male' ? 'M' : 'F'}
                          color={patient.gender === 'male' ? 'primary' : 'secondary'}
                          size="small"
                          sx={{ height: '28px', fontSize: '0.85rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                          {patient.visits_count}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                          {(Number(patient.total_amount) || 0).toFixed(0)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ padding: '10px 8px' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                          {patient.total_tests || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ padding: '10px 8px' }}>
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

