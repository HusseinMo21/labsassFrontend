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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Print,
  Edit,
  Download,
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
    patient: {
      id: number;
      name: string;
      phone: string;
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
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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

      const response = await axios.get('/api/invoices', { params });
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

  const handleOpenInvoicePreview = async (invoiceId: number) => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.onload = function() {
          const downloadBtn = newWindow.document.createElement('button');
          downloadBtn.innerHTML = 'Download PDF';
          downloadBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #1976d2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
          `;
          downloadBtn.onclick = function() {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
          };
          newWindow.document.body.appendChild(downloadBtn);
        };
        toast.success('Invoice opened in new tab');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${invoiceId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Invoice downloaded (popup blocked)');
      }
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
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
                          {invoice.lab_number || 'N/A'}
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
                          {invoice.visit?.visit_number || 'N/A'}
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
                          {new Date(invoice.invoice_date).toLocaleDateString()}
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
                              onClick={() => handleOpenInvoicePreview(invoice.id)}
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
                  onChange={(event, page) => setCurrentPage(page)}
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
              <Grid size={{ xs: 12, md: 6 }}>
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
              
              <Grid size={{ xs: 12, md: 6 }}>
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

              <Grid size={{ xs: 12 }}>
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