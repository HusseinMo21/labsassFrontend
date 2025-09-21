import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
} from '@mui/material';
import {
  Search,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from '../../config/axios';

interface TestCategory {
  id: number;
  name: string;
  description: string;
}

interface Patient {
  id: number;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  organization?: string;
  doctor_id?: string;
  sample_type?: string;
  case_type?: string;
  sample_size?: string;
  number_of_samples?: number;
  day_of_week?: string;
  medical_history?: string;
  previous_tests?: string;
  attendance_date?: string;
  delivery_date?: string;
  total_amount?: number;
  amount_paid?: number;
  lab_number?: string;
  lab?: string;
  doctor?: string;
}

interface UserCredentials {
  username: string;
  password: string;
}


const PatientRegistration: React.FC = () => {
  const [formData, setFormData] = useState<Patient>({
    name: '',
    phone: '',
    age: '',
    gender: '',
    organization: '',
    doctor: '',
    sample_type: '',
    case_type: '',
    sample_size: '',
    number_of_samples: '',
    day_of_week: '',
    medical_history: '',
    previous_tests: '',
    attendance_date: '',
    delivery_date: '',
    total_amount: '',
    amount_paid: '',
    lab_number: '',
  });

  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [searchType, setSearchType] = useState<'lab_number' | 'mobile' | 'name'>('lab_number');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    labNumber: string;
    credentials: UserCredentials;
  } | null>(null);

  useEffect(() => {
    fetchTestCategories();
  }, []);

  const fetchTestCategories = async () => {
    try {
      const response = await axios.get('/api/check-in/test-categories');
      setTestCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch test categories:', error);
    }
  };

  const handleInputChange = (field: keyof Patient, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.warning('يرجى إدخال قيمة للبحث (Please enter a search value)');
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get('/api/patient-registration/search', {
        params: {
          type: searchType,
          value: searchValue.trim()
        }
      });

      if (response.data.success) {
        setSearchResults(response.data.data);
        if (response.data.data.length === 0) {
          toast.info('لم يتم العثور على نتائج (No results found)');
        } else {
          toast.success(`تم العثور على ${response.data.data.length} نتيجة (Found ${response.data.data.length} results)`);
        }
      } else {
        setSearchResults([]);
        toast.error('فشل في البحث (Search failed)');
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      setSearchResults([]);
      
      if (error.response?.status === 422) {
        toast.error('خطأ في بيانات البحث (Search data error)');
      } else if (error.response?.status === 401) {
        toast.error('غير مصرح لك بالوصول (Unauthorized access)');
      } else {
        toast.error('فشل في البحث. يرجى المحاولة مرة أخرى (Search failed. Please try again)');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name || '',
      phone: patient.phone || '',
      age: patient.age?.toString() || '',
      gender: patient.gender || '',
      organization: patient.organization || '',
      doctor: patient.doctor || '',
      sample_type: patient.sample_type || '',
      case_type: patient.case_type || '',
      sample_size: patient.sample_size || '',
      number_of_samples: patient.number_of_samples?.toString() || '',
      day_of_week: patient.day_of_week || '',
      medical_history: patient.medical_history || '',
      previous_tests: patient.previous_tests || '',
      attendance_date: patient.attendance_date || '',
      delivery_date: patient.delivery_date || '',
      total_amount: patient.total_amount?.toString() || '',
      amount_paid: patient.amount_paid?.toString() || '',
      lab_number: patient.lab_number || patient.lab || '',
    });
    setSearchResults([]);
    setSearchValue('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('الاسم ورقم الموبايل مطلوبان (Name and phone are required)');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/api/patient-registration/submit', formData);
      
      if (response.data.success) {
        // Show success modal with credentials
        if (response.data.user_credentials) {
          setSuccessData({
            labNumber: response.data.lab_number,
            credentials: response.data.user_credentials
          });
          setShowSuccessModal(true);
        } else {
          toast.success(`تم تسجيل المريض بنجاح! رقم المختبر: ${response.data.lab_number}`);
        }
        
        // Reset form
        setFormData({
          name: '',
          phone: '',
          age: '',
          gender: '',
          organization: '',
          doctor: '',
          sample_type: '',
          case_type: '',
          sample_size: '',
          number_of_samples: '',
          day_of_week: '',
          medical_history: '',
          previous_tests: '',
          attendance_date: '',
          delivery_date: '',
          total_amount: '',
          amount_paid: '',
          lab_number: '',
        });
        setSelectedPatient(null);
      } else {
        toast.error(response.data.message || 'فشل في التسجيل (Registration failed)');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific error types
      if (error.response?.status === 422) {
        // Validation errors
        const errors = error.response.data.errors;
        if (errors) {
          Object.keys(errors).forEach(field => {
            toast.error(`${field}: ${errors[field][0]}`);
          });
        } else {
          toast.error(error.response.data.message || 'خطأ في البيانات المدخلة (Validation error)');
        }
      } else if (error.response?.status === 409) {
        // Conflict errors (like duplicate lab number)
        if (error.response.data.message?.includes('lab') || error.response.data.message?.includes('Lab')) {
          toast.error('رقم المختبر موجود بالفعل! يرجى استخدام رقم آخر (Lab number already exists! Please use a different number)');
        } else {
          toast.error(error.response.data.message || 'تعارض في البيانات (Data conflict)');
        }
      } else if (error.response?.status === 401) {
        toast.error('غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى (Unauthorized access. Please login again)');
      } else if (error.response?.status === 403) {
        toast.error('ليس لديك صلاحية للقيام بهذا الإجراء (You do not have permission to perform this action)');
      } else if (error.response?.status === 500) {
        toast.error('خطأ في الخادم. يرجى المحاولة مرة أخرى (Server error. Please try again)');
      } else {
        toast.error(error.response?.data?.message || 'فشل في التسجيل. يرجى المحاولة مرة أخرى (Registration failed. Please try again)');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      name: '',
      phone: '',
      age: '',
      gender: '',
      organization: '',
      doctor: '',
      sample_type: '',
      case_type: '',
      sample_size: '',
      number_of_samples: '',
      day_of_week: '',
      medical_history: '',
      previous_tests: '',
      attendance_date: '',
      delivery_date: '',
      total_amount: '',
      amount_paid: '',
      lab_number: '',
    });
    setSelectedPatient(null);
    setSearchResults([]);
    setSearchValue('');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
        {/* Beautiful Header */}
        <Box sx={{ 
          mb: 4, 
          textAlign: 'center',
          p: 4,
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Patient Entry Record +
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#666',
            fontWeight: 400,
            opacity: 0.8
          }}>
            Complete patient registration with modern interface
          </Typography>
        </Box>


        {/* Beautiful Search Section */}
        <Box sx={{ 
          mb: 4, 
          p: 4, 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            p: 3,
            background: 'linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%)',
            borderRadius: 3,
            boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)'
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#333',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              🔍 Search Section
            </Typography>
          </Box>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Search Type</InputLabel>
                <Select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  label="Search Type"
                  sx={{
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="lab_number">Lab Number</MenuItem>
                  <MenuItem value="mobile">Mobile Number</MenuItem>
                  <MenuItem value="name">Full Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={`Enter ${searchType === 'lab_number' ? 'Lab Number' : searchType === 'mobile' ? 'Mobile Number' : 'Full Name'}`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={handleSearch} 
                        disabled={searching}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                          }
                        }}
                      >
                        {searching ? <CircularProgress size={20} color="inherit" /> : <Search />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searching}
                fullWidth
                startIcon={searching ? <CircularProgress size={20} /> : <Search />}
                sx={{
                  height: 56,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                  }
                }}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {/* Beautiful Search Results */}
          {searchResults.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 700, 
                color: '#333',
                mb: 2
              }}>
                📋 Search Results:
              </Typography>
              {searchResults.map((patient) => (
                <Box 
                  key={patient.id} 
                  sx={{ 
                    mb: 2, 
                    p: 3,
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: '1px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                    }
                  }}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    <strong>{patient.name}</strong> - {patient.phone}
                    {patient.lab && ` - Lab: ${patient.lab}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Beautiful Patient Registration Form */}
        <Box sx={{ 
          p: 4, 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Organized Form Layout */}
          <Grid container spacing={4}>
            {/* Personal Information Section */}
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#333',
                mb: 3,
                pb: 1,
                borderBottom: '2px solid #667eea'
              }}>
                👤 Personal Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الاسم (Name)"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="الاسم"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="رقم الموبايل (Mobile Number)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                placeholder="رقم الموبايل"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="السن (Age)"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="السن"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: '1.4rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                👤 النوع (Gender/Type)
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '56px',
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    '& .MuiSelect-select': {
                      fontSize: '1.2rem',
                      padding: '16px 14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>اختر النوع</em>
                  </MenuItem>
                  <MenuItem value="male" sx={{ fontSize: '1.2rem' }}>ذكر (Male)</MenuItem>
                  <MenuItem value="female" sx={{ fontSize: '1.2rem' }}>أنثى (Female)</MenuItem>
                  <MenuItem value="other" sx={{ fontSize: '1.2rem' }}>آخر (Other)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Lab no"
                value={formData.lab_number}
                onChange={(e) => handleInputChange('lab_number', e.target.value)}
                placeholder="Lab no"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>

            {/* Medical Information Section */}
            <Grid item xs={12} sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#333',
                mb: 3,
                pb: 1,
                borderBottom: '2px solid #667eea'
              }}>
                🏥 Medical Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الجهة (Entity/Party)"
                value={formData.organization}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                placeholder="الجهة"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الدكتور المرسل (Referring Doctor)"
                value={formData.doctor}
                onChange={(e) => handleInputChange('doctor', e.target.value)}
                placeholder="الدكتور المرسل"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="هل يوجد تاريخ مرضي ؟ (Is there a medical history?)"
                value={formData.medical_history}
                onChange={(e) => handleInputChange('medical_history', e.target.value)}
                placeholder="نعم"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="هل سبق لك تحاليل باثولوجي (Have you had pathology tests before?)"
                value={formData.previous_tests}
                onChange={(e) => handleInputChange('previous_tests', e.target.value)}
                placeholder="نعم"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>

            {/* Sample Information Section */}
            <Grid item xs={12} sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#333',
                mb: 3,
                pb: 1,
                borderBottom: '2px solid #667eea'
              }}>
                🧪 Sample Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: '1.4rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                🧪 نوع العينة (Sample Type)
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.sample_type}
                  onChange={(e) => handleInputChange('sample_type', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '56px',
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    '& .MuiSelect-select': {
                      fontSize: '1.2rem',
                      padding: '16px 14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>اختر نوع العينة</em>
                  </MenuItem>
                  <MenuItem value="Pathology" sx={{ fontSize: '1.2rem' }}>Pathology</MenuItem>
                  <MenuItem value="Cytology" sx={{ fontSize: '1.2rem' }}>Cytology</MenuItem>
                  <MenuItem value="IHC" sx={{ fontSize: '1.2rem' }}>IHC</MenuItem>
                  <MenuItem value="Other" sx={{ fontSize: '1.2rem' }}>Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: '1.4rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                📊 نوع الحالة (Case Type)
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.case_type}
                  onChange={(e) => handleInputChange('case_type', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '56px',
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    '& .MuiSelect-select': {
                      fontSize: '1.2rem',
                      padding: '16px 14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>اختر نوع الحالة</em>
                  </MenuItem>
                  {testCategories.map((category) => (
                    <MenuItem key={category.id} value={category.name} sx={{ fontSize: '1.2rem' }}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: '1.4rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                📏 حجم العينة (Sample Size)
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.sample_size}
                  onChange={(e) => handleInputChange('sample_size', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '56px',
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    '& .MuiSelect-select': {
                      fontSize: '1.2rem',
                      padding: '16px 14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>اختر حجم العينة</em>
                  </MenuItem>
                  <MenuItem value="صغيرة جدا" sx={{ fontSize: '1.2rem' }}>صغيرة جدا (Very Small)</MenuItem>
                  <MenuItem value="صغيرة" sx={{ fontSize: '1.2rem' }}>صغيرة (Small)</MenuItem>
                  <MenuItem value="متوسطة" sx={{ fontSize: '1.2rem' }}>متوسطة (Medium)</MenuItem>
                  <MenuItem value="كبيرة" sx={{ fontSize: '1.2rem' }}>كبيرة (Large)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: '1.4rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                🔢 عدد العينات (Number of Samples)
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.number_of_samples}
                  onChange={(e) => handleInputChange('number_of_samples', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '56px',
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    '& .MuiSelect-select': {
                      fontSize: '1.2rem',
                      padding: '16px 14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>اختر عدد العينات</em>
                  </MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <MenuItem key={num} value={num.toString()} sx={{ fontSize: '1.2rem' }}>{num}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                fontSize: '1.4rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                📅 اليوم (Day)
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={formData.day_of_week}
                  onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                  displayEmpty
                  sx={{
                    height: '56px',
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    '& .MuiSelect-select': {
                      fontSize: '1.2rem',
                      padding: '16px 14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>اختر اليوم</em>
                  </MenuItem>
                  <MenuItem value="السبت" sx={{ fontSize: '1.2rem' }}>السبت (Saturday)</MenuItem>
                  <MenuItem value="الأحد" sx={{ fontSize: '1.2rem' }}>الأحد (Sunday)</MenuItem>
                  <MenuItem value="الاثنين" sx={{ fontSize: '1.2rem' }}>الاثنين (Monday)</MenuItem>
                  <MenuItem value="الثلاثاء" sx={{ fontSize: '1.2rem' }}>الثلاثاء (Tuesday)</MenuItem>
                  <MenuItem value="الأربعاء" sx={{ fontSize: '1.2rem' }}>الأربعاء (Wednesday)</MenuItem>
                  <MenuItem value="الخميس" sx={{ fontSize: '1.2rem' }}>الخميس (Thursday)</MenuItem>
                  <MenuItem value="الجمعة" sx={{ fontSize: '1.2rem' }}>الجمعة (Friday)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Dates Section */}
            <Grid item xs={12} sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#333',
                mb: 3,
                pb: 1,
                borderBottom: '2px solid #667eea'
              }}>
                📅 Dates & Scheduling
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="تاريخ الحضور (Attendance Date)"
                value={formData.attendance_date}
                onChange={(e) => handleInputChange('attendance_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="ميعاد التسليم (Delivery Date)"
                value={formData.delivery_date}
                onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>

            {/* Billing Section */}
            <Grid item xs={12} sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#333',
                mb: 3,
                pb: 1,
                borderBottom: '2px solid #667eea'
              }}>
                💰 Billing Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="أجمالي المبلغ (Total Amount)"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', e.target.value)}
                placeholder="اجمالي المبلغ"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="المبلغ المدفوع (Amount Paid)"
                value={formData.amount_paid}
                onChange={(e) => handleInputChange('amount_paid', e.target.value)}
                placeholder="المبلغ المدفوع"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                    },
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Beautiful Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            justifyContent: 'center', 
            mt: 6,
            flexWrap: 'wrap'
          }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              size="large"
              sx={{ 
                minWidth: 250,
                height: 60,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3d8bfe 0%, #00d4fe 100%)',
                  boxShadow: '0 12px 35px rgba(79, 172, 254, 0.6)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: '#ccc',
                  boxShadow: 'none',
                  transform: 'none',
                }
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : '💾 الحفظ و التسجيل (Save and Register)'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={submitting}
              size="large"
              sx={{ 
                minWidth: 180,
                height: 60,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 4,
                borderColor: '#667eea',
                borderWidth: 2,
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                }
              }}
            >
              🔄 Clear
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Success Modal */}
      <Dialog
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontSize: '1.8rem', 
          fontWeight: 700,
          pb: 1
        }}>
          ✅ تم التسجيل بنجاح!
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Paper sx={{ 
            p: 3, 
            background: 'rgba(255, 255, 255, 0.95)', 
            color: '#333',
            borderRadius: 3,
            mb: 3
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: '#667eea', 
              mb: 2,
              textAlign: 'center'
            }}>
              📋 Patient Registration Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                🏥 Lab Number:
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: '#667eea',
                textAlign: 'center',
                p: 2,
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: 2,
                border: '2px solid #667eea'
              }}>
                {successData?.labNumber}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: '#667eea', 
              mb: 2,
              textAlign: 'center'
            }}>
              🔐 Login Credentials
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                👤 Username:
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: '#333',
                textAlign: 'center',
                p: 1.5,
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 2,
                fontFamily: 'monospace'
              }}>
                {successData?.credentials.username}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                🔑 Password:
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: '#333',
                textAlign: 'center',
                p: 1.5,
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 2,
                fontFamily: 'monospace'
              }}>
                {successData?.credentials.password}
              </Typography>
            </Box>
            
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              background: 'rgba(76, 175, 80, 0.1)', 
              borderRadius: 2,
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              <Typography variant="body2" sx={{ 
                color: '#2e7d32', 
                fontWeight: 600,
                textAlign: 'center'
              }}>
                💡 Please save these credentials securely. The patient can use them to access their portal.
              </Typography>
            </Box>
          </Paper>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => setShowSuccessModal(false)}
            variant="contained"
            size="large"
            sx={{
              minWidth: 200,
              height: 50,
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            ✅ Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientRegistration;
