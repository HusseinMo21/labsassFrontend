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
  Divider,
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
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  visit: {
    id: number;
    visit_date: string;
    patient: {
      id: number;
      name: string;
      phone: string;
      email?: string;
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
      const response = await axios.get('/api/unpaid-invoices/search', {
        params: {
          query: searchQuery,
          status: statusFilter,
          page: currentPage,
        },
      });
      setInvoices(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const response = await axios.post(`/api/invoices/${selectedInvoice.id}/add-payment`, paymentForm);
      
      // Check if this payment completes the invoice
      const newRemainingBalance = response.data.remaining_balance;
      const isFullyPaid = response.data.is_fully_paid;
      
      if (isFullyPaid) {
        // Generate final payment receipt
        const receiptResponse = await axios.get(`/api/check-in/visits/${selectedInvoice.visit.id}/final-payment-receipt`, {
          params: {
            payment_amount: paymentForm.amount,
            payment_method: paymentForm.payment_method
          }
        });
        
        setReceiptData(receiptResponse.data.receipt_data);
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
      return '$0.00';
    }
    return `$${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const printFinalPaymentReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head>
          <title>Final Payment Receipt - ${receiptData?.receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; border-top: 1px solid #000; padding-top: 10px; }
            .credentials { background: #f0f0f0; padding: 10px; margin-top: 20px; }
            .payment-breakdown { background: #f8f9fa; padding: 10px; margin: 10px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>FINAL PAYMENT RECEIPT</h2>
            <p>Date: ${receiptData?.date}</p>
            <p>Receipt #: ${receiptData?.receipt_number}</p>
          </div>
          
          <div class="section">
            <h3>Patient Information</h3>
            <div class="row"><span>Name:</span><span>${receiptData?.patient_name}</span></div>
            <div class="row"><span>Age:</span><span>${receiptData?.patient_age}</span></div>
            <div class="row"><span>Phone:</span><span>${receiptData?.patient_phone}</span></div>
          </div>
          
          <div class="section">
            <h3>Tests</h3>
            ${receiptData?.tests?.map(test => `
              <div class="row">
                <span>${test.name}</span>
                <span>$${test.price}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section total">
            <div class="row"><span>Total Amount:</span><span>$${receiptData?.total_amount}</span></div>
            <div class="row"><span>Discount:</span><span>$${receiptData?.discount_amount}</span></div>
            <div class="row"><span>Final Amount:</span><span>$${receiptData?.final_amount}</span></div>
          </div>
          
          <div class="payment-breakdown">
            <h4>Payment Breakdown</h4>
            <div class="row"><span>Paid Before:</span><span>$${receiptData?.paid_before}</span></div>
            <div class="row"><span>Paid Now:</span><span>$${receiptData?.paid_now}</span></div>
            <div class="row"><span>Remaining:</span><span>$${receiptData?.remaining_balance}</span></div>
          </div>
          
          <div class="section">
            <div class="row"><span>Payment Method:</span><span>${receiptData?.payment_method}</span></div>
            <div class="row"><span>Expected Delivery:</span><span>${receiptData?.expected_delivery_date}</span></div>
            <div class="row"><span>Barcode:</span><span>${receiptData?.barcode}</span></div>
            <div class="row"><span>Processed by:</span><span>${receiptData?.check_in_by}</span></div>
          </div>
          
          ${receiptData?.patient_credentials ? `
          <div class="credentials">
            <h4>Patient Portal Access</h4>
            <p><strong>Username:</strong> ${receiptData.patient_credentials.username}</p>
            <p><strong>Password:</strong> ${receiptData.patient_credentials.password}</p>
            <p>Access your results at: [Patient Portal URL]</p>
          </div>
          ` : ''}
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Unpaid Invoices & Patient Balances
      </Typography>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ textAlign: 'center', height: '100%' }}>
              <CardContent>
                <Schedule color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                  {summary.partial_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Partial Payments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Search Patients"
                placeholder="Search by patient name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Payment Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Invoices</MenuItem>
                  <MenuItem value="pending">Pending Payment</MenuItem>
                  <MenuItem value="partial">Partial Payment</MenuItem>
                  <MenuItem value="paid">Fully Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={fetchInvoices}
                startIcon={<Search />}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Invoices
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : invoices.length > 0 ? (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Invoice #</strong></TableCell>
                      <TableCell><strong>Patient</strong></TableCell>
                      <TableCell><strong>Visit Date</strong></TableCell>
                      <TableCell><strong>Total Amount</strong></TableCell>
                      <TableCell><strong>Paid Amount</strong></TableCell>
                      <TableCell><strong>Remaining</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {invoice.invoice_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {invoice.visit?.patient?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {invoice.visit?.patient?.phone}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(invoice.visit?.visit_date || '')}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(invoice.total_amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main">
                            {formatCurrency(invoice.amount_paid)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.main">
                            {formatCurrency(invoice.remaining_balance)}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(invoice)}</TableCell>
                        <TableCell>
                          {invoice.remaining_balance > 0 && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Payment />}
                              onClick={() => openPaymentModal(invoice)}
                            >
                              Add Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          ) : (
            <Alert severity="info" sx={{ textAlign: 'center' }}>
              No invoices found
            </Alert>
          )}
        </CardContent>
      </Card>

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
                    Patient: {selectedInvoice.visit?.patient?.name}
                  </Typography>
                  <Typography variant="body2">
                    Remaining Balance: {formatCurrency(selectedInvoice.remaining_balance)}
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Payment Amount"
                      type="number"
                      inputProps={{ step: "0.01", min: "0.01", max: selectedInvoice.remaining_balance }}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0
                      }))}
                      required
                      helperText={`Maximum: ${formatCurrency(selectedInvoice.remaining_balance)}`}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={paymentForm.payment_method}
                        label="Payment Method"
                        onChange={(e) => setPaymentForm(prev => ({
                          ...prev,
                          payment_method: e.target.value
                        }))}
                      >
                        <MenuItem value="cash">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalAtm />
                            Cash
                          </Box>
                        </MenuItem>
                        <MenuItem value="card">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CreditCard />
                            Card
                          </Box>
                        </MenuItem>
                        <MenuItem value="insurance">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountBalance />
                            Insurance
                          </Box>
                        </MenuItem>
                        <MenuItem value="other">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoney />
                            Other
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Notes"
                      multiline
                      rows={2}
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<Payment />}>
              Add Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Final Payment Receipt Modal */}
      <Dialog open={showReceiptModal} onClose={() => setShowReceiptModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Final Payment Receipt Generated</DialogTitle>
        <DialogContent>
          {receiptData && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Receipt Number: {receiptData.receipt_number}
                </Typography>
                <Typography variant="body2">
                  Patient: {receiptData.patient_name}
                </Typography>
                <Typography variant="body2">
                  Status: Payment Completed
                </Typography>
              </Alert>
              
              <Box sx={{ textAlign: 'center' }}>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    startIcon={<Print />}
                    onClick={printFinalPaymentReceipt}
                  >
                    Print Final Receipt
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowReceiptModal(false)}
                  >
                    Close
                  </Button>
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UnpaidInvoices;