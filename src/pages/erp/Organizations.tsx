import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Search,
  Business,
  Visibility,
  Delete,
} from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import OrganizationPatientsView from '../../components/OrganizationPatientsView';

interface Organization {
  id: number;
  name: string;
  patients_count: number;
  created_at: string;
  updated_at: string;
}

const Organizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const itemsPerPage = 15;
  const [formData, setFormData] = useState({
    name: '',
  });
  const [viewingPatients, setViewingPatients] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    oldName: '',
    newName: '',
    affectedCount: 0,
    organizationId: 0
  });

  useEffect(() => {
    
    fetchOrganizations();
  }, [currentPage, search]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await axios.get(`/api/organizations?${params.toString()}`);
      setOrganizations(response.data.data);
      setTotalPages(response.data.last_page);
      setTotalOrganizations(response.data.total);
    } catch (error) {
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
    setCurrentPage(1);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      // The useEffect will trigger fetchOrganizations when search changes
    }, 500); // Wait 500ms after user stops typing
    
    setSearchTimeout(timeout);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrganization) {
        // First attempt to update organization
        const response = await axios.put(`/api/organizations/${editingOrganization.id}`, formData, {
          headers: {}
        });
        
        // Check if confirmation is required
        if (response.data.confirmation_required) {
          // Show confirmation dialog instead of browser alert
          setConfirmationDialog({
            open: true,
            oldName: response.data.old_name,
            newName: response.data.new_name,
            affectedCount: response.data.affected_patients_count,
            organizationId: editingOrganization.id
          });
          return; // Don't close the form yet
        } else {
          toast.success('Organization updated successfully');
        }
      } else {
        await axios.post('/api/organizations', formData, {
          headers: {}
        });
        toast.success('Organization created successfully');
      }
      
      setOpen(false);
      setEditingOrganization(null);
      resetForm();
      fetchOrganizations();
    } catch (error) {
      console.error('Failed to save organization:', error);
      if ((error as any).response?.data?.errors) {
        const validationErrors = Object.values((error as any).response.data.errors).flat();
        toast.error(`Failed to save: ${validationErrors.join(', ')}`);
      } else {
        toast.error('Failed to save organization');
      }
    }
  };

  const handleConfirmUpdate = async () => {
    try {
      // Send confirmed update
      await axios.put(`/api/organizations/${confirmationDialog.organizationId}`, {
        ...formData,
        confirmed: true
      }, {
        headers: {}
      });
      
      toast.success(`Organization updated successfully. ${confirmationDialog.affectedCount} patients updated.`);
      
      // Close both dialogs and reset form
      setConfirmationDialog({
        open: false,
        oldName: '',
        newName: '',
        affectedCount: 0,
        organizationId: 0
      });
      setOpen(false);
      setEditingOrganization(null);
      resetForm();
      fetchOrganizations();
    } catch (error) {
      console.error('Failed to confirm organization update:', error);
      toast.error('Failed to update organization');
    }
  };

  const handleCancelUpdate = () => {
    setConfirmationDialog({
      open: false,
      oldName: '',
      newName: '',
      affectedCount: 0,
      organizationId: 0
    });
    // Keep the form open so user can make changes
  };

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization);
    setFormData({
      name: organization.name,
    });
    setOpen(true);
  };

  const handleDelete = async (organization: Organization) => {
    if (window.confirm(`Are you sure you want to delete ${organization.name}?`)) {
      try {

        await axios.delete(`/api/organizations/${organization.id}`, {
          headers: {
          }
        });
        toast.success('Organization deleted successfully');
        fetchOrganizations();
      } catch (error) {
        console.error('Failed to delete organization:', error);
        toast.error('Failed to delete organization');
      }
    }
  };

  const handleViewPatients = (organization: Organization) => {
    setSelectedOrganization(organization);
    setViewingPatients(true);
  };

  const handleClosePatientsView = () => {
    setViewingPatients(false);
    setSelectedOrganization(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
  };

  const handleOpen = () => {
    resetForm();
    setEditingOrganization(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingOrganization(null);
    resetForm();
  };


  // If viewing patients, show the patients view component
  if (viewingPatients && selectedOrganization) {
    return (
      <OrganizationPatientsView 
        organization={selectedOrganization} 
        onClose={handleClosePatientsView}
      />
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Organizations Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ bgcolor: 'primary.main' }}
        >
          Add New Organization
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search organizations..."
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization Name</TableCell>
                  <TableCell>Patients Count</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Alert severity="info">No organizations found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((organization) => (
                    <TableRow key={organization.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business color="primary" />
                          {organization.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={organization.patients_count} color="primary">
                          <Chip 
                            label={`${organization.patients_count} patients`}
                            color={organization.patients_count > 0 ? 'primary' : 'default'}
                            size="small"
                          />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(organization.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Patients">
                            <IconButton
                              color="info"
                              onClick={() => handleViewPatients(organization)}
                              disabled={organization.patients_count === 0}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Organization">
                            <IconButton
                              color="primary"
                              onClick={() => handleEdit(organization)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Organization">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(organization)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalOrganizations)} of {totalOrganizations} organizations
              </Typography>
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

      {/* Add/Edit Organization Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOrganization ? 'Edit Organization' : 'Add New Organization'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Organization Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingOrganization ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmation Dialog for Organization Name Update */}
      <Dialog 
        open={confirmationDialog.open} 
        onClose={handleCancelUpdate}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'warning.light', 
          color: 'warning.contrastText',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          ⚠️ Confirm Organization Name Update
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              This action will affect patient records!
            </Typography>
          </Alert>
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" paragraph>
              Are you sure you want to update the organization name?
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 2,
              mb: 2,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300'
            }}>
              <Typography variant="h6" color="error">
                "{confirmationDialog.oldName}"
              </Typography>
              <Typography variant="h6" color="text.secondary">
                →
              </Typography>
              <Typography variant="h6" color="success.main">
                "{confirmationDialog.newName}"
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>{confirmationDialog.affectedCount}</strong> patient{confirmationDialog.affectedCount !== 1 ? 's' : ''} 
                {confirmationDialog.affectedCount !== 1 ? ' are' : ' is'} currently associated with this organization and 
                {confirmationDialog.affectedCount !== 1 ? ' will be' : ' will be'} automatically updated.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleCancelUpdate}
            variant="outlined"
            color="inherit"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmUpdate}
            variant="contained"
            color="warning"
            sx={{ minWidth: 100 }}
          >
            Update Organization
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Organizations;



