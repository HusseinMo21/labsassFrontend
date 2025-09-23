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
      // const _ = response.data.remaining_balance;
      const isFullyPaid = response.data.is_fully_paid;
      
      if (isFullyPaid) {
        // Generate final payment receipt
        const receiptResponse = await axios.get(`/api/invoices/${selectedInvoice.id}/final-payment-receipt`);
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
      // Fetch the original receipt data from the visit
      const response = await axios.get(`/api/check-in/visits/${invoice.visit.id}/receipt`);
      const receiptData = response.data.receipt_data;
      
      // Validate receipt data
      if (!receiptData) {
        toast.error('No receipt data found');
        return;
      }
      
      // Print the original receipt using the same logic as CheckIn component
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Popup blocked. Please allow popups for this site.');
        return;
      }

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${receiptData.receipt_number}</title>
          <style>
            @page { 
              size: 80mm 200mm; 
              margin: 5mm; 
            }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.2; 
              margin: 0; 
              padding: 0; 
              width: 70mm;
            }
            .header { 
              text-align: center; 
              border-bottom: 1px solid #000; 
              padding-bottom: 8px; 
              margin-bottom: 8px; 
            }
            .header h1 { 
              font-size: 14px; 
              margin: 0 0 4px 0; 
              font-weight: bold;
            }
            .header p { 
              margin: 2px 0; 
              font-size: 10px; 
            }
            .section { 
              margin-bottom: 8px; 
            }
            .section h3 { 
              font-size: 11px; 
              margin: 0 0 4px 0; 
              font-weight: bold;
              border-bottom: 1px dotted #000;
              padding-bottom: 2px;
            }
            .row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 2px; 
              font-size: 10px;
            }
            .row .label { 
              flex: 1; 
            }
            .row .value { 
              flex: 1; 
              text-align: right; 
              font-weight: bold;
            }
            .total { 
              font-weight: bold; 
              border-top: 1px solid #000; 
              padding-top: 4px; 
              margin-top: 4px;
            }
            .total .row { 
              font-size: 11px; 
            }
            .barcode { 
              text-align: center; 
              font-family: 'Courier New', monospace; 
              font-size: 8px; 
              margin: 4px 0; 
              padding: 2px; 
              background: #f0f0f0; 
              border: 1px solid #000;
            }
            .footer { 
              text-align: center; 
              font-size: 8px; 
              margin-top: 8px; 
              border-top: 1px dotted #000; 
              padding-top: 4px;
            }
            .test-item { 
              margin-bottom: 1px; 
              font-size: 9px;
            }
            .test-name { 
              display: inline-block; 
              width: 60%; 
            }
            .test-price { 
              display: inline-block; 
              width: 35%; 
              text-align: right; 
            }
            @media print { 
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PATHOLOGY LAB RECEIPT</h1>
            <p>Date: ${receiptData.date}</p>
            <p>Receipt #: ${receiptData.receipt_number}</p>
            <p>Lab #: ${receiptData.lab_number || 'N/A'}</p>
          </div>
          
          <div class="section">
            <h3>Patient Information</h3>
            <div class="row">
              <span class="label">Name:</span>
              <span class="value">${receiptData.patient_name}</span>
            </div>
            <div class="row">
              <span class="label">Age:</span>
              <span class="value">${receiptData.patient_age}</span>
            </div>
            <div class="row">
              <span class="label">Phone:</span>
              <span class="value">${receiptData.patient_phone}</span>
            </div>
          </div>
          
          <div class="section">
            <h3>Tests (${receiptData.tests?.length || 0})</h3>
            ${(receiptData.tests || []).map((test: any) => `
                <div class="test-item">
                  <span class="test-name">${test.name}</span>
                  <span class="test-price">EGP ${test.price}</span>
                </div>
              `).join('')}
          </div>
          
          <div class="section total">
            <div class="row">
              <span class="label">Total:</span>
              <span class="value">EGP ${receiptData.total_amount}</span>
            </div>
            <div class="row">
              <span class="label">Discount:</span>
              <span class="value">EGP ${receiptData.discount_amount || 0}</span>
            </div>
            <div class="row">
              <span class="label">Final:</span>
              <span class="value">EGP ${receiptData.final_amount}</span>
            </div>
            <div class="row">
              <span class="label">Paid:</span>
              <span class="value">EGP ${receiptData.upfront_payment}</span>
            </div>
            <div class="row">
              <span class="label">Remaining:</span>
              <span class="value">EGP ${receiptData.remaining_balance}</span>
            </div>
            <div class="row">
              <span class="label">Method:</span>
              <span class="value">${(receiptData.payment_method || 'N/A').toUpperCase()}</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="value">${(receiptData.billing_status || 'N/A').toUpperCase()}</span>
            </div>
          </div>
          
          ${receiptData.barcode ? `
          <div class="barcode">
            ${receiptData.barcode.includes('<svg') ? 
              receiptData.barcode : 
              `<img src="data:image/png;base64,${receiptData.barcode}" alt="Barcode" style="max-width: 200px; height: auto;" />`
            }
            <div style="font-size: 8px; margin-top: 2px;">${receiptData.barcode_text || receiptData.lab_number}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for choosing our lab!</p>
            <p>Printed by: ${receiptData.printed_by || 'System'}</p>
            <p>Printed at: ${receiptData.printed_at || new Date().toLocaleString()}</p>
            <p>Visit ID: ${receiptData.visit_id || 'N/A'}</p>
          </div>
        </body>
      </html>
      `;
      
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.print();
      
    } catch (error) {
      console.error('Error printing original receipt:', error);
      toast.error('Failed to print original receipt');
    }
  };

  const printFinalPaymentReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups for this site.');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Final Payment Receipt - ${receiptData?.receipt_number}</title>
        <style>
          @page { 
            size: 80mm 200mm; 
            margin: 5mm; 
          }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            line-height: 1.2; 
            margin: 0; 
            padding: 0; 
            width: 70mm;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 8px; 
          }
          .header h1 { 
            font-size: 14px; 
            margin: 0 0 4px 0; 
            font-weight: bold;
          }
          .header p { 
            margin: 2px 0; 
            font-size: 10px; 
          }
          .section { 
            margin-bottom: 8px; 
          }
          .section h3 { 
            font-size: 11px; 
            margin: 0 0 4px 0; 
            font-weight: bold;
            border-bottom: 1px dotted #000;
            padding-bottom: 2px;
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 2px; 
            font-size: 10px;
          }
          .row .label { 
            flex: 1; 
          }
          .row .value { 
            flex: 1; 
            text-align: right; 
            font-weight: bold;
          }
          .total { 
            font-weight: bold; 
            border-top: 1px solid #000; 
            padding-top: 4px; 
            margin-top: 4px;
          }
          .total .row { 
            font-size: 11px; 
          }
          .barcode { 
            text-align: center; 
            font-family: 'Courier New', monospace; 
            font-size: 8px; 
            margin: 4px 0; 
            padding: 2px; 
            background: #f0f0f0; 
            border: 1px solid #000;
          }
          .footer { 
            text-align: center; 
            font-size: 8px; 
            margin-top: 8px; 
            border-top: 1px dotted #000; 
            padding-top: 4px;
          }
          .test-item { 
            margin-bottom: 1px; 
            font-size: 9px;
          }
          .test-name { 
            display: inline-block; 
            width: 60%; 
          }
          .test-price { 
            display: inline-block; 
            width: 35%; 
            text-align: right; 
          }
          .payment-breakdown { 
            background: #f8f9fa; 
            padding: 4px; 
            margin: 4px 0; 
            border: 1px solid #ddd;
          }
          .credentials { 
            background: #f0f0f0; 
            padding: 4px; 
            margin: 4px 0; 
            border: 1px solid #ccc;
            font-size: 9px;
          }
          @media print { 
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FINAL PAYMENT RECEIPT</h1>
          <p>Date: ${receiptData?.date}</p>
          <p>Receipt #: ${receiptData?.receipt_number}</p>
        </div>
        
        <div class="section">
          <h3>Patient Information</h3>
          <div class="row">
            <span class="label">Name:</span>
            <span class="value">${receiptData?.patient_name}</span>
          </div>
          <div class="row">
            <span class="label">Age:</span>
            <span class="value">${receiptData?.patient_age}</span>
          </div>
          <div class="row">
            <span class="label">Phone:</span>
            <span class="value">${receiptData?.patient_phone}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>Tests</h3>
          ${receiptData?.tests?.map(test => `
              <div class="test-item">
                <span class="test-name">${test.name}</span>
                <span class="test-price">EGP ${test.price}</span>
              </div>
            `).join('')}
        </div>
        
        <div class="section total">
          <div class="row">
            <span class="label">Total Amount:</span>
            <span class="value">EGP ${receiptData?.total_amount}</span>
          </div>
          <div class="row">
            <span class="label">Discount:</span>
            <span class="value">EGP ${receiptData?.discount_amount || 0}</span>
          </div>
          <div class="row">
            <span class="label">Final Amount:</span>
            <span class="value">EGP ${receiptData?.final_amount}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>Payment Breakdown</h3>
          <div class="payment-breakdown">
            <div class="row">
              <span class="label">Paid Before:</span>
              <span class="value">EGP ${receiptData?.paid_before}</span>
            </div>
            <div class="row">
              <span class="label">Paid Now:</span>
              <span class="value">EGP ${receiptData?.paid_now}</span>
            </div>
            <div class="row">
              <span class="label">Remaining:</span>
              <span class="value">EGP 0</span>
            </div>
            <div class="row">
              <span class="label">Payment Method:</span>
              <span class="value">${receiptData?.payment_method}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="row">
            <span class="label">Expected Delivery:</span>
            <span class="value">${receiptData?.expected_delivery_date ? new Date(receiptData.expected_delivery_date).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Lab #:</span>
            <span class="value">${(receiptData as any)?.lab_number || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Processed by:</span>
            <span class="value">${(receiptData as any)?.processed_by || 'N/A'}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>Patient Portal Access</h3>
          <div class="credentials">
            <div class="row">
              <span class="label">Username:</span>
              <span class="value">${receiptData?.patient_credentials?.username}</span>
            </div>
            <div class="row">
              <span class="label">Password:</span>
              <span class="value">${receiptData?.patient_credentials?.password}</span>
            </div>
            <div style="text-align: center; margin-top: 4px; font-size: 8px;">
              Access your results at: [Patient Portal URL]
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing our lab!</p>
          <p>Processed by: ${(receiptData as any)?.processed_by || 'System'}</p>
          <p>Processed at: ${new Date().toLocaleString()}</p>
          <p>Visit ID: ${(receiptData as any)?.visit_id || 'N/A'}</p>
        </div>
      </body>
    </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
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
          <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={2}>
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
                          <Stack direction="row" spacing={1}>
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
                            <Tooltip title="Print Original Receipt">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handlePrintOriginalReceipt(invoice)}
                              >
                                <Receipt />
                              </IconButton>
                            </Tooltip>
                            {invoice.remaining_balance <= 0 && (
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
                                      .catch(error => {
                                        console.error('Error fetching final payment receipt:', error);
                                        toast.error('Failed to fetch final payment receipt');
                                      });
                                  }}
                                >
                                  <Print />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
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
                    onChange={(_, page) => setCurrentPage(page)}
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
                  <Grid item xs={12}>
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
                  <Grid item xs={12}>
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
                  <Grid item xs={12}>
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
