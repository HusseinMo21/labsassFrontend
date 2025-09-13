import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Badge,
  Tooltip,
  LinearProgress,
  InputAdornment,
  Fade,
  Slide,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add,
  Remove,
  Receipt,
  Print,
  LocalShipping,
  CheckCircle,
  Person,
  Science,
  AttachMoney,
  Search,
  Phone,
  Email,
  Close,
  Payment,
  ShoppingCart,
  Assignment,
  LocalHospital,
  Cancel,
  ArrowBack,
  NavigateNext,
  NavigateBefore,
  Done,
  Edit,
  MonetizationOn,
  CreditCard,
  AccountBalance,
  ExpandMore,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Patient {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface TestCategory {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

interface CustomTest {
  id: string; // temporary ID for frontend
  test_category_id: number;
  category_name: string;
  custom_test_name: string;
  custom_price: number;
  discount_percentage: number;
  final_price: number;
}

const CheckIn: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Patient state
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Test state
  const [availableCategories, setAvailableCategories] = useState<TestCategory[]>([]);
  const [selectedTests, setSelectedTests] = useState<CustomTest[]>([]);
  
  // Current test form state
  const [currentTestForm, setCurrentTestForm] = useState({
    test_category_id: '',
    custom_test_name: '',
    custom_price: 0,
    discount_percentage: 0,
  });
  
  // Billing state
  const [paymentForm, setPaymentForm] = useState({
    upfront_payment: 0,
    payment_method: 'cash',
    notes: '',
    discount_amount: 0,
    discount_percentage: 0,
    insurance_provider: '',
    insurance_policy_number: '',
    insurance_claim_number: '',
    expected_delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
  });
  
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [currentVisit, setCurrentVisit] = useState<any>(null);
  const [labelData, setLabelData] = useState<any>(null);

  const steps = [
    { label: 'Patient Selection', icon: <Person />, description: 'Find or register patient' },
    { label: 'Test Selection', icon: <Science />, description: 'Choose lab tests' },
    { label: 'Billing & Payment', icon: <MonetizationOn />, description: 'Complete payment' },
  ];

  useEffect(() => {
    // Fetch CSRF token when component loads
    const initializeCSRF = async () => {
      try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF cookie set for CheckIn');
      } catch (error) {
        console.error('Failed to set CSRF cookie:', error);
      }
    };
    
    initializeCSRF();
    fetchTestCategories();
  }, []);

  useEffect(() => {
    if (patientQuery.length >= 2) {
      searchPatients();
    } else {
      setPatientResults([]);
    }
  }, [patientQuery]);

  const fetchTestCategories = async () => {
    try {
      const response = await axios.get('/api/check-in/test-categories');
      console.log('Categories response:', response.data);
      if (response.data.success && response.data.data) {
        setAvailableCategories(response.data.data);
      } else {
        setAvailableCategories([]);
      }
    } catch (error) {
      console.error('Failed to fetch test categories:', error);
      setAvailableCategories([]);
    }
  };

  const searchPatients = async () => {
    try {
      setSearching(true);
      const response = await axios.get('/api/check-in/patients/search', {
        params: { query: patientQuery }
      });
      // Backend returns {patients: [...]}, so we need to access response.data.patients
      const patients = response.data?.patients || response.data || [];
      setPatientResults(Array.isArray(patients) ? patients : []);
    } catch (error) {
      console.error('Failed to search patients:', error);
      setPatientResults([]);
      toast.error('Failed to search patients. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddTest = () => {
    if (!currentTestForm.test_category_id || !currentTestForm.custom_test_name || currentTestForm.custom_price <= 0) {
      toast.error('Please fill in all test details');
      return;
    }

    const selectedCategory = availableCategories.find(cat => cat.id.toString() === currentTestForm.test_category_id);
    if (!selectedCategory) {
      toast.error('Please select a valid category');
      return;
    }

    const finalPrice = currentTestForm.custom_price - (currentTestForm.custom_price * currentTestForm.discount_percentage / 100);

    const newTest: CustomTest = {
      id: `temp_${Date.now()}_${Math.random()}`,
      test_category_id: parseInt(currentTestForm.test_category_id),
      category_name: selectedCategory.name,
      custom_test_name: currentTestForm.custom_test_name,
      custom_price: currentTestForm.custom_price,
      discount_percentage: currentTestForm.discount_percentage,
      final_price: finalPrice,
    };

    setSelectedTests([...selectedTests, newTest]);
    
    // Reset form
    setCurrentTestForm({
      test_category_id: '',
      custom_test_name: '',
      custom_price: 0,
      discount_percentage: 0,
    });

    toast.success('Test added successfully');
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(test => test.id !== testId));
  };



  const calculateTotal = () => {
    return selectedTests.reduce((sum, test) => sum + test.final_price, 0);
  };

  const calculateFinalAmount = () => {
    const total = calculateTotal();
    const discount = paymentForm.discount_amount || 0;
    return Math.max(0, total - discount);
  };

  const calculateBalance = () => {
    return calculateFinalAmount() - paymentForm.upfront_payment;
  };

  const calculateMinimumUpfront = () => {
    return Math.ceil(calculateFinalAmount() * 0.5); // 50% minimum
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePrintLabel = async () => {
    if (!currentVisit) {
      toast.error('No visit data available');
      return;
    }
    
    console.log('Current visit object:', currentVisit);
    console.log('Visit ID:', currentVisit.id);
    
    // Try different possible ID fields
    const visitId = currentVisit.id || currentVisit.visit_id || currentVisit.visitId;
    
    if (!visitId) {
      console.error('No visit ID found in currentVisit:', currentVisit);
      toast.error('Visit ID not found');
      return;
    }
    
    try {
      console.log(`Making request to: /api/check-in/visits/${visitId}/sample-label`);
      const response = await axios.get(`/api/check-in/visits/${visitId}/sample-label`);
      console.log('Sample label response:', response.data);
      setLabelData(response.data.label_data);
      setShowLabelModal(true);
      toast.success('Sample labels generated successfully');
    } catch (error) {
      console.error('Failed to generate sample label:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Failed to generate sample label: ${error.response?.data?.message || error.message}`);
    }
  };

  const printSampleLabel = () => {
    if (!labelData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }

    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sample Labels</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .label { 
            border: 2px solid #000; 
            padding: 15px; 
            margin: 10px 0; 
            width: 300px; 
            display: inline-block;
            vertical-align: top;
            page-break-inside: avoid;
          }
          .label-header { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
          .label-row { margin: 5px 0; }
          .barcode { 
            font-family: 'Courier New', monospace; 
            font-size: 14px; 
            font-weight: bold; 
            text-align: center; 
            margin-top: 10px;
            padding: 5px;
            background: #f0f0f0;
          }
          @media print {
            .label { margin: 5px; }
          }
        </style>
      </head>
      <body>
        <h2>Sample Labels - <span style="direction: rtl; text-align: right; unicode-bidi: bidi-override; font-weight: bold;">${labelData.patient_name}</span></h2>
        <p><strong>Date:</strong> ${labelData.visit_date} | <strong>Receipt:</strong> ${labelData.visit_id}</p>
        
        ${labelData.test_labels?.map((testLabel: any) => `
          <div class="label">
            <div class="label-header">LABORATORY SAMPLE</div>
            <div class="label-row"><strong>Test:</strong> ${testLabel.test_name}</div>
            <div class="label-row"><strong>Patient:</strong> <span style="direction: rtl; text-align: right; unicode-bidi: bidi-override; font-weight: bold;">${testLabel.patient_name}</span></div>
            <div class="label-row"><strong>ID:</strong> ${testLabel.patient_id}</div>
            <div class="label-row"><strong>Date:</strong> ${testLabel.sample_date}</div>
            <div class="label-row"><strong>Time:</strong> ${testLabel.sample_time}</div>
            <div class="barcode">${testLabel.barcode}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(labelHTML);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleNavigateToReceipts = () => {
    // Navigate to receipts page with patient filter
    const patientId = currentVisit?.patient?.id || selectedPatient?.id;
    if (patientId) {
      navigate(`/receipts?patient=${patientId}`);
    } else {
      navigate('/receipts');
    }
    setShowReceiptModal(false);
  };

  const handlePrintReceipt = () => {
    const receiptData = currentVisit?.receipt_data || {
      patient_name: selectedPatient?.name || 'N/A',
      patient_phone: selectedPatient?.phone || 'N/A',
      tests: selectedTests.map(test => ({
        name: test.name,
        price: test.price,
      })),
      total_amount: calculateTotal(),
      discount_amount: 0,
      final_amount: calculateTotal(),
      upfront_payment: paymentForm.upfront_payment,
      remaining_balance: calculateBalance(),
      payment_method: paymentForm.payment_method,
      expected_delivery_date: new Date().toISOString().split('T')[0],
      barcode: 'LAB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      check_in_by: 'Staff Member',
      check_in_at: new Date().toLocaleString(),
      receipt_number: 'RCP-' + Date.now(),
      date: new Date().toLocaleDateString(),
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptData.receipt_number}</title>
        <style>
          @page { 
            size: 80mm 200mm; 
            margin: 5mm; 
          }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            line-height: 1.2; 
            margin: 0; 
            padding: 0; 
            width: 70mm;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 8px; 
          }
          .header h1 { 
            font-size: 14px; 
            margin: 0 0 4px 0; 
            font-weight: bold;
          }
          .header p { 
            margin: 2px 0; 
            font-size: 10px; 
          }
          .section { 
            margin-bottom: 8px; 
          }
          .section h3 { 
            font-size: 11px; 
            margin: 0 0 4px 0; 
            font-weight: bold;
            border-bottom: 1px dotted #000;
            padding-bottom: 2px;
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 2px; 
            font-size: 10px;
          }
          .row .label { 
            flex: 1; 
          }
          .row .value { 
            flex: 1; 
            text-align: right; 
            font-weight: bold;
          }
          .total { 
            font-weight: bold; 
            border-top: 1px solid #000; 
            padding-top: 4px; 
            margin-top: 4px;
          }
          .total .row { 
            font-size: 11px; 
          }
          .barcode { 
            text-align: center; 
            font-family: 'Courier New', monospace; 
            font-size: 8px; 
            margin: 4px 0; 
            padding: 2px; 
            background: #f0f0f0; 
            border: 1px solid #000;
          }
          .footer { 
            text-align: center; 
            font-size: 8px; 
            margin-top: 8px; 
            border-top: 1px dotted #000; 
            padding-top: 4px;
          }
          .test-item { 
            margin-bottom: 1px; 
            font-size: 9px;
          }
          .test-name { 
            display: inline-block; 
            width: 60%; 
          }
          .test-price { 
            display: inline-block; 
            width: 35%; 
            text-align: right; 
          }
          @media print { 
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PATHOLOGY LAB RECEIPT</h1>
          <p>Date: ${receiptData.date}</p>
          <p>Receipt #: ${receiptData.receipt_number}</p>
          <p>Lab #: ${receiptData.lab_number || receiptData.barcode}</p>
        </div>
        
        <div class="section">
          <h3>PATIENT INFO</h3>
          <div class="row">
            <span class="label">Name:</span>
            <span class="value" style="direction: rtl; text-align: right; unicode-bidi: bidi-override; font-weight: bold;">${receiptData.patient_name}</span>
          </div>
          <div class="row">
            <span class="label">Phone:</span>
            <span class="value">${receiptData.patient_phone}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>TESTS (${receiptData.tests?.length || 0})</h3>
          ${(receiptData.tests || selectedTests).map((test: any) => `
            <div class="test-item">
              <span class="test-name">${test.name}</span>
              <span class="test-price">${formatCurrency(test.price)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="section total">
          <div class="row">
            <span class="label">Total:</span>
            <span class="value">${formatCurrency(receiptData.total_amount || calculateTotal())}</span>
          </div>
          <div class="row">
            <span class="label">Discount:</span>
            <span class="value">${formatCurrency(receiptData.discount_amount || 0)}</span>
          </div>
          <div class="row">
            <span class="label">Final:</span>
            <span class="value">${formatCurrency(receiptData.final_amount || calculateTotal())}</span>
          </div>
          <div class="row">
            <span class="label">Paid:</span>
            <span class="value">${formatCurrency(receiptData.upfront_payment || paymentForm.upfront_payment)}</span>
          </div>
          <div class="row">
            <span class="label">Remaining:</span>
            <span class="value">${formatCurrency(receiptData.remaining_balance || calculateBalance())}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="row">
            <span class="label">Method:</span>
            <span class="value">${receiptData.payment_method || paymentForm.payment_method}</span>
          </div>
          <div class="row">
            <span class="label">Delivery:</span>
            <span class="value">${new Date(receiptData.expected_delivery_date).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div class="barcode">
          ${receiptData.barcode || ''}
        </div>
        
        <div class="footer">
          <p>Processed by: ${receiptData.check_in_by}</p>
          <p>Thank you for choosing our lab!</p>
          ${receiptData.patient_credentials ? `
          <div style="margin-top: 8px; padding: 5px; background: #f0f0f0; border-radius: 3px; font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">🔐 Patient Portal Access:</p>
            <p style="margin: 2px 0; font-family: monospace;">Username: ${receiptData.patient_credentials.username}</p>
            <p style="margin: 2px 0; font-family: monospace;">Password: ${receiptData.patient_credentials.password}</p>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteVisit = async () => {
    if (!selectedPatient || selectedTests.length === 0) {
      toast.error('Please select a patient and at least one test');
      return;
    }

    setLoading(true);
    try {
      const visitData = {
        patient_id: selectedPatient.id,
        tests: selectedTests.map(test => ({
          test_category_id: test.test_category_id,
          custom_test_name: test.custom_test_name,
          custom_price: test.custom_price,
          discount_percentage: test.discount_percentage
        })),
        upfront_payment: paymentForm.upfront_payment,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes,
        insurance_provider: paymentForm.insurance_provider,
        insurance_policy_number: paymentForm.insurance_policy_number,
        insurance_claim_number: paymentForm.insurance_claim_number,
        expected_delivery_date: paymentForm.expected_delivery_date || new Date().toISOString().split('T')[0]
      };

      console.log('Sending visit data:', visitData);
      console.log('Selected tests:', selectedTests);
      console.log('Tests array being sent:', visitData.tests);
      
      // Manually fetch CSRF token before the request
      console.log('Fetching CSRF token for visit creation...');
      await axios.get('/sanctum/csrf-cookie');
      const csrfResponse = await axios.get('/api/auth/csrf-token');
      const csrfToken = csrfResponse.data.csrf_token;
      console.log('CSRF token received:', csrfToken);
      
      const response = await axios.post('/api/check-in/create-visit', visitData, {
        headers: {
          'X-CSRF-TOKEN': csrfToken
        }
      });
      console.log('Visit response:', response.data);
      console.log('Visit object:', response.data.visit);
      console.log('Visit ID:', response.data.visit?.id);
      console.log('Full response structure:', JSON.stringify(response.data, null, 2));
      
      // Store both the visit and receipt data
      setCurrentVisit({
        ...response.data.visit,
        receipt_data: response.data.receipt_data
      });
      setShowReceiptModal(true);
      toast.success('Visit completed successfully!');
      
      // Reset form
      setSelectedPatient(null);
      setSelectedTests([]);
      setPaymentForm({ 
        upfront_payment: 0, 
        payment_method: 'cash', 
        notes: '',
        discount_amount: 0,
        discount_percentage: 0,
        insurance_provider: '',
        insurance_policy_number: '',
        insurance_claim_number: '',
        expected_delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setCurrentStep(0);
    } catch (error) {
      console.error('Failed to complete visit:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        toast.error(`Validation failed: ${validationErrors.join(', ')}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to complete visit. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return selectedPatient !== null;
      case 1:
        return selectedTests.length > 0;
      case 2:
        return paymentForm.upfront_payment >= calculateMinimumUpfront();
      default:
        return false;
    }
  };

  const renderPatientSelection = () => (
    <Fade in={currentStep === 0} timeout={500}>
      <Box>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Patient Selection
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find an existing patient or register a new one
          </Typography>
        </Box>

        <Card sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          <CardContent>
            <Autocomplete
              freeSolo
              options={patientResults}
              loading={searching}
              value={selectedPatient}
              filterOptions={(options) => options} // Disable built-in filtering since we do server-side filtering
              onChange={(event, newValue) => {
                if (typeof newValue === 'object' && newValue) {
                  setSelectedPatient(newValue);
                }
              }}
              onInputChange={(event, newInputValue) => {
                setPatientQuery(newInputValue);
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.name || '';
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search for patient"
                  placeholder="Enter patient name, phone, or email"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {searching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                if (typeof option === 'string') {
                  return (
                    <Box component="li" {...props}>
                      <Typography variant="body1">{option}</Typography>
                    </Box>
                  );
                }
                
                if (!option || typeof option !== 'object' || !option.name) {
                  return (
                    <Box component="li" {...props}>
                      <Typography variant="body1">Invalid option</Typography>
                    </Box>
                  );
                }
                
                return (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {String(option.name).charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {String(option.name)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <Phone fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {String(option.phone || 'No phone')}
                        {option.email && (
                          <>
                            <br />
                            <Email fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {String(option.email)}
                          </>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
            />
          </CardContent>
        </Card>

        {selectedPatient && (
          <Slide direction="up" in={!!selectedPatient} timeout={300}>
            <Card sx={{ maxWidth: 600, mx: 'auto', bgcolor: 'success.50', border: '2px solid', borderColor: 'success.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Patient Selected
                    </Typography>
                  </Box>
                  <IconButton 
                    onClick={() => setSelectedPatient(null)}
                    size="small"
                    sx={{ 
                      color: 'error.main',
                      '&:hover': { bgcolor: 'error.50' }
                    }}
                    title="Remove selection"
                  >
                    <Close />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {String(selectedPatient.name).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      {String(selectedPatient.name)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <Phone fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      {String(selectedPatient.phone)}
                      {selectedPatient.email && (
                        <>
                          <br />
                          <Email fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          {String(selectedPatient.email)}
                        </>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Slide>
        )}
      </Box>
    </Fade>
  );

  const renderTestSelection = () => (
    <Fade in={currentStep === 1} timeout={500}>
      <Box>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'secondary.main' }}>
            <Science sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Test Selection
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose the lab tests for this visit
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Science sx={{ mr: 1 }} />
                  Add New Test
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Test Category</InputLabel>
                      <Select
                        value={currentTestForm.test_category_id}
                        onChange={(e) => setCurrentTestForm({...currentTestForm, test_category_id: e.target.value})}
                        label="Test Category"
                      >
                        {availableCategories.map((category) => (
                          <MenuItem key={category.id} value={category.id.toString()}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {category.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {category.description}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Test Name"
                      value={currentTestForm.custom_test_name}
                      onChange={(e) => setCurrentTestForm({...currentTestForm, custom_test_name: e.target.value})}
                      placeholder="e.g., Breast Biopsy, Pap Smear"
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Test Price"
                      type="number"
                      value={currentTestForm.custom_price}
                      onChange={(e) => setCurrentTestForm({...currentTestForm, custom_price: parseFloat(e.target.value) || 0})}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Discount %"
                      type="number"
                      value={currentTestForm.discount_percentage}
                      onChange={(e) => setCurrentTestForm({...currentTestForm, discount_percentage: parseFloat(e.target.value) || 0})}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleAddTest}
                        startIcon={<Add />}
                        fullWidth
                        sx={{ height: '56px' }}
                      >
                        Add Test
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                
                {currentTestForm.custom_price > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Final Price: {formatCurrency(currentTestForm.custom_price - (currentTestForm.custom_price * currentTestForm.discount_percentage / 100))}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCart sx={{ mr: 1 }} />
                  Selected Tests ({selectedTests.length})
                </Typography>
                
                {selectedTests.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No tests selected yet
                  </Alert>
                ) : (
                  <List dense>
                    {selectedTests.map((test, index) => (
                      <ListItem 
                        key={test.id} 
                        divider={index < selectedTests.length - 1}
                        sx={{ px: 0 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {test.custom_test_name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Chip 
                                label={test.category_name} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatCurrency(test.final_price)}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Remove test">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveTest(test.id)}
                              color="error"
                            >
                              <Remove />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                {selectedTests.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                      Total: {formatCurrency(calculateTotal())}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const renderBillingPayment = () => (
    <Fade in={currentStep === 2} timeout={500}>
      <Box>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'success.main' }}>
            <MonetizationOn sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Billing & Payment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete payment and finalize the visit
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ mb: 4, height: 'fit-content' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Payment sx={{ mr: 2, fontSize: 28 }} />
                  Payment Details
                </Typography>
                
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Upfront Payment"
                      type="number"
                      value={paymentForm.upfront_payment}
                      onChange={(e) => setPaymentForm(prev => ({
                        ...prev,
                        upfront_payment: parseFloat(e.target.value) || 0
                      }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              size="small"
                              onClick={() => setPaymentForm(prev => ({
                                ...prev,
                                upfront_payment: calculateMinimumUpfront()
                              }))}
                              variant="outlined"
                              sx={{ minWidth: 60 }}
                            >
                              Min
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                      helperText={`Minimum required: ${formatCurrency(calculateMinimumUpfront())} (50% of total)`}
                      error={paymentForm.upfront_payment < calculateMinimumUpfront() && paymentForm.upfront_payment > 0}
                      sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth sx={{ '& .MuiInputBase-root': { height: 56 } }}>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={paymentForm.payment_method}
                        onChange={(e) => setPaymentForm(prev => ({
                          ...prev,
                          payment_method: e.target.value
                        }))}
                      >
                        <MenuItem value="cash">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoney sx={{ mr: 1 }} />
                            Cash
                          </Box>
                        </MenuItem>
                        <MenuItem value="card">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CreditCard sx={{ mr: 1 }} />
                            Credit/Debit Card
                          </Box>
                        </MenuItem>
                        <MenuItem value="insurance">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccountBalance sx={{ mr: 1 }} />
                            Insurance
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Insurance Details - Show only when insurance is selected */}
                  {paymentForm.payment_method === 'insurance' && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Insurance Provider"
                          value={paymentForm.insurance_provider}
                          onChange={(e) => setPaymentForm(prev => ({
                            ...prev,
                            insurance_provider: e.target.value
                          }))}
                          sx={{ '& .MuiInputBase-root': { height: 56 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Policy Number"
                          value={paymentForm.insurance_policy_number}
                          onChange={(e) => setPaymentForm(prev => ({
                            ...prev,
                            insurance_policy_number: e.target.value
                          }))}
                          sx={{ '& .MuiInputBase-root': { height: 56 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Claim Number (Optional)"
                          value={paymentForm.insurance_claim_number}
                          onChange={(e) => setPaymentForm(prev => ({
                            ...prev,
                            insurance_claim_number: e.target.value
                          }))}
                          sx={{ '& .MuiInputBase-root': { height: 56 } }}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Discount Section */}
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Discount
                      </Typography>
                    </Divider>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Discount Amount"
                      type="number"
                      value={paymentForm.discount_amount}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const total = calculateTotal();
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        setPaymentForm(prev => ({
                          ...prev,
                          discount_amount: amount,
                          discount_percentage: percentage
                        }));
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      helperText={`${paymentForm.discount_percentage.toFixed(1)}% of total`}
                      sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Discount Percentage"
                      type="number"
                      value={paymentForm.discount_percentage}
                      onChange={(e) => {
                        const percentage = parseFloat(e.target.value) || 0;
                        const total = calculateTotal();
                        const amount = (total * percentage) / 100;
                        setPaymentForm(prev => ({
                          ...prev,
                          discount_percentage: percentage,
                          discount_amount: amount
                        }));
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      helperText={`$${paymentForm.discount_amount.toFixed(2)} off`}
                      sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />
                  </Grid>

                  {/* Delivery Date */}
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Delivery Information
                      </Typography>
                    </Divider>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Expected Delivery Date"
                      type="date"
                      value={paymentForm.expected_delivery_date}
                      onChange={(e) => setPaymentForm(prev => ({
                        ...prev,
                        expected_delivery_date: e.target.value
                      }))}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      helperText="When will the results be ready?"
                      sx={{ '& .MuiInputBase-root': { height: 56 } }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Notes (Optional)"
                      multiline
                      rows={4}
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      placeholder="Add any special instructions or notes..."
                      sx={{ '& .MuiInputBase-root': { minHeight: 120 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ position: 'sticky', top: 20, height: 'fit-content' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Receipt sx={{ mr: 2, fontSize: 28 }} />
                  Billing Summary
                </Typography>

                {/* Patient Info */}
                {selectedPatient && (
                  <Box sx={{ mb: 4, p: 3, bgcolor: 'primary.50', borderRadius: 3, border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="subtitle1" color="primary.main" gutterBottom sx={{ fontWeight: 600 }}>
                      Patient Information
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                      {String(selectedPatient.name)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Phone sx={{ mr: 1, fontSize: 18 }} />
                      {String(selectedPatient.phone)}
                    </Typography>
                  </Box>
                )}

                {/* Tests Summary */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Selected Tests ({selectedTests.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {selectedTests.map((test) => (
                      <Box key={test.id} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2,
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <Science color="primary" sx={{ mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {test.custom_test_name}
                            </Typography>
                            <Chip 
                              label={test.category_name} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {formatCurrency(test.final_price)}
                          </Typography>
                          {test.discount_percentage > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {test.discount_percentage}% off
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
                
                {/* Payment Breakdown */}
                <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Payment Breakdown
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatCurrency(calculateTotal())}
                    </Typography>
                  </Box>
                  
                  {paymentForm.discount_amount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1">Discount:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                        -{formatCurrency(paymentForm.discount_amount)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Final Amount:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatCurrency(calculateFinalAmount())}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1">Upfront Payment:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                      -{formatCurrency(paymentForm.upfront_payment)}
                    </Typography>
                  </Box>
                  
                  {paymentForm.upfront_payment < calculateMinimumUpfront() && (
                    <Alert severity="warning" sx={{ mb: 2, py: 1 }}>
                      <Typography variant="body2">
                        Minimum upfront payment required: {formatCurrency(calculateMinimumUpfront())}
                      </Typography>
                    </Alert>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Remaining Due:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: calculateBalance() > 0 ? 'error.main' : 'success.main' }}>
                      {formatCurrency(calculateBalance())}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleCompleteVisit}
                    disabled={loading || selectedTests.length === 0 || paymentForm.upfront_payment < calculateMinimumUpfront()}
                    startIcon={loading ? <CircularProgress size={20} /> : <Done />}
                    sx={{ 
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 2
                    }}
                  >
                    {loading ? 'Processing...' : 'Complete Visit'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const renderReceiptModal = () => {
    // Get receipt data from current visit or use form data as fallback
    const receiptData = currentVisit?.receipt_data || {
      patient_name: selectedPatient?.name || 'N/A',
      patient_phone: selectedPatient?.phone || 'N/A',
      tests: selectedTests.map(test => ({
        name: test.custom_test_name,
        category: test.category_name,
        price: test.final_price
      })),
      total_amount: calculateTotal(),
      final_amount: calculateTotal(),
      upfront_payment: paymentForm.upfront_payment,
      remaining_balance: calculateBalance(),
      payment_method: paymentForm.payment_method,
      receipt_number: currentVisit?.visit?.visit_number || 'N/A',
      date: new Date().toLocaleDateString(),
      check_in_by: 'Staff Member',
      check_in_at: new Date().toLocaleString()
    };

    return (
      <Dialog
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Visit Receipt
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Receipt #{receiptData.receipt_number} • {receiptData.date}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box>
            {/* Patient Info */}
            <Box sx={{ mb: 4, p: 3, bgcolor: 'primary.50', borderRadius: 3, border: '1px solid', borderColor: 'primary.200' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <Person sx={{ mr: 1 }} />
                Patient Information
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Name:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {String(receiptData.patient_name)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Phone:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {String(receiptData.patient_phone)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Tests Ordered */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 2 }}>
                <Science sx={{ mr: 1 }} />
                Tests Ordered ({receiptData.tests?.length || 0})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Test Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(receiptData.tests || selectedTests).map((test, index) => (
                      <TableRow key={test.id || index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Science color="primary" sx={{ mr: 1, fontSize: 20 }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {String(test.name || 'Unknown Test')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={test.category} 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {formatCurrency(Number(test.price) || 0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Payment Summary */}
            <Box sx={{ p: 3, bgcolor: 'success.50', borderRadius: 3, border: '1px solid', borderColor: 'success.200' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 2 }}>
                <Payment sx={{ mr: 1 }} />
                Payment Summary
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">Total Amount:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(receiptData.total_amount || calculateTotal())}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">Payment Method:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                  {String(receiptData.payment_method || paymentForm.payment_method)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">Amount Paid:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatCurrency(receiptData.upfront_payment || paymentForm.upfront_payment)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Remaining Due:
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  color: (receiptData.remaining_balance || calculateBalance()) > 0 ? 'error.main' : 'success.main' 
                }}>
                  {formatCurrency(receiptData.remaining_balance || calculateBalance())}
                </Typography>
              </Box>

              {/* Additional Info */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'success.300' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Checked in by:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {receiptData.check_in_by || 'Staff Member'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Date & Time:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {receiptData.check_in_at || new Date().toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleNavigateToReceipts}
            startIcon={<Receipt />}
            variant="contained"
            color="primary"
            size="large"
          >
            View in Receipts
          </Button>
          <Button
            onClick={handlePrintLabel}
            startIcon={<Science />}
            variant="outlined"
            color="secondary"
            size="large"
          >
            Print Sample
          </Button>
          <Button
            onClick={() => setShowReceiptModal(false)}
            variant="outlined"
            startIcon={<Done />}
            size="large"
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Check-In & Billing
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Streamline patient registration and test ordering process
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  icon={
                    <Avatar
                      sx={{
                        bgcolor: index <= currentStep ? 'primary.main' : 'grey.300',
                        color: index <= currentStep ? 'white' : 'grey.600',
                      }}
                    >
                      {step.icon}
                    </Avatar>
                  }
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {step.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Box sx={{ minHeight: 500 }}>
        {currentStep === 0 && renderPatientSelection()}
        {currentStep === 1 && renderTestSelection()}
        {currentStep === 2 && renderBillingPayment()}
      </Box>

      {/* Navigation */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              startIcon={<NavigateBefore />}
              variant="outlined"
              size="large"
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Step {currentStep + 1} of {steps.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={((currentStep + 1) / steps.length) * 100}
                sx={{ width: 100 }}
              />
            </Box>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                endIcon={<NavigateNext />}
                variant="contained"
                size="large"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCompleteVisit}
                disabled={!canProceedToNext() || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Done />}
                variant="contained"
                size="large"
              >
                {loading ? 'Processing...' : 'Complete Visit'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {renderReceiptModal()}

      {/* Sample Label Modal */}
      <Dialog open={showLabelModal} onClose={() => setShowLabelModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Science color="secondary" />
            Sample Labels
          </Box>
        </DialogTitle>
        <DialogContent>
          {labelData && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">
                  <strong>Patient:</strong> {labelData.patient_name} | 
                  <strong> Date:</strong> {labelData.visit_date} | 
                  <strong> Receipt:</strong> {labelData.visit_id}
                </Typography>
              </Alert>
              
              <Grid container spacing={2}>
                {labelData.test_labels?.map((testLabel: any, index: number) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={index}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          <strong>Test:</strong> {testLabel.test_name}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Patient:</strong> {testLabel.patient_name}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>ID:</strong> {testLabel.patient_id}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Date:</strong> {testLabel.sample_date}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Time:</strong> {testLabel.sample_time}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Sample ID:</strong> {testLabel.sample_id}
                        </Typography>
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid #ccc' }}>
                          <div dangerouslySetInnerHTML={{ __html: testLabel.barcode }} />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={printSampleLabel}
                  startIcon={<Print />}
                  size="large"
                >
                  Print All Labels
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLabelModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckIn;