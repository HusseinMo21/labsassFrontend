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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material';
import {
  Delete,
  Search,
  Person,
  Phone,
  WhatsApp,
  Assignment,
  Science,
  CheckCircle,
  Pending,
  FilterList,
  Clear,
  Print,
} from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';

interface Patient {
  id: number;
  name: string;
  gender: string;
  birth_date?: string;
  age?: number;
  phone: string;
  whatsapp_number?: string;
  address: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_history?: string;
  allergies?: string;
  // Original database fields
  entry?: string;
  deli?: string;
  time?: string;
  tsample?: string;
  nsample?: string;
  isample?: string;
  paid?: number;
  had?: string;
  sender?: string; // Doctor name
  pleft?: number;
  total?: number;
  lab?: string;
  entryday?: string;
  deliday?: string;
  type?: string;
  doctor_id?: number;
  organization_id?: number;
  doctor?: any;
  organization?: any;
  doctor_name?: string; // Computed doctor name from sender field
  // Delivery tracking fields
  report_delivered?: boolean;
  report_delivery_date?: string;
  report_delivery_notes?: string;
  report_delivered_by?: string;
  wax_blocks_delivered?: boolean;
  wax_blocks_delivery_date?: string;
  wax_blocks_delivery_notes?: string;
  wax_blocks_delivered_by?: string;
  attendance_dates?: string[];
  delivery_dates?: string[];
}

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{username: string, password: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [filters, setFilters] = useState({
    lab_no: '',
    attendance_date: '',
    delivery_date: '',
  });
  const [labNoInput, setLabNoInput] = useState('');
  const [labNoTimeout, setLabNoTimeout] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Delivery tracking modals
  const [reportDeliveryModalOpen, setReportDeliveryModalOpen] = useState(false);
  const [waxBlocksModalOpen, setWaxBlocksModalOpen] = useState(false);
  const [selectedPatientForDelivery, setSelectedPatientForDelivery] = useState<Patient | null>(null);
  const [deliveryType, setDeliveryType] = useState<'report' | 'wax_blocks'>('report');
  const [formData, setFormData] = useState({
    name: '',
    doctor: '',
    gender: 'male',
    age: '',
    address_required: '',
    address_optional: '',
    organization: '',
    status: '',
    phone: '',
    whatsapp_number: '',
    sender: '', // Doctor name
    // Keep existing fields for compatibility
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_history: '',
    allergies: '',
  });

  const [deliveryFormData, setDeliveryFormData] = useState({
    delivered: false,
    delivery_date: '',
    notes: '',
    delivered_by: '',
  });

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters.lab_no, filters.attendance_date, filters.delivery_date]);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, search, filters.lab_no, filters.attendance_date, filters.delivery_date]);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Show searching indicator if user is typing
    if (searchInput !== search) {
      setIsSearching(true);
    }
    
    // If search input is empty, search immediately
    if (searchInput === '') {
      setSearch('');
      setCurrentPage(1);
      setIsSearching(false);
      return;
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1); // Reset to first page when searching
      setIsSearching(false);
    }, 1500); // Wait 1.5 seconds after user stops typing
    
    setSearchTimeout(timeout);
    
    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchInput, search]);

  // Debounced Lab No filter effect
  useEffect(() => {
    // Clear existing timeout
    if (labNoTimeout) {
      clearTimeout(labNoTimeout);
    }
    
    // If lab no input is empty, update filter immediately
    if (labNoInput === '') {
      setFilters(prev => ({ ...prev, lab_no: '' }));
      setCurrentPage(1);
      return;
    }
    
    // Set new timeout for debounced filter
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, lab_no: labNoInput }));
      setCurrentPage(1); // Reset to first page when filtering
    }, 1500); // Wait 1.5 seconds after user stops typing
    
    setLabNoTimeout(timeout);
    
    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [labNoInput]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      if (labNoTimeout) {
        clearTimeout(labNoTimeout);
      }
    };
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        search: search,
        _t: Date.now(),
      };
      
      if (filters.lab_no.trim()) {
        params.lab_no = filters.lab_no.trim();
      }
      if (filters.attendance_date) {
        params.attendance_date = filters.attendance_date;
      }
      if (filters.delivery_date) {
        params.delivery_date = filters.delivery_date;
      }
      
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(`/api/patients?${queryString}`);
      console.log('Fetched patients data:', response.data.data);
      setPatients(response.data.data);
      setTotalPages(response.data.last_page || 1);
      setTotalPatients(response.data.total || 0);
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Map Arabic form fields to backend expected fields
      const patientData = {
        name: formData.name || null,
        gender: formData.gender || null,
        birth_date: null, // We only use age, not birth_date
        phone: formData.phone || null,
        whatsapp_number: formData.whatsapp_number || null,
        address: formData.address_required || formData.address || null,
        emergency_contact: null,
        emergency_phone: null,
        medical_history: formData.doctor || formData.organization || formData.status ? `Doctor: ${formData.doctor || ''}, Organization: ${formData.organization || ''}, Status: ${formData.status || ''}` : null,
        allergies: null,
        // Additional fields for the new Arabic form
        doctor: formData.doctor || null,
        age: formData.age && formData.age.trim() !== '' ? parseInt(formData.age, 10) : null,
        address_required: formData.address_required || null,
        address_optional: formData.address_optional || null,
        organization: formData.organization || null,
        status: formData.status || null,
        sender: formData.sender || null, // Doctor name from sender field
      };

      console.log('Submitting patient data:', patientData);
      console.log('Form data age:', formData.age);
      console.log('Parsed age:', formData.age ? parseInt(formData.age, 10) : null);


      if (editingPatient) {
        await axios.put(`/api/patients/${editingPatient.id}`, patientData, {
          headers: {
          }
        });
        toast.success('تم تحديث بيانات المريض بنجاح');
        setOpen(false);
        setEditingPatient(null);
        resetForm();
        fetchPatients();
      } else {
        const response = await axios.post('/api/patients', patientData, {
          headers: {
          }
        });
        toast.success('تم إنشاء المريض بنجاح');
        
        // Show credentials modal for new patients
        if (response.data.user_credentials) {
          setGeneratedCredentials(response.data.user_credentials);
          setCredentialsModalOpen(true);
        }
        
        setOpen(false);
        setEditingPatient(null);
        resetForm();
        fetchPatients();
      }
    } catch (error) {
      console.error('Failed to save patient:', error);
      if ((error as any).response?.data?.errors) {
        const validationErrors = Object.values((error as any).response.data.errors).flat();
        toast.error(`فشل في الحفظ: ${validationErrors.join(', ')}`);
      } else {
        toast.error('فشل في حفظ بيانات المريض');
      }
    }
  };

  // Removed handleEdit - no longer used after removing Edit button

  const resetForm = () => {
    setFormData({
      name: '',
      doctor: '',
      gender: 'male',
      age: '',
      address_required: '',
      address_optional: '',
      organization: '',
      status: '',
      phone: '',
      whatsapp_number: '',
      sender: '', // Doctor name
      // Keep existing fields for compatibility
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      medical_history: '',
      allergies: '',
    });
  };

  // const handleOpen = (): void => {
  //   resetForm();
  //   setEditingPatient(null);
  //   setOpen(true);
  // };

  const handleClose = () => {
    setOpen(false);
    setEditingPatient(null);
    resetForm();
  };

  // Removed handleDeleteClick - no longer used after removing Delete button

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    setDeleting(true);
    try {
      const response = await axios.delete(`/api/patients/${patientToDelete.id}`);
      
      if (response.data.message) {
        toast.success(response.data.message);
        
        // Show details of what was deleted
        if (response.data.deleted_data) {
          const deletedData = response.data.deleted_data;
          const summary = Object.entries(deletedData)
            .filter(([_, count]) => (count as any) > 0)
            .map(([key, count]) => `${count} ${key}`)
            .join(', ');
          
          if (summary) {
            toast.info(`Deleted: ${summary}`);
          }
        }
        
        // Refresh the patients list
        fetchPatients();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete patient');
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  // Delivery tracking functions
  const openDeliveryModal = (patient: Patient, type: 'report' | 'wax_blocks') => {
    setSelectedPatientForDelivery(patient);
    setDeliveryType(type);
    
    // Pre-fill form with existing data
    if (type === 'report') {
      setDeliveryFormData({
        delivered: patient.report_delivered || false,
        delivery_date: patient.report_delivery_date || '',
        notes: patient.report_delivery_notes || '',
        delivered_by: patient.report_delivered_by || '',
      });
      setReportDeliveryModalOpen(true);
    } else {
      setDeliveryFormData({
        delivered: patient.wax_blocks_delivered || false,
        delivery_date: patient.wax_blocks_delivery_date || '',
        notes: patient.wax_blocks_delivery_notes || '',
        delivered_by: patient.wax_blocks_delivered_by || '',
      });
      setWaxBlocksModalOpen(true);
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForDelivery) return;

    try {
      const updateData: any = {};
      
      if (deliveryType === 'report') {
        updateData.report_delivered = deliveryFormData.delivered;
        updateData.report_delivery_date = deliveryFormData.delivery_date || null;
        updateData.report_delivery_notes = deliveryFormData.notes || null;
        updateData.report_delivered_by = deliveryFormData.delivered_by || null;
      } else {
        updateData.wax_blocks_delivered = deliveryFormData.delivered;
        updateData.wax_blocks_delivery_date = deliveryFormData.delivery_date || null;
        updateData.wax_blocks_delivery_notes = deliveryFormData.notes || null;
        updateData.wax_blocks_delivered_by = deliveryFormData.delivered_by || null;
      }

      const response = await axios.put(`/api/patients/${selectedPatientForDelivery.id}`, updateData);
      
      const itemName = deliveryType === 'report' ? 'Report' : 'Wax Blocks (بلوكات الشمع)';
      toast.success(`${itemName} delivery status updated successfully`);
      
      // Update local state immediately with the updated patient data
      const updatedPatient = response.data?.patient || response.data?.data;
      if (updatedPatient) {
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient.id === selectedPatientForDelivery.id 
              ? { ...patient, ...updatedPatient }
              : patient
          )
        );
      } else {
        // Fallback: update with the form data we just sent
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient.id === selectedPatientForDelivery.id 
              ? {
                  ...patient,
                  ...(deliveryType === 'report' 
                    ? {
                        report_delivered: deliveryFormData.delivered,
                        report_delivery_date: deliveryFormData.delivery_date || undefined,
                        report_delivery_notes: deliveryFormData.notes || undefined,
                        report_delivered_by: deliveryFormData.delivered_by || undefined,
                      }
                    : {
                        wax_blocks_delivered: deliveryFormData.delivered,
                        wax_blocks_delivery_date: deliveryFormData.delivery_date || undefined,
                        wax_blocks_delivery_notes: deliveryFormData.notes || undefined,
                        wax_blocks_delivered_by: deliveryFormData.delivered_by || undefined,
                      })
                }
              : patient
          )
        );
      }
      
      // Close modal and refresh data to ensure consistency
      setReportDeliveryModalOpen(false);
      setWaxBlocksModalOpen(false);
      setSelectedPatientForDelivery(null);
      resetDeliveryForm();
      
      // Refresh data from server to ensure we have the latest
      fetchPatients();
    } catch (error: any) {
      console.error('Delivery update error:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const resetDeliveryForm = () => {
    setDeliveryFormData({
      delivered: false,
      delivery_date: '',
      notes: '',
      delivered_by: '',
    });
  };

  const closeDeliveryModal = () => {
    setReportDeliveryModalOpen(false);
    setWaxBlocksModalOpen(false);
    setSelectedPatientForDelivery(null);
    resetDeliveryForm();
  };

  const getGenderChip = (gender: string) => {
    // Handle Arabic gender values
    const isMale = gender === 'male' || gender === 'ذكر';
    const isFemale = gender === 'female' || gender === 'انثي' || gender === 'انثى';
    
    let label = 'Unknown';
    let color: 'primary' | 'secondary' | 'default' = 'default';
    
    if (isMale) {
      label = 'Male';
      color = 'primary';
    } else if (isFemale) {
      label = 'Female';
      color = 'secondary';
    }
    
    return (
      <Chip
        label={label}
        color={color}
        size="small"
      />
    );
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setLabNoInput('');
    setFilters({
      lab_no: '',
      attendance_date: '',
      delivery_date: '',
    });
  };

  const handlePrint = async () => {
    try {
      // Use current page patients or fetch all if filters are active
      let allPatients: Patient[] = [];
      let filterInfo: string[] = [];
      
      // If filters are active, fetch all filtered patients
      if (filters.lab_no || filters.attendance_date || filters.delivery_date || search) {
        const params: any = {
          page: 1,
          per_page: 10000, // Large number to get all results
          search: search,
        };
        
        if (filters.lab_no.trim()) {
          params.lab_no = filters.lab_no.trim();
        }
        if (filters.attendance_date) {
          params.attendance_date = filters.attendance_date;
        }
        if (filters.delivery_date) {
          params.delivery_date = filters.delivery_date;
        }
        
        const queryString = new URLSearchParams(params).toString();
        const response = await axios.get(`/api/patients?${queryString}`);
        allPatients = response.data.data || [];
        
        // Build filter info text
        if (search) filterInfo.push(`Search: ${search}`);
        if (filters.lab_no) filterInfo.push(`Lab No: ${filters.lab_no}`);
        if (filters.attendance_date) filterInfo.push(`تاريخ الحضور: ${new Date(filters.attendance_date).toLocaleDateString('ar-EG')}`);
        if (filters.delivery_date) filterInfo.push(`تاريخ الاستلام: ${new Date(filters.delivery_date).toLocaleDateString('ar-EG')}`);
      } else {
        // No filters, use current page patients
        allPatients = patients;
        filterInfo.push(`Page: ${currentPage}`);
      }
      
      if (allPatients.length === 0) {
        toast.info('No patients to print');
        return;
      }

      // Create print HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      const tableRows = allPatients.map((patient: Patient) => {
        const attendanceDates = patient.attendance_dates && patient.attendance_dates.length > 0
          ? patient.attendance_dates.map((d: string) => new Date(d).toLocaleDateString('ar-EG')).join(', ')
          : 'No dates';
        
        const deliveryDates = patient.delivery_dates && patient.delivery_dates.length > 0
          ? patient.delivery_dates.map((d: string) => new Date(d).toLocaleDateString('ar-EG')).join(', ')
          : 'No dates';

        return `
          <tr>
            <td>${patient.name || 'N/A'}</td>
            <td>${patient.lab || '-'}</td>
            <td>${patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Unknown'}</td>
            <td>${patient.age || 'N/A'}</td>
            <td>${patient.phone || 'N/A'}</td>
            <td>${patient.doctor_name || patient.sender || '-'}</td>
            <td>${attendanceDates}</td>
            <td>${deliveryDates}</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Patients Report</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .filter-info {
              margin: 10px 0;
              font-size: 14px;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              position: sticky;
              top: 0;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Patients Report</h1>
            ${filterInfo.length > 0 ? `<div class="filter-info"><strong>Filters:</strong> ${filterInfo.join(' | ')}</div>` : ''}
            <div class="filter-info"><strong>Total Patients:</strong> ${allPatients.length}</div>
            <div class="filter-info"><strong>Print Date:</strong> ${new Date().toLocaleString('ar-EG')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Lab Number</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Phone</th>
                <th>Doctor</th>
                <th>تاريخ الحضور</th>
                <th>تاريخ الاستلام</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Generated on ${new Date().toLocaleString('ar-EG')}
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
    } catch (error: any) {
      console.error('Error printing patients:', error);
      toast.error('Failed to print patients');
    }
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
          Patients
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by name, phone, or lab number... (wait 1.5 seconds after typing)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isSearching ? (
                      <CircularProgress size={20} sx={{ color: 'primary.main' }} />
                    ) : (
                      <Search sx={{ color: 'text.secondary' }} />
                    )}
                  </Box>
                ),
              }}
              helperText={isSearching ? "Searching..." : searchInput !== search ? "Type to search..." : ""}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterList color="primary" />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Lab No"
                value={labNoInput}
                onChange={(e) => setLabNoInput(e.target.value)}
                placeholder="Search by lab number... (wait 1.5 seconds after typing)"
                size="small"
                helperText={labNoInput !== filters.lab_no && labNoInput !== '' ? "Type to search..." : ""}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="تاريخ الحضور"
                type="date"
                value={filters.attendance_date}
                onChange={(e) => handleFilterChange('attendance_date', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="تاريخ الاستلام"
                type="date"
                value={filters.delivery_date}
                onChange={(e) => handleFilterChange('delivery_date', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {(filters.lab_no || filters.attendance_date || filters.delivery_date) && (
              <Button
                size="small"
                onClick={clearFilters}
                color="error"
                variant="outlined"
                startIcon={<Clear />}
              >
                Clear Filters
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{ ml: 'auto' }}
            >
              Print
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Lab Number</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>تاريخ الحضور</TableCell>
                  <TableCell>تاريخ الاستلام</TableCell>
                  <TableCell align="center">Report Status</TableCell>
                  <TableCell align="center">Wax Blocks Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Alert severity="info">No patients found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow key={patient.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person color="primary" />
                          {patient.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 'bold',
                            color: 'primary.main'
                          }}>
                            {patient.lab || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getGenderChip(patient.gender)}</TableCell>
                      <TableCell>
                        {(() => {
                          // If age is directly available, use it
                          if (patient.age && patient.age > 0) {
                            return patient.age;
                          }
                          
                          // If birth_date is available, calculate age from it
                          if (patient.birth_date) {
                            const birthDate = new Date(patient.birth_date);
                            const today = new Date();
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            
                            // Adjust if birthday hasn't occurred this year
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            
                            return age > 0 ? age : 'N/A';
                          }
                          
                          return 'N/A';
                        })()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone fontSize="small" color="action" />
                          {patient.phone}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person fontSize="small" color="action" />
                          {patient.doctor_name || patient.sender || '-'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patient.attendance_dates && patient.attendance_dates.length > 0 ? (
                            patient.attendance_dates.slice(0, 2).map((date, index) => (
                              <Chip 
                                key={index}
                                label={new Date(date).toLocaleDateString('ar-EG')}
                                color="info"
                                variant="outlined"
                                size="small"
                              />
                            ))
                          ) : (
                            <Chip 
                              label="No dates"
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                          {patient.attendance_dates && patient.attendance_dates.length > 2 && (
                            <Chip 
                              label={`+${patient.attendance_dates.length - 2}`}
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {patient.delivery_dates && patient.delivery_dates.length > 0 ? (
                            patient.delivery_dates.slice(0, 2).map((date, index) => (
                              <Chip 
                                key={index}
                                label={new Date(date).toLocaleDateString('ar-EG')}
                                color="warning"
                                variant="outlined"
                                size="small"
                              />
                            ))
                          ) : (
                            <Chip 
                              label="No dates"
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                          {patient.delivery_dates && patient.delivery_dates.length > 2 && (
                            <Chip 
                              label={`+${patient.delivery_dates.length - 2}`}
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            icon={patient.report_delivered ? <CheckCircle /> : <Pending />}
                            label={patient.report_delivered ? 'Delivered' : 'Pending'}
                            color={patient.report_delivered ? 'success' : 'warning'}
                            size="small"
                            onClick={() => openDeliveryModal(patient, 'report')}
                            sx={{ cursor: 'pointer' }}
                          />
                          {patient.report_delivery_date && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(patient.report_delivery_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            icon={patient.wax_blocks_delivered ? <CheckCircle /> : <Pending />}
                            label={patient.wax_blocks_delivered ? 'Delivered' : 'Pending'}
                            color={patient.wax_blocks_delivered ? 'success' : 'warning'}
                            size="small"
                            onClick={() => openDeliveryModal(patient, 'wax_blocks')}
                            sx={{ cursor: 'pointer' }}
                          />
                          {patient.wax_blocks_delivery_date && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(patient.wax_blocks_delivery_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {totalPatients > 0 ? (
                <>Showing {((currentPage - 1) * 15) + 1}-{Math.min(currentPage * 15, totalPatients)} of {totalPatients} patients</>
              ) : (
                <>No patients found</>
              )}
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
        </CardContent>
      </Card>

      {/* Add/Edit Patient Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPatient ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              {/* الاسم */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الاسم *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* الدكتور */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الدكتور (اسم المرسل)"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                  placeholder="اسم الطبيب أو المرسل"
                />
              </Grid>
              
              {/* النوع */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>النوع *</InputLabel>
                  <Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    label="النوع *"
                  >
                    <MenuItem value="male">ذكر</MenuItem>
                    <MenuItem value="female">أنثى</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* السن */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="السن"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  inputProps={{ min: 0, max: 120 }}
                />
              </Grid>
              
              {/* العنوان المطلوب */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="العنوان"
                  value={formData.address_required}
                  onChange={(e) => setFormData({ ...formData, address_required: e.target.value })}
                  multiline
                  rows={2}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* العنوان الاختياري */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="العنوان (اختياري)"
                  value={formData.address_optional}
                  onChange={(e) => setFormData({ ...formData, address_optional: e.target.value })}
                  multiline
                  rows={2}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* الجهة */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الجهة"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* الحالة */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="الحالة"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  sx={{ '& .MuiInputBase-input': { direction: 'rtl' } }}
                />
              </Grid>
              
              {/* رقم التليفون */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="رقم التليفون *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              
              {/* رقم الواتساب */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="رقم الواتساب (اختياري)"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="مثال: 01234567890"
                  InputProps={{
                    startAdornment: <WhatsApp sx={{ mr: 1, color: '#25D366' }} />,
                  }}
                />
              </Grid>
              
              {/* Additional fields for compatibility */}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>إلغاء</Button>
            <Button type="submit" variant="contained">
              {editingPatient ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Patient Credentials Modal */}
      <Dialog open={credentialsModalOpen} onClose={() => setCredentialsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" />
            Patient Portal Credentials
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Patient created successfully!</strong> Here are the login credentials for the patient portal.
            </Typography>
          </Alert>
          
          {generatedCredentials && (
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'inherit' }}>
                  🔐 Portal Access Information
                </Typography>
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  p: 2, 
                  borderRadius: 1, 
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>
                  <Box sx={{ mb: 1 }}>
                    <strong>Username:</strong> {generatedCredentials.username}
                  </Box>
                  <Box>
                    <strong>Password:</strong> {generatedCredentials.password}
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 2, color: 'inherit', opacity: 0.9 }}>
                  These credentials will also appear on the patient's invoice and receipt.
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCredentialsModalOpen(false);
              setGeneratedCredentials(null);
            }} 
            variant="contained"
            fullWidth
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete color="error" />
            Delete Patient
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone!
            </Typography>
          </Alert>
          
          {patientToDelete && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete patient <strong>"{patientToDelete.name}"</strong>?
              </Typography>
              
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>This will permanently delete:</strong>
                </Typography>
                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                  • All patient visits and lab requests<br/>
                  • All test results and samples<br/>
                  • All invoices and payments<br/>
                  • All reports and enhanced reports<br/>
                  • Patient credentials and portal access
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={deleting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Delivery Tracking Modal */}
      <Dialog open={reportDeliveryModalOpen} onClose={closeDeliveryModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            Report Delivery Status - {selectedPatientForDelivery?.name}
          </Box>
        </DialogTitle>
        <form onSubmit={handleDeliverySubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Delivery Status</InputLabel>
                  <Select
                    value={deliveryFormData.delivered ? 'delivered' : 'pending'}
                    onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivered: e.target.value === 'delivered' })}
                    label="Delivery Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {deliveryFormData.delivered && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Delivery Date"
                      type="date"
                      value={deliveryFormData.delivery_date}
                      onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivery_date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Delivered By (Who received it?)"
                      value={deliveryFormData.delivered_by}
                      onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivered_by: e.target.value })}
                      placeholder="e.g., Patient's brother, Sister, etc."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                      value={deliveryFormData.notes}
                      onChange={(e) => setDeliveryFormData({ ...deliveryFormData, notes: e.target.value })}
                      placeholder="Additional notes about the delivery..."
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeliveryModal}>Cancel</Button>
            <Button type="submit" variant="contained">Update Status</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Wax Blocks Delivery Tracking Modal */}
      <Dialog open={waxBlocksModalOpen} onClose={closeDeliveryModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science color="primary" />
            Wax Blocks (بلوكات الشمع) Delivery Status - {selectedPatientForDelivery?.name}
          </Box>
        </DialogTitle>
        <form onSubmit={handleDeliverySubmit}>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Wax blocks are kept for 3 years only. Track delivery to avoid unnecessary requests.
              </Typography>
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Delivery Status</InputLabel>
                  <Select
                    value={deliveryFormData.delivered ? 'delivered' : 'pending'}
                    onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivered: e.target.value === 'delivered' })}
                    label="Delivery Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {deliveryFormData.delivered && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Delivery Date"
                      type="date"
                      value={deliveryFormData.delivery_date}
                      onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivery_date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Delivered By (Who received it?)"
                      value={deliveryFormData.delivered_by}
                      onChange={(e) => setDeliveryFormData({ ...deliveryFormData, delivered_by: e.target.value })}
                      placeholder="e.g., Patient's brother, Sister, etc."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                      value={deliveryFormData.notes}
                      onChange={(e) => setDeliveryFormData({ ...deliveryFormData, notes: e.target.value })}
                      placeholder="Additional notes about the delivery..."
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeliveryModal}>Cancel</Button>
            <Button type="submit" variant="contained">Update Status</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Patients;

