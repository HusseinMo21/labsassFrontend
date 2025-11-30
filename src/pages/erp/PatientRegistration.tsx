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
  Preview,
  Edit,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from '../../config/axios';
import { config } from '../../config/environment';

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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sampleData, setSampleData] = useState<any>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [updatingPatient, setUpdatingPatient] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [patientCredentials, setPatientCredentials] = useState<{
    username: string;
    password: string;
    visitId?: number;
    labNumber?: string;
    patientId?: number;
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

  // Function to print receipt - opens print dialog directly without downloading
  const handleReceiptPrint = async () => {
    if (!patientCredentials?.visitId) return;
    
    setLoadingReceipt(true);
    try {
      const timestamp = new Date().getTime();
      const pdfUrl = `${config.API_ORIGIN}/api/check-in/visits/${patientCredentials.visitId}/unpaid-invoice-receipt?t=${timestamp}&_prevent_download=1&_inline=1`;
      
      // Always use axios with blob to prevent downloads and IDM interception
      const response = await axios.get(pdfUrl, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      // Create blob URL from response (blob URLs prevent downloads)
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create hidden iframe for printing (avoids IDM and download)
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.display = 'none';
      printFrame.src = blobUrl;
      
      document.body.appendChild(printFrame);
      
      // Wait for PDF to load, then trigger print
      printFrame.onload = () => {
        setTimeout(() => {
          try {
            if (printFrame.contentWindow) {
              printFrame.contentWindow.focus();
              printFrame.contentWindow.print();
            }
          } catch (error) {
            console.error('Print error:', error);
            toast.error('Failed to print. Please try again.');
          }
          
          // Clean up after printing
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
            window.URL.revokeObjectURL(blobUrl);
          }, 2000);
        }, 500);
      };
      
      // Handle errors
      printFrame.onerror = () => {
        toast.error('Failed to load PDF for printing');
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
        window.URL.revokeObjectURL(blobUrl);
      };
      
      toast.success('Opening print dialog...');
    } catch (error: any) {
      console.error('Failed to print receipt:', error);
      toast.error('Failed to print receipt: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Function to preview receipt - opens modal with PDF view without downloading
  const handlePreviewReceipt = async () => {
    if (!patientCredentials?.visitId) return;
    
    setLoadingReceipt(true);
    setReceiptPreviewUrl(null); // Reset previous URL
    
    try {
      const timestamp = new Date().getTime();
      const pdfUrl = `${config.API_ORIGIN}/api/check-in/visits/${patientCredentials.visitId}/unpaid-invoice-receipt?t=${timestamp}&_prevent_download=1&_inline=1`;
      
      // Always use axios with blob to prevent downloads and IDM interception
      const response = await axios.get(pdfUrl, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      // Create blob URL from response (blob URLs prevent downloads)
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Set blob URL for iframe (blob URLs don't trigger downloads)
      setReceiptPreviewUrl(blobUrl);
      setShowPreviewModal(true);
      toast.success('Receipt preview loaded');
    } catch (error: any) {
      console.error('Failed to open preview:', error);
      toast.error('Failed to open preview: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Function to load patient data for editing
  const handleLoadPatientForEdit = async () => {
    if (!patientCredentials?.patientId || !patientCredentials?.visitId) {
      toast.error('Patient ID or Visit ID not found');
      return;
    }

    try {
      // Fetch both patient and visit data
      const [patientResponse, visitResponse] = await Promise.all([
        axios.get(`/api/patients/${patientCredentials.patientId}`),
        axios.get(`/api/visits/${patientCredentials.visitId}`)
      ]);

      const patient = patientResponse.data;
      const visit = visitResponse.data;

      // Parse visit metadata to get payment details
      let metadata: any = {};
      let paymentDetails: any = {};
      try {
        metadata = visit.metadata ? (typeof visit.metadata === 'string' ? JSON.parse(visit.metadata) : visit.metadata) : {};
        paymentDetails = metadata.payment_details || {};
      } catch (e) {
        console.error('Failed to parse visit metadata:', e);
      }

      // Helper function to format date for input field
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
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

      // Get payment amounts from visit metadata or patient record
      const totalAmount = visit.total_amount || patient.total_amount || 0;
      const amountPaidCash = paymentDetails.amount_paid_cash || patient.amount_paid_cash || 0;
      const amountPaidCard = paymentDetails.amount_paid_card || patient.amount_paid_card || 0;
      const additionalPaymentMethod = paymentDetails.additional_payment_method || patient.additional_payment_method || 'Fawry';

      // Get patient data from visit metadata if available
      const patientDataFromMetadata = metadata.patient_data || {};

      // Fill the form with patient data (prioritize visit metadata, then patient record)
      setFormData({
        name: patient.name || patientDataFromMetadata.name || '',
        age: patient.age?.toString() || patientDataFromMetadata.age?.toString() || '',
        phone: patient.phone || patientDataFromMetadata.phone || '',
        lab_number: patient.lab || patient.lab_number || patientDataFromMetadata.lab_number || '',
        gender: mapGender(patient.gender || patientDataFromMetadata.gender),
        organization: patient.organization || patientDataFromMetadata.organization || 
                     (typeof patient.organization_id === 'string' ? patient.organization_id : '') || '',
        attendance_day: patient.day_of_week || patientDataFromMetadata.attendance_day || 
                       (visit.visit_date ? getDayNameFromDate(visit.visit_date) : 'السبت'),
        delivery_day: patient.day_of_week || patientDataFromMetadata.delivery_day || 
                     (visit.expected_delivery_date ? getDayNameFromDate(visit.expected_delivery_date) : 'السبت'),
        delivery_date: formatDateForInput(visit.expected_delivery_date || patient.delivery_date || patientDataFromMetadata.delivery_date),
        referring_doctor: patient.doctor || patientDataFromMetadata.doctor || patientDataFromMetadata.referring_doctor || '',
        sample_size: patient.sample_size || patientDataFromMetadata.sample_size || 'صغيرة جدا',
        number_of_samples: patient.number_of_samples?.toString() || patientDataFromMetadata.number_of_samples?.toString() || '',
        attendance_date: formatDateForInput(visit.visit_date || patient.attendance_date || patientDataFromMetadata.attendance_date),
        previous_tests: patient.previous_tests || patientDataFromMetadata.previous_tests || 'نعم',
        sample_type: patient.sample_type || patientDataFromMetadata.sample_type || 'Pathology',
        medical_history: patient.medical_history || patientDataFromMetadata.medical_history || '',
        total_amount: totalAmount.toString(),
        amount_paid_cash: amountPaidCash.toString(),
        amount_paid_card: amountPaidCard.toString(),
        additional_payment_method: additionalPaymentMethod,
      });

      setIsEditing(true);
    } catch (error: any) {
      console.error('Failed to load patient data:', error);
      toast.error('Failed to load patient data for editing: ' + (error.response?.data?.message || error.message));
    }
  };

  // Function to handle patient update
  const handleUpdatePatient = async () => {
    if (!patientCredentials?.patientId) {
      toast.error('Patient ID not found');
      return;
    }

    setUpdatingPatient(true);
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

      // Prepare data for update
      const patientData: any = {
        name: formData.name,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: mapGenderForBackend(formData.gender),
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
        amount_paid: getTotalPaidAmount(),
        lab_number: formData.lab_number,
      };

      // Only include additional payment method and amount if they have values
      const additionalPaymentAmount = parseFloat(formData.amount_paid_card) || 0;
      if (additionalPaymentAmount > 0 && formData.additional_payment_method) {
        patientData.amount_paid_card = additionalPaymentAmount;
        patientData.additional_payment_method = formData.additional_payment_method;
      }

      // Update patient
      await axios.put(`/api/patients/${patientCredentials.patientId}`, patientData);
      
      // Also update visit if payment information changed and visitId exists
      if (patientCredentials.visitId) {
        const totalAmount = parseFloat(formData.total_amount) || 0;
        const totalPaid = getTotalPaidAmount();
        const remainingBalance = Math.max(0, totalAmount - totalPaid);
        
        // Determine payment status
        let billingStatus = 'unpaid';
        if (remainingBalance <= 0 && totalAmount > 0) {
          billingStatus = 'paid';
        } else if (totalPaid > 0) {
          billingStatus = 'partial';
        }

        // Get existing visit metadata
        try {
          const visitResponse = await axios.get(`/api/visits/${patientCredentials.visitId}`);
          const visit = visitResponse.data;
          const metadata = visit.metadata ? (typeof visit.metadata === 'string' ? JSON.parse(visit.metadata) : visit.metadata) : {};
          
          // Update patient data in metadata
          const patientData = metadata.patient_data || {};
          patientData.name = formData.name;
          patientData.age = parseInt(formData.age);
          patientData.phone = formData.phone;
          patientData.gender = mapGenderForBackend(formData.gender);
          patientData.organization = formData.organization;
          patientData.doctor = formData.referring_doctor;
          patientData.referring_doctor = formData.referring_doctor;
          patientData.sample_type = formData.sample_type;
          patientData.sample_size = formData.sample_size;
          patientData.number_of_samples = parseInt(formData.number_of_samples) || 1;
          patientData.attendance_day = formData.attendance_day;
          patientData.delivery_day = formData.delivery_day;
          patientData.attendance_date = formData.attendance_date;
          patientData.delivery_date = formData.delivery_date;
          patientData.medical_history = formData.medical_history;
          patientData.previous_tests = formData.previous_tests;
          patientData.lab_number = formData.lab_number;
          metadata.patient_data = patientData;
          
          // Update payment details in metadata
          const paymentDetails = metadata.payment_details || {};
          paymentDetails.amount_paid_cash = parseFloat(formData.amount_paid_cash) || 0;
          paymentDetails.amount_paid_card = additionalPaymentAmount;
          paymentDetails.additional_payment_method = formData.additional_payment_method;
          paymentDetails.total_paid = totalPaid;
          metadata.payment_details = paymentDetails;
          
          // Update financial data in metadata
          const financialData = metadata.financial_data || {};
          financialData.total_amount = totalAmount;
          financialData.final_amount = totalAmount;
          metadata.financial_data = financialData;
          
          // Update visit
          await axios.put(`/api/visits/${patientCredentials.visitId}`, {
            visit_date: formData.attendance_date || visit.visit_date,
            expected_delivery_date: formData.delivery_date || visit.expected_delivery_date,
            total_amount: totalAmount,
            upfront_payment: totalPaid,
            billing_status: billingStatus,
            metadata: JSON.stringify(metadata),
          });
        } catch (visitError) {
          console.error('Failed to update visit:', visitError);
          // Don't fail the whole operation if visit update fails
        }
      }
      
      toast.success('Patient updated successfully!');
      setIsEditing(false);
      
      // Refresh the receipt preview by fetching new PDF
      // Add a small delay to ensure database is updated
      if (patientCredentials.visitId) {
        setTimeout(async () => {
          try {
            // Clean up old blob URL
            if (receiptPreviewUrl) {
              window.URL.revokeObjectURL(receiptPreviewUrl);
            }
            
            // Fetch updated PDF with timestamp to avoid cache
            const timestamp = new Date().getTime();
            const response = await axios.get(`/api/check-in/visits/${patientCredentials.visitId}/unpaid-invoice-receipt?t=${timestamp}&_refresh=1`, {
              responseType: 'blob'
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setReceiptPreviewUrl(url);
          } catch (error) {
            console.error('Failed to refresh receipt preview:', error);
            toast.error('Failed to refresh receipt preview');
          }
        }, 500); // Wait 500ms for database to update
      }
    } catch (error: any) {
      console.error('Failed to update patient:', error);
      const message = error.response?.data?.message || 'Failed to update patient';
      toast.error(message);
    } finally {
      setUpdatingPatient(false);
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
        
        // Get the latest visit if available
        const latestVisit = patient.visits && patient.visits.length > 0 ? patient.visits[0] : null;
        
        // Parse visit metadata if available
        let visitMetadata: any = {};
        let patientDataFromMetadata: any = {};
        let paymentDetails: any = {};
        
        if (latestVisit && latestVisit.metadata) {
          try {
            visitMetadata = typeof latestVisit.metadata === 'string' 
              ? JSON.parse(latestVisit.metadata) 
              : latestVisit.metadata;
            patientDataFromMetadata = visitMetadata.patient_data || {};
            paymentDetails = visitMetadata.payment_details || {};
          } catch (e) {
            console.error('Failed to parse visit metadata:', e);
          }
        }
        
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

        // Get attendance date from visit or patient
        const attendanceDate = latestVisit?.visit_date 
          || patientDataFromMetadata.attendance_date 
          || patient.attendance_date 
          || '';
        
        // Get delivery date from visit or patient
        const deliveryDate = latestVisit?.expected_delivery_date 
          || patientDataFromMetadata.delivery_date 
          || patient.delivery_date 
          || '';
        
        // Get referring doctor from visit metadata, patient data, or patient record
        const referringDoctor = patientDataFromMetadata.referring_doctor 
          || patientDataFromMetadata.doctor 
          || latestVisit?.referring_doctor 
          || patient.doctor 
          || '';
        
        // Get number of samples from visit metadata or patient record
        const numberOfSamples = patientDataFromMetadata.number_of_samples 
          || patient.number_of_samples?.toString() 
          || '';
        
        // Get payment amounts from visit metadata or patient record
        const amountPaidCash = paymentDetails.amount_paid_cash 
          || latestVisit?.upfront_payment 
          || patient.amount_paid_cash?.toString() 
          || '';
        
        const amountPaidCard = paymentDetails.amount_paid_card 
          || patient.amount_paid_card?.toString() 
          || '';
        
        const additionalPaymentMethod = paymentDetails.additional_payment_method 
          || patient.additional_payment_method 
          || 'Fawry';
        
        const totalAmount = latestVisit?.total_amount 
          || patientDataFromMetadata.total_amount 
          || patient.total_amount?.toString() 
          || '';

        // Fill the form with existing patient data (prioritize visit data, then patient data)
        setFormData({
          name: patient.name || '',
          age: patient.age?.toString() || '',
          phone: patient.phone || '',
          lab_number: patient.lab || patient.lab_number || searchValue,
          gender: mapGender(patient.gender),
          organization: patient.organization || '',
          attendance_day: attendanceDate ? getDayNameFromDate(attendanceDate) : (patient.day_of_week || 'السبت'),
          delivery_day: deliveryDate ? getDayNameFromDate(deliveryDate) : (patient.day_of_week || 'السبت'),
          delivery_date: formatDateForInput(deliveryDate),
          referring_doctor: referringDoctor,
          sample_size: patientDataFromMetadata.sample_size || patient.sample_size || 'صغيرة جدا',
          number_of_samples: numberOfSamples,
          attendance_date: formatDateForInput(attendanceDate),
          previous_tests: patient.previous_tests || 'نعم',
          sample_type: patientDataFromMetadata.sample_type || patient.sample_type || 'Pathology',
          medical_history: patient.medical_history || '',
          total_amount: totalAmount,
          amount_paid_cash: amountPaidCash.toString(),
          amount_paid_card: amountPaidCard.toString(),
          additional_payment_method: additionalPaymentMethod,
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
      console.log('Financial data being sent:', {
        total_amount: patientData.total_amount,
        amount_paid_cash: patientData.amount_paid_cash,
        amount_paid_card: patientData.amount_paid_card,
        amount_paid: patientData.amount_paid,
        additional_payment_method: patientData.additional_payment_method,
      });

      // Submit to backend
      const response = await axios.post('/api/patients', patientData);
      
      console.log('Backend response:', response.data);
      
      toast.success('Patient registered successfully!');
      console.log('Patient registration response:', response.data);
      
      // Show credentials modal
        if (response.data.user_credentials) {
        setPatientCredentials({
          username: response.data.user_credentials.username,
          password: response.data.user_credentials.password,
          visitId: response.data.visit_id,
          labNumber: response.data.lab_number,
          patientId: response.data.patient_id,
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
              startIcon={<Preview />}
              onClick={handlePreviewReceipt}
              sx={{ 
                backgroundColor: '#4caf50',
                color: 'white',
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                minWidth: 140,
                '&:hover': {
                  backgroundColor: '#45a049',
                }
              }}
            >
              معاينة الإيصال
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Print />}
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
              startIcon={<Science />}
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

        {/* Receipt Preview Modal */}
        <Dialog 
          open={showPreviewModal} 
          onClose={() => {
            setShowPreviewModal(false);
            setIsEditing(false);
            // Clean up blob URL when closing to free memory
            if (receiptPreviewUrl && receiptPreviewUrl.startsWith('blob:')) {
              try {
                window.URL.revokeObjectURL(receiptPreviewUrl);
              } catch (e) {
                // Ignore errors when revoking URL
              }
            }
            setReceiptPreviewUrl(null);
          }} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              height: '90vh',
              maxHeight: '90vh',
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#1976d2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Preview sx={{ fontSize: 28 }} />
              <Typography variant="h6">معاينة الإيصال</Typography>
            </Box>
            {!isEditing && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Edit />}
                onClick={handleLoadPatientForEdit}
                disabled={loadingReceipt}
                sx={{ 
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                }}
              >
                تعديل
              </Button>
            )}
          </DialogTitle>
          <DialogContent sx={{ p: 0, position: 'relative', height: 'calc(90vh - 120px)' }}>
            {isEditing ? (
              <Box sx={{ 
                width: '100%', 
                p: 1, 
                overflowY: 'auto',
                height: '100%'
              }}>
                <Typography variant="caption" sx={{ mb: 1, color: '#d32f2f', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>
                  تعديل بيانات المريض
                </Typography>
                <Grid container spacing={0.5}>
                  {/* Name */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      الاسم *
                    </Typography>
                    <TextField
                      fullWidth
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Age */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      السن *
                    </Typography>
                    <TextField
                      fullWidth
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      required
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Phone */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      رقم الموبايل
                    </Typography>
                    <TextField
                      fullWidth
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Organization */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      الجهة
                    </Typography>
                    <TextField
                      fullWidth
                      value={formData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Gender */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      النوع
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        sx={{ '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' } }}
                      >
                        <MenuItem value="ذكر">ذكر</MenuItem>
                        <MenuItem value="أنثى">أنثى</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Lab Number */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      Lab Number
                    </Typography>
                    <TextField
                      fullWidth
                      value={formData.lab_number}
                      onChange={(e) => handleInputChange('lab_number', e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Referring Doctor */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      الدكتور المرسل
                    </Typography>
                    <TextField
                      fullWidth
                      value={formData.referring_doctor}
                      onChange={(e) => handleInputChange('referring_doctor', e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Attendance Date */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      تاريخ الحضور
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={formData.attendance_date}
                      onChange={(e) => handleDateChange('attendance_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Attendance Day */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      يوم الحضور
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.attendance_day}
                        onChange={(e) => handleInputChange('attendance_day', e.target.value)}
                        sx={{ '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' } }}
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
                  {/* Delivery Date */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      ميعاد التسليم
                    </Typography>
                    <TextField
                      fullWidth
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => handleDateChange('delivery_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Delivery Day */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      يوم التسليم
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.delivery_day}
                        onChange={(e) => handleInputChange('delivery_day', e.target.value)}
                        sx={{ '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' } }}
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
                  {/* Number of Samples */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      عدد العينات
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={formData.number_of_samples}
                      onChange={(e) => handleInputChange('number_of_samples', e.target.value)}
                      inputProps={{ min: 1, max: 10 }}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Sample Size */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      حجم العينة
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.sample_size}
                        onChange={(e) => handleInputChange('sample_size', e.target.value)}
                        sx={{ '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' } }}
                      >
                        <MenuItem value="صغيرة جدا">صغيرة جدا</MenuItem>
                        <MenuItem value="صغيرة">صغيرة</MenuItem>
                        <MenuItem value="متوسطة">متوسطة</MenuItem>
                        <MenuItem value="كبيرة">كبيرة</MenuItem>
                        <MenuItem value="كبيرة جدا">كبيرة جدا</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Sample Type */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      نوع العينة
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.sample_type}
                        onChange={(e) => handleInputChange('sample_type', e.target.value)}
                        sx={{ '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' } }}
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
                  {/* Previous Tests */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      هل سبق لك تحاليل باثولوجي
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.previous_tests}
                        onChange={(e) => handleInputChange('previous_tests', e.target.value)}
                        sx={{ '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' } }}
                      >
                        <MenuItem value="نعم">نعم</MenuItem>
                        <MenuItem value="لا">لا</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Total Amount */}
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      إجمالي المبلغ
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={formData.total_amount}
                      onChange={(e) => handleInputChange('total_amount', e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Amount Paid Cash */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      المبلغ المدفوع نقداً
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={formData.amount_paid_cash}
                      onChange={(e) => handleInputChange('amount_paid_cash', e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Amount Paid Card */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      المبلغ المدفوع ب {formData.additional_payment_method}
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={formData.amount_paid_card}
                      onChange={(e) => handleInputChange('amount_paid_card', e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                  {/* Payment Method */}
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      طريقة الدفع الإضافية
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.additional_payment_method}
                        onChange={(e) => handleInputChange('additional_payment_method', e.target.value)}
                        sx={{ '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' } }}
                      >
                        <MenuItem value="Fawry">Fawry</MenuItem>
                        <MenuItem value="InstaPay">InstaPay</MenuItem>
                        <MenuItem value="VodafoneCash">VodafoneCash</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Medical History */}
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                      التاريخ المرضي
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={1.5}
                      value={formData.medical_history}
                      onChange={(e) => handleInputChange('medical_history', e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative', 
                backgroundColor: '#f5f5f5' 
              }}>
                {receiptPreviewUrl ? (
                  <iframe
                    id="receipt-preview-iframe"
                    src={receiptPreviewUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      backgroundColor: '#f5f5f5',
                    }}
                    title="Receipt Preview"
                    onLoad={() => {
                      console.log('PDF iframe loaded successfully');
                    }}
                    onError={() => {
                      console.error('PDF iframe failed to load');
                      toast.error('Failed to load PDF. Please try again.');
                    }}
                  />
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <CircularProgress size={60} />
                    <Typography variant="body1" color="text.secondary">
                      Loading receipt preview...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  disabled={updatingPatient}
                  sx={{ 
                    borderColor: '#666',
                    color: '#666',
                    borderRadius: 1,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    minWidth: 120,
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdatePatient}
                  disabled={updatingPatient}
                  startIcon={updatingPatient ? <CircularProgress size={20} /> : <SaveIcon />}
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
                  {updatingPatient ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Print />}
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
                  variant="outlined"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setIsEditing(false);
                  }}
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
              </>
            )}
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
                          <strong>Attendance Date:</strong> {sampleLabel.attendance_date || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Delivery Date:</strong> {sampleLabel.delivery_date || 'N/A'}
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
                            <strong>Attendance Date:</strong> ${sampleLabel.attendance_date || 'N/A'}
                          </div>
                          <div style="margin-bottom: 5px;">
                            <strong>Delivery Date:</strong> ${sampleLabel.delivery_date || 'N/A'}
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