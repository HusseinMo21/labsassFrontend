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
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Badge,
  Pagination,
} from '@mui/material';
import {
  CalendarToday,
  ExpandMore,
  Science,
  AttachMoney,
  CheckCircle,
  Schedule,
  Cancel,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
  Refresh,
  Print,
  QrCode,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Visit {
  id: number;
  visit_number: string;
  visit_date: string;
  visit_time: string;
  status: string;
  total_amount: number;
  final_amount: number;
  billing_status: string;
  patient: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  visitTests: Array<{
    id: number;
    status: string;
    result_value?: string;
    result_status?: string;
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
  }>;
  invoice?: {
    id: number;
    status: string;
  };
}

const Visits: React.FC = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisits, setTotalVisits] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch CSRF token when component loads
    const initializeCSRF = async () => {
      try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF cookie set for Visits');
      } catch (error) {
        console.error('Failed to set CSRF cookie:', error);
      }
    };
    
    initializeCSRF();
    fetchVisits();
  }, [page, statusFilter]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('page', page.toString());
      params.append('per_page', itemsPerPage.toString());
      
      const response = await axios.get(`/api/visits?${params.toString()}`);
      
      // Handle different response structures
      let visitsData = [];
      let totalCount = 0;
      let lastPage = 1;
      
      if (response.data.data) {
        // Paginated response
        visitsData = response.data.data;
        totalCount = response.data.total || 0;
        lastPage = response.data.last_page || 1;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        visitsData = response.data;
        totalCount = response.data.length;
        lastPage = 1;
      } else {
        visitsData = [];
        totalCount = 0;
        lastPage = 1;
      }
      
      // Ensure each visit has visitTests array (convert from visit_tests to visitTests)
      const normalizedVisits = visitsData.map((visit: any) => ({
        ...visit,
        visitTests: visit.visit_tests || visit.visitTests || [],
        patient: visit.patient || { id: 0, name: 'Unknown', phone: '', email: '' },
        billing_status: visit.billing_status || 'pending',
        total_amount: visit.total_amount || 0,
        final_amount: visit.final_amount || 0,
      }));
      
      setVisits(normalizedVisits);
      setTotalVisits(totalCount);
      setTotalPages(lastPage);
    } catch (err: any) {
      console.error('Error fetching visits:', err);
      setError('Failed to load visits');
      toast.error('Failed to load visits');
      setVisits([]); // Set empty array on error
      setTotalVisits(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  const handleStatusFilter = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(1); // Reset to first page when filtering
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      (visit.visit_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visit.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visit.patient?.phone || '').includes(searchTerm) ||
      (visit.patient?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVisits = filteredVisits.slice(startIndex, endIndex);
  const totalFilteredPages = Math.ceil(filteredVisits.length / itemsPerPage);

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending', icon: <Schedule /> },
      registered: { color: 'info', label: 'Registered', icon: <Schedule /> },
      in_progress: { color: 'info', label: 'In Progress', icon: <Schedule /> },
      completed: { color: 'success', label: 'Completed', icon: <CheckCircle /> },
      cancelled: { color: 'error', label: 'Cancelled', icon: <Cancel /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      color: 'default', 
      label: status, 
      icon: <Schedule /> 
    };
    return <Chip label={config.label} color={config.color as any} size="small" icon={config.icon} />;
  };

  const getBillingStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending Payment' },
      partial: { color: 'info', label: 'Partial Payment' },
      paid: { color: 'success', label: 'Paid in Full' },
      overdue: { color: 'error', label: 'Overdue' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      color: 'default', 
      label: status 
    };
    return <Chip label={config.label} color={config.color as any} size="small" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, visitId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedVisitId(visitId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVisitId(null);
  };

  const handleViewDetails = (visit: Visit) => {
    setSelectedVisit(visit);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleCompleteVisit = async (visitId: number) => {
    try {
      console.log('Completing visit:', visitId);
      
      // Manually fetch CSRF token before the request
      console.log('Fetching CSRF token for visit completion...');
      await axios.get('/sanctum/csrf-cookie');
      const csrfResponse = await axios.get('/api/auth/csrf-token');
      const csrfToken = csrfResponse.data.csrf_token;
      console.log('CSRF token received:', csrfToken);
      
      // Make the PUT request with CSRF token
      await axios.put(`/api/visits/${visitId}/complete`, {}, {
        headers: {
          'X-CSRF-TOKEN': csrfToken
        }
      });
      
      toast.success('Visit marked as completed');
      fetchVisits();
    } catch (err: any) {
      console.error('Visit completion error:', err);
      toast.error('Failed to complete visit');
    }
    handleMenuClose();
  };

  const handleDeleteVisit = async (visitId: number) => {
    if (window.confirm('Are you sure you want to delete this visit?')) {
      try {
        console.log('Deleting visit:', visitId);
        
        // Manually fetch CSRF token before the request
        console.log('Fetching CSRF token for visit deletion...');
        await axios.get('/sanctum/csrf-cookie');
        const csrfResponse = await axios.get('/api/auth/csrf-token');
        const csrfToken = csrfResponse.data.csrf_token;
        console.log('CSRF token received:', csrfToken);
        
        // Make the DELETE request with CSRF token
        await axios.delete(`/api/visits/${visitId}`, {
          headers: {
            'X-CSRF-TOKEN': csrfToken
          }
        });
        
        toast.success('Visit deleted successfully');
        fetchVisits();
      } catch (err: any) {
        console.error('Visit deletion error:', err);
        toast.error('Failed to delete visit');
      }
    }
    handleMenuClose();
  };

  const getTestStatusCounts = (visitTests: Visit['visitTests']) => {
    const counts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    
    // Add null/undefined check
    if (!visitTests || !Array.isArray(visitTests)) {
      return counts;
    }
    
    visitTests.forEach(test => {
      if (test && test.status) {
        counts[test.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Visits Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage patient visits and test results
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchVisits}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => window.location.href = '/check-in'}
          >
            New Visit
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Search visits"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by visit number, patient name, phone, or email"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchTerm && (
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      sx={{ mr: 1 }}
                    >
                      <Cancel />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={handleStatusFilter}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="registered">Registered</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={fetchVisits}
                >
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Visits
                  </Typography>
                  <Typography variant="h4">
                    {totalVisits}
                  </Typography>
                </Box>
                <CalendarToday sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4">
                    {visits.filter(v => v.status === 'pending' || v.status === 'registered').length}
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4">
                    {visits.filter(v => v.status === 'completed').length}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(visits.reduce((sum, v) => {
                      const amount = parseFloat(v.final_amount) || 0;
                      return sum + amount;
                    }, 0))}
      </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Visits Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Visit #</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Tests</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Billing</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedVisits.map((visit) => {
                  const testCounts = getTestStatusCounts(visit.visitTests);
                  return (
                    <TableRow key={visit.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {visit.visit_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {visit.patient?.name || 'Unknown Patient'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {visit.patient?.phone || 'No phone'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(visit.visit_date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {visit.visit_time}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {testCounts.completed > 0 && (
                            <Tooltip title={`${testCounts.completed} completed`}>
                              <Badge badgeContent={testCounts.completed} color="success">
                                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                              </Badge>
                            </Tooltip>
                          )}
                          {testCounts.pending > 0 && (
                            <Tooltip title={`${testCounts.pending} pending`}>
                              <Badge badgeContent={testCounts.pending} color="warning">
                                <Schedule sx={{ fontSize: 16, color: 'warning.main' }} />
                              </Badge>
                            </Tooltip>
                          )}
                          {testCounts.in_progress > 0 && (
                            <Tooltip title={`${testCounts.in_progress} in progress`}>
                              <Badge badgeContent={testCounts.in_progress} color="info">
                                <Science sx={{ fontSize: 16, color: 'info.main' }} />
                              </Badge>
                            </Tooltip>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {visit.visitTests?.length || 0} test{(visit.visitTests?.length || 0) !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(visit.status)}
                      </TableCell>
                      <TableCell>
                        {getBillingStatusChip(visit.billing_status)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(parseFloat(visit.final_amount) || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, visit.id)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {paginatedVisits.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No visits found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search criteria'
                  : 'Create your first visit to get started'
                }
              </Typography>
            </Box>
          )}
          
          {/* Pagination */}
          {totalFilteredPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredVisits.length)} of {filteredVisits.length} visits
              </Typography>
              <Pagination
                count={totalFilteredPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedVisitId && handleViewDetails(visits.find(v => v.id === selectedVisitId)!)}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedVisitId && handleCompleteVisit(selectedVisitId)}>
          <CheckCircle sx={{ mr: 1 }} />
          Mark Complete
        </MenuItem>
        <MenuItem onClick={() => selectedVisitId && window.open(`/visits/${selectedVisitId}/report`, '_blank')}>
          <Print sx={{ mr: 1 }} />
          Print Report
        </MenuItem>
        <MenuItem onClick={() => selectedVisitId && handleDeleteVisit(selectedVisitId)}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Visit Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Visit Details - {selectedVisit?.visit_number}
        </DialogTitle>
        <DialogContent>
          {selectedVisit && (
            <Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Patient Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Name" 
                        secondary={selectedVisit.patient?.name || 'Unknown Patient'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Phone" 
                        secondary={selectedVisit.patient?.phone || 'No phone'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Email" 
                        secondary={selectedVisit.patient?.email || 'No email'} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Visit Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Visit Number" 
                        secondary={selectedVisit.visit_number} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Date" 
                        secondary={formatDate(selectedVisit.visit_date)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Time" 
                        secondary={selectedVisit.visit_time} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Status" 
                        secondary={getStatusChip(selectedVisit.status)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Total Amount" 
                        secondary={formatCurrency(parseFloat(selectedVisit.final_amount) || 0)} 
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Tests ({selectedVisit.visitTests?.length || 0})
              </Typography>
              {(selectedVisit.visitTests || []).map((test, index) => (
                <Accordion key={test.id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Science />
                      <Typography variant="body1" sx={{ flexGrow: 1 }}>
                        {(test.labTest || test.lab_test)?.name || 'Unknown Test'}
                      </Typography>
                      {getStatusChip(test.status || 'pending')}
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency((test.labTest || test.lab_test)?.price || 0)}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Status: {test.status || 'pending'}
                        </Typography>
                        {test.result_value && (
                          <Typography variant="body2" color="text.secondary">
                            Result: {test.result_value}
                          </Typography>
                        )}
                        {test.result_status && (
                          <Typography variant="body2" color="text.secondary">
                            Result Status: {test.result_status}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedVisit) {
                window.open(`/visits/${selectedVisit.id}/report`, '_blank');
              }
            }}
          >
            Print Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Visits;


