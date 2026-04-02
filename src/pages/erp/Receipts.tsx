import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Alert,
  Pagination,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Receipt,
  Visibility,
  Print,
  Refresh,
  Edit,
} from '@mui/icons-material';
import axios from 'axios';
/** Opens a PDF blob and triggers the browser print dialog (thermal receipt). */
function openPdfBlobForPrint(blob: Blob): void {
  const blobUrl = URL.createObjectURL(blob);
  const printFrame = document.createElement('iframe');
  printFrame.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  );
  printFrame.src = blobUrl;
  document.body.appendChild(printFrame);
  printFrame.onload = () => {
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (e) {
        console.error('Print failed:', e);
      }
      setTimeout(() => {
        printFrame.remove();
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    }, 500);
  };
  printFrame.onerror = () => {
    printFrame.remove();
    URL.revokeObjectURL(blobUrl);
  };
}

interface LabReceiptBranding {
  display_name?: string;
  tagline?: string;
  doc_label?: string;
  currency_label?: string;
  address?: string;
  phone?: string;
  email?: string;
  vat?: string;
  website?: string;
}

interface Receipt {
  id: number;
  receipt_number: string;
  lab_number?: string;
  visit_number: string;
  visit_date: string;
  visit_time: string;
  date?: string;
  total_amount: number;
  final_amount: number;
  upfront_payment: number;
  remaining_balance: number;
  payment_method: string;
  billing_status: string;
  status: string;
  payment_status?: string;
  discount_amount?: number;
  barcode?: string;
  expected_delivery_date?: string;
  payment_breakdown?: {
    cash: number;
    card: number;
    card_method: string;
  };
  processed_by?: string;
  patient: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
  patient_name?: string;
  patient_age?: number;
  patient_phone?: string;
  patient_gender?: string;
  organization?: string;
  referring_doctor?: string;
  attendance_day?: string;
  delivery_day?: string;
  number_of_samples?: number;
  sample_size?: string;
  sample_type?: string;
  previous_tests?: string;
  medical_history?: string;
  tests?: Array<{
    name: string;
    price: number;
  }>;
  paid_now?: number;
  lab_branding?: LabReceiptBranding;
  visitTests: Array<{
    id: number;
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
    status: string;
  }>;
}

const Receipts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [saving, setSaving] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  useEffect(() => {
    fetchReceipts();
  }, [currentPage]);

  // Handle patient filter from URL parameters
  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId) {
      setSearchTerm(patientId);
      // Auto search if patient ID is provided in URL
      fetchReceipts();
    }
  }, [searchParams]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: 15,
        include_receipts: true,
        _t: Date.now(), // Cache busting parameter
      };

      // Add search parameters if search term exists
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axios.get('/api/visits', { params });
      
      
      // Handle the response structure - receipt_data contains the paginated data
      let receiptsData = [];
      let totalPages = 1;
      
      if (response.data.receipt_data) {
        // Check if receipt_data has pagination structure
        if (response.data.receipt_data.data) {
          // Paginated response
          receiptsData = response.data.receipt_data.data;
          totalPages = response.data.receipt_data.last_page || 1;
        } else if (Array.isArray(response.data.receipt_data)) {
          // Direct array response
          receiptsData = response.data.receipt_data;
          totalPages = 1;
        }
      }
      
      // Filter to only include visits with visit numbers (use as receipt numbers) and normalize data
      const filteredReceipts = receiptsData
        .filter((visit: any) => visit.visit_number)
        .map((visit: any) => ({
          ...visit,
          receipt_number: visit.visit_number, // Use visit_number as receipt_number
          visitTests: visit.visit_tests || visit.visitTests || [],
          // Ensure patient data exists
          patient: visit.patient || { id: 0, name: 'Unknown', phone: 'N/A' },
        }));
      
      setReceipts(filteredReceipts);
      setTotalPages(totalPages);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchReceipts();
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    // No auto search - only update the search term
  };

  const handleViewDetails = async (receipt: Receipt) => {
    try {
      // Try the new universal receipt endpoint first
      const response = await axios.get(`/api/visits/${receipt.id}/receipt`);
      const receiptData = response.data.receipt_data;
      
      // Update the receipt with the proper receipt data
      const updatedReceipt = {
        ...receipt,
        ...receiptData,
        barcode: receiptData.barcode
      };
      
      setSelectedReceipt(updatedReceipt);
      setEditingReceipt({ ...updatedReceipt });
      setIsEditing(false);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Failed to fetch receipt details:', error);
      
      // Try the check-in receipt endpoint as fallback
      try {
        const fallbackResponse = await axios.get(`/api/check-in/visits/${receipt.id}/receipt`);
        const fallbackData = fallbackResponse.data.receipt_data;
        
        const updatedReceipt = {
          ...receipt,
          ...fallbackData,
          barcode: fallbackData.barcode
        };
        
        setSelectedReceipt(updatedReceipt);
        setEditingReceipt({ ...updatedReceipt });
        setIsEditing(false);
        setDetailsOpen(true);
      } catch (fallbackError) {
        console.error('Failed to fetch receipt from fallback endpoint:', fallbackError);
        // Use original receipt data as last resort
        setSelectedReceipt(receipt);
        setEditingReceipt({ ...receipt });
        setIsEditing(false);
        setDetailsOpen(true);
      }
    }
  };

  const handleLoadReceiptForEdit = async () => {
    if (!selectedReceipt?.id || !selectedReceipt?.patient?.id) {
      toast.error('Receipt ID or Patient ID not found');
      return;
    }

    try {
      // Fetch both patient and visit data
      const [patientResponse, visitResponse] = await Promise.all([
        axios.get(`/api/patients/${selectedReceipt.patient.id}`),
        axios.get(`/api/visits/${selectedReceipt.id}`)
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

      // Get payment amounts from visit metadata or patient record
      const totalAmount = visit.total_amount || selectedReceipt.total_amount || 0;
      const amountPaidCash = paymentDetails.amount_paid_cash || selectedReceipt.payment_breakdown?.cash || 0;
      const amountPaidCard = paymentDetails.amount_paid_card || selectedReceipt.payment_breakdown?.card || 0;
      const additionalPaymentMethod = paymentDetails.additional_payment_method || selectedReceipt.payment_breakdown?.card_method || 'Fawry';

      // Helper function to map gender values
      const mapGender = (gender: string) => {
        if (gender === 'male') return 'ذكر';
        if (gender === 'female') return 'أنثى';
        return gender || 'ذكر';
      };

      // Helper function to get day name from date
      const getDayNameFromDate = (dateString: string) => {
        if (!dateString) return 'السبت';
        try {
          const date = new Date(dateString);
          const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
          return days[date.getDay()];
        } catch {
          return 'السبت';
        }
      };

      // Get patient data from visit metadata if available
      const patientDataFromMetadata = metadata.patient_data || {};

      // Update editingReceipt with all data
      const updatedReceipt: Receipt = {
        ...selectedReceipt,
        patient: {
          ...selectedReceipt.patient,
          name: patient.name || patientDataFromMetadata.name || selectedReceipt.patient.name,
          phone: patient.phone || patientDataFromMetadata.phone || selectedReceipt.patient.phone,
        },
        patient_name: patient.name || patientDataFromMetadata.name || selectedReceipt.patient.name,
        patient_age: patient.age || patientDataFromMetadata.age || selectedReceipt.patient_age,
        patient_phone: patient.phone || patientDataFromMetadata.phone || selectedReceipt.patient.phone,
        patient_gender: mapGender(patient.gender || patientDataFromMetadata.gender),
        organization: patient.organization || patientDataFromMetadata.organization || '',
        referring_doctor: patient.doctor || patientDataFromMetadata.doctor || patientDataFromMetadata.referring_doctor || '',
        lab_number: patient.lab || patient.lab_number || patientDataFromMetadata.lab_number || selectedReceipt.lab_number,
        attendance_day: patient.day_of_week || patientDataFromMetadata.attendance_day || 
                       (visit.visit_date ? getDayNameFromDate(visit.visit_date) : 'السبت'),
        delivery_day: patient.day_of_week || patientDataFromMetadata.delivery_day || 
                     (visit.expected_delivery_date ? getDayNameFromDate(visit.expected_delivery_date) : 'السبت'),
        number_of_samples: patient.number_of_samples || patientDataFromMetadata.number_of_samples || 1,
        sample_size: patient.sample_size || patientDataFromMetadata.sample_size || 'صغيرة جدا',
        sample_type: patient.sample_type || patientDataFromMetadata.sample_type || 'Pathology',
        previous_tests: patient.previous_tests || patientDataFromMetadata.previous_tests || 'نعم',
        medical_history: patient.medical_history || patientDataFromMetadata.medical_history || '',
        total_amount: totalAmount,
        final_amount: totalAmount - (selectedReceipt.discount_amount || 0),
        upfront_payment: amountPaidCash + amountPaidCard,
        remaining_balance: (totalAmount - (selectedReceipt.discount_amount || 0)) - (amountPaidCash + amountPaidCard),
        payment_method: additionalPaymentMethod !== 'Fawry' ? additionalPaymentMethod : 'cash',
        payment_breakdown: {
          cash: amountPaidCash,
          card: amountPaidCard,
          card_method: additionalPaymentMethod,
        },
        visit_date: formatDateForInput(visit.visit_date || selectedReceipt.visit_date),
        expected_delivery_date: formatDateForInput(visit.expected_delivery_date || selectedReceipt.expected_delivery_date),
      };

      setEditingReceipt(updatedReceipt);
      setIsEditing(true);
    } catch (error: any) {
      console.error('Failed to load receipt data:', error);
      toast.error('Failed to load receipt data for editing: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveReceipt = async () => {
    if (!editingReceipt || !selectedReceipt) return;
    
    setSaving(true);
    try {
      // Helper function to map gender for backend
      const mapGenderForBackend = (gender: string) => {
        if (gender === 'ذكر') return 'male';
        if (gender === 'أنثى') return 'female';
        return gender || 'male';
      };

      // Update patient data first
      if (selectedReceipt.patient?.id) {
        const patientUpdateData: any = {
          name: editingReceipt.patient_name || editingReceipt.patient.name,
          phone: editingReceipt.patient_phone || editingReceipt.patient.phone,
        };
        
        if (editingReceipt.patient_age) {
          patientUpdateData.age = editingReceipt.patient_age;
        }
        
        if (editingReceipt.patient_gender) {
          patientUpdateData.gender = mapGenderForBackend(editingReceipt.patient_gender);
        }
        
        if (editingReceipt.organization) {
          patientUpdateData.organization = editingReceipt.organization;
        }
        
        if (editingReceipt.referring_doctor) {
          patientUpdateData.doctor = editingReceipt.referring_doctor;
        }
        
        if (editingReceipt.lab_number) {
          patientUpdateData.lab = editingReceipt.lab_number;
          patientUpdateData.lab_number = editingReceipt.lab_number;
        }
        
        if (editingReceipt.sample_type) {
          patientUpdateData.sample_type = editingReceipt.sample_type;
        }
        
        if (editingReceipt.sample_size) {
          patientUpdateData.sample_size = editingReceipt.sample_size;
        }
        
        if (editingReceipt.number_of_samples) {
          patientUpdateData.number_of_samples = editingReceipt.number_of_samples;
        }
        
        if (editingReceipt.attendance_day) {
          patientUpdateData.day_of_week = editingReceipt.attendance_day;
        }
        
        if (editingReceipt.medical_history) {
          patientUpdateData.medical_history = editingReceipt.medical_history;
        }
        
        if (editingReceipt.previous_tests) {
          patientUpdateData.previous_tests = editingReceipt.previous_tests;
        }
        
        // Update financial data in patient table (important for UnpaidInvoices page)
        if (editingReceipt.total_amount !== undefined) {
          patientUpdateData.total_amount = editingReceipt.total_amount;
        }
        
        if (editingReceipt.upfront_payment !== undefined) {
          patientUpdateData.amount_paid = editingReceipt.upfront_payment;
        }
        
        // Note: remaining_balance is calculated, not stored in patient table
        // It will be calculated as total_amount - amount_paid
        
        await axios.put(`/api/patients/${selectedReceipt.patient.id}`, patientUpdateData);
      }

      // Update the visit with edited data
      const updateData: any = {
        total_amount: editingReceipt.total_amount,
        final_amount: editingReceipt.final_amount,
        upfront_payment: editingReceipt.upfront_payment,
        remaining_balance: editingReceipt.remaining_balance,
        payment_method: editingReceipt.payment_method,
      };

      if (editingReceipt.visit_date) {
        updateData.visit_date = editingReceipt.visit_date;
      }

      if (editingReceipt.expected_delivery_date) {
        updateData.expected_delivery_date = editingReceipt.expected_delivery_date;
      }

      // Update visit metadata to include financial data and patient data
      const visitResponse = await axios.get(`/api/visits/${selectedReceipt.id}`);
      const visit = visitResponse.data;
      
      // Parse metadata if it's a string, otherwise use as is
      let metadata: any = {};
      if (visit.metadata) {
        if (typeof visit.metadata === 'string') {
          try {
            metadata = JSON.parse(visit.metadata);
          } catch (e) {
            console.error('Failed to parse metadata:', e);
            metadata = {};
          }
        } else {
          metadata = { ...visit.metadata };
        }
      }
      
      // Update patient data in metadata
      const patientData = metadata.patient_data || {};
      patientData.name = editingReceipt.patient_name || editingReceipt.patient.name;
      patientData.phone = editingReceipt.patient_phone || editingReceipt.patient.phone;
      if (editingReceipt.patient_age) {
        patientData.age = editingReceipt.patient_age;
      }
      if (editingReceipt.patient_gender) {
        patientData.gender = mapGenderForBackend(editingReceipt.patient_gender);
      }
      if (editingReceipt.organization) {
        patientData.organization = editingReceipt.organization;
      }
      if (editingReceipt.referring_doctor) {
        patientData.doctor = editingReceipt.referring_doctor;
        patientData.referring_doctor = editingReceipt.referring_doctor;
      }
      if (editingReceipt.lab_number) {
        patientData.lab_number = editingReceipt.lab_number;
      }
      if (editingReceipt.sample_type) {
        patientData.sample_type = editingReceipt.sample_type;
      }
      if (editingReceipt.sample_size) {
        patientData.sample_size = editingReceipt.sample_size;
      }
      if (editingReceipt.number_of_samples) {
        patientData.number_of_samples = editingReceipt.number_of_samples;
      }
      if (editingReceipt.attendance_day) {
        patientData.attendance_day = editingReceipt.attendance_day;
      }
      if (editingReceipt.delivery_day) {
        patientData.delivery_day = editingReceipt.delivery_day;
      }
      if (editingReceipt.visit_date) {
        patientData.attendance_date = editingReceipt.visit_date;
      }
      if (editingReceipt.expected_delivery_date) {
        patientData.delivery_date = editingReceipt.expected_delivery_date;
      }
      if (editingReceipt.medical_history) {
        patientData.medical_history = editingReceipt.medical_history;
      }
      if (editingReceipt.previous_tests) {
        patientData.previous_tests = editingReceipt.previous_tests;
      }
      metadata.patient_data = patientData;
      
      const financialData = metadata.financial_data || {};
      const paymentDetails = metadata.payment_details || {};
      
      financialData.total_amount = editingReceipt.total_amount;
      financialData.final_amount = editingReceipt.final_amount;
      financialData.amount_paid = editingReceipt.upfront_payment;
      financialData.remaining_balance = editingReceipt.remaining_balance;
      
      // Update payment breakdown from editingReceipt.payment_breakdown
      const cashAmount = editingReceipt.payment_breakdown?.cash || 0;
      const cardAmount = editingReceipt.payment_breakdown?.card || 0;
      
      paymentDetails.amount_paid_cash = cashAmount;
      paymentDetails.amount_paid_card = cardAmount;
      paymentDetails.additional_payment_method = editingReceipt.payment_breakdown?.card_method || 'Fawry';
      paymentDetails.total_paid = editingReceipt.upfront_payment;
      
      metadata.financial_data = financialData;
      metadata.payment_details = paymentDetails;
      updateData.metadata = metadata;

      // Update the visit
      await axios.put(`/api/visits/${selectedReceipt.id}`, updateData);

      // Update all visits for the same patient
      if (selectedReceipt.patient?.id) {
        const patientVisitsResponse = await axios.get('/api/visits', {
          params: { patient_id: selectedReceipt.patient.id }
        });
        
        const patientVisits = patientVisitsResponse.data.data || [];
        const updatePromises = patientVisits.map((v: any) => {
          if (v.id === selectedReceipt.id) return Promise.resolve();
          
          // Parse metadata if it's a string
          let vMetadata: any = {};
          if (v.metadata) {
            if (typeof v.metadata === 'string') {
              try {
                vMetadata = JSON.parse(v.metadata);
              } catch (e) {
                console.error('Failed to parse metadata for visit:', v.id, e);
                vMetadata = {};
              }
            } else {
              vMetadata = { ...v.metadata };
            }
          }
          
          const vFinancialData = vMetadata.financial_data || {};
          const vPaymentDetails = vMetadata.payment_details || {};
          
          vFinancialData.total_amount = editingReceipt.total_amount;
          vFinancialData.final_amount = editingReceipt.final_amount;
          vFinancialData.amount_paid = editingReceipt.upfront_payment;
          vFinancialData.remaining_balance = editingReceipt.remaining_balance;
          
          // Update payment breakdown based on payment method
          const paymentMethod = editingReceipt.payment_method?.toLowerCase() || 'cash';
          if (paymentMethod === 'cash') {
            vPaymentDetails.amount_paid_cash = editingReceipt.upfront_payment;
            vPaymentDetails.amount_paid_card = 0;
          } else {
            vPaymentDetails.amount_paid_cash = 0;
            vPaymentDetails.amount_paid_card = editingReceipt.upfront_payment;
            vPaymentDetails.additional_payment_method = editingReceipt.payment_method;
          }
          vPaymentDetails.total_paid = editingReceipt.upfront_payment;
          
          vMetadata.financial_data = vFinancialData;
          vMetadata.payment_details = vPaymentDetails;
          
          return axios.put(`/api/visits/${v.id}`, {
            total_amount: editingReceipt.total_amount,
            final_amount: editingReceipt.final_amount,
            upfront_payment: editingReceipt.upfront_payment,
            remaining_balance: editingReceipt.remaining_balance,
            payment_method: editingReceipt.payment_method,
            metadata: vMetadata
          });
        });
        
        await Promise.all(updatePromises);
      }

      setSelectedReceipt(editingReceipt);
      setIsEditing(false);
      toast.success('Receipt updated successfully for all related visits');
      fetchReceipts();
    } catch (error: any) {
      console.error('Failed to save receipt:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
      toast.error('Failed to save receipt: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async (receipt: Receipt) => {
    try {
      const response = await axios.get(`/api/check-in/visits/${receipt.id}/unpaid-invoice-receipt`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      openPdfBlobForPrint(blob);
      toast.success('Opening print dialog…');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt: ' + (error.message || 'Unknown error'));
    }
  };

  const printReceipt = async (receipt: Receipt) => {
    const esc = (v: unknown) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    let branding: LabReceiptBranding = receipt.lab_branding || {};
    if (!branding.display_name) {
      try {
        const { data } = await axios.get(`/api/check-in/visits/${receipt.id}/unpaid-invoice-receipt-data`);
        branding = data.lab_branding || {};
      } catch {
        /* use fallbacks below */
      }
    }

    const cur = branding.currency_label || 'جنيه';
    const fmtAmt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString('ar-EG')} ${esc(cur)}`;

    const genderAr =
      receipt.patient_gender === 'male'
        ? 'ذكر'
        : receipt.patient_gender === 'female'
          ? 'أنثى'
          : esc(receipt.patient_gender || '');

    const testsRows = (receipt.tests || [])
      .map((test: any) => {
        const cat = test.category as string | undefined;
        const catPart =
          cat && cat !== 'Unknown' && cat !== 'Sample Type'
            ? ` <span style="font-size:8px;color:#555">(${esc(cat)})</span>`
            : '';
        return `
          <table class="payment-item">
            <tr>
              <td>• ${esc(test.name || '—')}${catPart}</td>
              <td>${fmtAmt(test.price || 0)}</td>
            </tr>
          </table>`;
      })
      .join('');

    const pb = receipt.payment_breakdown;
    const pbRows =
      pb && (pb.cash > 0 || pb.card > 0)
        ? `${pb.cash > 0 ? `<table class="payment-item"><tr><td>نقدي:</td><td>${fmtAmt(pb.cash)}</td></tr></table>` : ''}
           ${pb.card > 0 ? `<table class="payment-item"><tr><td>${esc(pb.card_method || 'بطاقة')}:</td><td>${fmtAmt(pb.card)}</td></tr></table>` : ''}`
        : '';

    const barcodeBlock = receipt.barcode
      ? `<div class="barcode-wrap">
           ${receipt.barcode.includes('<svg') ? receipt.barcode : `<span>${esc(receipt.barcode)}</span>`}
         </div>`
      : '';

    const displayName = esc(branding.display_name || 'Laboratory');
    const docLabel = esc(branding.doc_label || 'إيصال تسجيل / دفع');
    const tagline = branding.tagline
      ? `<div class="clinic-info-line">${esc(branding.tagline)}</div>`
      : '';

    const footerLines: string[] = [];
    if (branding.address) {
      footerLines.push(`<div class="footer-line">${esc(branding.address)}</div>`);
    }
    const contact = [branding.phone, branding.email, branding.website].filter(Boolean).join(' — ');
    if (contact) {
      footerLines.push(`<div class="footer-line">${esc(contact)}</div>`);
    }
    if (branding.vat) {
      footerLines.push(`<div class="footer-line">الرقم الضريبي: ${esc(branding.vat)}</div>`);
    }
    const footerHtml = footerLines.join('');

    const hasSpecimen =
      !!(receipt.sample_type && String(receipt.sample_type).trim()) ||
      !!(receipt.sample_size && String(receipt.sample_size).trim()) ||
      receipt.number_of_samples != null;

    const specimenBlock = hasSpecimen
      ? `
          <table class="rw rw-label-row"><tr><td colspan="2">العينة</td></tr></table>
          <table class="rw"><tr><td>نوع العينة:</td><td>${esc(receipt.sample_type || '—')}</td></tr></table>
          <table class="rw"><tr><td>حجم العينة:</td><td>${esc(receipt.sample_size || '—')}</td></tr></table>
          <table class="rw"><tr><td>عدد العينات:</td><td>${esc(receipt.number_of_samples != null ? String(receipt.number_of_samples) : '—')}</td></tr></table>`
      : '';

    const receiptHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${displayName} — ${docLabel}</title>
        <style>
          @page { size: 80mm 200mm; margin: 3mm 5mm 3mm 3mm; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.25;
            margin: 0;
            padding: 0 2mm 0 0;
            width: 70mm;
            max-width: 70mm;
            direction: rtl;
            color: #000;
            background: #fff;
          }
          .receipt-container { max-width: 70mm; margin: 0 auto; padding: 0 2mm 0 0; }
          .header {
            text-align: center;
            margin-bottom: 6px;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
          }
          .lab-name { font-size: 12px; font-weight: 900; margin-bottom: 2px; }
          .clinic-info { text-align: center; margin: 3px 0; font-size: 8.5px; font-weight: 700; line-height: 1.35; }
          .clinic-info-line { margin-bottom: 2px; }
          .receipt-doc-label { font-size: 9px; font-weight: 800; margin-top: 4px; color: #222; }
          .receipt-title { font-size: 11px; font-weight: 900; margin-top: 6px; margin-bottom: 2px; }
          .receipt-number { font-size: 10px; color: #444; font-weight: 800; }
          .receipt-body { margin: 6px 0; }
          .rw { width: 100%; border-collapse: collapse; margin-bottom: 3px; font-size: 10px; font-weight: 700; }
          .rw td { padding: 1px 0 1px 2mm; vertical-align: top; }
          .rw td:first-child { text-align: right; white-space: nowrap; width: 40%; }
          .rw td:last-child { text-align: left; font-weight: 700; word-wrap: break-word; }
          .rw-label-row td {
            font-weight: 900;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 2px;
            font-size: 9px;
          }
          .separator { border-top: 1px dashed #000; margin: 4px 0; }
          .payment-breakdown { margin: 4px 0; padding: 2px 0; }
          .payment-item { width: 100%; border-collapse: collapse; margin-bottom: 2px; font-size: 9.5px; font-weight: 700; }
          .payment-item td { padding: 2px 0; }
          .payment-item td:first-child { text-align: right; }
          .payment-item td:last-child { text-align: left; }
          .total-section {
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 8px;
            font-size: 12px;
            font-weight: 900;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 8px;
            font-size: 8px;
            font-weight: 700;
            color: #333;
            border-top: 1px dashed #000;
            padding-top: 5px;
          }
          .footer-line { margin: 2px 0; line-height: 1.25; }
          .thank-you { text-align: center; margin: 8px 0; font-weight: 900; font-size: 12px; }
          .barcode-wrap { text-align: center; margin: 6px 0; padding: 4px 0; border-top: 1px dashed #000; }
          @media print { body { margin: 0; padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="lab-name">${displayName}</div>
            <div class="clinic-info">
              ${tagline}
              <div class="receipt-doc-label">${docLabel}</div>
            </div>
            <div class="receipt-title">رقم الزيارة</div>
            <div class="receipt-number">${esc(receipt.receipt_number || receipt.visit_number)}</div>
            <div class="receipt-number" style="margin-top:3px;color:#000;">رقم العينة: ${esc(receipt.lab_number || '—')}</div>
          </div>

          <div class="receipt-body">
            <table class="rw"><tr><td>التاريخ:</td><td>${esc(receipt.date || receipt.visit_date?.split('T')[0] || '')}</td></tr></table>
            <table class="rw"><tr><td>اسم المريض:</td><td>${esc(receipt.patient_name || receipt.patient?.name)}</td></tr></table>
            ${receipt.patient_age ? `<table class="rw"><tr><td>السن:</td><td>${esc(receipt.patient_age)}</td></tr></table>` : ''}
            <table class="rw"><tr><td>الجوال:</td><td>${esc(receipt.patient_phone || receipt.patient?.phone)}</td></tr></table>
            ${receipt.patient_gender ? `<table class="rw"><tr><td>النوع:</td><td>${genderAr}</td></tr></table>` : ''}
            ${receipt.organization ? `<table class="rw"><tr><td>الجهة:</td><td>${esc(receipt.organization)}</td></tr></table>` : ''}
            ${receipt.referring_doctor ? `<table class="rw"><tr><td>الطبيب المحيل:</td><td>${esc(receipt.referring_doctor)}</td></tr></table>` : ''}
            ${receipt.attendance_day ? `<table class="rw"><tr><td>يوم الحضور:</td><td>${esc(receipt.attendance_day)}</td></tr></table>` : ''}
            ${receipt.expected_delivery_date ? `<table class="rw"><tr><td>ميعاد التسليم:</td><td>${esc(new Date(receipt.expected_delivery_date).toLocaleDateString('ar-EG'))}</td></tr></table>` : ''}
            ${specimenBlock}
          </div>

          <div class="separator"></div>

          ${(receipt.tests || []).length ? `<table class="rw rw-label-row"><tr><td colspan="2">الخدمات / التحاليل</td></tr></table>${testsRows}<div class="separator"></div>` : ''}

          <table class="rw rw-label-row"><tr><td colspan="2">تفاصيل الدفع</td></tr></table>
          <div class="payment-breakdown">
            <table class="payment-item"><tr><td>إجمالي المبلغ:</td><td>${fmtAmt(receipt.total_amount)}</td></tr></table>
            ${(receipt.discount_amount || 0) > 0 ? `<table class="payment-item"><tr><td>الخصم:</td><td>${fmtAmt(receipt.discount_amount || 0)}</td></tr></table>` : ''}
            <table class="payment-item"><tr><td>المدفوع:</td><td>${fmtAmt(receipt.paid_now ?? receipt.upfront_payment)}</td></tr></table>
            ${pbRows}
            <table class="payment-item"><tr><td>المتبقي:</td><td>${fmtAmt(receipt.remaining_balance)}</td></tr></table>
            <table class="payment-item"><tr><td>الحالة:</td><td>${esc((receipt.billing_status || receipt.payment_status || '—').toString())}</td></tr></table>
            <table class="payment-item"><tr><td>طريقة الدفع:</td><td>${esc(receipt.payment_method || '—')}</td></tr></table>
          </div>

          <div class="total-section">المبلغ النهائي: ${fmtAmt(receipt.final_amount)}</div>

          ${barcodeBlock}

          <div class="thank-you">شكراً لثقتكم</div>

          <div class="footer">${footerHtml}</div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };


  const getStatusChip = (status: string) => {
    const statusConfig = {
      registered: { color: 'default', label: 'Registered' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color as any} size="small" />;
  };

  const getBillingStatusChip = (status: string) => {
    const statusConfig = {
      paid: { color: 'success', label: 'Paid' },
      partial: { color: 'warning', label: 'Partial Payment' },
      pending: { color: 'error', label: 'Unpaid' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color as any} size="small" />;
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt />
          Receipts Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchReceipts}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Receipts
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search by Lab Number, Patient Name, or Phone Number"
              value={searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : receipts.length === 0 ? (
        <Alert severity="info">
          {searchTerm ? 'No receipts found matching your search criteria.' : 'No receipts found.'}
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lab No</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Remaining</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Billing</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receipts.map((receipt) => (
                <TableRow key={receipt.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}>
                      {receipt.lab_number || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {receipt.patient.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {receipt.patient.phone}
                      </Typography>
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        ID: {receipt.patient.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {new Date(receipt.visit_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {receipt.visit_time}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(receipt.final_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(receipt.upfront_payment)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error.main">
                      {formatCurrency(receipt.remaining_balance)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(receipt.status)}</TableCell>
                  <TableCell>{getBillingStatusChip(receipt.billing_status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetails(receipt)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handlePrint(receipt)}
                        title="Print Receipt"
                      >
                        <Print />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
        </>
      )}

      {/* Receipt Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => {
        setIsEditing(false);
        setDetailsOpen(false);
      }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component="span">
            {isEditing ? 'تعديل بيانات الإيصال' : 'Receipt Details'} - {selectedReceipt?.receipt_number}
          </Box>
          {!isEditing && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Edit />}
              onClick={handleLoadReceiptForEdit}
              sx={{ 
                borderRadius: 1,
                px: 3,
                py: 1,
                fontSize: '0.9rem',
                fontWeight: 'bold',
              }}
            >
              Edit
            </Button>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: isEditing ? 1 : 3, position: 'relative', height: isEditing ? 'calc(90vh - 120px)' : 'auto', overflowY: isEditing ? 'auto' : 'visible' }}>
          {editingReceipt && (
            <>
              {isEditing ? (
                <Box sx={{ width: '100%', p: 1, overflowY: 'auto', height: '100%' }}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#d32f2f', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>
                    تعديل بيانات الإيصال
                  </Typography>
                  <Grid container spacing={0.5}>
                    {/* Name */}
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                        الاسم *
                      </Typography>
                      <TextField
                        fullWidth
                        value={editingReceipt.patient_name || editingReceipt.patient.name}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          patient_name: e.target.value,
                          patient: { ...editingReceipt.patient, name: e.target.value }
                        })}
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
                        value={editingReceipt.patient_age || ''}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          patient_age: parseInt(e.target.value) || 0
                        })}
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
                        value={editingReceipt.patient_phone || editingReceipt.patient.phone}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          patient_phone: e.target.value,
                          patient: { ...editingReceipt.patient, phone: e.target.value }
                        })}
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
                        value={editingReceipt.organization || ''}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          organization: e.target.value
                        })}
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
                          value={editingReceipt.patient_gender || 'ذكر'}
                          onChange={(e) => setEditingReceipt({
                            ...editingReceipt,
                            patient_gender: e.target.value
                          })}
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
                        value={editingReceipt.lab_number || ''}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          lab_number: e.target.value
                        })}
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
                        value={editingReceipt.referring_doctor || ''}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          referring_doctor: e.target.value
                        })}
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
                        value={editingReceipt.visit_date || ''}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          visit_date: e.target.value
                        })}
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
                          value={editingReceipt.attendance_day || 'السبت'}
                          onChange={(e) => setEditingReceipt({
                            ...editingReceipt,
                            attendance_day: e.target.value
                          })}
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
                        value={editingReceipt.expected_delivery_date || ''}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          expected_delivery_date: e.target.value
                        })}
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
                          value={editingReceipt.delivery_day || 'السبت'}
                          onChange={(e) => setEditingReceipt({
                            ...editingReceipt,
                            delivery_day: e.target.value
                          })}
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
                        value={editingReceipt.number_of_samples || 1}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          number_of_samples: parseInt(e.target.value) || 1
                        })}
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
                          value={editingReceipt.sample_size || 'صغيرة جدا'}
                          onChange={(e) => setEditingReceipt({
                            ...editingReceipt,
                            sample_size: e.target.value
                          })}
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
                          value={editingReceipt.sample_type || 'Pathology'}
                          onChange={(e) => setEditingReceipt({
                            ...editingReceipt,
                            sample_type: e.target.value
                          })}
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
                          value={editingReceipt.previous_tests || 'نعم'}
                          onChange={(e) => setEditingReceipt({
                            ...editingReceipt,
                            previous_tests: e.target.value
                          })}
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
                        value={editingReceipt.total_amount}
                        onChange={(e) => {
                          const newTotal = parseFloat(e.target.value) || 0;
                          setEditingReceipt({
                            ...editingReceipt,
                            total_amount: newTotal,
                            final_amount: newTotal - (editingReceipt.discount_amount || 0),
                            remaining_balance: (newTotal - (editingReceipt.discount_amount || 0)) - editingReceipt.upfront_payment
                          });
                        }}
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
                        value={editingReceipt.payment_breakdown?.cash || 0}
                        onChange={(e) => {
                          const cash = parseFloat(e.target.value) || 0;
                          const card = editingReceipt.payment_breakdown?.card || 0;
                          setEditingReceipt({
                            ...editingReceipt,
                            upfront_payment: cash + card,
                            remaining_balance: editingReceipt.final_amount - (cash + card),
                            payment_breakdown: {
                              ...editingReceipt.payment_breakdown,
                              cash,
                              card,
                              card_method: editingReceipt.payment_breakdown?.card_method || 'Fawry'
                            }
                          });
                        }}
                        size="small"
                        sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                      />
                    </Grid>
                    {/* Amount Paid Card */}
                    <Grid item xs={4}>
                      <Typography variant="caption" sx={{ mb: 0.25, fontWeight: 500, fontSize: '0.7rem', display: 'block' }}>
                        المبلغ المدفوع ب {editingReceipt.payment_breakdown?.card_method || 'Fawry'}
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        value={editingReceipt.payment_breakdown?.card || 0}
                        onChange={(e) => {
                          const card = parseFloat(e.target.value) || 0;
                          const cash = editingReceipt.payment_breakdown?.cash || 0;
                          setEditingReceipt({
                            ...editingReceipt,
                            upfront_payment: cash + card,
                            remaining_balance: editingReceipt.final_amount - (cash + card),
                            payment_breakdown: {
                              ...editingReceipt.payment_breakdown,
                              cash,
                              card,
                              card_method: editingReceipt.payment_breakdown?.card_method || 'Fawry'
                            }
                          });
                        }}
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
                          value={editingReceipt.payment_breakdown?.card_method || 'Fawry'}
                          onChange={(e) => setEditingReceipt({
                            ...editingReceipt,
                            payment_breakdown: {
                              ...editingReceipt.payment_breakdown,
                              card_method: e.target.value,
                              cash: editingReceipt.payment_breakdown?.cash || 0,
                              card: editingReceipt.payment_breakdown?.card || 0
                            }
                          })}
                          sx={{ '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' } }}
                        >
                          <MenuItem value="Fawry">Fawry</MenuItem>
                          <MenuItem value="InstaPay">InstaPay</MenuItem>
                          <MenuItem value="VodafoneCash">VodafoneCash</MenuItem>
                          <MenuItem value="Card">Card</MenuItem>
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
                        value={editingReceipt.medical_history || ''}
                        onChange={(e) => setEditingReceipt({
                          ...editingReceipt,
                          medical_history: e.target.value
                        })}
                        size="small"
                        sx={{ '& .MuiInputBase-input': { py: 0.75, fontSize: '0.8rem' } }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Patient Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Name:</strong></Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editingReceipt.patient_name || editingReceipt.patient.name}
                      onChange={(e) => setEditingReceipt({
                        ...editingReceipt,
                        patient_name: e.target.value,
                        patient: { ...editingReceipt.patient, name: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mb: 2 }}>{editingReceipt.patient.name}</Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Age:</strong></Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={editingReceipt.patient_age || ''}
                      onChange={(e) => setEditingReceipt({
                        ...editingReceipt,
                        patient_age: parseInt(e.target.value) || 0
                      })}
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mb: 2 }}>{editingReceipt.patient_age || 'N/A'}</Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Phone:</strong></Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editingReceipt.patient_phone || editingReceipt.patient.phone}
                      onChange={(e) => setEditingReceipt({
                        ...editingReceipt,
                        patient_phone: e.target.value,
                        patient: { ...editingReceipt.patient, phone: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mb: 2 }}>{editingReceipt.patient.phone}</Typography>
                  )}
                  
                  {editingReceipt.patient.email && (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Email:</strong></Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{editingReceipt.patient.email}</Typography>
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Receipt Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Receipt #:</strong> {editingReceipt.receipt_number}</Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Lab #:</strong></Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editingReceipt.lab_number || ''}
                      onChange={(e) => setEditingReceipt({
                        ...editingReceipt,
                        lab_number: e.target.value
                      })}
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mb: 2 }}>{editingReceipt.lab_number || 'N/A'}</Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Visit #:</strong> {editingReceipt.visit_number}</Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Date:</strong></Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={editingReceipt.visit_date ? new Date(editingReceipt.visit_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingReceipt({
                        ...editingReceipt,
                        visit_date: e.target.value
                      })}
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mb: 2 }}>{new Date(editingReceipt.visit_date).toLocaleDateString()}</Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Time:</strong> {editingReceipt.visit_time}</Typography>
                  
                  {editingReceipt.expected_delivery_date && (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Expected Delivery Date:</strong></Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          value={editingReceipt.expected_delivery_date ? new Date(editingReceipt.expected_delivery_date).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditingReceipt({
                            ...editingReceipt,
                            expected_delivery_date: e.target.value
                          })}
                          sx={{ mb: 2 }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {new Date(editingReceipt.expected_delivery_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Tests</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Test Name</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(editingReceipt.visitTests || []).map((test) => (
                        <TableRow key={test.id}>
                          <TableCell>{(test as any).custom_test_name || (test.labTest || test.lab_test)?.name || 'Unknown Test'}</TableCell>
                          <TableCell>{formatCurrency((test as any).final_price || (test.labTest || test.lab_test)?.price || 0)}</TableCell>
                          <TableCell>{getStatusChip(test.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Payment Summary</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Typography variant="body2">Total Amount:</Typography>
                  {isEditing ? (
                    <TextField
                      type="number"
                      size="small"
                      value={editingReceipt.total_amount}
                      onChange={(e) => {
                        const newTotal = parseFloat(e.target.value) || 0;
                        setEditingReceipt({
                          ...editingReceipt,
                          total_amount: newTotal,
                          final_amount: newTotal - (editingReceipt.discount_amount || 0),
                          remaining_balance: (newTotal - (editingReceipt.discount_amount || 0)) - editingReceipt.upfront_payment
                        });
                      }}
                      sx={{ width: 150 }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  ) : (
                    <Typography variant="body2">{formatCurrency(editingReceipt.total_amount)}</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Typography variant="body2">Final Amount:</Typography>
                  {isEditing ? (
                    <TextField
                      type="number"
                      size="small"
                      value={editingReceipt.final_amount}
                      onChange={(e) => {
                        const newFinal = parseFloat(e.target.value) || 0;
                        setEditingReceipt({
                          ...editingReceipt,
                          final_amount: newFinal,
                          remaining_balance: newFinal - editingReceipt.upfront_payment
                        });
                      }}
                      sx={{ width: 150 }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{formatCurrency(editingReceipt.final_amount)}</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Typography variant="body2">Amount Paid:</Typography>
                  {isEditing ? (
                    <TextField
                      type="number"
                      size="small"
                      value={editingReceipt.upfront_payment}
                      onChange={(e) => {
                        const newPaid = parseFloat(e.target.value) || 0;
                        setEditingReceipt({
                          ...editingReceipt,
                          upfront_payment: newPaid,
                          remaining_balance: editingReceipt.final_amount - newPaid
                        });
                      }}
                      sx={{ width: 150 }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  ) : (
                    <Typography variant="body2" color="success.main">{formatCurrency(editingReceipt.upfront_payment)}</Typography>
                  )}
                </Box>
                
                {/* Payment Breakdown */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Payment Breakdown:
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                    <Typography variant="body2">Paid Cash:</Typography>
                    {isEditing ? (
                      <TextField
                        type="number"
                        size="small"
                        value={editingReceipt.payment_breakdown?.cash || 0}
                        onChange={(e) => {
                          const cash = parseFloat(e.target.value) || 0;
                          const card = editingReceipt.payment_breakdown?.card || 0;
                          setEditingReceipt({
                            ...editingReceipt,
                            upfront_payment: cash + card,
                            remaining_balance: editingReceipt.final_amount - (cash + card),
                            payment_breakdown: {
                              ...editingReceipt.payment_breakdown,
                              cash,
                              card,
                              card_method: editingReceipt.payment_breakdown?.card_method || 'Fawry'
                            }
                          });
                        }}
                        sx={{ width: 150 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    ) : (
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(editingReceipt.payment_breakdown?.cash || 0)}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                    <Typography variant="body2">Paid with {editingReceipt.payment_breakdown?.card_method || 'Card'}:</Typography>
                    {isEditing ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControl size="small" sx={{ width: 120 }}>
                          <Select
                            value={editingReceipt.payment_breakdown?.card_method || 'Fawry'}
                            onChange={(e) => setEditingReceipt({
                              ...editingReceipt,
                              payment_breakdown: {
                                ...editingReceipt.payment_breakdown,
                                card_method: e.target.value,
                                cash: editingReceipt.payment_breakdown?.cash || 0,
                                card: editingReceipt.payment_breakdown?.card || 0
                              }
                            })}
                          >
                            <MenuItem value="Fawry">Fawry</MenuItem>
                            <MenuItem value="InstaPay">InstaPay</MenuItem>
                            <MenuItem value="VodafoneCash">VodafoneCash</MenuItem>
                            <MenuItem value="Card">Card</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          type="number"
                          size="small"
                          value={editingReceipt.payment_breakdown?.card || 0}
                          onChange={(e) => {
                            const card = parseFloat(e.target.value) || 0;
                            const cash = editingReceipt.payment_breakdown?.cash || 0;
                            setEditingReceipt({
                              ...editingReceipt,
                              upfront_payment: cash + card,
                              remaining_balance: editingReceipt.final_amount - (cash + card),
                              payment_breakdown: {
                                ...editingReceipt.payment_breakdown,
                                cash,
                                card,
                                card_method: editingReceipt.payment_breakdown?.card_method || 'Fawry'
                              }
                            });
                          }}
                          sx={{ width: 150 }}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(editingReceipt.payment_breakdown?.card || 0)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Typography variant="body2">Remaining Balance:</Typography>
                  <Typography variant="body2" color="error.main">{formatCurrency(editingReceipt.remaining_balance)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Typography variant="body2">Payment Method:</Typography>
                  {isEditing ? (
                    <TextField
                      size="small"
                      value={editingReceipt.payment_method}
                      onChange={(e) => setEditingReceipt({ ...editingReceipt, payment_method: e.target.value })}
                      sx={{ width: 150 }}
                    />
                  ) : (
                    <Typography variant="body2">{editingReceipt.payment_method}</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Billing Status:</Typography>
                  {getBillingStatusChip(editingReceipt.billing_status)}
                </Box>
                {editingReceipt.processed_by && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Processed by:</Typography>
                    <Typography variant="body2">{editingReceipt.processed_by}</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsEditing(false);
            setDetailsOpen(false);
          }}>Close</Button>
          {!isEditing ? (
            <>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={async () => {
                  if (selectedReceipt) {
                    await handlePrint(selectedReceipt);
                  }
                }}
              >
                Print Receipt
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  setEditingReceipt(selectedReceipt ? { ...selectedReceipt } : null);
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={async () => {
                  if (selectedReceipt) {
                    await handlePrint(selectedReceipt);
                  }
                }}
                disabled={saving}
              >
                Print Receipt
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveReceipt}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Print dialog: 80mm paper, ~70mm content (levelsderm-style thermal) */}
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth={false} PaperProps={{ sx: { width: 'min(80mm, 100vw)', maxWidth: '100vw' } }}>
        <DialogTitle>Print Receipt - {selectedReceipt?.receipt_number}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Preview matches 80&nbsp;mm thermal width. Use &quot;Print Receipt&quot; for the browser print dialog, or print from the PDF opened by the main Print button.
          </Typography>
          {selectedReceipt && (
            <Box
              sx={{
                p: 1.5,
                border: '1px dashed #ccc',
                borderRadius: 1,
                width: '70mm',
                maxWidth: '100%',
                mx: 'auto',
                fontFamily: '"Courier New", monospace',
                fontSize: '12px',
                fontWeight: 600,
                lineHeight: 1.2,
                boxSizing: 'border-box',
              }}
            >
              <Typography variant="h6" align="center" gutterBottom>
                RECEIPT
              </Typography>
              <Typography variant="body2" align="center" gutterBottom>
                {selectedReceipt.receipt_number}
              </Typography>
              <Typography variant="body2" align="center" gutterBottom>
                {new Date(selectedReceipt.visit_date).toLocaleDateString()} {selectedReceipt.visit_time}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Patient: {selectedReceipt.patient.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Phone: {selectedReceipt.patient.phone}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Total: {formatCurrency(selectedReceipt.final_amount)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Paid: {formatCurrency(selectedReceipt.upfront_payment)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Remaining: {formatCurrency(selectedReceipt.remaining_balance)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={async () => {
              await printReceipt(selectedReceipt!);
              setPrintOpen(false);
            }}
          >
            Print Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Receipts;

