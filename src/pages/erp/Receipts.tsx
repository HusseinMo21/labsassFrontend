import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Alert,
  Pagination,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Receipt,
  Visibility,
  Print,
  Refresh,
  Download,
} from '@mui/icons-material';
import axios from 'axios';

interface Receipt {
  id: number;
  receipt_number: string;
  lab_number?: string;
  visit_number: string;
  visit_date: string;
  visit_time: string;
  total_amount: number;
  final_amount: number;
  upfront_payment: number;
  remaining_balance: number;
  payment_method: string;
  billing_status: string;
  status: string;
  discount_amount?: number;
  barcode?: string;
  expected_delivery_date?: string;
  patient: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
  visitTests: Array<{
    id: number;
    labTest?: {
      id: number;
      name: string;
      price: number;
    };
    lab_test?: {
      id: number;
      name: string;
      price: number;
    };
    status: string;
  }>;
}

const Receipts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  useEffect(() => {
    fetchReceipts();
  }, [currentPage]);

  // Handle patient filter from URL parameters
  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId) {
      setSearchTerm(patientId);
      // You could also filter the receipts by patient ID here
      // For now, we'll just set the search term
    }
  }, [searchParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: 15,
        include_receipts: true,
        _t: Date.now(), // Cache busting parameter
      };

      // Add search parameters if search term exists
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axios.get('/api/visits', { params });
      
      // Debug: Log the first visit to see what data we're getting
      if (response.data.data && response.data.data.length > 0) {
        console.log('First visit data:', response.data.data[0]);
        console.log('Lab number in first visit:', response.data.data[0].lab_number);
      }
      
      // Filter to only include visits with receipt numbers and normalize data
      const receiptsData = response.data.data
        .filter((visit: any) => visit.receipt_number)
        .map((visit: any) => ({
          ...visit,
          visitTests: visit.visit_tests || visit.visitTests || [],
          // Ensure patient data exists
          patient: visit.patient || { id: 0, name: 'Unknown', phone: 'N/A' },
        }));
      
      setReceipts(receiptsData);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchReceipts();
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
      fetchReceipts();
    }, 500); // Wait 500ms after user stops typing
    
    setSearchTimeout(timeout);
  };

  const handleViewDetails = async (receipt: Receipt) => {
    try {
      // Fetch the proper receipt data with correct barcode URL
      const response = await axios.get(`/api/check-in/visits/${receipt.id}/receipt`);
      const receiptData = response.data.receipt_data;
      
      // Update the receipt with the proper receipt data
      const updatedReceipt = {
        ...receipt,
        ...receiptData,
        barcode: receiptData.barcode
      };
      
      setSelectedReceipt(updatedReceipt);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Failed to fetch receipt details:', error);
      // Fallback to original receipt data
      setSelectedReceipt(receipt);
      setDetailsOpen(true);
    }
  };

  const handlePrint = async (receipt: Receipt) => {
    try {
      // Fetch the proper receipt data with correct barcode URL
      const response = await axios.get(`/api/check-in/visits/${receipt.id}/receipt`);
      const receiptData = response.data.receipt_data;
      
      // Update the receipt with the proper receipt data
      const updatedReceipt = {
        ...receipt,
        ...receiptData,
        barcode: receiptData.barcode
      };
      
      setSelectedReceipt(updatedReceipt);
      setPrintOpen(true);
    } catch (error) {
      console.error('Failed to fetch receipt data for printing:', error);
      // Fallback to original receipt data
      setSelectedReceipt(receipt);
      setPrintOpen(true);
    }
  };

  const printReceipt = (receipt: Receipt) => {
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.receipt_number}</title>
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
          <p>Date: ${new Date(receipt.visit_date).toLocaleDateString()}</p>
          <p>Receipt #: ${receipt.receipt_number}</p>
          <p>Lab #: ${receipt.lab_number || 'N/A'}</p>
        </div>
        
        <div class="section">
          <h3>PATIENT INFO</h3>
          <div class="row">
            <span class="label">Name:</span>
            <span class="value" style="direction: rtl; text-align: right; unicode-bidi: bidi-override; font-weight: bold;">${receipt.patient.name}</span>
          </div>
          <div class="row">
            <span class="label">Phone:</span>
            <span class="value">${receipt.patient.phone}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>TESTS (${receipt.visitTests?.length || 0})</h3>
          ${(receipt.visitTests || []).map((test) => `
            <div class="test-item">
              <span class="test-name">${(test.labTest || test.lab_test)?.name || 'Unknown Test'}</span>
              <span class="test-price">${formatCurrency((test.labTest || test.lab_test)?.price || 0)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="section total">
          <div class="row">
            <span class="label">Total:</span>
            <span class="value">${formatCurrency(receipt.total_amount)}</span>
          </div>
          <div class="row">
            <span class="label">Discount:</span>
            <span class="value">${formatCurrency(receipt.discount_amount || 0)}</span>
          </div>
          <div class="row">
            <span class="label">Final:</span>
            <span class="value">${formatCurrency(receipt.final_amount)}</span>
          </div>
          <div class="row">
            <span class="label">Paid:</span>
            <span class="value">${formatCurrency(receipt.upfront_payment)}</span>
          </div>
          <div class="row">
            <span class="label">Remaining:</span>
            <span class="value">${formatCurrency(receipt.remaining_balance)}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="row">
            <span class="label">Method:</span>
            <span class="value">${receipt.payment_method.toUpperCase()}</span>
          </div>
          <div class="row">
            <span class="label">Status:</span>
            <span class="value">${receipt.billing_status.toUpperCase()}</span>
          </div>
        </div>
        
        ${receipt.barcode ? `
        <div class="barcode">
          ${receipt.barcode}
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for choosing our lab!</p>
          <p>Visit: ${receipt.visit_number}</p>
          <p>Expected: ${receipt.expected_delivery_date ? new Date(receipt.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      registered: { color: 'default', label: 'Registered' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color as any} size="small" />;
  };

  const getBillingStatusChip = (status: string) => {
    const statusConfig = {
      paid: { color: 'success', label: 'Paid' },
      partial: { color: 'warning', label: 'Partial Payment' },
      pending: { color: 'error', label: 'Unpaid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color as any} size="small" />;
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt />
          Receipts Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchReceipts}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Receipts
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search by receipt number (e.g., RCP202509110003), visit number, patient name, or phone"
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : receipts.length === 0 ? (
        <Alert severity="info">
          {searchTerm ? 'No receipts found matching your search criteria.' : 'No receipts found.'}
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Receipt #</TableCell>
                  <TableCell>Lab #</TableCell>
                  <TableCell>Visit #</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Remaining</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Billing</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receipts.map((receipt) => (
                <TableRow key={receipt.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {receipt.receipt_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}>
                      {receipt.lab_number || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {receipt.visit_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {receipt.patient.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {receipt.patient.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {new Date(receipt.visit_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {receipt.visit_time}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(receipt.final_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(receipt.upfront_payment)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error.main">
                      {formatCurrency(receipt.remaining_balance)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(receipt.status)}</TableCell>
                  <TableCell>{getBillingStatusChip(receipt.billing_status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetails(receipt)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handlePrint(receipt)}
                        title="Print Receipt"
                      >
                        <Print />
                      </IconButton>
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
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Receipt Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Receipt Details - {selectedReceipt?.receipt_number}
        </DialogTitle>
        <DialogContent>
          {selectedReceipt && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Patient Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2"><strong>Name:</strong> {selectedReceipt.patient.name}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedReceipt.patient.phone}</Typography>
                  {selectedReceipt.patient.email && (
                    <Typography variant="body2"><strong>Email:</strong> {selectedReceipt.patient.email}</Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Receipt Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2"><strong>Receipt #:</strong> {selectedReceipt.receipt_number}</Typography>
                  <Typography variant="body2"><strong>Lab #:</strong> {selectedReceipt.lab_number || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Visit #:</strong> {selectedReceipt.visit_number}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {new Date(selectedReceipt.visit_date).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Time:</strong> {selectedReceipt.visit_time}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Tests</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Test Name</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedReceipt.visitTests || []).map((test) => (
                        <TableRow key={test.id}>
                          <TableCell>{(test.labTest || test.lab_test)?.name || 'Unknown Test'}</TableCell>
                          <TableCell>{formatCurrency((test.labTest || test.lab_test)?.price || 0)}</TableCell>
                          <TableCell>{getStatusChip(test.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Payment Summary</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Amount:</Typography>
                  <Typography variant="body2">{formatCurrency(selectedReceipt.total_amount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Final Amount:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(selectedReceipt.final_amount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Amount Paid:</Typography>
                  <Typography variant="body2" color="success.main">{formatCurrency(selectedReceipt.upfront_payment)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Remaining Balance:</Typography>
                  <Typography variant="body2" color="error.main">{formatCurrency(selectedReceipt.remaining_balance)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Payment Method:</Typography>
                  <Typography variant="body2">{selectedReceipt.payment_method}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Billing Status:</Typography>
                  {getBillingStatusChip(selectedReceipt.billing_status)}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={() => {
              setDetailsOpen(false);
              printReceipt(selectedReceipt!);
            }}
          >
            Print Receipt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Print Receipt - {selectedReceipt?.receipt_number}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Receipt printing functionality will be implemented here. This would typically open a print dialog or generate a PDF.
          </Typography>
          {selectedReceipt && (
            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <Typography variant="h6" align="center" gutterBottom>
                RECEIPT
              </Typography>
              <Typography variant="body2" align="center" gutterBottom>
                {selectedReceipt.receipt_number}
              </Typography>
              <Typography variant="body2" align="center" gutterBottom>
                {new Date(selectedReceipt.visit_date).toLocaleDateString()} {selectedReceipt.visit_time}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Patient: {selectedReceipt.patient.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Phone: {selectedReceipt.patient.phone}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Total: {formatCurrency(selectedReceipt.final_amount)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Paid: {formatCurrency(selectedReceipt.upfront_payment)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Remaining: {formatCurrency(selectedReceipt.remaining_balance)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={() => {
              printReceipt(selectedReceipt!);
              setPrintOpen(false);
            }}
          >
            Print Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Receipts;
