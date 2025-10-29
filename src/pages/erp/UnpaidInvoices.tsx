import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Pagination,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Payment,
  Receipt,
  Print,
  AttachMoney,
  AccountBalance,
  CreditCard,
  LocalAtm,
  Assessment,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Add,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  patient_name: string;
  patient_phone: string;
  created_at: string;
  visit: {
    id: number;
    visit_date: string;
    patient: {
      id: number;
      name: string;
      phone: string;
      email?: string;
      lab?: string;
    };
  };
}

interface Summary {
  total_invoices: number;
  total_paid: number;
  total_remaining: number;
  partial_count: number;
}

interface PaymentForm {
  amount: number;
  payment_method: string;
  notes: string;
}

interface ReceiptData {
  receipt_number: string;
  date: string;
  patient_name: string;
  patient_age: string;
  patient_phone: string;
  tests: Array<{
    name: string;
    price: number;
  }>;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  paid_before: number;
  paid_now: number;
  remaining_balance: number;
  payment_method: string;
  expected_delivery_date: string;
  barcode: string;
  check_in_by: string;
  patient_credentials?: {
    username: string;
    password: string;
  };
  payment_breakdown?: {
    cash: number;
    card: number;
    card_method?: string;
  };
  visit?: {
    id: number;
  };
  visit_id?: number;
}

const UnpaidInvoices: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    amount: 0,
    payment_method: 'cash',
    notes: '',
  });
  
  // Final payment receipt state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchInvoices();
  }, [searchQuery, statusFilter, currentPage]);

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/unpaid-invoices/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      console.log('Fetching invoices with params:', {
        query: searchQuery,
        status: statusFilter,
        page: currentPage,
      });
      
      // First test if the endpoint is accessible
      console.log('Testing API endpoint accessibility...');
      
      const response = await axios.get('/api/unpaid-invoices/search', {
        params: {
          query: searchQuery,
          status: statusFilter,
          page: currentPage,
        },
      });
      
      console.log('API Response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      setInvoices(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch invoices';
      toast.error(`Failed to fetch invoices: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const response = await axios.post(`/api/visits/${selectedInvoice.id}/add-payment`, paymentForm);
      
      // Check if this payment completes the invoice
      // const _ = response.data.remaining_balance;
      const isFullyPaid = response.data.is_fully_paid;
      
      if (isFullyPaid) {
        // Generate final payment receipt
        const receiptResponse = await axios.get(`/api/visits/${selectedInvoice.id}/final-payment-receipt`);
        setReceiptData(receiptResponse.data);
        setShowReceiptModal(true);
        toast.success('Payment completed! Final receipt generated.');
      } else {
        toast.success('Payment added successfully');
      }
      
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentForm({ amount: 0, payment_method: 'cash', notes: '' });
      fetchInvoices();
      fetchSummary();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add payment';
      toast.error(message);
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: invoice.remaining_balance,
      payment_method: 'cash',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const getStatusChip = (invoice: Invoice) => {
    if (invoice.remaining_balance <= 0) {
      return <Chip icon={<CheckCircle />} label="Paid" color="success" size="small" />;
    } else if (invoice.amount_paid > 0) {
      return <Chip icon={<Schedule />} label="Partial" color="warning" size="small" />;
    } else {
      return <Chip icon={<Warning />} label="Pending" color="error" size="small" />;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'EGP 0.00';
    }
    return `EGP ${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handlePrintOriginalReceipt = async (invoice: Invoice) => {
    try {
      // First, test the data endpoint to see what data we're getting
      console.log('Testing data endpoint for visit:', invoice.visit.id);
      const dataResponse = await axios.get(`/api/check-in/visits/${invoice.visit.id}/unpaid-invoice-receipt-data`);
      console.log('Receipt data response:', dataResponse.data);
      
      // Now get the PDF
      const response = await axios.get(`/api/check-in/visits/${invoice.visit.id}/unpaid-invoice-receipt`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open PDF in new tab for viewing
      const printWindow = window.open(url, '_blank');
      if (!printWindow) {
        alert('Popup blocked. Please allow popups for this site.');
        return;
      }

      // Clean up the URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
      
      toast.success('Receipt opened in new tab. You can print or download from there.');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt: ' + (error.message || 'Unknown error'));
    }
  };

  const printFinalPaymentReceipt = async () => {
    if (!receiptData?.visit_id) {
      toast.error('No visit data available for final payment receipt');
      return;
    }

    try {
      // Generate PDF using the dedicated final payment receipt template
      const response = await axios.get(`/api/check-in/visits/${receiptData.visit_id}/final-payment-receipt-pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open PDF in new tab for viewing
      const printWindow = window.open(url, '_blank');
      if (!printWindow) {
        alert('Popup blocked. Please allow popups for this site.');
        return;
      }
      
      // Clean up the URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
      
      toast.success('Final payment receipt opened in new tab. You can print or download from there.');
    } catch (error: any) {
      console.error('Error generating final payment receipt:', error);
      toast.error('Failed to generate final payment receipt: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Unpaid Invoices & Patient Remaining
      </Typography>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', height: '100%' }}>
              <CardContent>
                <Assessment color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {summary.total_invoices}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', height: '100%' }}>
              <CardContent>
                <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {formatCurrency(summary.total_paid)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Paid
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', height: '100%' }}>
              <CardContent>
                <TrendingDown color="error" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                  {formatCurrency(summary.total_remaining)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Remaining
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Invoices Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Remaining</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {invoice.invoice_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {invoice.patient_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.patient_phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(invoice.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                      {formatCurrency(invoice.amount_paid)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                      {formatCurrency(invoice.remaining_balance)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(invoice)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Add Payment">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openPaymentModal(invoice)}
                          disabled={invoice.remaining_balance <= 0}
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Original Receipt">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handlePrintOriginalReceipt(invoice)}
                        >
                          <Receipt />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Final Payment Receipt">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => {
                            // Fetch final payment receipt data and print
                            axios.get(`/api/invoices/${invoice.id}/final-payment-receipt`)
                              .then(response => {
                                setReceiptData(response.data);
                                setShowReceiptModal(true);
                              })
                              .catch((error: any) => {
                                console.error('Error fetching final payment receipt:', error);
                                toast.error('Failed to fetch final payment receipt');
                              });
                          }}
                          disabled={invoice.remaining_balance > 0}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onClose={() => setShowPaymentModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <form onSubmit={handleAddPayment}>
          <DialogContent>
            {selectedInvoice && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Invoice: {selectedInvoice.invoice_number}
                  </Typography>
                  <Typography variant="body2">
                    Patient: {selectedInvoice.patient_name}
                  </Typography>
                  <Typography variant="body2">
                    Remaining Balance: {formatCurrency(selectedInvoice.remaining_balance)}
                  </Typography>
                </Alert>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Payment Amount"
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                      inputProps={{ min: 0, max: selectedInvoice.remaining_balance, step: 0.01 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={paymentForm.payment_method}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                        label="Payment Method"
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                        <MenuItem value="fawry">Fawry</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes (Optional)"
                      multiline
                      rows={3}
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Adding...' : 'Add Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Final Payment Receipt Modal */}
      <Dialog open={showReceiptModal} onClose={() => setShowReceiptModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Final Payment Receipt Generated</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Payment Completed Successfully!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Final payment receipt has been generated for this invoice.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Print />}
              onClick={printFinalPaymentReceipt}
              sx={{ mr: 2 }}
            >
              Print Final Receipt
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowReceiptModal(false)}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UnpaidInvoices;