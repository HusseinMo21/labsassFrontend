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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Receipt,
  Visibility,
  PictureAsPdf,
  Refresh,
  Search,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  paid_at: string;
  notes?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  lab_number?: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  amount_paid: number;
  balance: number;
  status: string;
  notes?: string;
  created_at: string;
  visit: {
    id: number;
    visit_number: string;
    visit_date?: string;
    patient: {
      id: number;
      name: string;
      phone: string;
      lab?: string;
    };
  };
  payments: Payment[];
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [savingPrice, setSavingPrice] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: 15,
      };

      // Add search parameters if search term exists
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axios.get('/api/unpaid-invoices/search', { params });
      setInvoices(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchInvoices();
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchInvoices();
    }, 500); // Wait 500ms after user stops typing
    
    setSearchTimeout(timeout);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditPrice(invoice.total_amount);
    setShowModal(true);
  };

  const generateTaxInvoiceHtml = (receiptData: any) => {
    const currentDate = new Date().toLocaleDateString('ar-EG');
    const taxRate = 14; // 14% VAT rate for Egypt
    const subtotal = receiptData.total_amount || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalWithTax = subtotal + taxAmount;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة ضريبية - ${receiptData.receipt_number}</title>
        <style>
          @page { 
            size: A4; 
            margin: 20mm; 
          }
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
            direction: rtl;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2c5aa0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
          }
          .header h2 {
            margin: 0;
            font-size: 20px;
            color: #666;
            font-weight: normal;
          }
          .company-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .company-details h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #2c5aa0;
          }
          .company-details p {
            margin: 5px 0;
            font-size: 14px;
          }
          .invoice-details {
            text-align: left;
          }
          .invoice-details h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #2c5aa0;
          }
          .invoice-details p {
            margin: 5px 0;
            font-size: 14px;
          }
          .patient-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .patient-info h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #2c5aa0;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 10px;
          }
          .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .patient-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
          }
          .patient-label {
            font-weight: bold;
            color: #555;
          }
          .patient-value {
            color: #333;
          }
          .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .services-table th {
            background: #2c5aa0;
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: bold;
          }
          .services-table td {
            padding: 12px 15px;
            text-align: center;
            border-bottom: 1px solid #eee;
          }
          .services-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .service-name {
            text-align: right;
            font-weight: bold;
          }
          .totals-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .totals-section h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #2c5aa0;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
          }
          .total-label {
            font-weight: bold;
            color: #555;
          }
          .total-value {
            font-weight: bold;
            color: #333;
          }
          .grand-total {
            background: #2c5aa0;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
          }
          .grand-total .total-row {
            border-bottom: none;
            font-size: 18px;
          }
          .payment-info {
            background: #e8f4fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-right: 4px solid #2c5aa0;
          }
          .payment-info h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #2c5aa0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #2c5aa0;
            color: #666;
          }
          .footer p {
            margin: 5px 0;
          }
          .barcode {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
          }
          .status-paid {
            background: #d4edda;
            color: #155724;
          }
          .status-partial {
            background: #fff3cd;
            color: #856404;
          }
          .status-pending {
            background: #f8d7da;
            color: #721c24;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>فاتورة ضريبية</h1>
            <h2>Tax Invoice</h2>
          </div>
          
          <div class="company-info">
            <div class="company-details">
              <h3>معلومات المختبر</h3>
              <p><strong>اسم المختبر:</strong> مختبر التحاليل الطبية</p>
              <p><strong>العنوان:</strong> القاهرة، مصر</p>
              <p><strong>الهاتف:</strong> +20 123 456 7890</p>
              <p><strong>البريد الإلكتروني:</strong> info@lab.com</p>
              <p><strong>الرقم الضريبي:</strong> 123456789012345</p>
            </div>
            <div class="invoice-details">
              <h3>تفاصيل الفاتورة</h3>
              <p><strong>رقم الفاتورة:</strong> ${receiptData.receipt_number}</p>
              <p><strong>تاريخ الفاتورة:</strong> ${receiptData.date}</p>
              <p><strong>رقم المختبر:</strong> ${receiptData.lab_number || 'N/A'}</p>
              <p><strong>رقم الزيارة:</strong> ${receiptData.visit_number}</p>
            </div>
          </div>
          
          <div class="patient-info">
            <h3>معلومات المريض</h3>
            <div class="patient-grid">
              <div class="patient-item">
                <span class="patient-label">الاسم:</span>
                <span class="patient-value">${receiptData.patient_name}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">العمر:</span>
                <span class="patient-value">${receiptData.patient_age || 'N/A'}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">الهاتف:</span>
                <span class="patient-value">${receiptData.patient_phone}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">الحالة:</span>
                <span class="patient-value">
                  <span class="status-badge status-${(receiptData.billing_status || receiptData.payment_status || 'pending').toLowerCase()}">
                    ${(receiptData.billing_status || receiptData.payment_status || 'PENDING').toUpperCase()}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <table class="services-table">
            <thead>
              <tr>
                <th style="width: 60%;">الخدمة / Service</th>
                <th style="width: 20%;">السعر / Price</th>
                <th style="width: 20%;">المجموع / Total</th>
              </tr>
            </thead>
            <tbody>
              ${(receiptData.tests || []).map((test: any) => `
                <tr>
                  <td class="service-name">${test.name || 'Unknown Test'}</td>
                  <td>${formatCurrency(test.price || 0)}</td>
                  <td>${formatCurrency(test.price || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals-section">
            <h3>تفاصيل المبلغ</h3>
            <div class="total-row">
              <span class="total-label">المجموع الفرعي:</span>
              <span class="total-value">${formatCurrency(subtotal)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">الخصم:</span>
              <span class="total-value">${formatCurrency(receiptData.discount_amount || 0)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">الضريبة (${taxRate}%):</span>
              <span class="total-value">${formatCurrency(taxAmount)}</span>
            </div>
            <div class="grand-total">
              <div class="total-row">
                <span class="total-label">المجموع الكلي:</span>
                <span class="total-value">${formatCurrency(totalWithTax)}</span>
              </div>
            </div>
          </div>
          
          <div class="payment-info">
            <h3>معلومات الدفع</h3>
            <div class="total-row">
              <span class="total-label">المبلغ المدفوع:</span>
              <span class="total-value">${formatCurrency(receiptData.paid_now || receiptData.upfront_payment || 0)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">المبلغ المتبقي:</span>
              <span class="total-value">${formatCurrency(receiptData.remaining_balance || 0)}</span>
            </div>
            ${receiptData.payment_breakdown && (receiptData.payment_breakdown.cash > 0 || receiptData.payment_breakdown.card > 0) ? `
            <div style="margin-top: 15px;">
              <h4>تفاصيل الدفع:</h4>
              ${receiptData.payment_breakdown.cash > 0 ? `
              <div class="total-row">
                <span class="total-label">نقداً:</span>
                <span class="total-value">${formatCurrency(receiptData.payment_breakdown.cash)}</span>
              </div>
              ` : ''}
              ${receiptData.payment_breakdown.card > 0 ? `
              <div class="total-row">
                <span class="total-label">بطاقة (${receiptData.payment_breakdown.card_method || 'Card'}):</span>
                <span class="total-value">${formatCurrency(receiptData.payment_breakdown.card)}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
          
          ${receiptData.barcode ? `
          <div class="barcode">
            <p><strong>باركود المختبر:</strong></p>
            ${receiptData.barcode.includes('<svg') ? 
              receiptData.barcode : 
              `<img src="data:image/png;base64,${receiptData.barcode}" alt="Barcode" style="max-width: 300px; height: auto;" />`
            }
          </div>
          ` : ''}
          
          <div class="footer">
            <p><strong>شكراً لاختياركم مختبرنا</strong></p>
            <p>Thank you for choosing our lab!</p>
            <p>تاريخ الطباعة: ${currentDate}</p>
            <p>Printed by: ${receiptData.processed_by || 'System'}</p>
            <p>Visit ID: ${receiptData.visit_id}</p>
          </div>
        </div>
      </body>
    </html>
    `;
  };

  const generateReceiptHtml = (receiptData: any) => {
    return generateTaxInvoiceHtml(receiptData);
  };

  const handleOpenInvoicePreview = async (invoice: any) => {
    try {
      // Use the visit ID to get the receipt
      const visitId = invoice.visit?.id;
      if (!visitId) {
        toast.error('Visit ID not found');
        return;
      }
      
      const response = await axios.get(`/api/check-in/visits/${visitId}/receipt`);
      const receiptData = response.data.receipt_data;
      
      // Generate receipt HTML
      const receiptHtml = generateReceiptHtml(receiptData);
      
      // Open in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(receiptHtml);
        newWindow.document.close();
        newWindow.print();
        toast.success('Receipt opened in new tab');
      }
    } catch (error) {
      console.error('Failed to open invoice:', error);
      toast.error('Failed to open invoice');
    }
  };

  const handleSavePrice = async () => {
    if (!selectedInvoice) return;
    
    setSavingPrice(true);
    try {
      const response = await axios.put(`/api/invoices/${selectedInvoice.id}`, {
        total_amount: editPrice,
      });
      setSelectedInvoice(response.data.invoice);
      setInvoices(invoices.map(inv => 
        inv.id === response.data.invoice.id ? response.data.invoice : inv
      ));
      toast.success('Invoice price updated successfully');
    } catch (error) {
      console.error('Failed to update price:', error);
      toast.error('Failed to update price');
    } finally {
      setSavingPrice(false);
    }
  };


  const getAmountPaid = (invoice: Invoice): number => {
    // Use the amount_paid field from the invoice if available, otherwise calculate from payments
    if (invoice.amount_paid !== undefined && invoice.amount_paid !== null) {
      return Number(invoice.amount_paid);
    }
    
    if (!invoice.payments || invoice.payments.length === 0) {
      return 0;
    }
    return invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  };

  const getBalance = (invoice: Invoice): number => {
    // Use the balance field from the invoice if available, otherwise calculate it
    if (invoice.balance !== undefined && invoice.balance !== null) {
      return Number(invoice.balance);
    }
    return Number(invoice.total_amount || 0) - getAmountPaid(invoice);
  };

  const getStatus = (invoice: Invoice): string => {
    // Use the status field from the invoice if available, otherwise calculate it
    if (invoice.status && invoice.status !== 'unpaid') {
      return invoice.status;
    }
    
    const total = Number(invoice.total_amount || 0);
    const paid = getAmountPaid(invoice);
    if (paid === 0) return 'unpaid';
    if (paid >= total) return 'paid';
    return 'partial';
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      unpaid: { color: 'error', label: 'Unpaid' },
      partial: { color: 'warning', label: 'Partial' },
      paid: { color: 'success', label: 'Paid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color as any} size="small" />;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Receipt sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              Invoices
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage patient invoices and payments
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchInvoices}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Invoices
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search by invoice number, visit number, patient name, or phone"
              value={searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // Clear timeout and search immediately on Enter
                  if (searchTimeout) {
                    clearTimeout(searchTimeout);
                  }
                  handleSearch();
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Box>
        </CardContent>
      </Card>

      {invoices.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Invoices Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invoices will appear here when patients complete their visits.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Invoices ({invoices.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Lab #</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Visit #</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
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
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}>
                          {invoice.lab_number || invoice.visit?.patient?.lab || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {invoice.visit?.patient?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.visit?.patient?.phone || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {invoice.visit?.visit_number || invoice.invoice_number || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(invoice.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          {formatCurrency(getAmountPaid(invoice))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={getBalance(invoice) > 0 ? 'error.main' : 'success.main'}
                        >
                          {formatCurrency(getBalance(invoice))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(getStatus(invoice))}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.visit?.visit_date ? new Date(invoice.visit.visit_date).toLocaleDateString() : 
                           invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewInvoice(invoice)}
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Preview PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenInvoicePreview(invoice)}
                              color="secondary"
                            >
                              <PictureAsPdf />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
          </CardContent>
        </Card>
      )}

      {/* Invoice Details Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt color="primary" />
            Invoice Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Invoice Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Invoice Number"
                      secondary={selectedInvoice.invoice_number}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Lab Number"
                      secondary={selectedInvoice.lab_number || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Patient"
                      secondary={selectedInvoice.visit?.patient?.name || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Visit Number"
                      secondary={selectedInvoice.visit?.visit_number || 'N/A'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Date"
                      secondary={new Date(selectedInvoice.invoice_date).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={getStatusChip(getStatus(selectedInvoice))}
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Financial Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Total Amount"
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            size="small"
                            sx={{ width: 120 }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                          <Button
                            size="small"
                            onClick={handleSavePrice}
                            disabled={savingPrice}
                            variant="outlined"
                          >
                            {savingPrice ? 'Saving...' : 'Save'}
                          </Button>
                        </Box>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Amount Paid"
                      secondary={formatCurrency(getAmountPaid(selectedInvoice))}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Remaining"
                      secondary={
                        <Typography 
                          color={getBalance(selectedInvoice) > 0 ? 'error.main' : 'success.main'}
                          fontWeight="medium"
                        >
                          {formatCurrency(getBalance(selectedInvoice))}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {getAmountPaid(selectedInvoice) > Number(selectedInvoice.total_amount || 0) && (
                    <ListItem>
                      <Alert severity="warning">
                        Overpaid by {formatCurrency(getAmountPaid(selectedInvoice) - Number(selectedInvoice.total_amount || 0))}
                      </Alert>
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Payment History
                </Typography>
                {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.paid_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={payment.payment_method} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              {payment.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No payments recorded
                  </Typography>
                )}
              </Grid>

            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices;
