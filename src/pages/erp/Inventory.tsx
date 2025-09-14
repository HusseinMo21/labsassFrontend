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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Fab,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Inventory as InventoryIcon,
  Warning,
  Error,
  CheckCircle,
  Schedule,
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  Upload,
  Science,
  LocalHospital,
  Biotech,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface InventoryItem {
  id: number;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  minimum_quantity: number;
  unit_price: number;
  supplier: string;
  expiry_date: string;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'expired';
  updated_by: number;
  created_at: string;
  updated_at: string;
  updatedBy?: {
    id: number;
    name: string;
  };
}

interface InventoryStats {
  total_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  expired_items: number;
  total_value: number;
  by_status: {
    active: number;
    low_stock: number;
    out_of_stock: number;
    expired: number;
  };
}

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    quantity: '',
    minimum_quantity: '',
    unit_price: '',
    supplier: '',
    expiry_date: '',
  });
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment: '',
    reason: '',
  });

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (showLowStock) params.append('low_stock', 'true');
      if (showExpired) params.append('expired', 'true');

      const response = await axios.get(`/api/inventory?${params}`);
      setItems(response.data.data);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
      toast.error('Failed to fetch inventory items');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/inventory/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      unit: '',
      quantity: '',
      minimum_quantity: '',
      unit_price: '',
      supplier: '',
      expiry_date: '',
    });
    setOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      unit: item.unit,
      quantity: item.quantity.toString(),
      minimum_quantity: item.minimum_quantity.toString(),
      unit_price: item.unit_price?.toString() || '',
      supplier: item.supplier || '',
      expiry_date: item.expiry_date || '',
    });
    setOpen(true);
  };

  const handleAdjustQuantity = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentData({ adjustment: '', reason: '' });
    setAdjustmentOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        quantity: parseInt(formData.quantity),
        minimum_quantity: parseInt(formData.minimum_quantity),
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        expiry_date: formData.expiry_date || null,
      };

      if (editingItem) {
        await axios.put(`/api/inventory/${editingItem.id}`, data);
        toast.success('Inventory item updated successfully');
      } else {
        await axios.post('/api/inventory', data);
        toast.success('Inventory item created successfully');
      }

      setOpen(false);
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      toast.error('Failed to save inventory item');
    }
  };

  const handleAdjustmentSubmit = async () => {
    try {
      await axios.patch(`/api/inventory/${selectedItem?.id}/adjust-quantity`, {
        adjustment: parseInt(adjustmentData.adjustment),
        reason: adjustmentData.reason,
      });

      toast.success('Quantity adjusted successfully');
      setAdjustmentOpen(false);
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to adjust quantity:', error);
      toast.error('Failed to adjust quantity');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        toast.success('Inventory item deleted successfully');
        fetchItems();
        fetchStats();
      } catch (error) {
        console.error('Failed to delete inventory item:', error);
        toast.error('Failed to delete inventory item');
      }
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { color: 'success' as const, icon: <CheckCircle />, label: 'Active' },
      low_stock: { color: 'warning' as const, icon: <Warning />, label: 'Low Stock' },
      out_of_stock: { color: 'error' as const, icon: <Error />, label: 'Out of Stock' },
      expired: { color: 'secondary' as const, icon: <Schedule />, label: 'Expired' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalValue = (item: InventoryItem) => {
    return item.quantity * (item.unit_price || 0);
  };

  const renderStatsCards = () => {
    if (!stats) return null;

    const statCards = [
      {
        title: 'Total Items',
        value: stats.total_items,
        icon: <InventoryIcon />,
        color: '#1976d2',
      },
      {
        title: 'Low Stock',
        value: stats.low_stock_items,
        icon: <Warning />,
        color: '#ed6c02',
      },
      {
        title: 'Out of Stock',
        value: stats.out_of_stock_items,
        icon: <Error />,
        color: '#d32f2f',
      },
      {
        title: 'Expired Items',
        value: stats.expired_items,
        icon: <Schedule />,
        color: '#757575',
      },
      {
        title: 'Total Value',
        value: formatCurrency(stats.total_value),
        icon: <TrendingUp />,
        color: '#2e7d32',
      },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: stat.color,
                      color: 'white',
                      borderRadius: '50%',
                      p: 1,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {stat.value}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderAlerts = () => {
    if (!stats) return null;

    const alerts = [];
    
    if (stats.low_stock_items > 0) {
      alerts.push(
        <Alert severity="warning" key="low-stock" sx={{ mb: 2 }}>
          {stats.low_stock_items} items are running low on stock
        </Alert>
      );
    }

    if (stats.out_of_stock_items > 0) {
      alerts.push(
        <Alert severity="error" key="out-of-stock" sx={{ mb: 2 }}>
          {stats.out_of_stock_items} items are out of stock
        </Alert>
      );
    }

    if (stats.expired_items > 0) {
      alerts.push(
        <Alert severity="info" key="expired" sx={{ mb: 2 }}>
          {stats.expired_items} items have expired
        </Alert>
      );
    }

    return alerts;
  };

  const renderInventoryTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Inventory Items</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search items..."
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setShowLowStock(!showLowStock);
                setShowExpired(false);
              }}
              color={showLowStock ? 'primary' : 'inherit'}
            >
              Low Stock
            </Button>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => {
                setShowExpired(!showExpired);
                setShowLowStock(false);
              }}
              color={showExpired ? 'primary' : 'inherit'}
            >
              Expired
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                fetchItems();
                fetchStats();
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="center">Min Qty</TableCell>
                <TableCell align="center">Unit Price</TableCell>
                <TableCell align="center">Total Value</TableCell>
                <TableCell align="center">Supplier</TableCell>
                <TableCell align="center">Expiry Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      color={item.quantity <= item.minimum_quantity ? 'error' : 'inherit'}
                      fontWeight={item.quantity <= item.minimum_quantity ? 'bold' : 'normal'}
                    >
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{item.minimum_quantity}</TableCell>
                  <TableCell align="center">
                    {item.unit_price ? formatCurrency(item.unit_price) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {formatCurrency(getTotalValue(item))}
                  </TableCell>
                  <TableCell align="center">
                    {item.supplier || '-'}
                  </TableCell>
                  <TableCell align="center">
                    {item.expiry_date ? formatDate(item.expiry_date) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {getStatusChip(item.status)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Adjust Quantity">
                        <IconButton
                          size="small"
                          onClick={() => handleAdjustQuantity(item)}
                        >
                          <TrendingUp />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item.id)}
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
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Inventory Management
      </Typography>

      {renderStatsCards()}
      {renderAlerts()}
      {renderInventoryTable()}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Item Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., ml, mg, pieces"
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Current Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Minimum Quantity"
                type="number"
                value={formData.minimum_quantity}
                onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quantity Adjustment Dialog */}
      <Dialog open={adjustmentOpen} onClose={() => setAdjustmentOpen(false)}>
        <DialogTitle>Adjust Quantity</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Item: {selectedItem?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Quantity: {selectedItem?.quantity} {selectedItem?.unit}
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Adjustment"
            type="number"
            value={adjustmentData.adjustment}
            onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustment: e.target.value })}
            helperText="Use positive numbers to add, negative to subtract"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Reason"
            value={adjustmentData.reason}
            onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustmentOpen(false)}>Cancel</Button>
          <Button onClick={handleAdjustmentSubmit} variant="contained">
            Adjust
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreate}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Inventory;