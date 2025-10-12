import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  InputAdornment,
  Pagination,
  Stack,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  AttachMoney,
  Search,
  Phone,
  Payment,
  MonetizationOn,
  CreditCard,
  AccountBalance,
  LocalAtm,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Patient {
  id: number;
  name: string;
  phone: string;
  lab?: string;
  age?: number;
  gender?: string;
  visits?: any[];
  total_amount?: number;
  amount_paid?: number;
  remaining_balance?: number;
  payment_status?: string;
}

const CheckIn: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showExtraPaymentModal, setShowExtraPaymentModal] = useState(false);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState('');
  const [extraPaymentMethod, setExtraPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(15);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [currentPage]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchPatients();
    }, 500); // 500ms delay
    setSearchTimeout(timeout);
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage.toString(),
      });
      
      // Add search parameter if provided
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const response = await axios.get(`/api/patients?${params.toString()}`);
      
      // Handle paginated response
      if (response.data.data) {
        setPatients(response.data.data);
        setTotalPages(response.data.last_page || 1);
        setTotalItems(response.data.total || 0);
        setCurrentPage(response.data.current_page || 1);
        
      } else {
        // Fallback for non-paginated response
        setPatients(response.data);
        setTotalPages(1);
        setTotalItems(response.data.length || 0);
        setCurrentPage(1);
        
      }
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleAddExtraPayment = (patient: Patient) => {
    setSelectedPatient(patient);
    setExtraPaymentAmount('');
    setExtraPaymentMethod('cash');
    setShowExtraPaymentModal(true);
  };

  const handleSubmitExtraPayment = async () => {
    if (!selectedPatient || !extraPaymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }

    const amount = parseFloat(extraPaymentAmount);
    if (amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      // Submit extra payment
      const response = await axios.post(`/api/patients/${selectedPatient.id}/extra-payment`, {
        amount: amount,
        payment_method: extraPaymentMethod,
        notes: `Extra payment - ${extraPaymentMethod}`,
      });

      toast.success('Extra payment added successfully');
      setShowExtraPaymentModal(false);
      setSelectedPatient(null);
      setExtraPaymentAmount('');
      
      // Refresh patients list
      fetchPatients();
      
      // Navigate to receipt if needed
      if (response.data.receipt_data) {
        // Handle receipt generation
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add extra payment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const getPaymentStatusChip = (status: string, remainingBalance: number) => {
    if (remainingBalance <= 0) {
      return <Chip icon={<CheckCircle />} label="Fully Paid" color="success" size="small" />;
    } else if (status === 'partial') {
      return <Chip label="Partial Payment" color="warning" size="small" />;
    } else {
      return <Chip label="Pending Payment" color="error" size="small" />;
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery) ||
    (patient.lab && patient.lab.includes(searchQuery))
  );

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Extra Payments Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add additional payments for patients with extra lab costs
        </Typography>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search patients by name, phone, or lab number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Lab Number</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Amount Paid</TableCell>
                  <TableCell>Remaining Balance</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Alert severity="info">No patients found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {patient.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {patient.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <Phone fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                              {patient.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 'bold',
                          color: 'primary.main'
                        }}>
                          {patient.lab || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {formatCurrency(patient.total_amount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(patient.amount_paid || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600, 
                          color: (patient.remaining_balance || 0) > 0 ? 'error.main' : 'success.main'
                        }}>
                          {formatCurrency(patient.remaining_balance || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusChip(patient.payment_status || 'unpaid', patient.remaining_balance || 0)}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => handleAddExtraPayment(patient)}
                          sx={{ 
                            backgroundColor: '#1976d2',
                            '&:hover': { backgroundColor: '#1565c0' }
                          }}
                        >
                          Add Extra Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Stack spacing={2}>
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              )}
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} patients
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Extra Payment Modal */}
      <Dialog open={showExtraPaymentModal} onClose={() => setShowExtraPaymentModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" />
            Add Extra Payment
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Patient: {selectedPatient.name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Lab Number:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedPatient.lab || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Phone:</Typography>
                  <Typography variant="body1">{selectedPatient.phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(selectedPatient.total_amount || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(selectedPatient.amount_paid || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Remaining Balance:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {formatCurrency(selectedPatient.remaining_balance || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Extra Payment Amount"
                type="number"
                value={extraPaymentAmount}
                onChange={(e) => setExtraPaymentAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">EGP</InputAdornment>,
                }}
                placeholder="Enter additional amount"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={extraPaymentMethod}
                  onChange={(e) => setExtraPaymentMethod(e.target.value)}
                >
                  <MenuItem value="cash">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalAtm />
                      Cash
                    </Box>
                  </MenuItem>
                  <MenuItem value="Fawry">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalance />
                      Fawry
                    </Box>
                  </MenuItem>
                  <MenuItem value="InstaPay">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCard />
                      InstaPay
                    </Box>
                  </MenuItem>
                  <MenuItem value="VodafoneCash">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Payment />
                      VodafoneCash
                    </Box>
                  </MenuItem>
                  <MenuItem value="Other">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MonetizationOn />
                      Other
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExtraPaymentModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitExtraPayment}
            disabled={submitting || !extraPaymentAmount}
            startIcon={submitting ? <CircularProgress size={20} /> : <Payment />}
          >
            {submitting ? 'Processing...' : 'Add Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckIn;