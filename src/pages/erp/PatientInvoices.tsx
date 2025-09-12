import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Receipt,
  AttachMoney,
  Payment,
  Download,
  CreditCard,
  CheckCircle,
  Schedule,
  Error,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

interface PatientInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  visit_id: string;
  patient_name: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_status: string;
  balance_due: number;
  payments: Array<{
    id: number;
    amount: number;
    payment_method: string;
    payment_date: string;
    notes?: string;
  }>;
  visit: {
    visit_tests: Array<{
      test_name: string;
      price: number;
    }>;
  };
}

const PatientInvoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PatientInvoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'cash',
    notes: '',
  });

  useEffect(() => {
    fetchPatientInvoices();
  }, []);

  const fetchPatientInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/patient/my-invoices');
      setInvoices(response.data.invoices || []);
    } catch (err: any) {
      console.error('Error fetching patient invoices:', err);
      setError('Failed to load your invoices');
      toast.error('Failed to load your invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (invoice: PatientInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: invoice.balance_due,
      payment_method: 'cash',
      notes: '',
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await axios.post(`/api/invoices/${selectedInvoice.id}/payments`, {
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes,
      });

      toast.success('Payment recorded successfully');
      setPaymentDialogOpen(false);
      fetchPatientInvoices(); // Refresh the list
    } catch (err: any) {
      console.error('Error recording payment:', err);
      toast.error('Failed to record payment');
    }
  };

  const handleDownloadInvoice = async (invoice: PatientInvoice) => {
    try {
      const response = await axios.get(`/api/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (err: any) {
      console.error('Error downloading invoice:', err);
      toast.error('Failed to download invoice');
    }
  };

  const getPaymentStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending Payment', icon: <Schedule /> },
      partial: { color: 'info', label: 'Partial Payment', icon: <Payment /> },
      paid: { color: 'success', label: 'Paid in Full', icon: <CheckCircle /> },
      overdue: { color: 'error', label: 'Overdue', icon: <Error /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status, icon: <Payment /> };
    return <Chip label={config.label} color={config.color as any} size="small" icon={config.icon} />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTotalPaid = (invoice: PatientInvoice) => {
    return invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Receipt sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1">
            My Invoices
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View and manage your invoices and payments
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Payment Information:</strong> You can make payments for your invoices. All payments are recorded and will be reflected in your account.
        </Typography>
      </Alert>

      {invoices.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Invoices Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any invoices yet. Invoices will appear here after you complete a visit.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Your Invoices ({invoices.length} invoices)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Visit ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Paid Amount</TableCell>
                    <TableCell>Balance Due</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {invoice.invoice_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {invoice.visit_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(invoice.final_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          {formatCurrency(getTotalPaid(invoice))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={invoice.balance_due > 0 ? 'error.main' : 'success.main'}
                        >
                          {formatCurrency(invoice.balance_due)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusChip(invoice.payment_status)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            PDF
                          </Button>
                          {invoice.balance_due > 0 && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Payment />}
                              onClick={() => handlePayment(invoice)}
                            >
                              Pay
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment color="primary" />
            Record Payment
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Invoice #{selectedInvoice.invoice_number}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Visit: {selectedInvoice.visit_id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Total Amount: {formatCurrency(selectedInvoice.final_amount)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Already Paid: {formatCurrency(getTotalPaid(selectedInvoice))}
              </Typography>
              <Typography variant="body2" fontWeight="medium" color="error.main">
                Balance Due: {formatCurrency(selectedInvoice.balance_due)}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            label="Payment Amount"
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
            sx={{ mb: 2 }}
            inputProps={{ min: 0, max: selectedInvoice?.balance_due || 0 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              label="Payment Method"
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Credit/Debit Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="check">Check</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePaymentSubmit} 
            variant="contained"
            disabled={paymentForm.amount <= 0 || paymentForm.amount > (selectedInvoice?.balance_due || 0)}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientInvoices;

