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
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Print,
  Science,
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
  const [showSampleModal, setShowSampleModal] = useState(false);
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

  // Function to fetch receipt data and generate PDF
  const handleReceiptPrint = async () => {
    if (!patientCredentials?.visitId) return;
    
    setLoadingReceipt(true);
    try {
      // Generate PDF using the new receipt template
      const response = await axios.get(`/api/check-in/visits/${patientCredentials.visitId}/unpaid-invoice-receipt`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open PDF in new tab for viewing
      const printWindow = window.open(url, '_blank');
      if (!printWindow) {
        alert('Popup blocked. Please allow popups for this site.');
        return;
      }
      
      // Clean up the URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
      
      toast.success('Receipt opened in new tab. You can print or download from there.');
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      toast.error('Failed to generate receipt: ' + ((error as any)?.message || 'Unknown error'));
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
      console.log('Sample label API response:', response.data);
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
      if (!formData.name || !formData.age) {
        toast.error('Please fill in all required fields (Name, Age)');
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
                    placeholder="رقم الموبايل (اختياري)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
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

        {/* Receipt Modal - Disabled, using PDF instead */}

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
            {sampleData.sample_data?.sample_labels?.length || 0} sample label(s) generated
          </Typography>
        )}
          </DialogTitle>
          <DialogContent>
        {sampleData ? (
          <Box>
            {sampleData.sample_data?.sample_labels && sampleData.sample_data.sample_labels.length > 0 ? (
              <Grid container spacing={2}>
                {sampleData.sample_data.sample_labels.map((sampleLabel: any, index: number) => (
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
                if (sampleData && sampleData.sample_data?.sample_labels) {
                  // Use the same print function as CheckIn.tsx
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const labelsHTML = sampleData.sample_data.sample_labels.map((sampleLabel: any) => `
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