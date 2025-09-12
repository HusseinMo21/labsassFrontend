import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Pagination,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Science,
  Category,
  AttachMoney,
  Visibility,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface LabTest {
  id: number;
  name: string;
  category: string | { id: number; name: string; description: string; is_active: boolean; created_at: string; updated_at: string };
  price: number;
  description: string;
  normal_range: string;
  unit: string;
  created_at: string;
}

const LabTests: React.FC = () => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    normal_range: '',
    unit: '',
  });

  useEffect(() => {
    fetchTests();
  }, [currentPage, search]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tests?page=${currentPage}&search=${search}`);
      setTests(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      toast.error('Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await axios.put(`/api/tests/${editingTest.id}`, formData);
        toast.success('Lab test updated successfully');
      } else {
        await axios.post('/api/tests', formData);
        toast.success('Lab test created successfully');
      }
      setOpen(false);
      setEditingTest(null);
      resetForm();
      fetchTests();
    } catch (error) {
      toast.error('Failed to save lab test');
    }
  };

  const handleEdit = (test: LabTest) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      category: typeof test.category === 'string' ? test.category : test.category?.name || '',
      price: test.price.toString(),
      description: test.description,
      normal_range: test.normal_range,
      unit: test.unit,
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this lab test?')) {
      try {
        await axios.delete(`/api/tests/${id}`);
        toast.success('Lab test deleted successfully');
        fetchTests();
      } catch (error) {
        toast.error('Failed to delete lab test');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      normal_range: '',
      unit: '',
    });
  };

  const handleOpen = () => {
    resetForm();
    setEditingTest(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTest(null);
    resetForm();
  };

  const getCategoryChip = (category: string | { id: number; name: string; description: string; is_active: boolean; created_at: string; updated_at: string }) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'Blood Test': 'primary',
      'Urine Test': 'secondary',
      'Biochemistry': 'success',
      'Hematology': 'warning',
      'Microbiology': 'error',
      'Pathology': 'info',
    };
    
    // Handle both string and object categories
    const categoryName = typeof category === 'string' ? category : (category?.name || 'Unknown');
    
    return (
      <Chip
        label={categoryName}
        color={colors[categoryName] || 'default'}
        size="small"
        icon={<Category />}
      />
    );
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Lab Tests
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ bgcolor: 'primary.main' }}
        >
          Add Lab Test
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search lab tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Normal Range</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Alert severity="info">No lab tests found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Science color="primary" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {test.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {test.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{getCategoryChip(test.category)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AttachMoney fontSize="small" color="action" />
                          {test.price.toLocaleString()}
                        </Box>
                      </TableCell>
                      <TableCell>{test.normal_range}</TableCell>
                      <TableCell>{test.unit}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(test)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(test.id)}
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Test Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTest ? 'Edit Lab Test' : 'Add New Lab Test'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Test Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="Blood Test">Blood Test</MenuItem>
                    <MenuItem value="Urine Test">Urine Test</MenuItem>
                    <MenuItem value="Biochemistry">Biochemistry</MenuItem>
                    <MenuItem value="Hematology">Hematology</MenuItem>
                    <MenuItem value="Microbiology">Microbiology</MenuItem>
                    <MenuItem value="Pathology">Pathology</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Normal Range"
                  value={formData.normal_range}
                  onChange={(e) => setFormData({ ...formData, normal_range: e.target.value })}
                  placeholder="e.g., 3.5-5.0"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingTest ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LabTests;
