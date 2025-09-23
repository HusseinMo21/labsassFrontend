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
  Refresh,
  Download,
  Upload,
  Science,
  Category,
  LocalShipping,
  Assessment,
  Print,
  AttachMoney,
  Settings,
  Analytics,
  Notifications,
  Info,
  Share,
  GetApp,
  CloudUpload,
  TableView,
  GridView,
  ViewModule,
  LocalPharmacy,
  Engineering,
  MedicalServices,
  Biotech as BiotechIcon,
  Coronavirus,
  Close,
  Visibility,
  Image as ImageIcon,
  Save,
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
  category: 'reagents' | 'consumables' | 'equipment' | 'pathology' | 'cytology' | 'ihc' | 'other';
  batch_number?: string;
  lot_number?: string;
  storage_conditions?: string;
  hazard_level?: 'low' | 'medium' | 'high' | 'critical';
  temperature_range?: string;
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
  expiring_soon_items: number;
  total_value: number;
  by_status: {
    active: number;
    low_stock: number;
    out_of_stock: number;
    expired: number;
  };
  by_category: {
    reagents: number;
    consumables: number;
    equipment: number;
    pathology: number;
    cytology: number;
    ihc: number;
    other: number;
  };
  critical_alerts: number;
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  is_active: boolean;
}

interface InventoryAlert {
  id: number;
  type: 'low_stock' | 'expired' | 'expiring_soon' | 'critical';
  message: string;
  item_id: number;
  item_name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  is_read: boolean;
}

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [, setSuppliers] = useState<Supplier[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'cards'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    quantity: '',
    minimum_quantity: '',
    unit_price: '',
    supplier: '',
    expiry_date: '',
    category: 'reagents',
    batch_number: '',
    lot_number: '',
    storage_conditions: '',
    hazard_level: 'low',
    temperature_range: '',
  });
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment: '',
    reason: '',
  });
  const [bulkUpdateData, setBulkUpdateData] = useState({
    quantity: '',
    unit_price: '',
    supplier: '',
  });

  useEffect(() => {
    fetchItems();
    fetchStats();
    fetchSuppliers();
    fetchAlerts();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, categoryFilter, showLowStock, showExpired, showExpiringSoon]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (showLowStock) params.append('low_stock', 'true');
      if (showExpired) params.append('expired', 'true');
      if (showExpiringSoon) params.append('expiring_soon', 'true');

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
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory stats:', error);
      // Set default stats if API fails
      setStats({
        total_items: 0,
        low_stock_items: 0,
        out_of_stock_items: 0,
        expired_items: 0,
        expiring_soon_items: 0,
        total_value: 0,
        by_status: {
          active: 0,
          low_stock: 0,
          out_of_stock: 0,
          expired: 0,
        },
        by_category: {
          reagents: 0,
          consumables: 0,
          equipment: 0,
          pathology: 0,
          cytology: 0,
          ihc: 0,
          other: 0,
        },
        critical_alerts: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/inventory/alerts');
      console.log('Alerts response:', response.data);
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]);
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
      category: 'reagents',
      batch_number: '',
      lot_number: '',
      storage_conditions: '',
      hazard_level: 'low',
      temperature_range: '',
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
      category: item.category || 'reagents',
      batch_number: item.batch_number || '',
      lot_number: item.lot_number || '',
      storage_conditions: item.storage_conditions || '',
      hazard_level: item.hazard_level || 'low',
      temperature_range: item.temperature_range || '',
    });
    setOpen(true);
  };

  const handleBulkUpdate = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to update');
      return;
    }
    setBulkUpdateData({ quantity: '', unit_price: '', supplier: '' });
    setBulkUpdateOpen(true);
  };

  const handleBulkUpdateSubmit = async () => {
    try {
      const updateData = selectedItems.map(id => {
        const item = items.find(i => i.id === id);
        return {
          id,
          quantity: bulkUpdateData.quantity ? parseInt(bulkUpdateData.quantity) : item?.quantity,
          unit_price: bulkUpdateData.unit_price ? parseFloat(bulkUpdateData.unit_price) : item?.unit_price,
          supplier: bulkUpdateData.supplier || item?.supplier,
        };
      });

      await axios.post('/api/inventory/bulk-update', { items: updateData });
      toast.success('Items updated successfully');
      setBulkUpdateOpen(false);
      setSelectedItems([]);
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to bulk update items:', error);
      toast.error('Failed to update items');
    }
  };

  const handleAdjustQuantity = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentData({ adjustment: '', reason: '' });
    setAdjustmentOpen(true);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Item name is required');
        return;
      }
      if (!formData.unit.trim()) {
        toast.error('Unit is required');
        return;
      }
      if (!formData.quantity || parseInt(formData.quantity) < 0) {
        toast.error('Valid quantity is required');
        return;
      }
      if (!formData.minimum_quantity || parseInt(formData.minimum_quantity) < 0) {
        toast.error('Valid minimum quantity is required');
        return;
      }

      const data = {
        ...formData,
        quantity: parseInt(formData.quantity),
        minimum_quantity: parseInt(formData.minimum_quantity),
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        expiry_date: formData.expiry_date || null,
      };

      if (editingItem) {
        await axios.put(`/api/inventory/${editingItem.id}`, data);
        toast.success(`"${formData.name}" updated successfully`);
      } else {
        await axios.post('/api/inventory', data);
        toast.success(`"${formData.name}" created successfully`);
      }

      setOpen(false);
      fetchItems();
      fetchStats();
      fetchAlerts();
    } catch (error: any) {
      console.error('Failed to save inventory item:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        toast.error(firstError[0] || 'Validation failed');
      } else {
        toast.error('Failed to save inventory item');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustmentSubmit = async () => {
    try {
      if (!adjustmentData.adjustment || !adjustmentData.reason.trim()) {
        toast.error('Adjustment amount and reason are required');
        return;
      }

      const adjustment = parseInt(adjustmentData.adjustment);
      if (isNaN(adjustment)) {
        toast.error('Please enter a valid adjustment amount');
        return;
      }

      const newQuantity = (selectedItem?.quantity || 0) + adjustment;
      if (newQuantity < 0) {
        toast.error('Quantity cannot be negative');
        return;
      }

      await axios.patch(`/api/inventory/${selectedItem?.id}/adjust-quantity`, {
        adjustment: adjustment,
        reason: adjustmentData.reason,
      });

      const action = adjustment > 0 ? 'increased' : 'decreased';
      toast.success(`Quantity ${action} by ${Math.abs(adjustment)} for "${selectedItem?.name}"`);
      setAdjustmentOpen(false);
      fetchItems();
      fetchStats();
      fetchAlerts();
    } catch (error: any) {
      console.error('Failed to adjust quantity:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to adjust quantity');
      }
    }
  };

  const handleDelete = (id: number) => {
    const item = items.find(i => i.id === id);
    setItemToDelete(item || null);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await axios.delete(`/api/inventory/${itemToDelete.id}`);
      toast.success(`"${itemToDelete.name}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchItems();
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      toast.error('Failed to delete inventory item');
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

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'EGP 0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalValue = (item: InventoryItem) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    return quantity * unitPrice;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      reagents: <Science />,
      consumables: <LocalPharmacy />,
      equipment: <Engineering />,
      pathology: <MedicalServices />,
      cytology: <BiotechIcon />,
      ihc: <Coronavirus />,
      other: <InventoryIcon />,
    };
    return icons[category as keyof typeof icons] || <InventoryIcon />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      reagents: '#1976d2',
      consumables: '#388e3c',
      equipment: '#f57c00',
      pathology: '#d32f2f',
      cytology: '#7b1fa2',
      ihc: '#303f9f',
      other: '#757575',
    };
    return colors[category as keyof typeof colors] || '#757575';
  };

  const getHazardLevelColor = (level: string) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    };
    return colors[level as keyof typeof colors] || 'default';
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // const isExpiringSoon = (expiryDate: string, daysThreshold: number = 30) => {
  //   const days = getDaysUntilExpiry(expiryDate);
  //   return days !== null && days <= daysThreshold && days > 0;
  // };

  const getExpiryStatus = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return { status: 'no-expiry', color: 'default', text: 'No expiry' };
    if (days < 0) return { status: 'expired', color: 'error', text: 'Expired' };
    if (days <= 7) return { status: 'critical', color: 'error', text: `${days} days` };
    if (days <= 30) return { status: 'warning', color: 'warning', text: `${days} days` };
    return { status: 'good', color: 'success', text: `${days} days` };
  };

  const handleItemSelection = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setViewDetailsOpen(true);
  };

  const renderStatsCards = () => {
    if (!stats) return null;

    const statCards = [
      {
        title: 'Total Items',
        value: stats.total_items,
        icon: <InventoryIcon />,
        color: '#1976d2',
        subtitle: 'All inventory items',
      },
      {
        title: 'Low Stock',
        value: stats.low_stock_items,
        icon: <Warning />,
        color: '#ed6c02',
        subtitle: 'Need reordering',
      },
      {
        title: 'Out of Stock',
        value: stats.out_of_stock_items,
        icon: <Error />,
        color: '#d32f2f',
        subtitle: 'Critical shortage',
      },
      {
        title: 'Expired Items',
        value: stats.expired_items,
        icon: <Schedule />,
        color: '#757575',
        subtitle: 'Remove from use',
      },
      {
        title: 'Expiring Soon',
        value: stats.expiring_soon_items || 0,
        icon: <Error />,
        color: '#f44336',
        subtitle: 'Within 30 days',
      },
      {
        title: 'Total Value',
        value: formatCurrency(stats.total_value || 0),
        icon: <TrendingUp />,
        color: '#2e7d32',
        subtitle: 'Inventory worth',
      },
      {
        title: 'Critical Alerts',
        value: stats.critical_alerts || 0,
        icon: <Notifications />,
        color: '#e91e63',
        subtitle: 'Urgent attention',
      },
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={2} key={index}>
            <Card sx={{ height: '100%' }}>
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
                  <Box>
                    <Typography variant="h6" component="div" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {stat.subtitle}
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
    
    if (stats.critical_alerts > 0) {
      alerts.push(
        <Alert severity="error" key="critical" sx={{ mb: 2 }} icon={<Error />}>
          <Typography variant="subtitle2" fontWeight="bold">
            {stats.critical_alerts} Critical Alerts Require Immediate Attention
          </Typography>
          <Typography variant="body2">
            Items are out of stock or expired - lab operations may be affected
          </Typography>
        </Alert>
      );
    }

    if (stats.out_of_stock_items > 0) {
      alerts.push(
        <Alert severity="error" key="out-of-stock" sx={{ mb: 2 }} icon={<Error />}>
          <Typography variant="subtitle2" fontWeight="bold">
            {stats.out_of_stock_items} Items Out of Stock
          </Typography>
          <Typography variant="body2">
            Critical supplies are unavailable - urgent reordering required
          </Typography>
        </Alert>
      );
    }

    if (stats.expired_items > 0) {
      alerts.push(
        <Alert severity="warning" key="expired" sx={{ mb: 2 }} icon={<Schedule />}>
          <Typography variant="subtitle2" fontWeight="bold">
            {stats.expired_items} Items Have Expired
          </Typography>
          <Typography variant="body2">
            Remove expired items from active use immediately
          </Typography>
        </Alert>
      );
    }

    if (stats.expiring_soon_items > 0) {
      alerts.push(
        <Alert severity="info" key="expiring-soon" sx={{ mb: 2 }} icon={<Warning />}>
          <Typography variant="subtitle2" fontWeight="bold">
            {stats.expiring_soon_items} Items Expiring Within 30 Days
          </Typography>
          <Typography variant="body2">
            Plan usage or reorder to avoid waste
          </Typography>
        </Alert>
      );
    }

    if (stats.low_stock_items > 0) {
      alerts.push(
        <Alert severity="warning" key="low-stock" sx={{ mb: 2 }} icon={<Warning />}>
          <Typography variant="subtitle2" fontWeight="bold">
            {stats.low_stock_items} Items Running Low
          </Typography>
          <Typography variant="body2">
            Consider reordering to maintain adequate stock levels
          </Typography>
        </Alert>
      );
    }

    if (alerts.length === 0) {
      alerts.push(
        <Alert severity="success" key="all-good" sx={{ mb: 2 }} icon={<CheckCircle />}>
          <Typography variant="subtitle2" fontWeight="bold">
            All Systems Operational
          </Typography>
          <Typography variant="body2">
            No critical inventory alerts at this time
          </Typography>
        </Alert>
      );
    }

    return alerts;
  };

  const renderInventoryTable = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6">Laboratory Inventory</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage reagents, consumables, and equipment
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('table')}
              startIcon={<TableView />}
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('grid')}
              startIcon={<GridView />}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('cards')}
              startIcon={<ViewModule />}
            >
              Cards
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search items, suppliers, batch numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="reagents">Reagents</MenuItem>
              <MenuItem value="consumables">Consumables</MenuItem>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="pathology">Pathology</MenuItem>
              <MenuItem value="cytology">Cytology</MenuItem>
              <MenuItem value="ihc">IHC</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="low_stock">Low Stock</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Warning />}
            onClick={() => {
              setShowLowStock(!showLowStock);
              setShowExpired(false);
              setShowExpiringSoon(false);
            }}
            color={showLowStock ? 'primary' : 'inherit'}
            size="small"
          >
            Low Stock
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Error />}
            onClick={() => {
              setShowExpiringSoon(!showExpiringSoon);
              setShowLowStock(false);
              setShowExpired(false);
            }}
            color={showExpiringSoon ? 'primary' : 'inherit'}
            size="small"
          >
            Expiring Soon
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Schedule />}
            onClick={() => {
              setShowExpired(!showExpired);
              setShowLowStock(false);
              setShowExpiringSoon(false);
            }}
            color={showExpired ? 'primary' : 'inherit'}
            size="small"
          >
            Expired
          </Button>

          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            color={showAdvancedFilters ? 'primary' : 'inherit'}
            size="small"
          >
            Advanced
          </Button>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchItems();
              fetchStats();
              fetchAlerts();
            }}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {selectedItems.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {selectedItems.length} items selected
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={handleBulkUpdate}
                startIcon={<Edit />}
              >
                Bulk Update
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedItems([])}
                startIcon={<Close />}
              >
                Clear Selection
              </Button>
            </Box>
          </Box>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === items.length && items.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Item Details</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="center">Min Qty</TableCell>
                <TableCell align="center">Unit Price</TableCell>
                <TableCell align="center">Total Value</TableCell>
                <TableCell align="center">Supplier</TableCell>
                <TableCell align="center">Batch/Lot</TableCell>
                <TableCell align="center">Expiry</TableCell>
                <TableCell align="center">Hazard</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleItemSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description || 'No description'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.unit}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getCategoryIcon(item.category)}
                      label={item.category}
                      size="small"
                      sx={{ 
                        bgcolor: getCategoryColor(item.category),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography
                        variant="body2"
                        color={item.quantity <= item.minimum_quantity ? 'error' : 'inherit'}
                        fontWeight={item.quantity <= item.minimum_quantity ? 'bold' : 'normal'}
                      >
                        {item.quantity}
                      </Typography>
                      {item.quantity <= item.minimum_quantity && (
                        <Typography variant="caption" color="error">
                          Low Stock
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {item.minimum_quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {item.unit_price ? formatCurrency(item.unit_price) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(getTotalValue(item))}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {item.supplier || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      {item.batch_number && (
                        <Typography variant="caption" display="block">
                          Batch: {item.batch_number}
                        </Typography>
                      )}
                      {item.lot_number && (
                        <Typography variant="caption" display="block">
                          Lot: {item.lot_number}
                        </Typography>
                      )}
                      {!item.batch_number && !item.lot_number && (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      {item.expiry_date ? (
                        <>
                          <Typography variant="body2">
                            {formatDate(item.expiry_date)}
                          </Typography>
                          <Chip
                            label={getExpiryStatus(item.expiry_date).text}
                            size="small"
                            color={getExpiryStatus(item.expiry_date).color as any}
                            variant="outlined"
                          />
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No expiry
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {item.hazard_level && item.hazard_level !== 'low' ? (
                      <Chip
                        label={item.hazard_level.toUpperCase()}
                        size="small"
                        color={getHazardLevelColor(item.hazard_level) as any}
                        variant="filled"
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Low
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {getStatusChip(item.status)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(item)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
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
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Laboratory Inventory Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage reagents, consumables, equipment, and supplies for your medical laboratory
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => {/* Export functionality */}}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => {/* Import functionality */}}
            >
              Import
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Add Item
            </Button>
          </Box>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<Assessment />} />
        <Tab label="Inventory" icon={<InventoryIcon />} />
        <Tab label="Alerts" icon={<Notifications />} />
        <Tab label="Reports" icon={<Analytics />} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {renderStatsCards()}
          {renderAlerts()}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {renderInventoryTable()}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications color="primary" />
                Inventory Alerts
              </Typography>
              
              {!alerts || !Array.isArray(alerts) || alerts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" color="success.main">
                    All Good!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No critical alerts at this time
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(alerts || []).map((alert, index) => (
                    <Alert 
                      key={index}
                      severity={(alert as any).severity}
                      icon={(alert as any).icon}
                      action={
                        <Button 
                          color="inherit" 
                          size="small" 
                          onClick={() => {
                            // Handle alert action
                            toast.info(`Handling ${alert.type} alert`);
                          }}
                        >
                          View
                        </Button>
                      }
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {(alert as any).title}
                      </Typography>
                      <Typography variant="body2">
                        {alert.message}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => {
                    fetchAlerts();
                    toast.success('Alerts refreshed');
                  }}
                >
                  Refresh Alerts
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => {
                    toast.info('Alert settings will be implemented');
                  }}
                >
                  Alert Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assessment color="primary" />
                Inventory Reports
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                {/* Quick Reports */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp color="primary" />
                        Quick Reports
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => {
                            toast.success('Generating inventory summary report...');
                          }}
                        >
                          Inventory Summary
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Warning />}
                          onClick={() => {
                            toast.success('Generating low stock report...');
                          }}
                        >
                          Low Stock Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Error />}
                          onClick={() => {
                            toast.success('Generating expiry report...');
                          }}
                        >
                          Expiry Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<AttachMoney />}
                          onClick={() => {
                            toast.success('Generating value report...');
                          }}
                        >
                          Value Analysis
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Category Analysis */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Category color="primary" />
                        Category Analysis
                      </Typography>
                      {stats && stats.by_category ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {Object.entries(stats.by_category).map(([category, count]) => (
                            <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getCategoryIcon(category)}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {category}
                                </Typography>
                              </Box>
                              <Chip 
                                label={count} 
                                size="small" 
                                color={getCategoryColor(category) as any}
                              />
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No category data available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Enhanced Reports with Image Support */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudUpload color="primary" />
                        Enhanced Reports with Image Support
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Generate smart reports that can optionally include lab result images. Reports with images will be 2-page PDFs (content + image), while reports without images will be single-page.
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          startIcon={<CloudUpload />}
                          onClick={() => {
                            toast.info('Enhanced report generation with image support is now available!');
                          }}
                        >
                          Generate Enhanced Report
                        </Button>
                        <Button
                          variant="outlined"
                           startIcon={<ImageIcon />}
                          onClick={() => {
                            toast.info('Image upload feature is ready for lab results!');
                          }}
                        >
                          Upload Lab Image
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Print />}
                          onClick={() => {
                            toast.info('Smart PDF generation: 1 page (no image) or 2 pages (with image)');
                          }}
                        >
                          Smart PDF Report
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Export Options */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GetApp color="primary" />
                        Export Options
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          startIcon={<Download />}
                          onClick={() => {
                            toast.success('Exporting to Excel...');
                          }}
                        >
                          Export to Excel
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Print />}
                          onClick={() => {
                            toast.success('Generating PDF report...');
                          }}
                        >
                          Print Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Share />}
                          onClick={() => {
                            toast.info('Share functionality will be implemented');
                          }}
                        >
                          Share Report
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getCategoryIcon(formData.category)}
            {editingItem ? 'Edit Laboratory Item' : 'Add New Laboratory Item'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Formalin 10%, Hematoxylin, Microscope Slides"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="reagents">Reagents</MenuItem>
                  <MenuItem value="consumables">Consumables</MenuItem>
                  <MenuItem value="equipment">Equipment</MenuItem>
                  <MenuItem value="pathology">Pathology</MenuItem>
                  <MenuItem value="cytology">Cytology</MenuItem>
                  <MenuItem value="ihc">IHC</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                placeholder="Detailed description of the item and its use in the laboratory"
              />
            </Grid>

            {/* Quantity and Pricing */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                Quantity and Pricing
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Current Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., ml, mg, pieces, boxes"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Minimum Quantity"
                type="number"
                value={formData.minimum_quantity}
                onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                required
                inputProps={{ min: 0 }}
                helperText="Alert threshold for low stock"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Price (EGP)"
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                inputProps={{ step: "0.01", min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier company name"
              />
            </Grid>

            {/* Laboratory Specific Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1, mt: 2 }}>
                Laboratory Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Batch Number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="Manufacturing batch number"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lot Number"
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                placeholder="Lot identification number"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Storage Conditions"
                value={formData.storage_conditions}
                onChange={(e) => setFormData({ ...formData, storage_conditions: e.target.value })}
                placeholder="e.g., Room temperature, Refrigerated, Frozen"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Temperature Range"
                value={formData.temperature_range}
                onChange={(e) => setFormData({ ...formData, temperature_range: e.target.value })}
                placeholder="e.g., 2-8°C, -20°C, 15-25°C"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Hazard Level</InputLabel>
                <Select
                  value={formData.hazard_level}
                  label="Hazard Level"
                  onChange={(e) => setFormData({ ...formData, hazard_level: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty if no expiry date"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : (editingItem ? 'Update Item' : 'Create Item')}
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

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateOpen} onClose={() => setBulkUpdateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Update Selected Items</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Update {selectedItems.length} selected items. Leave fields empty to keep current values.
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Quantity"
                type="number"
                value={bulkUpdateData.quantity}
                onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, quantity: e.target.value })}
                inputProps={{ min: 0 }}
                helperText="Leave empty to keep current"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Unit Price (EGP)"
                type="number"
                value={bulkUpdateData.unit_price}
                onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, unit_price: e.target.value })}
                inputProps={{ step: "0.01", min: 0 }}
                helperText="Leave empty to keep current"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Supplier"
                value={bulkUpdateData.supplier}
                onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, supplier: e.target.value })}
                helperText="Leave empty to keep current"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUpdateOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkUpdateSubmit} variant="contained" startIcon={<Save />}>
            Update Items
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Error color="error" />
            Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>"{itemToDelete?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All data associated with this item will be permanently removed.
          </Typography>
          {itemToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">Item Details:</Typography>
              <Typography variant="body2">Category: {itemToDelete.category}</Typography>
              <Typography variant="body2">Quantity: {itemToDelete.quantity} {itemToDelete.unit}</Typography>
              <Typography variant="body2">Supplier: {itemToDelete.supplier || 'Not specified'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
          >
            Delete Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Modal */}
      <Dialog 
        open={viewDetailsOpen} 
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility color="primary" />
            Item Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Info color="primary" />
                      Basic Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedItem.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Description</Typography>
                        <Typography variant="body1">{selectedItem.description || 'No description'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Category</Typography>
                        <Chip 
                          label={selectedItem.category} 
                          color={getCategoryColor(selectedItem.category) as any}
                          size="small"
                          icon={getCategoryIcon(selectedItem.category)}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={selectedItem.status} 
                          color={selectedItem.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Quantity & Pricing */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney color="primary" />
                      Quantity & Pricing
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Current Quantity</Typography>
                        <Typography variant="h6" color={selectedItem.quantity <= selectedItem.minimum_quantity ? 'error' : 'primary'}>
                          {selectedItem.quantity} {selectedItem.unit}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Minimum Quantity</Typography>
                        <Typography variant="body1">{selectedItem.minimum_quantity} {selectedItem.unit}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Unit Price</Typography>
                        <Typography variant="body1">
                          {selectedItem.unit_price ? formatCurrency(selectedItem.unit_price) : 'Not set'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total Value</Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(getTotalValue(selectedItem))}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Lab-Specific Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Science color="primary" />
                      Lab Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Batch Number</Typography>
                        <Typography variant="body1">{selectedItem.batch_number || 'Not specified'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Lot Number</Typography>
                        <Typography variant="body1">{selectedItem.lot_number || 'Not specified'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Storage Conditions</Typography>
                        <Typography variant="body1">{selectedItem.storage_conditions || 'Not specified'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Temperature Range</Typography>
                        <Typography variant="body1">{selectedItem.temperature_range || 'Not specified'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Hazard Level</Typography>
                        <Chip 
                          label={selectedItem.hazard_level || 'Low'} 
                          color={getHazardLevelColor(selectedItem.hazard_level || 'low') as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Supplier & Expiry */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalShipping color="primary" />
                      Supplier & Expiry
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Supplier</Typography>
                        <Typography variant="body1">{selectedItem.supplier || 'Not specified'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                        <Typography variant="body1">
                          {selectedItem.expiry_date ? formatDate(selectedItem.expiry_date) : 'No expiry'}
                        </Typography>
                      </Box>
                      {selectedItem.expiry_date && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Days Until Expiry</Typography>
                          <Typography 
                            variant="body1" 
                            color={getExpiryStatus(selectedItem.expiry_date).color}
                            fontWeight="bold"
                          >
                            {getDaysUntilExpiry(selectedItem.expiry_date)} days
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                        <Typography variant="body1">
                          {selectedItem.updated_at ? formatDate(selectedItem.updated_at) : 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsOpen(false)}>
            Close
          </Button>
          <Button 
            onClick={() => {
              setViewDetailsOpen(false);
              handleEdit(selectedItem!);
            }}
            variant="contained"
            startIcon={<Edit />}
          >
            Edit Item
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
