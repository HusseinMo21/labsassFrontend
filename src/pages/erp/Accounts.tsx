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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Payment,
  CheckCircle,
  Search,
  Refresh,
  Business,
  AttachMoney,
  History,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

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
  const [showEditDialog, setShowEditDialog] = useState(false);
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
      const response = await axios.post('/api/accounts', formData);
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
      const response = await axios.post(`/api/accounts/${selectedAccount.id}/transactions`, transactionData);
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
      const response = await axios.post(`/api/accounts/${selectedAccount.id}/payments`, paymentData);
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

  const formatCurrency = (amount: number) => {
    return `EGP ${amount.toFixed(2)}`;
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
    </Box>
  );
};

export default Accounts;
