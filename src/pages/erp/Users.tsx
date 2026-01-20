// @ts-nocheck
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Avatar,
  Tooltip,
} from '@mui/material';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Person,
  Email,
  AdminPanelSettings,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  display_name?: string;
  real_name?: string;
  patient_id?: number;
  patient?: {
    id: number;
    name: string;
  };
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [patientPage, setPatientPage] = useState(1);
  const [patientTotalPages, setPatientTotalPages] = useState(1);
  const [patientTotal, setPatientTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleteErrorDialog, setDeleteErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    relatedData: string[];
  }>({
    open: false,
    title: '',
    message: '',
    relatedData: []
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    password: '',
    is_active: true,
  });

  // All roles for display purposes
  const allRoles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'lab_technician', label: 'Lab Technician' },
    { value: 'staff', label: 'Staff' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'patient', label: 'Patient' },
  ];

  // Roles that admin can assign when creating/editing users (only staff and doctor)
  const assignableRoles = [
    { value: 'staff', label: 'Staff' },
    { value: 'doctor', label: 'Doctor' },
  ];

  // Use assignableRoles for the form, allRoles for display
  const roles = assignableRoles;

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'error',
      doctor: 'primary',
      lab_technician: 'secondary',
      staff: 'default',
      accountant: 'warning',
      patient: 'info',
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role: string) => {
    const roleObj = allRoles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch non-patient users (exclude patients)
      const response = await axios.get('/api/users', {
        params: {
          page,
          search: searchTerm,
          exclude_role: 'patient', // Exclude patients from main users list
        },
      });
      const usersData = response.data.data || [];
      // Filter out patients from the response
      const nonPatientUsers = usersData.filter((user: User) => user.role !== 'patient');
      setUsers(nonPatientUsers);
      setTotalPages(response.data.last_page || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
      // Mock data for development
      setUsers([
        {
          id: 1,
          name: 'Dr. Ahmed Yasser',
          email: 'ahmed@lab.com',
          role: 'admin',
          created_at: '2024-01-15',
          updated_at: '2024-01-15',
          is_active: true,
        },
        {
          id: 2,
          name: 'Dr. Sarah Mohamed',
          email: 'sarah@lab.com',
          role: 'doctor',
          created_at: '2024-01-16',
          updated_at: '2024-01-16',
          is_active: true,
        },
        {
          id: 3,
          name: 'Lab Tech Ali',
          email: 'ali@lab.com',
          role: 'lab_technician',
          created_at: '2024-01-17',
          updated_at: '2024-01-17',
          is_active: true,
        },
        {
          id: 4,
          name: 'Receptionist Fatma',
          email: 'fatma@lab.com',
          role: 'staff',
          created_at: '2024-01-18',
          updated_at: '2024-01-18',
          is_active: true,
        },
      ]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await axios.get('/api/users', {
        params: {
          role: 'patient',
          page: patientPage,
          per_page: 15, // 15 patients per page
          search: searchTerm,
        },
      });
      const patientsData = response.data.data || [];
      setPatients(patientsData);
      setPatientTotalPages(response.data.last_page || 1);
      setPatientTotal(response.data.total || 0);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setPatients([]);
      setPatientTotalPages(1);
      setPatientTotal(0);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [patientPage, searchTerm]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
    setPatientPage(1); // Reset patient page when search changes
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      // Keep the original role, especially for patients who should always remain patients
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role, // Keep original role (important for patients)
        password: '',
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'staff',
        password: '',
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = (_event?: {}, reason?: string) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'staff',
      password: '',
      is_active: true,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // For patients, always preserve their role - don't allow role changes
        const submitData = { ...formData };
        if (editingUser.role === 'patient') {
          submitData.role = 'patient'; // Force patient role
        }
        await axios.put(`/api/users/${editingUser.id}`, submitData);
        toast.success('User updated successfully');
      } else {
        await axios.post('/api/users', formData);
        toast.success('User created successfully');
      }
      handleCloseDialog();
      fetchUsers();
      fetchPatients(); // Also refresh patients list
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error('Failed to save user');
    }
  };

  const handleDelete = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    const userName = user?.display_name || user?.name || 'this user';
    const userRole = user?.role || 'unknown role';
    
    if (window.confirm(`Are you sure you want to delete ${userName} (${userRole})?\n\nThis action cannot be undone.`)) {
      try {
        await axios.delete(`/api/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
        fetchPatients(); // Also refresh patients list
      } catch (err: any) {
        console.error('Error deleting user:', err);
        
        // Handle 422 response (deletion prevented due to related data)
        if (err.response?.status === 422) {
          console.log('422 Response data:', err.response.data);
          const message = err.response.data?.message || 'Cannot delete user';
          const relatedData = err.response.data?.related_data || [];
          
          console.log('Setting delete error dialog with:', { message, relatedData });
          
          setDeleteErrorDialog({
            open: true,
            title: 'Cannot Delete User',
            message: message,
            relatedData: relatedData
          });
          
          // Fallback toast in case dialog doesn't show
          setTimeout(() => {
            toast.warning(message, { autoClose: 5000 });
          }, 100);
        } else {
          // Handle other errors (500, network issues, etc.)
          toast.error('Failed to delete user');
        }
      }
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await axios.put(`/api/users/${userId}`, {
        is_active: !currentStatus,
      });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
      fetchPatients(); // Also refresh patients list
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error('Failed to update user status');
    }
  };

  // Filter non-patient users (patients are handled separately)
  const filteredUsers = users.filter(user => {
    if (user.role === 'patient') return false; // Exclude patients from main list
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  // Patients are already filtered by backend pagination, no need to filter again
  const filteredPatients = patients;

  // Group users by role (normalize role to lowercase to handle any case differences)
  const usersByRole = filteredUsers.reduce((acc, user) => {
    // Get the original role value
    const originalRole = user.role || '';
    
    // Normalize role: convert to string, lowercase, trim, and remove extra spaces
    const roleValue = String(originalRole).toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Map ALL variations to standard role names
    let normalizedRole = roleValue;
    
    // Staff variations - check if it contains "staff" anywhere (case insensitive)
    if (roleValue === 'staff' || roleValue === 'staff user' || roleValue.includes('staff')) {
      normalizedRole = 'staff';
    }
    // Lab technician variations
    else if (roleValue.includes('lab') || roleValue.includes('technician') || roleValue.includes('tech')) {
      normalizedRole = 'lab_technician';
    }
    // Accountant variations
    else if (roleValue.includes('account')) {
      normalizedRole = 'accountant';
    }
    // Admin variations
    else if (roleValue.includes('admin')) {
      normalizedRole = 'admin';
    }
    // Doctor variations
    else if (roleValue.includes('doctor') || roleValue.includes('dr')) {
      normalizedRole = 'doctor';
    }
    // Patient variations
    else if (roleValue.includes('patient')) {
      normalizedRole = 'patient';
    }
    // If no match, use the normalized value as-is
    else {
      normalizedRole = roleValue || 'unknown';
    }
    
    if (!acc[normalizedRole]) {
      acc[normalizedRole] = [];
    }
    acc[normalizedRole].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  // Define role order and labels
  const roleOrder = ['admin', 'doctor', 'lab_technician', 'staff', 'accountant', 'patient'];
  const roleLabels: { [key: string]: string } = {
    admin: 'Administrators',
    doctor: 'Doctors',
    lab_technician: 'Lab Technicians',
    staff: 'Staff',
    accountant: 'Accountants',
    patient: 'Patients',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Get all unique normalized roles from usersByRole, sorted by roleOrder */}
              {(() => {
                // Get all roles that exist in usersByRole
                const existingRoles = Object.keys(usersByRole).filter(role => usersByRole[role] && usersByRole[role].length > 0);
                
                // Sort them according to roleOrder
                const sortedRoles = existingRoles.sort((a, b) => {
                  const aIndex = roleOrder.findIndex(r => {
                    const normalized = r.toLowerCase().trim();
                    if (normalized.includes('staff') && a === 'staff') return true;
                    if (normalized.includes('lab') && a === 'lab_technician') return true;
                    if (normalized.includes('account') && a === 'accountant') return true;
                    if (normalized.includes('admin') && a === 'admin') return true;
                    if (normalized.includes('doctor') && a === 'doctor') return true;
                    if (normalized.includes('patient') && a === 'patient') return true;
                    return normalized === a;
                  });
                  const bIndex = roleOrder.findIndex(r => {
                    const normalized = r.toLowerCase().trim();
                    if (normalized.includes('staff') && b === 'staff') return true;
                    if (normalized.includes('lab') && b === 'lab_technician') return true;
                    if (normalized.includes('account') && b === 'accountant') return true;
                    if (normalized.includes('admin') && b === 'admin') return true;
                    if (normalized.includes('doctor') && b === 'doctor') return true;
                    if (normalized.includes('patient') && b === 'patient') return true;
                    return normalized === b;
                  });
                  return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                });
                
                // Filter out 'patient' role from main list (patients are shown separately)
                const nonPatientRoles = sortedRoles.filter(role => role !== 'patient');
                
                return nonPatientRoles.map((normalizedRole) => {
                  const roleUsers = usersByRole[normalizedRole] || [];
                  // Find the original role label from roleOrder
                  const originalRole = roleOrder.find(r => {
                    const rKey = r.toLowerCase().trim();
                    if (rKey.includes('staff') && normalizedRole === 'staff') return true;
                    if ((rKey.includes('lab') || rKey.includes('technician') || rKey.includes('tech')) && normalizedRole === 'lab_technician') return true;
                    if (rKey.includes('account') && normalizedRole === 'accountant') return true;
                    if (rKey.includes('admin') && normalizedRole === 'admin') return true;
                    if ((rKey.includes('doctor') || rKey.includes('dr')) && normalizedRole === 'doctor') return true;
                    if (rKey.includes('patient') && normalizedRole === 'patient') return true;
                    return rKey === normalizedRole;
                  }) || normalizedRole;

                return (
                  <Box key={normalizedRole} sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        label={roleLabels[originalRole] || originalRole.charAt(0).toUpperCase() + originalRole.slice(1)}
                        color={getRoleColor(normalizedRole) as any}
                        size="medium"
                        sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2.5 }}
                        icon={normalizedRole === 'admin' ? <AdminPanelSettings /> : <Person />}
                      />
                      <Typography variant="body2" color="text.secondary">
                        ({roleUsers.length} {roleUsers.length === 1 ? 'user' : 'users'})
                      </Typography>
                    </Box>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell>User</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {roleUsers.map((user) => (
                            <TableRow key={user.id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ bgcolor: `${getRoleColor(user.role)}.main` }}>
                                    <Person />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                      {user.display_name || user.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ID: {user.id}
                                      {user.role === 'patient' && user.patient_id && (
                                        <span> • Patient ID: {user.patient_id}</span>
                                      )}
                                      {user.role === 'patient' && user.real_name && (
                                        <span> • Real Name: {user.real_name}</span>
                                      )}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  {user.email}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={user.is_active ? 'Active' : 'Inactive'}
                                  color={user.is_active ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                  <Tooltip title="Edit User">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenDialog(user)}
                                      color="primary"
                                    >
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                                      color={user.is_active ? 'warning' : 'success'}
                                    >
                                      {user.is_active ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete User">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDelete(user.id)}
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
                  </Box>
                );
                });
              })()}

              {/* Patients Section with Separate Pagination */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={roleLabels['patient'] || 'Patients'}
                    color={getRoleColor('patient') as any}
                    size="medium"
                    sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2.5 }}
                    icon={<Person />}
                  />
                  <Typography variant="body2" color="text.secondary">
                    ({patientTotal} {patientTotal === 1 ? 'user' : 'users'})
                  </Typography>
                </Box>
                {loadingPatients ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell>User</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredPatients.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                <Typography variant="body1" color="text.secondary">
                                  No patients found
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredPatients.map((user) => (
                              <TableRow key={user.id} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: `${getRoleColor(user.role)}.main` }}>
                                      <Person />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {user.display_name || user.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        ID: {user.id}
                                        {user.patient_id && (
                                          <span> • Patient ID: {user.patient_id}</span>
                                        )}
                                        {user.real_name && (
                                          <span> • Real Name: {user.real_name}</span>
                                        )}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    {user.email}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={user.is_active ? 'Active' : 'Inactive'}
                                    color={user.is_active ? 'success' : 'default'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(user.created_at).toLocaleDateString()}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Tooltip title="Edit User">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenDialog(user)}
                                        color="primary"
                                      >
                                        <Edit />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          handleToggleStatus(user.id, user.is_active);
                                        }}
                                        color={user.is_active ? 'warning' : 'success'}
                                      >
                                        {user.is_active ? <VisibilityOff /> : <Visibility />}
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete User">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          handleDelete(user.id);
                                        }}
                                        color="error"
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
                    {/* Patients Pagination */}
                    {patientTotalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Pagination
                          count={patientTotalPages}
                          page={patientPage}
                          onChange={(_, newPage) => setPatientPage(newPage)}
                          color="primary"
                          size="large"
                        />
                      </Box>
                    )}
                  </>
                )}
              </Box>
              
              {Object.keys(usersByRole).filter(role => role !== 'patient').length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No users found
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      {openDialog && (
        <Dialog 
          open={true}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  {editingUser && editingUser.role === 'patient' ? (
                    // For patients, show read-only field - patients cannot change their role
                    <TextField
                      fullWidth
                      label="Role"
                      value={getRoleLabel('patient')}
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Patient role cannot be changed"
                    />
                  ) : (
                    // For other users, show dropdown with assignable roles
                    <Box>
                      <Select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        label="Role"
                      >
                        {/* Show only staff and doctor options that can be assigned */}
                        {Array.isArray(assignableRoles) ? assignableRoles.map((role) => (
                          <MenuItem key={role.value} value={role.value}>
                            {role.label}
                          </MenuItem>
                        )) : null}
                      </Select>
                      {editingUser && editingUser.role && !assignableRoles.find(r => r.value === editingUser.role) && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Current role: {getRoleLabel(editingUser.role)}. You can only assign Staff or Doctor roles.
                        </Typography>
                      )}
                    </Box>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                    label="Status"
                  >
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              setEditingUser(null);
              setFormData({
                name: '',
                email: '',
                role: 'staff',
                password: '',
                is_active: true,
              });
            }}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Error Dialog */}
      {console.log('Rendering dialog with state:', deleteErrorDialog)}
      <Dialog 
        open={deleteErrorDialog.open} 
        onClose={() => setDeleteErrorDialog({ ...deleteErrorDialog, open: false })}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete color="error" />
            {deleteErrorDialog.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {deleteErrorDialog.message}
            </Typography>
            {deleteErrorDialog.relatedData.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Related data found:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {deleteErrorDialog.relatedData.map((item, index) => (
                    <Typography key={index} component="li" variant="body2">
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Consider deactivating the user instead of deleting them to preserve data integrity.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteErrorDialog({ ...deleteErrorDialog, open: false })}
            variant="contained"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;