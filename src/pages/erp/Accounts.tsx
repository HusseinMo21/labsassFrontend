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
  CircularProgress,
  Grid,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Pagination,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Delete,
  Payment,
  CheckCircle,
  Search,
  Refresh,
  Business,
  History,
  Print,
  FileDownload,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Account {
  id: number;
  name: string;
  description?: string;
  total_amount: number;
  total_paid: number;
  remaining_balance: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  transaction_date: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  type: 'purchase' | 'payment';
  description?: string;
  notes?: string;
  created_at: string;
}

interface AccountSummary {
  total_accounts: number;
  active_accounts: number;
  completed_accounts: number;
  total_debt: number;
  total_paid: number;
  total_amount: number;
}

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState<AccountSummary | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initial_amount: '',
    initial_paid: '',
  });

  const [transactionData, setTransactionData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    paid_amount: '',
    type: 'purchase' as 'purchase' | 'payment',
    description: '',
    notes: '',
  });

  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFilename, setPdfFilename] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchSummary();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: 15,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await axios.get('/api/accounts', { params });
      setAccounts(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/accounts-summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleCreateAccount = async () => {
    if (!formData.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    setSaving(true);
    try {
      await axios.post('/api/accounts', formData);
      toast.success('Account created successfully');
      setShowCreateDialog(false);
      setFormData({ name: '', description: '', initial_amount: '', initial_paid: '' });
      fetchAccounts();
      fetchSummary();
    } catch (error) {
      console.error('Failed to create account:', error);
      toast.error('Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedAccount) return;

    if (!transactionData.transaction_date || !transactionData.amount || !transactionData.paid_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`/api/accounts/${selectedAccount.id}/transactions`, transactionData);
      toast.success('Transaction added successfully');
      setShowTransactionDialog(false);
      setTransactionData({
        transaction_date: new Date().toISOString().split('T')[0],
        amount: '',
        paid_amount: '',
        type: 'purchase',
        description: '',
        notes: '',
      });
      fetchAccounts();
      fetchSummary();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedAccount) return;

    if (!paymentData.payment_date || !paymentData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`/api/accounts/${selectedAccount.id}/payments`, paymentData);
      toast.success('Payment added successfully');
      setShowPaymentDialog(false);
      setPaymentData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        notes: '',
      });
      fetchAccounts();
      fetchSummary();
    } catch (error) {
      console.error('Failed to add payment:', error);
      toast.error('Failed to add payment');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async (account: Account) => {
    try {
      await axios.post(`/api/accounts/${account.id}/mark-completed`);
      toast.success('Account marked as completed');
      fetchAccounts();
      fetchSummary();
    } catch (error) {
      console.error('Failed to mark account as completed:', error);
      toast.error('Failed to mark account as completed');
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (!window.confirm(`Are you sure you want to delete "${account.name}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/accounts/${account.id}`);
      toast.success('Account deleted successfully');
      fetchAccounts();
      fetchSummary();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    // Convert to number and handle edge cases
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if the value is a valid number
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'EGP 0.00';
    }
    
    return `EGP ${numAmount.toFixed(2)}`;
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { color: 'warning' as const, label: 'Active' },
      completed: { color: 'success' as const, label: 'Completed' },
      cancelled: { color: 'error' as const, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getTransactionTypeChip = (type: string) => {
    const typeConfig = {
      purchase: { color: 'error' as const, label: 'Purchase' },
      payment: { color: 'success' as const, label: 'Payment' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.purchase;
    return <Chip label={config.label} color={config.color} size="small" />;
  };


  const handleExportAccountDetails = (account: Account) => {
    // Prepare detailed data for the specific account with proper formatting
    const accountData = [{
      'Account Name': account.name,
      'Description': account.description || '',
      'Total Amount (EGP)': Number(account.total_amount),
      'Paid Amount (EGP)': Number(account.total_paid),
      'Remaining Balance (EGP)': Number(account.remaining_balance),
      'Status': account.status.charAt(0).toUpperCase() + account.status.slice(1),
      'Created Date': new Date(account.created_at),
      'Updated Date': new Date(account.updated_at),
    }];

    // Add transaction details if available
    if (account.transactions && account.transactions.length > 0) {
      accountData.push({
        'Account Name': '',
        'Description': '',
        'Total Amount (EGP)': 0,
        'Paid Amount (EGP)': 0,
        'Remaining Balance (EGP)': 0,
        'Status': '',
        'Created Date': new Date(),
        'Updated Date': new Date(),
      }); // Empty row separator
      accountData.push({
        'Account Name': 'TRANSACTION HISTORY',
        'Description': '',
        'Total Amount (EGP)': 0,
        'Paid Amount (EGP)': 0,
        'Remaining Balance (EGP)': 0,
        'Status': '',
        'Created Date': new Date(),
        'Updated Date': new Date(),
      });

      account.transactions.forEach(transaction => {
        accountData.push({
          'Account Name': transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Transaction`,
          'Description': transaction.notes || '',
          'Total Amount (EGP)': Number(transaction.amount),
          'Paid Amount (EGP)': Number(transaction.paid_amount),
          'Remaining Balance (EGP)': Number(transaction.remaining_amount),
          'Status': transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
          'Created Date': new Date(transaction.transaction_date),
          'Updated Date': new Date(transaction.created_at),
        });
      });
    }

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(accountData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 25 }, // Account Name
      { wch: 35 }, // Description
      { wch: 15 }, // Total Amount
      { wch: 15 }, // Paid Amount
      { wch: 18 }, // Remaining Balance
      { wch: 12 }, // Status
      { wch: 12 }, // Created Date
      { wch: 12 }, // Updated Date
    ];
    ws['!cols'] = colWidths;

    // Add header styling
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    // Apply header styling to first row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) ws[cellAddress] = { v: '' };
      ws[cellAddress].s = headerStyle;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${account.name} Details`);

    // Generate filename with account name and current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `account_${account.name.replace(/[^a-zA-Z0-9]/g, '_')}_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    toast.success(`Account details for "${account.name}" exported successfully`);
  };

  const handlePrintAccountDetails = async (account: Account) => {
    console.log('PDF generation started for account:', account.name);
    toast.info('Starting PDF generation...');
    setGeneratingPDF(true);
    
    try {
      // Create a temporary div element to hold the content with Arabic support
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = 'Arial, "Amiri", "Noto Sans Arabic", sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#333';
      tempDiv.style.direction = 'ltr'; // Keep overall direction LTR for layout

      const currentDate = new Date().toLocaleDateString();

      tempDiv.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="font-size: 24px; margin: 0 0 10px 0; font-weight: bold;">Account Details Report</h1>
          <p style="margin: 5px 0; font-size: 14px;">Generated on: ${currentDate}</p>
          <p style="margin: 5px 0; font-size: 14px;">Account: ${account.name}</p>
        </div>

        <div style="background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; width: 150px;">Account Name:</span>
            <span style="flex: 1; text-align: right;">${account.name}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; width: 150px;">Description:</span>
            <span style="flex: 1; text-align: right; font-family: 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;">${account.description || 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; width: 150px;">Total Amount:</span>
            <span style="flex: 1; text-align: right;">${formatCurrency(account.total_amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; width: 150px;">Paid Amount:</span>
            <span style="flex: 1; text-align: right;">${formatCurrency(account.total_paid)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; width: 150px;">Remaining Balance:</span>
            <span style="flex: 1; text-align: right;">${formatCurrency(account.remaining_balance)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; width: 150px;">Status:</span>
            <span style="flex: 1; text-align: right;">${account.status.charAt(0).toUpperCase() + account.status.slice(1)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; width: 150px;">Created Date:</span>
            <span style="flex: 1; text-align: right;">${new Date(account.created_at).toLocaleDateString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; width: 150px;">Last Updated:</span>
            <span style="flex: 1; text-align: right;">${new Date(account.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        ${account.transactions && account.transactions.length > 0 ? `
        <div style="margin-top: 20px;">
          <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Transaction History (${account.transactions.length} transactions)</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold; font-size: 13px;">Date</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold; font-size: 13px;">Description</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold; font-size: 13px;">Type</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold; font-size: 13px;">Amount</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold; font-size: 13px;">Paid</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold; font-size: 13px;">Remaining</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold; font-size: 13px;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${account.transactions.map(transaction => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">${new Date(transaction.transaction_date).toLocaleDateString()}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; font-family: 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;">${transaction.description || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">${formatCurrency(transaction.amount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">${formatCurrency(transaction.paid_amount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">${formatCurrency(transaction.remaining_amount)}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; font-family: 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;">${transaction.notes || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : `
        <div style="margin-top: 20px;">
          <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Transaction History</h3>
          <p>No transactions found for this account.</p>
        </div>
        `}

        <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 10px; color: #666;">
          <p>This report was generated automatically by the Accounts Management System</p>
          <p>For any questions, please contact the system administrator</p>
        </div>
      `;

      // Add the temporary div to the document
      document.body.appendChild(tempDiv);

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove the temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate PDF blob for preview
      const filename = `account_${account.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = pdf.output('blob');
      
      // Set the PDF data for preview
      setPdfBlob(pdfBlob);
      setPdfFilename(filename);
      setShowPDFPreview(true);

      toast.success(`PDF preview generated successfully`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + (error as Error).message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business sx={{ fontSize: 32 }} />
          Accounts Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
        >
          Add Account
        </Button>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {summary.total_accounts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Accounts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {summary.active_accounts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {summary.completed_accounts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="error.main">
                  {formatCurrency(summary.total_debt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Debt
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(summary.total_paid)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Paid
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {formatCurrency(summary.total_amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by account name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchAccounts}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Accounts Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first account to start tracking supplier transactions.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Accounts ({accounts.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Account Name</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {account.name}
                        </Typography>
                        {account.description && (
                          <Typography variant="caption" color="text.secondary">
                            {account.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(account.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          {formatCurrency(account.total_paid)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={account.remaining_balance > 0 ? 'error.main' : 'success.main'}
                        >
                          {formatCurrency(account.remaining_balance)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(account.status)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(account.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View History">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowHistoryDialog(true);
                              }}
                              color="info"
                            >
                              <History />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Preview & Generate PDF">
                            <IconButton
                              size="small"
                              onClick={() => handlePrintAccountDetails(account)}
                              color="info"
                              disabled={generatingPDF}
                            >
                              {generatingPDF ? <CircularProgress size={16} /> : <Print />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export Account Details">
                            <IconButton
                              size="small"
                              onClick={() => handleExportAccountDetails(account)}
                              color="secondary"
                            >
                              <FileDownload />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Transaction">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowTransactionDialog(true);
                              }}
                              color="primary"
                            >
                              <Add />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Payment">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowPaymentDialog(true);
                              }}
                              color="success"
                            >
                              <Payment />
                            </IconButton>
                          </Tooltip>
                          {account.status === 'active' && account.remaining_balance > 0 && (
                            <Tooltip title="Mark as Completed">
                              <IconButton
                                size="small"
                                onClick={() => handleMarkCompleted(account)}
                                color="success"
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAccount(account)}
                              color="error"
                            >
                              <Delete />
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
                />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Account Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Initial Amount"
                type="number"
                value={formData.initial_amount}
                onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Initial Paid"
                type="number"
                value={formData.initial_paid}
                onChange={(e) => setFormData({ ...formData, initial_paid: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAccount} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={showTransactionDialog} onClose={() => setShowTransactionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Transaction - {selectedAccount?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Transaction Date"
                type="date"
                value={transactionData.transaction_date}
                onChange={(e) => setTransactionData({ ...transactionData, transaction_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={transactionData.amount}
                onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Paid Amount"
                type="number"
                value={transactionData.paid_amount}
                onChange={(e) => setTransactionData({ ...transactionData, paid_amount: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={transactionData.type}
                  label="Transaction Type"
                  onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value as 'purchase' | 'payment' })}
                >
                  <MenuItem value="purchase">Purchase (Add to Debt)</MenuItem>
                  <MenuItem value="payment">Payment (Reduce Debt)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={transactionData.description}
                onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={transactionData.notes}
                onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransactionDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTransaction} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Add Transaction'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment - {selectedAccount?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                inputProps={{ min: 0.01, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={paymentData.description}
                onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handleAddPayment} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Add Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={showHistoryDialog} onClose={() => setShowHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Transaction History - {selectedAccount?.name}
          <Typography variant="body2" color="text.secondary">
            Total: {formatCurrency(selectedAccount?.total_amount || 0)} | 
            Paid: {formatCurrency(selectedAccount?.total_paid || 0)} | 
            Remaining: {formatCurrency(selectedAccount?.remaining_balance || 0)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedAccount?.transactions && selectedAccount.transactions.length > 0 ? (
            <List>
              {selectedAccount.transactions.map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Transaction`}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {getTransactionTypeChip(transaction.type)}
                            <Typography variant="body2" color="text.secondary">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Amount: {formatCurrency(transaction.amount)} | 
                            Paid: {formatCurrency(transaction.paid_amount)} | 
                            Remaining: {formatCurrency(transaction.remaining_amount)}
                          </Typography>
                          {transaction.notes && (
                            <Typography variant="caption" color="text.secondary">
                              Notes: {transaction.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < selectedAccount.transactions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No transactions found for this account.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog 
        open={showPDFPreview} 
        onClose={() => setShowPDFPreview(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">PDF Preview - {pdfFilename}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={() => {
                if (pdfBlob) {
                  const url = URL.createObjectURL(pdfBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = pdfFilename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  toast.success('PDF downloaded successfully');
                }
              }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={() => {
                if (pdfBlob) {
                  const url = URL.createObjectURL(pdfBlob);
                  const printWindow = window.open(url, '_blank');
                  if (printWindow) {
                    printWindow.onload = () => {
                      printWindow.print();
                    };
                  }
                  toast.success('PDF sent to printer');
                }
              }}
            >
              Print PDF
            </Button>
            <Button onClick={() => setShowPDFPreview(false)}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {pdfBlob && (
            <iframe
              src={URL.createObjectURL(pdfBlob)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="PDF Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Accounts;

