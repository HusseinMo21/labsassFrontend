import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Receipt,
  Person,
  Science,
  MonetizationOn,
  Print,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from '../../config/axios';

interface PatientFormData {
  name: string;
  age: string;
  phone: string;
  lab_number: string;
  gender: string;
  organization: string;
  attendance_day: string;
  delivery_day: string;
  delivery_date: string;
  referring_doctor: string;
  sample_size: string;
  number_of_samples: string;
  attendance_date: string;
  previous_tests: string;
  sample_type: string;
  medical_history: string;
  total_amount: string;
  amount_paid_cash: string;
  amount_paid_card: string;
  additional_payment_method: string;
}

const PatientRegistration: React.FC = () => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    age: '',
    phone: '',
    lab_number: '',
    gender: 'ذكر',
    organization: '',
    attendance_day: 'السبت',
    delivery_day: 'السبت',
    delivery_date: '',
    referring_doctor: '',
    sample_size: 'صغيرة جدا',
    number_of_samples: '',
    attendance_date: '',
    previous_tests: 'نعم',
    sample_type: 'Pathology',
    medical_history: '',
    total_amount: '',
    amount_paid_cash: '',
    amount_paid_card: '',
    additional_payment_method: 'Fawry',
  });

  const [searchValue, setSearchValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [sampleData, setSampleData] = useState<any>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [patientCredentials, setPatientCredentials] = useState<{
    username: string;
    password: string;
    visitId?: number;
    labNumber?: string;
  } | null>(null);

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to calculate total paid amount
  const getTotalPaidAmount = () => {
    const cash = parseFloat(formData.amount_paid_cash) || 0;
    const card = parseFloat(formData.amount_paid_card) || 0;
    return cash + card;
  };

  // Helper function to validate payment amounts
  const validatePaymentAmounts = () => {
    const totalAmount = parseFloat(formData.total_amount) || 0;
    const totalPaid = getTotalPaidAmount();
    
    if (totalAmount > 0 && totalPaid > totalAmount) {
      return 'المبلغ المدفوع أكبر من المبلغ الإجمالي';
    }
    
    return null;
  };

  // Helper function to map gender for backend (Arabic to English)
  const mapGenderForBackend = (gender: string) => {
    if (gender === 'ذكر') return 'male';
    if (gender === 'أنثى') return 'female';
    return gender || 'male';
  };

  // Function to fetch receipt data
  const handleReceiptPrint = async () => {
    if (!patientCredentials?.visitId) return;
    
    setLoadingReceipt(true);
    try {
      const response = await axios.get(`/api/visits/${patientCredentials.visitId}/receipt`);
      setReceiptData(response.data);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Failed to fetch receipt:', error);
      toast.error('فشل في تحميل الإيصال');
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Function to fetch sample data
  const handleSamplePrint = async () => {
    if (!patientCredentials?.visitId) return;
    
    setLoadingSample(true);
    try {
      const response = await axios.get(`/api/check-in/visits/${patientCredentials.visitId}/sample-label`);
      setSampleData(response.data);
      setShowSampleModal(true);
    } catch (error) {
      console.error('Failed to fetch sample label:', error);
      toast.error('فشل في تحميل ملصق العينة');
    } finally {
      setLoadingSample(false);
    }
  };

  // Helper function to get day name in Arabic from date
  const getDayNameFromDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const dayNames = {
      0: 'الأحد',    // Sunday
      1: 'الاثنين',  // Monday
      2: 'الثلاثاء', // Tuesday
      3: 'الأربعاء', // Wednesday
      4: 'الخميس',   // Thursday
      5: 'الجمعة',   // Friday
      6: 'السبت'     // Saturday
    };
    
    return dayNames[date.getDay() as keyof typeof dayNames] || '';
  };

  // Handle date change with automatic day detection
  const handleDateChange = (field: 'attendance_date' | 'delivery_date', value: string) => {
    setFormData(prev => {
      const newFormData = {
      ...prev,
      [field]: value
      };
      
      // Auto-fill corresponding day field when date changes
      if (field === 'attendance_date' && value) {
        newFormData.attendance_day = getDayNameFromDate(value);
      } else if (field === 'delivery_date' && value) {
        newFormData.delivery_day = getDayNameFromDate(value);
      }
      
      return newFormData;
    });
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.warning('Please enter a lab number to search');
      return;
    }

    setSearching(true);
    try {
      // Search for existing patient by lab number using the correct endpoint
      const response = await axios.get(`/api/patients?search=${encodeURIComponent(searchValue)}`);
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const patient = response.data.data[0];
        
        // Helper function to format date for input field
        const formatDateForInput = (dateString: string) => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // Convert to yyyy-MM-dd format
          } catch {
            return '';
          }
        };

        // Helper function to map gender values
        const mapGender = (gender: string) => {
          if (gender === 'male') return 'ذكر';
          if (gender === 'female') return 'أنثى';
          return gender || 'ذكر';
        };



        // Fill the form with existing patient data
    setFormData({
      name: patient.name || '',
          age: patient.age?.toString() || '',
      phone: patient.phone || '',
          lab_number: patient.lab || patient.lab_number || searchValue,
          gender: mapGender(patient.gender),
      organization: patient.organization || '',
          attendance_day: patient.day_of_week || 'السبت',
          delivery_day: patient.day_of_week || 'السبت',
          delivery_date: formatDateForInput(patient.delivery_date),
          referring_doctor: patient.doctor || '',
          sample_size: patient.sample_size || 'صغيرة جدا',
          number_of_samples: patient.number_of_samples?.toString() || '',
          attendance_date: formatDateForInput(patient.attendance_date),
          previous_tests: patient.previous_tests || 'نعم',
          sample_type: patient.sample_type || 'Pathology',
      medical_history: patient.medical_history || '',
          total_amount: patient.total_amount?.toString() || '',
          amount_paid_cash: patient.amount_paid_cash?.toString() || '',
          amount_paid_card: patient.amount_paid_card?.toString() || '',
          additional_payment_method: patient.additional_payment_method || 'Fawry',
        });
        
        toast.success('Patient found! Form filled with existing data.');
      } else {
        toast.info('No patient found with this lab number. You can proceed with new registration.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Search failed. Please check the lab number and try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.phone || !formData.age) {
        toast.error('Please fill in all required fields (Name, Phone, Age)');
        return;
      }

      // Validate payment amounts
      const paymentError = validatePaymentAmounts();
      if (paymentError) {
        toast.error(paymentError);
        return;
      }

      // Prepare data for submission
      const patientData: any = {
        name: formData.name,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: mapGenderForBackend(formData.gender), // Convert Arabic to English for backend
        organization: formData.organization,
        doctor: formData.referring_doctor,
        sample_type: formData.sample_type,
        sample_size: formData.sample_size,
        number_of_samples: parseInt(formData.number_of_samples) || 1,
        day_of_week: formData.attendance_day,
        medical_history: formData.medical_history,
        previous_tests: formData.previous_tests,
        attendance_date: formData.attendance_date,
        delivery_date: formData.delivery_date,
        total_amount: parseFloat(formData.total_amount) || 0,
        amount_paid_cash: parseFloat(formData.amount_paid_cash) || 0,
        amount_paid: getTotalPaidAmount(), // Total paid amount for backward compatibility
        lab_number: formData.lab_number,
      };

      // Only include additional payment method and amount if they have values
      const additionalPaymentAmount = parseFloat(formData.amount_paid_card) || 0;
      if (additionalPaymentAmount > 0 && formData.additional_payment_method) {
        patientData.amount_paid_card = additionalPaymentAmount;
        patientData.additional_payment_method = formData.additional_payment_method;
      }

      console.log('Submitting patient data:', patientData);

      // Submit to backend
      const response = await axios.post('/api/patients', patientData);
      
      toast.success('Patient registered successfully!');
      console.log('Patient registration response:', response.data);
      
      // Show credentials modal
        if (response.data.user_credentials) {
        setPatientCredentials({
          username: response.data.user_credentials.username,
          password: response.data.user_credentials.password,
          visitId: response.data.visit_id,
            labNumber: response.data.lab_number,
          });
        setShowCredentialsModal(true);
        }
        
        // Reset form
        setFormData({
          name: '',
        age: '',
          phone: '',
        lab_number: '',
        gender: 'ذكر',
          organization: '',
        attendance_day: 'السبت',
        delivery_day: 'السبت',
          delivery_date: '',
        referring_doctor: '',
        sample_size: 'صغيرة جدا',
        number_of_samples: '',
        attendance_date: '',
        previous_tests: 'نعم',
        sample_type: 'Pathology',
        medical_history: '',
        total_amount: '',
        amount_paid_cash: '',
        amount_paid_card: '',
        additional_payment_method: 'Fawry',
      });

    } catch (error: any) {
      console.error('Failed to register patient:', error);
      const message = error.response?.data?.message || 'Failed to register patient';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      py: 4,
      px: 2
    }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Main Form Card */}
        <Card sx={{ 
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          backgroundColor: 'white'
        }}>
          <CardContent sx={{ p: 4 }}>
            {/* Lab Number Check Section */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Lab Number"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searching}
                sx={{
                  backgroundColor: '#1976d2',
                  borderRadius: 1,
                  px: 3,
                  py: 1.5,
                  minWidth: 120,
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc',
                  }
                }}
              >
                {searching ? 'جاري البحث...' : 'التحقق من الوجود'}
              </Button>
            </Box>

            {/* Title Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 'bold',
                color: '#333',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                Patient Entry Record
                <AddIcon sx={{ color: '#1976d2', fontSize: 32 }} />
              </Typography>
              <Box sx={{ 
                height: 2,
                backgroundColor: '#1976d2',
                width: '100%',
                borderRadius: 1
              }} />
        </Box>


            {/* Form Fields */}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Row 1: Name, Age, Phone */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    الاسم
                  </Typography>
              <TextField
                fullWidth
                    placeholder="الاسم"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    السن
                  </Typography>
              <TextField
                fullWidth
                    placeholder="السن"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    رقم الموبايل
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="رقم الموبايل"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
            
                {/* Row 2: Organization, Gender, Lab Number */}
            <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    الجهة
                  </Typography>
              <TextField
                fullWidth
                    placeholder="الجهة"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    النوع
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  sx={{
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value="ذكر">ذكر</MenuItem>
                      <MenuItem value="أنثى">أنثى</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    Lab no
                  </Typography>
              <TextField
                fullWidth
                    placeholder="Lab no"
                value={formData.lab_number}
                onChange={(e) => handleInputChange('lab_number', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>

                {/* Row 3: Referring Doctor, Delivery Date, Delivery Day */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    الدكتور المرسل
              </Typography>
              <TextField
                fullWidth
                    placeholder="الدكتور المرسل"
                    value={formData.referring_doctor}
                    onChange={(e) => handleInputChange('referring_doctor', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    تاريخ الحضور
                  </Typography>
              <TextField
                fullWidth
                    type="date"
                    value={formData.attendance_date}
                    onChange={(e) => handleDateChange('attendance_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    يوم الحضور
              </Typography>
              <FormControl fullWidth>
                <Select
                      value={formData.attendance_day}
                      onChange={(e) => handleInputChange('attendance_day', e.target.value)}
                  sx={{
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value="السبت">السبت</MenuItem>
                      <MenuItem value="الأحد">الأحد</MenuItem>
                      <MenuItem value="الاثنين">الاثنين</MenuItem>
                      <MenuItem value="الثلاثاء">الثلاثاء</MenuItem>
                      <MenuItem value="الأربعاء">الأربعاء</MenuItem>
                      <MenuItem value="الخميس">الخميس</MenuItem>
                      <MenuItem value="الجمعة">الجمعة</MenuItem>
                    </Select>
                  </FormControl>
            </Grid>
            
                {/* Row 4: Delivery Date, Delivery Day, Number of Samples, Sample Size */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    ميعاد التسليم
                  </Typography>
              <TextField
                fullWidth
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => handleDateChange('delivery_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    يوم التسليم
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={formData.delivery_day}
                      onChange={(e) => handleInputChange('delivery_day', e.target.value)}
                sx={{
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value="السبت">السبت</MenuItem>
                      <MenuItem value="الأحد">الأحد</MenuItem>
                      <MenuItem value="الاثنين">الاثنين</MenuItem>
                      <MenuItem value="الثلاثاء">الثلاثاء</MenuItem>
                      <MenuItem value="الأربعاء">الأربعاء</MenuItem>
                      <MenuItem value="الخميس">الخميس</MenuItem>
                      <MenuItem value="الجمعة">الجمعة</MenuItem>
                </Select>
              </FormControl>
            </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    عدد العينات
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={formData.number_of_samples}
                onChange={(e) => handleInputChange('number_of_samples', e.target.value)}
                inputProps={{ min: 1, max: 10 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    حجم العينة
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.sample_size}
                  onChange={(e) => handleInputChange('sample_size', e.target.value)}
                  sx={{
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value="صغيرة جدا">صغيرة جدا</MenuItem>
                      <MenuItem value="صغيرة">صغيرة</MenuItem>
                      <MenuItem value="متوسطة">متوسطة</MenuItem>
                      <MenuItem value="كبيرة">كبيرة</MenuItem>
                      <MenuItem value="كبيرة جدا">كبيرة جدا</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
                {/* Row 5: Sample Type, Previous Tests, Case Type */}
            <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    نوع العينة
              </Typography>
              <FormControl fullWidth>
                <Select
                      value={formData.sample_type}
                      onChange={(e) => handleInputChange('sample_type', e.target.value)}
                  sx={{
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value="Pathology">Pathology</MenuItem>
                      <MenuItem value="Pathology+IHC">Pathology+IHC</MenuItem>
                      <MenuItem value="سائل">سائل</MenuItem>
                      <MenuItem value="صبغة مناعية">صبغة مناعية</MenuItem>
                      <MenuItem value="frozen">frozen</MenuItem>
                      <MenuItem value="اخرى">اخرى</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    هل سبق لك تحاليل باثولوجي
              </Typography>
              <FormControl fullWidth>
                <Select
                      value={formData.previous_tests}
                      onChange={(e) => handleInputChange('previous_tests', e.target.value)}
                  sx={{
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value="نعم">نعم</MenuItem>
                      <MenuItem value="لا">لا</MenuItem>
                </Select>
              </FormControl>
            </Grid>

                {/* Row 6: Medical History */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    هل يوجد تاريخ مرضي ؟
              </Typography>
              <TextField
                fullWidth
                    value={formData.medical_history}
                    onChange={(e) => handleInputChange('medical_history', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
            
                {/* Row 7: Financial Information */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    أجمالي المبلغ
                  </Typography>
              <TextField
                fullWidth
                    placeholder="اجمالي المبلغ"
                    value={formData.total_amount}
                    onChange={(e) => handleInputChange('total_amount', e.target.value)}
                    type="number"
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    المبلغ المدفوع نقداً
              </Typography>
                  <TextField
                    fullWidth
                    placeholder="المبلغ المدفوع نقداً"
                    value={formData.amount_paid_cash}
                    onChange={(e) => handleInputChange('amount_paid_cash', e.target.value)}
                    type="number"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                      }
                    }}
                  />
            </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    المبلغ المدفوع ب {formData.additional_payment_method}
                  </Typography>
              <TextField
                fullWidth
                    placeholder={`المبلغ المدفوع ب ${formData.additional_payment_method}`}
                    value={formData.amount_paid_card}
                    onChange={(e) => handleInputChange('amount_paid_card', e.target.value)}
                type="number"
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                  }
                }}
              />
            </Grid>
            
                {/* Row 8: Payment Method and Summary */}
            <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    طريقة الدفع الإضافية
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={formData.additional_payment_method}
                      onChange={(e) => handleInputChange('additional_payment_method', e.target.value)}
                      sx={{
                        borderRadius: 1,
                      }}
                    >
                      <MenuItem value="Fawry">Fawry</MenuItem>
                      <MenuItem value="InstaPay">InstaPay</MenuItem>
                      <MenuItem value="VodafoneCash">VodafoneCash</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
                    إجمالي المدفوع
                  </Typography>
              <TextField
                fullWidth
                    value={`${getTotalPaidAmount().toFixed(2)} جنيه`}
                    disabled
                sx={{
                  '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        backgroundColor: '#f5f5f5',
                  }
                }}
              />
            </Grid>
          </Grid>

              {/* Submit Button */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
                  type="submit"
              variant="contained"
              disabled={submitting}
                  startIcon={<SaveIcon />}
              sx={{ 
                    backgroundColor: '#d32f2f',
                    color: 'white',
                    borderRadius: 1,
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    minWidth: 200,
                '&:hover': {
                      backgroundColor: '#b71c1c',
                },
                '&:disabled': {
                      backgroundColor: '#ccc',
                }
              }}
            >
                  {submitting ? 'جاري الحفظ...' : 'الحفظ و التسجيل'}
            </Button>
          </Box>
            </form>
          </CardContent>
        </Card>
        </Box>
        
        {/* Credentials Modal */}
        <Dialog open={showCredentialsModal} onClose={() => setShowCredentialsModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#d32f2f' }}>
            بيانات تسجيل الدخول للمريض
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#333' }}>
                تم تسجيل المريض بنجاح!
              </Typography>
              
              <Box sx={{ backgroundColor: '#f5f5f5', p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  اسم المستخدم (Username):
                </Typography>
                <Typography variant="h6" sx={{ color: '#d32f2f', fontFamily: 'monospace', mb: 3 }}>
                  {patientCredentials?.username}
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  كلمة المرور (Password):
                </Typography>
                <Typography variant="h6" sx={{ color: '#d32f2f', fontFamily: 'monospace' }}>
                  {patientCredentials?.password}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                يمكن للمريض استخدام هذه البيانات للدخول إلى النظام
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleReceiptPrint}
              disabled={loadingReceipt}
              sx={{ 
                backgroundColor: '#1976d2',
                color: 'white',
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 120,
              }}
            >
              {loadingReceipt ? 'جاري التحميل...' : 'طباعة الإيصال'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSamplePrint}
              disabled={loadingSample}
              sx={{ 
                backgroundColor: '#9c27b0',
                color: 'white',
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 120,
              }}
            >
              {loadingSample ? 'جاري التحميل...' : 'طباعة العينة'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowCredentialsModal(false)}
              sx={{ 
                borderColor: '#d32f2f',
                color: '#d32f2f',
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 120,
              }}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        {/* Receipt Modal - Same as Receipts.tsx */}
        <Dialog open={showReceiptModal} onClose={() => setShowReceiptModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt sx={{ mr: 1, fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Visit Receipt
              </Typography>
            </Box>
            {receiptData && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Receipt #{receiptData.receipt_number} • {receiptData.date}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {receiptData ? (
              <Box>
                {/* Patient Info */}
                <Box sx={{ mb: 4, p: 3, bgcolor: 'primary.50', borderRadius: 3, border: '1px solid', borderColor: 'primary.200' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    <Person sx={{ mr: 1 }} />
                    Patient Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Name:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {String(receiptData.patient_name)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Phone:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {String(receiptData.patient_phone)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Tests Ordered */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    <Science sx={{ mr: 1 }} />
                    Tests Ordered ({receiptData.tests?.length || 0})
                  </Typography>
                  {receiptData.tests && receiptData.tests.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Test Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {receiptData.tests.map((test: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {test.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {test.category}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  EGP {test.price}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No tests ordered
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Financial Summary */}
                <Box sx={{ mb: 4, p: 3, bgcolor: 'success.50', borderRadius: 3, border: '1px solid', borderColor: 'success.200' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    <MonetizationOn sx={{ mr: 1 }} />
                    Financial Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        EGP {receiptData.total_amount || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Discount:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        EGP {receiptData.discount_amount || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Final Amount:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        EGP {receiptData.final_amount || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Paid:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                        EGP {(receiptData.payment_breakdown?.cash || 0) + (receiptData.payment_breakdown?.card || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Remaining Balance:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: receiptData.remaining_balance > 0 ? 'warning.main' : 'success.main' }}>
                        EGP {receiptData.remaining_balance || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Payment Method:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {receiptData.payment_method || 'CASH'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {/* Payment Breakdown */}
                  {receiptData.payment_breakdown && (receiptData.payment_breakdown.cash > 0 || receiptData.payment_breakdown.card > 0) && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Payment Breakdown:
                      </Typography>
                      <Grid container spacing={2}>
                        {receiptData.payment_breakdown.cash > 0 && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Paid Cash:</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                              EGP {receiptData.payment_breakdown.cash}
                            </Typography>
                          </Grid>
                        )}
                        {receiptData.payment_breakdown.card > 0 && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Paid with {receiptData.payment_breakdown.card_method}:
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              EGP {receiptData.payment_breakdown.card}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}
                </Box>

                {/* Status */}
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Payment Status
                  </Typography>
                  <Chip
                    label={receiptData.billing_status || 'PENDING'}
                    color={receiptData.billing_status === 'paid' ? 'success' : receiptData.billing_status === 'partial' ? 'warning' : 'default'}
                    sx={{ fontWeight: 600, mb: 2 }}
                  />
                  {receiptData.processed_by && (
                    <Typography variant="body2" color="text.secondary">
                      Processed by: {receiptData.processed_by}
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1">جاري تحميل بيانات الإيصال...</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Print />}
              onClick={() => {
                if (receiptData) {
                  // Use the same print function as Receipts.tsx
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Receipt - ${receiptData.receipt_number}</title>
                    <style>
                      @page { size: 80mm 200mm; margin: 5mm; }
                      body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.2; margin: 0; padding: 0; width: 70mm; }
                      .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
                      .header h1 { font-size: 14px; margin: 0 0 4px 0; font-weight: bold; }
                      .header p { margin: 2px 0; font-size: 10px; }
                      .section { margin-bottom: 8px; }
                      .section h3 { font-size: 11px; margin: 0 0 4px 0; font-weight: bold; border-bottom: 1px dotted #000; padding-bottom: 2px; }
                      .row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px; }
                      .row .label { flex: 1; }
                      .row .value { flex: 1; text-align: right; font-weight: bold; }
                      .total { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
                      .total .row { font-size: 11px; }
                      .payment-breakdown { margin-top: 4px; padding-top: 4px; border-top: 1px dotted #000; }
                      .payment-breakdown .row { font-size: 9px; }
                      .barcode { text-align: center; font-family: 'Courier New', monospace; font-size: 8px; margin: 4px 0; padding: 2px; background: #f0f0f0; border: 1px solid #000; }
                      .footer { text-align: center; font-size: 8px; margin-top: 8px; border-top: 1px dotted #000; padding-top: 4px; }
                      .test-item { margin-bottom: 1px; font-size: 9px; }
                      .test-name { display: inline-block; width: 60%; }
                      .test-price { display: inline-block; width: 35%; text-align: right; }
                      @media print { body { margin: 0; padding: 0; } .no-print { display: none; } }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h1>${receiptData.billing_status === 'paid' ? 'FINAL PAYMENT RECEIPT' : 'PATHOLOGY LAB RECEIPT'}</h1>
                      <p>Date: ${receiptData.date ? new Date(receiptData.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                      <p>Receipt #: ${receiptData.receipt_number || 'N/A'}</p>
                      <p>Lab #: ${receiptData.lab_number || 'N/A'}</p>
                    </div>
                    
                    <div class="section">
                      <h3>PATIENT INFO</h3>
                      <div class="row">
                        <span class="label">Name:</span>
                        <span class="value" style="direction: rtl; text-align: right; unicode-bidi: bidi-override; font-weight: bold;">${receiptData.patient_name || 'N/A'}</span>
                      </div>
                      <div class="row">
                        <span class="label">Phone:</span>
                        <span class="value">${receiptData.patient_phone || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div class="section">
                      <h3>TESTS (${receiptData.tests?.length || 0})</h3>
                      ${(receiptData.tests || []).map((test: any) => `
                        <div class="test-item">
                          <span class="test-name">${test.name || 'Unknown Test'}</span>
                          <span class="test-price">EGP ${test.price || 0}</span>
                        </div>
                      `).join('')}
                    </div>
                    
                    <div class="section total">
                      <div class="row">
                        <span class="label">Total:</span>
                        <span class="value">EGP ${receiptData.total_amount || 0}</span>
                      </div>
                      <div class="row">
                        <span class="label">Discount:</span>
                        <span class="value">EGP ${receiptData.discount_amount || 0}</span>
                      </div>
                      <div class="row">
                        <span class="label">Final:</span>
                        <span class="value">EGP ${receiptData.final_amount || 0}</span>
                      </div>
                      <div class="row">
                        <span class="label">Total Paid:</span>
                        <span class="value">EGP ${(receiptData.payment_breakdown?.cash || 0) + (receiptData.payment_breakdown?.card || 0)}</span>
                      </div>
                      <div class="row">
                        <span class="label">Remaining:</span>
                        <span class="value">EGP ${receiptData.remaining_balance || 0}</span>
                      </div>
                    </div>
                    
                    ${receiptData.payment_breakdown && (receiptData.payment_breakdown.cash > 0 || receiptData.payment_breakdown.card > 0) ? `
                      <div class="section payment-breakdown">
                        <h3>PAYMENT BREAKDOWN</h3>
                        ${receiptData.payment_breakdown.cash > 0 ? `
                          <div class="row">
                            <span class="label">Paid Cash:</span>
                            <span class="value">EGP ${receiptData.payment_breakdown.cash}</span>
                          </div>
                        ` : ''}
                        ${receiptData.payment_breakdown.card > 0 ? `
                          <div class="row">
                            <span class="label">Paid with ${receiptData.payment_breakdown.card_method}:</span>
                            <span class="value">EGP ${receiptData.payment_breakdown.card}</span>
                          </div>
                        ` : ''}
                      </div>
                    ` : ''}
                    
                    <div class="section">
                      <div class="row">
                        <span class="label">Status:</span>
                        <span class="value">${receiptData.billing_status || 'PENDING'}</span>
                      </div>
                    </div>
                    
                    ${receiptData.barcode ? `
                      <div class="barcode">
                        ${receiptData.barcode}
                      </div>
                    ` : ''}
                    
                    <div class="footer">
                      <p>Thank you for choosing our lab!</p>
                      <p>Processed by: ${receiptData.processed_by || 'System'}</p>
                      <p>Printed at: ${new Date().toLocaleString()}</p>
                    </div>
                  </body>
                  </html>
                `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }
              }}
              sx={{ 
                backgroundColor: '#1976d2',
                color: 'white',
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 120,
              }}
            >
              Print Receipt
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowReceiptModal(false)}
              sx={{ 
                borderColor: '#d32f2f',
                color: '#d32f2f',
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 120,
              }}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sample Label Modal - Same as CheckIn.tsx */}
        <Dialog open={showSampleModal} onClose={() => setShowSampleModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Science sx={{ mr: 1, fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Sample Labels
              </Typography>
            </Box>
        {sampleData && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {sampleData.sample_labels?.length || 0} sample label(s) generated
          </Typography>
        )}
          </DialogTitle>
          <DialogContent>
        {sampleData ? (
          <Box>
            {sampleData.sample_labels && sampleData.sample_labels.length > 0 ? (
              <Grid container spacing={2}>
                {sampleData.sample_labels.map((sampleLabel: any, index: number) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          <strong>Patient:</strong> {sampleLabel.patient_name}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Lab Number:</strong> {sampleLabel.lab_number}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Sample ID:</strong> {sampleLabel.sample_id}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Sample Type:</strong> {sampleLabel.sample_type}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Sample Size:</strong> {sampleLabel.sample_size}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Date:</strong> {sampleLabel.sample_date}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Time:</strong> {sampleLabel.sample_time}
                        </Typography>
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #ccc' }}>
                          <div dangerouslySetInnerHTML={{ __html: sampleLabel.barcode }} />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No sample labels available
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1">جاري تحميل بيانات ملصق العينة...</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Print />}
              onClick={() => {
                if (sampleData && sampleData.sample_labels) {
                  // Use the same print function as CheckIn.tsx
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const labelsHTML = sampleData.sample_labels.map((sampleLabel: any) => `
                      <div style="page-break-after: always; margin-bottom: 20px;">
                        <div style="border: 2px solid #000; padding: 10px; width: 300px; font-family: Arial, sans-serif;">
                          <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
                            SAMPLE LABEL
                          </div>
                          <div style="margin-bottom: 5px;">
                            <strong>Patient:</strong> ${sampleLabel.patient_name}
                          </div>
                          <div style="margin-bottom: 5px;">
                            <strong>Lab Number:</strong> ${sampleLabel.lab_number}
                          </div>
                          <div style="margin-bottom: 5px;">
                            <strong>Sample ID:</strong> ${sampleLabel.sample_id}
                          </div>
                          <div style="margin-bottom: 5px;">
                            <strong>Sample Type:</strong> ${sampleLabel.sample_type}
                          </div>
                          <div style="margin-bottom: 5px;">
                            <strong>Sample Size:</strong> ${sampleLabel.sample_size}
                          </div>
                          <div style="margin-bottom: 5px;">
                            <strong>Date:</strong> ${sampleLabel.sample_date}
                          </div>
                          <div style="margin-bottom: 5px;">
                            <strong>Time:</strong> ${sampleLabel.sample_time}
                          </div>
                          <div style="margin-top: 10px; text-align: center; border: 1px solid #ccc; padding: 5px;">
                            ${sampleLabel.barcode}
                          </div>
                        </div>
                      </div>
                    `).join('');
                    
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Sample Labels</title>
                        <style>
                          @page { size: A4; margin: 1cm; }
                          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                          @media print { 
                            body { margin: 0; padding: 0; }
                            .no-print { display: none; }
                          }
                        </style>
                      </head>
                      <body>
                        ${labelsHTML}
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }
              }}
              sx={{ 
                backgroundColor: '#9c27b0',
                color: 'white',
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 120,
              }}
            >
              Print All Labels
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowSampleModal(false)}
              sx={{ 
                borderColor: '#d32f2f',
                color: '#d32f2f',
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 120,
              }}
            >
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default PatientRegistration;