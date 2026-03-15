import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TemplateSaveModal from '../../components/TemplateSaveModal';
import { SimilarCasesPanel } from '../../components/reportSearch/SimilarCasesPanel';
import { ReportComparison } from '../../components/reportSearch/ReportComparison';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  ContentCopy,
  FullscreenExit,
  Fullscreen,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Visit {
  id: number;
  visit_number: string;
  visit_date: string;
  test_status: string;
  diagnosis?: string;
  clinical_data?: string;
  specimen_information?: string;
  gross_examination?: string;
  microscopic_description?: string;
  recommendations?: string;
  referred_doctor?: string;
  notes?: string;
  image_path?: string;
  image_filename?: string;
  image_mime_type?: string;
  image_size?: number;
  image_uploaded_at?: string;
  image_uploaded_by?: number;
  lab_number?: string;
  checked_by_doctors?: string[];
  last_checked_at?: string;
  labRequest?: {
    id: number;
    lab_no: string;
    suffix?: string;
    full_lab_no: string;
    reports?: Array<{
      id: number;
      content: string;
      title: string;
      status: string;
    }>;
  };
  patient: {
    id: number;
    name: string;
    phone: string;
    gender: string;
    birth_date: string;
    age: string;
    doctor_id?: string;
  };
  visit_tests: Array<{
    id: number;
    lab_test: {
      id: number;
      name: string;
      code: string;
      reference_range?: string;
    };
    result_value?: string;
    result_status?: string;
    result_notes?: string;
    status: string;
    price: number;
  }>;
}

interface ReportData {
  clinical_data?: string;
  nature_of_specimen?: string;
  gross_pathology?: string;
  microscopic_examination?: string;
  conclusion?: string;
  recommendations?: string;
  referred_by?: string;
  type_of_analysis?: string;
  image_placement?: string;
  // Legacy field names for backward compatibility
  gross_examination?: string;
  microscopic_description?: string;
  specimen_information?: string;
  diagnosis?: string;
  [key: string]: any; // Allow additional properties
}

const PathologyRecordForm: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get return URL from navigation state, default to /reports
  const returnUrl = (location.state as { returnUrl?: string })?.returnUrl || '/reports';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Copy from another patient feature
  const [copyFromLabNo, setCopyFromLabNo] = useState('');
  const [copyingData, setCopyingData] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [sourcePatientData, setSourcePatientData] = useState<any>(null);

  // Expandable field dialog state
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [expandedValue, setExpandedValue] = useState('');

  // Comparison modal state
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonVisitId, setComparisonVisitId] = useState<number | null>(null);

  // Single text fields for all pathology details
  const [clinicalData, setClinicalData] = useState<string>('');
  const [natureOfSpecimen, setNatureOfSpecimen] = useState<string>('');
  const [grossPathology, setGrossPathology] = useState<string>('');
  const [microscopicExamination, setMicroscopicExamination] = useState<string>('');
  const [conclusion, setConclusion] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');

  // Helper function to clean field data (remove numbered points format)
  const cleanFieldData = (data: string | undefined): string => {
    if (!data || data.trim() === '' || data === '.' || data === '---') {
      return '';
    }
    
    // Remove numbered points format (e.g., "1-point1\n2-point2" -> "point1\npoint2")
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return '';
    }
    
    // Remove leading number and dash/period if present
    const cleanedLines = lines.map(line => {
      const match = line.match(/^\d+[-.)]\s*(.+)$/);
      if (match) {
        return match[1].trim();
      }
      // Remove leading dash or bullet if present
      const match2 = line.match(/^[-•]\s*(.+)$/);
      if (match2) {
        return match2[1].trim();
      }
      return line.trim();
    });
    
    return cleanedLines.join('\n');
  };

  const [formData, setFormData] = useState({
    // Patient Information
    patient_name: '',
    referred_by: '',
    lab_no: '',
    date: '',
    age: '',
    sex: 'Male',
    receiving_date: '',
    
    // Pathology Details
    clinical_data: '',
    nature_of_specimen: '',
    gross_pathology: '',
    microscopic_examination: '',
    conclusion: '',
    recommendations: '',
    
    // Document Type
    type_of_analysis: 'Pathology',
    test_status: 'pending',
    image: null as File | null,
    image_placement: 'end_of_report', // 'clinical_data', 'nature_of_specimen', 'gross_pathology', 'microscopic_examination', 'conclusion', 'end_of_report'
  });

  useEffect(() => {
    if (visitId) {
      fetchVisitData();
      fetchTemplates();
    }
  }, [visitId]);

  const fetchVisitData = async () => {
    try {
      const response = await axios.get(`/api/visits/${visitId}`);
      const visitData = response.data;
      setVisit(visitData);
      
      console.log('Visit data loaded:', visitData);
      console.log('Lab request reports:', visitData.labRequest?.reports);
      
      // Load report data if available
      let reportData: ReportData = {};
      
      // Try multiple ways to find reports
      let reports = [];
      
      // Method 1: Through labRequest.reports
      if (visitData.labRequest && visitData.labRequest.reports) {
        // Handle both array and Collection-like objects
        if (Array.isArray(visitData.labRequest.reports)) {
          reports = visitData.labRequest.reports;
        } else if (visitData.labRequest.reports && typeof visitData.labRequest.reports === 'object') {
          // Try different ways to extract data from Collection
          if (visitData.labRequest.reports.data) {
            reports = visitData.labRequest.reports.data;
          } else if (visitData.labRequest.reports.items) {
            reports = visitData.labRequest.reports.items;
          } else if (visitData.labRequest.reports['Illuminate\\Support\\Collection']) {
            // Handle Laravel Collection structure
            reports = visitData.labRequest.reports['Illuminate\\Support\\Collection'];
          } else {
            // Convert Collection-like object to array
            reports = Object.values(visitData.labRequest.reports);
          }
        }
      }
      // Method 2: Direct reports on visit
      else if (visitData.reports && visitData.reports.length > 0) {
        reports = visitData.reports;
      }
      // Method 3: Check if reports is in a different structure
      else if (visitData.labRequest && visitData.labRequest.reports) {
        reports = visitData.labRequest.reports;
      }
      
      console.log('Found reports:', reports);
      
        if (reports.length > 0) {
          // Get the latest report (prioritize completed, but use any if available)
          let report = reports
            .filter((r: any) => r.status === 'completed')
            .sort((a: any, b: any) => b.id - a.id)[0];

          if (!report) {
            // Fall back to the latest report if no completed report found
            report = reports.sort((a: any, b: any) => b.id - a.id)[0];
          }
          
          // If still no report, use the first one
          if (!report && reports.length > 0) {
            report = reports[0];
          }
        
        console.log('Selected report:', report);
        console.log('Report status:', report.status);
        console.log('Report content:', report.content);
        
        try {
          reportData = JSON.parse(report.content || '{}') as ReportData;
          console.log('Parsed report data:', reportData);
          
          // Normalize key names - handle different variations
          if (reportData && typeof reportData === 'object') {
            // Map old key names to new ones
            if (reportData.gross_examination && !reportData.gross_pathology) {
              reportData.gross_pathology = reportData.gross_examination;
            }
            if (reportData.microscopic_description && !reportData.microscopic_examination) {
              reportData.microscopic_examination = reportData.microscopic_description;
            }
            if (reportData.specimen_information && !reportData.nature_of_specimen) {
              reportData.nature_of_specimen = reportData.specimen_information;
            }
            if (reportData.diagnosis && !reportData.conclusion) {
              reportData.conclusion = reportData.diagnosis;
            }
          }
        } catch (e) {
          console.warn('Failed to parse report content:', e);
        }
      } else {
        console.log('No reports found in visit data, trying fallback methods...');
        
        // Try to find reports in any possible structure
        if (visitData.labRequest && visitData.labRequest.reports) {
          // If it's an object with data property
          if (visitData.labRequest.reports.data) {
            reports = visitData.labRequest.reports.data;
          }
          // If it's an object with items
          else if (visitData.labRequest.reports.items) {
            reports = visitData.labRequest.reports.items;
          }
        }
        
        if (reports.length > 0) {
          const report = reports[0];
          try {
            reportData = JSON.parse(report.content || '{}') as ReportData;
            
            // Normalize key names - handle different variations
            if (reportData && typeof reportData === 'object') {
              if (reportData.gross_examination && !reportData.gross_pathology) {
                reportData.gross_pathology = reportData.gross_examination;
              }
              if (reportData.microscopic_description && !reportData.microscopic_examination) {
                reportData.microscopic_examination = reportData.microscopic_description;
              }
              if (reportData.specimen_information && !reportData.nature_of_specimen) {
                reportData.nature_of_specimen = reportData.specimen_information;
              }
              if (reportData.diagnosis && !reportData.conclusion) {
                reportData.conclusion = reportData.diagnosis;
              }
            }
          } catch (e) {
            console.warn('Failed to parse fallback report content:', e);
          }
        } else {
          // Try to fetch reports directly if labRequest is not available
          if (visitData.lab_request_id) {
            console.log('Fetching reports directly for lab_request_id:', visitData.lab_request_id);
            try {
              const reportsResponse = await axios.get(`/api/reports?lab_request_id=${visitData.lab_request_id}`);
              console.log('Direct reports response:', reportsResponse.data);
              if (reportsResponse.data && reportsResponse.data.length > 0) {
                // Get the latest completed report, or fall back to the latest report
                let report = reportsResponse.data
                  .filter((r: any) => r.status === 'completed')
                  .sort((a: any, b: any) => b.id - a.id)[0];
                
                if (!report) {
                  // Fall back to the latest report if no completed report found
                  report = reportsResponse.data.sort((a: any, b: any) => b.id - a.id)[0];
                }
                
                console.log('Selected report from direct API call:', report);
                
                try {
                  reportData = JSON.parse(report.content || '{}') as ReportData;
                  console.log('Loaded report data from direct API call:', reportData);
                  
                  // Normalize key names - handle different variations
                  if (reportData && typeof reportData === 'object') {
                    if (reportData.gross_examination && !reportData.gross_pathology) {
                      reportData.gross_pathology = reportData.gross_examination;
                    }
                    if (reportData.microscopic_description && !reportData.microscopic_examination) {
                      reportData.microscopic_examination = reportData.microscopic_description;
                    }
                    if (reportData.specimen_information && !reportData.nature_of_specimen) {
                      reportData.nature_of_specimen = reportData.specimen_information;
                    }
                    if (reportData.diagnosis && !reportData.conclusion) {
                      reportData.conclusion = reportData.diagnosis;
                    }
                  }
                } catch (e) {
                  console.warn('Failed to parse direct report content:', e);
                }
              }
            } catch (e) {
              console.warn('Failed to fetch reports directly:', e);
            }
          }
        }
      }
      
      // Populate form with existing data
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Setting form data with reportData:', reportData);
      console.log('Visit data for referred_by:', {
        reportData_referred_by: reportData.referred_by,
        patient_doctor_id: visitData.patient?.doctor_id,
        patient_doctor: visitData.patient?.doctor,
        patient_sender: visitData.patient?.sender,
        visit_referred_doctor: visitData.referred_doctor,
        labRequest_referred_doctor: visitData.labRequest?.referred_doctor,
        metadata: visitData.metadata,
        patient_object: visitData.patient,
      });
      
      // Try to get referred_by from multiple sources
      let referredBy = '';
      if (reportData.referred_by) {
        referredBy = reportData.referred_by;
      } else if (visitData.referred_doctor) {
        referredBy = visitData.referred_doctor;
      } else if (visitData.patient?.doctor_id) {
        referredBy = visitData.patient.doctor_id;
      } else if (visitData.patient?.doctor) {
        referredBy = visitData.patient.doctor;
      } else if (visitData.patient?.sender) {
        referredBy = visitData.patient.sender;
      } else if (visitData.labRequest?.referred_doctor) {
        referredBy = visitData.labRequest.referred_doctor;
      } else if (visitData.metadata) {
        // Try to get from metadata
        try {
          const metadata = typeof visitData.metadata === 'string' ? JSON.parse(visitData.metadata) : visitData.metadata;
          if (metadata?.patient_data?.doctor) {
            referredBy = metadata.patient_data.doctor;
          } else if (metadata?.referred_doctor) {
            referredBy = metadata.referred_doctor;
          } else if (metadata?.doctor) {
            referredBy = metadata.doctor;
          }
        } catch (e) {
          console.warn('Failed to parse metadata:', e);
        }
      }
      
      console.log('Final referred_by value:', referredBy);
      
      // Build form data object
      const newFormData = {
        // Patient Information
        patient_name: visitData.patient?.name || '',
        referred_by: referredBy,
        lab_no: visitData.lab_number || visitData.labRequest?.full_lab_no || visitData.labRequest?.lab_no || visitData.patient?.lab || visitData.visit_number || '',
        date: visitData.visit_date ? visitData.visit_date.split('T')[0] : today,
        age: visitData.patient?.age || '',
        sex: visitData.patient?.gender ? visitData.patient.gender.charAt(0).toUpperCase() + visitData.patient.gender.slice(1).toLowerCase() : 'Male',
        receiving_date: visitData.visit_date ? visitData.visit_date.split('T')[0] : today,
        
        // Pathology Details - prioritize reportData, but handle empty strings, nulls, and single dots
        clinical_data: (reportData?.clinical_data && 
          reportData.clinical_data !== null && 
          reportData.clinical_data !== '.' && 
          String(reportData.clinical_data).trim() !== '') 
          ? String(reportData.clinical_data) 
          : (visitData.clinical_data || ''),
        nature_of_specimen: (reportData?.nature_of_specimen && 
          reportData.nature_of_specimen !== null && 
          String(reportData.nature_of_specimen).trim() !== '') 
          ? String(reportData.nature_of_specimen) 
          : (visitData.specimen_information || ''),
        gross_pathology: (reportData?.gross_pathology && 
          reportData.gross_pathology !== null && 
          String(reportData.gross_pathology).trim() !== '') 
          ? String(reportData.gross_pathology) 
          : (reportData?.gross_examination && 
            reportData.gross_examination !== null && 
            String(reportData.gross_examination).trim() !== '')
            ? String(reportData.gross_examination)
            : (visitData.gross_examination || ''),
        microscopic_examination: (reportData?.microscopic_examination && 
          reportData.microscopic_examination !== null && 
          String(reportData.microscopic_examination).trim() !== '') 
          ? String(reportData.microscopic_examination) 
          : (reportData?.microscopic_description && 
            reportData.microscopic_description !== null && 
            String(reportData.microscopic_description).trim() !== '')
            ? String(reportData.microscopic_description)
            : (visitData.microscopic_description || ''),
        conclusion: (reportData?.conclusion && 
          reportData.conclusion !== null && 
          String(reportData.conclusion).trim() !== '') 
          ? String(reportData.conclusion) 
          : (reportData?.diagnosis && 
            reportData.diagnosis !== null && 
            String(reportData.diagnosis).trim() !== '')
            ? String(reportData.diagnosis)
            : (visitData.diagnosis || ''),
        recommendations: (reportData?.recommendations && 
          reportData.recommendations !== null && 
          String(reportData.recommendations).trim() !== '') 
          ? String(reportData.recommendations) 
          : (visitData.recommendations || ''),
        
        // Document Type
        type_of_analysis: reportData.type_of_analysis || 'Pathology',
        test_status: visitData.test_status || 'pending',
        image: null,
        image_placement: reportData.image_placement || 'end_of_report',
      };
      
      console.log('Final form data being set:', {
        clinical_data_length: newFormData.clinical_data.length,
        nature_of_specimen_length: newFormData.nature_of_specimen.length,
        gross_pathology_length: newFormData.gross_pathology.length,
        microscopic_examination_length: newFormData.microscopic_examination.length,
        conclusion_length: newFormData.conclusion.length,
        recommendations_length: newFormData.recommendations.length,
        reportData_keys: reportData ? Object.keys(reportData) : 'no reportData',
        reportData_sample: reportData ? {
          clinical_data_preview: reportData.clinical_data ? String(reportData.clinical_data).substring(0, 50) : 'EMPTY',
          gross_pathology_preview: reportData.gross_pathology ? String(reportData.gross_pathology).substring(0, 50) : 'EMPTY',
        } : 'no reportData',
      });
      
      setFormData(newFormData);
      
      // Initialize all fields from the loaded data
      setClinicalData(cleanFieldData(newFormData.clinical_data));
      setNatureOfSpecimen(cleanFieldData(newFormData.nature_of_specimen));
      setGrossPathology(cleanFieldData(newFormData.gross_pathology));
      setMicroscopicExamination(cleanFieldData(newFormData.microscopic_examination));
      setConclusion(cleanFieldData(newFormData.conclusion));
      setRecommendations(cleanFieldData(newFormData.recommendations));
      
    } catch (error) {
      console.error('Failed to fetch visit data:', error);
      toast.error('Failed to load visit data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates');
      const templatesData = response.data?.data || response.data || [];
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Removed unused handleExpandField function

  const handleExpandField = (fieldName: string) => {
    let currentValue = '';
    switch (fieldName) {
      case 'clinical_data':
        currentValue = clinicalData;
        break;
      case 'nature_of_specimen':
        currentValue = natureOfSpecimen;
        break;
      case 'gross_pathology':
        currentValue = grossPathology;
        break;
      case 'microscopic_examination':
        currentValue = microscopicExamination;
        break;
      case 'conclusion':
        currentValue = conclusion;
        break;
      case 'recommendations':
        currentValue = recommendations;
        break;
    }
    setExpandedValue(currentValue);
    setExpandedField(fieldName);
  };

  const handleCloseExpandedField = () => {
    if (expandedField) {
      switch (expandedField) {
        case 'clinical_data':
          setClinicalData(expandedValue);
          break;
        case 'nature_of_specimen':
          setNatureOfSpecimen(expandedValue);
          break;
        case 'gross_pathology':
          setGrossPathology(expandedValue);
          break;
        case 'microscopic_examination':
          setMicroscopicExamination(expandedValue);
          break;
        case 'conclusion':
          setConclusion(expandedValue);
          break;
        case 'recommendations':
          setRecommendations(expandedValue);
          break;
      }
    }
    setExpandedField(null);
    setExpandedValue('');
  };


  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId && Array.isArray(templates)) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        const clinicalData = template.clinical_data || '';
        setFormData(prev => ({
          ...prev,
          // Pathology Details - All fields
          clinical_data: clinicalData,
          nature_of_specimen: template.specimen_information || prev.nature_of_specimen,
          gross_pathology: template.gross_examination || prev.gross_pathology,
          microscopic_examination: template.microscopic_description || template.microscopic || prev.microscopic_examination,
          conclusion: template.diagnosis || prev.conclusion,
          recommendations: template.recommendations || prev.recommendations,
          // Patient Information
          referred_by: template.referred_doctor || prev.referred_by,
          // Document Type
          type_of_analysis: template.type_of_analysis || prev.type_of_analysis,
        }));
        // Update all fields
        setClinicalData(cleanFieldData(clinicalData));
        setNatureOfSpecimen(cleanFieldData(template.specimen_information || ''));
        setGrossPathology(cleanFieldData(template.gross_examination || ''));
        setMicroscopicExamination(cleanFieldData(template.microscopic_description || template.microscopic || ''));
        setConclusion(cleanFieldData(template.diagnosis || ''));
        setRecommendations(cleanFieldData(template.recommendations || ''));
      }
    }
  };

  const handleSaveAsTemplate = () => {
    setTemplateModalOpen(true);
  };

  const handleTemplateSave = async (templateName: string) => {
    setSavingTemplate(true);
    try {
      const templateData = {
        name: templateName,
        clinical_data: formData.clinical_data,
        specimen_information: formData.nature_of_specimen,
        gross_examination: formData.gross_pathology,
        microscopic_description: formData.microscopic_examination,
        diagnosis: formData.conclusion,
        recommendations: formData.recommendations,
        referred_doctor: formData.referred_by,
        type_of_analysis: formData.type_of_analysis,
      };

      await axios.post('/api/templates', templateData);
      toast.success('Template saved successfully!');
      
      // Refresh templates list
      fetchTemplates();
      setTemplateModalOpen(false);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const saveReport = async () => {
    // Validate required fields
    if (!formData.patient_name || !formData.patient_name.trim()) {
      toast.error('Patient name is required');
      return false;
    }
    
    if (!formData.lab_no || !formData.lab_no.trim()) {
      toast.error('Lab number is required');
      return false;
    }
    
    // Get current field values from state
    const updatedFormData = {
      ...formData,
      clinical_data: clinicalData.trim(),
      nature_of_specimen: natureOfSpecimen.trim(),
      gross_pathology: grossPathology.trim(),
      microscopic_examination: microscopicExamination.trim(),
      conclusion: conclusion.trim(),
      recommendations: recommendations.trim(),
    };

      const formDataToSend = new FormData();
      
      // Add all form fields
    Object.entries(updatedFormData).forEach(([key, value]) => {
        if (key !== 'image' && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Keep the current status when "Record Now" is pressed (don't auto-complete)
      // Only admin can mark as completed via "Mark as Complete" button
    formDataToSend.set('test_status', updatedFormData.test_status || 'pending');

      // Debug: Log the form data being sent
    console.log('Form data being sent:', updatedFormData);
      console.log('FormDataToSend entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Add image if selected
    if (updatedFormData.image) {
      formDataToSend.append('image', updatedFormData.image);
      }

      await axios.post(`/api/visits/${visitId}/report`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);

    try {
      const success = await saveReport();
      if (success) {
      toast.success('Report saved successfully!');
      // Navigate to documents page for this visit
      navigate(`/documents/${visitId}`, {
        state: { returnUrl: returnUrl }
      });
      }
    } catch (error) {
      console.error('Failed to save report:', error);
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsChecked = async () => {
    if (!user?.name) {
      toast.error('User name not found');
      return;
    }

    if (!visitId) {
      toast.error('Visit ID not found');
      return;
    }

    try {
      setSaving(true);
      await axios.post(`/api/visits/${visitId}/mark-checked`, {
        doctor_name: user.name
      });

      toast.success('Report marked as checked successfully');
      
      // Refresh visit data to update the checked_by_doctors list
      await fetchVisitData();
    } catch (error: any) {
      console.error('Failed to mark report as checked:', error);
      toast.error(error.response?.data?.message || 'Failed to mark report as checked');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordAndPrint = async () => {
    setSaving(true);

    try {
      // First save the report
      const success = await saveReport();
      if (!success) {
        return;
      }

      toast.success('Report saved! Opening print dialog...');

      // Then print the document with header
      const endpoint = `/api/visits/${visitId}/report/pdf/with-header`;
      const response = await axios.get(endpoint);
      const documentData = response.data;
      
      // Convert base64 to binary
      const binaryString = atob(documentData.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Create an iframe to load the PDF and then print it
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          // Wait a bit for the PDF to fully load
          setTimeout(() => {
            iframe.contentWindow?.print();
            // Clean up after printing
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(blobUrl);
            }, 1000);
          }, 500);
        } catch (error) {
          console.error('Error printing:', error);
          // Fallback: open in new window
          window.open(blobUrl, '_blank');
          document.body.removeChild(iframe);
          toast.info('PDF opened in a new tab. Please use the browser\'s print function.');
        }
      };
      
      iframe.onerror = () => {
        // Fallback: open in new window if iframe fails
        window.open(blobUrl, '_blank');
        document.body.removeChild(iframe);
        toast.info('PDF opened in a new tab. Please use the browser\'s print function.');
      };
    } catch (error) {
      console.error('Failed to save and print report:', error);
      toast.error('Failed to save and print report');
    } finally {
      setSaving(false);
    }
  };

  // Copy from another patient functions
  const fetchPatientByLabNo = async (labNo: string) => {
    if (!labNo.trim()) {
      toast.error('Please enter a lab number');
      return;
    }

    setCopyingData(true);
    try {
      // Search for patient by lab number
      console.log('Searching for patient with lab number:', labNo);
      const response = await axios.get(`/api/patients/search?query=${labNo}`);
      
      const patients = response.data.data || response.data;
      console.log('Search results:', patients);
      
      if (!patients || patients.length === 0) {
        console.error('No patients returned from search API');
        toast.error('No patient found with this lab number');
        return;
      }

      // Normalize lab number for comparison (remove dashes, convert to lowercase)
      const normalizeLabNo = (lab: string) => {
        if (!lab) return '';
        return lab.toString().replace(/-/g, '').toLowerCase().trim();
      };

      const normalizedSearchLabNo = normalizeLabNo(labNo);

      // Find the patient with matching lab number (try multiple formats)
      const patient = patients.find((p: any) => {
        // Try direct matches
        if (normalizeLabNo(p.lab) === normalizedSearchLabNo) return true;
        if (normalizeLabNo(p.labRequest?.full_lab_no) === normalizedSearchLabNo) return true;
        if (normalizeLabNo(p.labRequest?.lab_no) === normalizedSearchLabNo) return true;
        
        // Try partial matches (in case of format differences)
        const pLab = normalizeLabNo(p.lab || '');
        const pFullLabNo = normalizeLabNo(p.labRequest?.full_lab_no || '');
        const pLabNo = normalizeLabNo(p.labRequest?.lab_no || '');
        
        // Check if search lab number is contained in any of the patient's lab numbers
        if (pLab && (pLab.includes(normalizedSearchLabNo) || normalizedSearchLabNo.includes(pLab))) return true;
        if (pFullLabNo && (pFullLabNo.includes(normalizedSearchLabNo) || normalizedSearchLabNo.includes(pFullLabNo))) return true;
        if (pLabNo && (pLabNo.includes(normalizedSearchLabNo) || normalizedSearchLabNo.includes(pLabNo))) return true;
        
        return false;
      });

      if (!patient) {
        console.error('No patient found with lab number:', labNo);
        console.error('Searched patients:', patients.map((p: any) => ({
          id: p.id,
          name: p.name,
          lab: p.lab,
          labRequest: p.labRequest
        })));
        toast.error(`No patient found with lab number: ${labNo}`);
        return;
      }

      // Get the patient's latest visit with pathology report
      const visitResponse = await axios.get(`/api/patients/${patient.id}/visits`);
      
      const visits = visitResponse.data.visits || visitResponse.data;
      
      if (!visits || visits.length === 0) {
        toast.error('No visits found for this patient');
        return;
      }

      // Find the latest visit with pathology report
      const latestVisit = visits.find((v: any) => 
        v.labRequest?.reports && v.labRequest.reports.length > 0
      ) || visits[0];

      if (!latestVisit) {
        toast.error('No pathology report found for this patient');
        return;
      }

      // Extract pathology details from the report
      let pathologyData = {};
      
      // Try to get reports data using the same approach as the main form
      if (latestVisit.labRequest?.reports && latestVisit.labRequest.reports.length > 0) {
        const report = latestVisit.labRequest.reports[0];
        
        try {
          pathologyData = JSON.parse(report.content || '{}');
        } catch (e) {
          console.warn('Failed to parse report content:', e);
        }
      } else {
        // Try to fetch reports directly using the same approach as the main form
        if (latestVisit.lab_request_id) {
          try {
            const reportsResponse = await axios.get(`/api/reports?lab_request_id=${latestVisit.lab_request_id}`);
            if (reportsResponse.data && reportsResponse.data.length > 0) {
              const report = reportsResponse.data[0];
              try {
                pathologyData = JSON.parse(report.content || '{}');
              } catch (e) {
                console.warn('Failed to parse direct report content for copy:', e);
              }
            }
          } catch (e) {
            console.warn('Failed to fetch reports directly for copy:', e);
          }
        }
      }
      
      // Always try to get pathology data directly from visit as fallback
      const visitBasedData = {
        clinical_data: latestVisit.clinical_data || '',
        nature_of_specimen: latestVisit.specimen_information || '',
        gross_pathology: latestVisit.gross_examination || '',
        microscopic_examination: latestVisit.microscopic_description || '',
        conclusion: latestVisit.diagnosis || '',
        recommendations: latestVisit.recommendations || '',
      };
      
      // Merge report data with visit data (report data takes priority)
      pathologyData = {
        ...visitBasedData,
        ...pathologyData,
      };

      setSourcePatientData({
        patient: patient,
        visit: latestVisit,
        pathologyData: pathologyData
      });
      
      setCopyModalOpen(true);

    } catch (error: any) {
      console.error('Failed to fetch patient data:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else if (error.response.status === 404) {
          toast.error('API endpoint not found. Please check if the backend is running.');
        } else if (error.response.status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(`Failed to fetch patient data: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check if the backend is running.');
      } else {
        // Something else happened
        console.error('Error setting up request:', error.message);
        toast.error(`Failed to fetch patient data: ${error.message}`);
      }
    } finally {
      setCopyingData(false);
    }
  };

  const copyPathologyData = () => {
    if (!sourcePatientData) return;

    const pathologyData = sourcePatientData.pathologyData;
    const clinicalData = pathologyData.clinical_data || '';
    
    const newFormData = {
      clinical_data: clinicalData,
      nature_of_specimen: pathologyData.nature_of_specimen || '',
      gross_pathology: pathologyData.gross_pathology || '',
      microscopic_examination: pathologyData.microscopic_examination || '',
      conclusion: pathologyData.conclusion || '',
      recommendations: pathologyData.recommendations || '',
    };
    
    setFormData(prev => ({
      ...prev,
      ...newFormData,
    }));

        // Update all fields
        setClinicalData(cleanFieldData(clinicalData));
        setNatureOfSpecimen(cleanFieldData(pathologyData.nature_of_specimen || ''));
        setGrossPathology(cleanFieldData(pathologyData.gross_pathology || ''));
        setMicroscopicExamination(cleanFieldData(pathologyData.microscopic_examination || ''));
        setConclusion(cleanFieldData(pathologyData.conclusion || ''));
        setRecommendations(cleanFieldData(pathologyData.recommendations || ''));

    toast.success('Pathology details copied successfully!');
    setCopyModalOpen(false);
    setSourcePatientData(null);
    setCopyFromLabNo('');
  };

  const handleCopyFromLabNo = () => {
    fetchPatientByLabNo(copyFromLabNo);
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Visit not found</Alert>
        <Button onClick={() => navigate(returnUrl)} sx={{ mt: 2 }}>
          Back to Reports
        </Button>
      </Box>
    );
  }


  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(returnUrl)}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" sx={{ textDecoration: 'underline', color: 'primary.main' }}>
            Pathology Record +
          </Typography>
        </Box>
      </Box>

      {/* Pathology Record Form */}
      <Paper sx={{ p: 3, bgcolor: 'white' }}>
        <Box component="form" onSubmit={handleSubmit}>
          {/* Patient and Administrative Information */}
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Patient and Administrative Information
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            {/* First Row: Name of Patient, Referred by, Lab No */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Name of Patient"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={(e) => handleInputChange('patient_name', e.target.value)}
                  required
                  placeholder="Name of Patient*"
                  error={!formData.patient_name}
                  helperText={!formData.patient_name ? "Patient name is required" : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Referred by"
                  name="referred_by"
                  value={formData.referred_by}
                  onChange={(e) => handleInputChange('referred_by', e.target.value)}
                  placeholder="Referred by"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Lab No"
                  name="lab_no"
                  value={formData.lab_no}
                  onChange={(e) => handleInputChange('lab_no', e.target.value)}
                  required
                  placeholder="Lab No : *"
                  error={!formData.lab_no}
                  helperText={!formData.lab_no ? "Lab number is required" : ""}
                />
              </Grid>
            </Grid>

            {/* Second Row: Date, Age, Sex */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  placeholder="mm/dd/yyyy"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Age"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Sex</InputLabel>
                  <Select
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    label="Sex"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Third Row: Receiving date, Type of Analysis, Test Status */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Receiving date"
                  name="receiving_date"
                  type="date"
                  value={formData.receiving_date}
                  onChange={(e) => handleInputChange('receiving_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  placeholder="mm/dd/yyyy"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Type of Analysis</InputLabel>
                  <Select
                    value={formData.type_of_analysis}
                    onChange={(e) => handleInputChange('type_of_analysis', e.target.value)}
                    label="Type of Analysis"
                  >
                    <MenuItem value="Pathology">Pathology</MenuItem>
                    <MenuItem value="Cytology">Cytology</MenuItem>
                    <MenuItem value="FNAC">FNAC</MenuItem>
                    <MenuItem value="Immunohistochemistry">Immunohistochemistry</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Test Status</InputLabel>
                  <Select
                    value={formData.test_status}
                    onChange={(e) => handleInputChange('test_status', e.target.value)}
                    label="Test Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    {/* Doctors can see Approved status */}
                    {((user?.role === 'doctor' || user?.role === 'admin') && (
                      <MenuItem key="approved" value="approved">Approved</MenuItem>
                    ))}
                    {/* Only admins can see Completed and Cancelled */}
                    {user?.role === 'admin' && [
                      <MenuItem key="completed" value="completed">Completed</MenuItem>,
                      <MenuItem key="cancelled" value="cancelled">Cancelled</MenuItem>
                    ]}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Fourth Row: Checked By (for doctors only) */}
            {user?.role === 'doctor' && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Checked By"
                    name="checked_by"
                    value={
                      visit?.checked_by_doctors && visit.checked_by_doctors.length > 0
                        ? visit.checked_by_doctors.join(', ')
                        : 'No doctors have checked this report yet'
                    }
                    InputProps={{
                      readOnly: true,
                    }}
                    placeholder="Checked By"
                    helperText="Doctors who have checked this report"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleMarkAsChecked}
                    disabled={saving || Boolean(visit?.checked_by_doctors && user?.name && visit.checked_by_doctors.includes(user.name))}
                    sx={{ 
                      height: '56px',
                      mt: { xs: 0, sm: 0 }
                    }}
                  >
                    {visit?.checked_by_doctors && user?.name && visit.checked_by_doctors.includes(user.name)
                      ? 'Already Checked'
                      : 'Mark as Checked'}
                  </Button>
                </Grid>
              </Grid>
            )}
          </Box>

          {/* Pathology Details */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Pathology Details
            </Typography>
            
            {/* Copy from another patient feature */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                size="small"
                label="Copy from Lab No"
                value={copyFromLabNo}
                onChange={(e) => setCopyFromLabNo(e.target.value)}
                placeholder="Enter lab number"
                sx={{ width: 200 }}
              />
              <Button
                variant="outlined"
                onClick={handleCopyFromLabNo}
                disabled={copyingData || !copyFromLabNo.trim()}
                startIcon={copyingData ? <CircularProgress size={16} /> : <ContentCopy />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {copyingData ? 'Searching...' : 'Copy Details'}
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            {/* Clinical data */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Clinical data
                </Typography>
                {formData.image_placement !== 'clinical_data' && (
                  <IconButton
                    size="small"
                    onClick={() => handleExpandField('clinical_data')}
                    color="primary"
                    title="Expand field"
                  >
                    <Fullscreen />
                  </IconButton>
                )}
              </Box>
              {formData.image_placement === 'clinical_data' && formData.image ? (
                <Box sx={{ 
                  border: '2px solid', 
                  borderColor: 'primary.main', 
                  borderRadius: 2, 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    Image will replace this field
                  </Typography>
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} 
                  />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  minRows={6}
                  maxRows={15}
                  value={clinicalData}
                  onChange={(e) => setClinicalData(e.target.value)}
                  placeholder="Enter clinical data..."
                  disabled={formData.image_placement === 'clinical_data'}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      alignItems: 'flex-start',
                    }
                  }}
                />
              )}
            </Box>

            {/* Nature of specimen */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Nature of specimen
                </Typography>
                {formData.image_placement !== 'nature_of_specimen' && (
                  <IconButton
                    size="small"
                    onClick={() => handleExpandField('nature_of_specimen')}
                    color="primary"
                    title="Expand field"
                  >
                    <Fullscreen />
                  </IconButton>
                )}
              </Box>
              {formData.image_placement === 'nature_of_specimen' && formData.image ? (
                <Box sx={{ 
                  border: '2px solid', 
                  borderColor: 'primary.main', 
                  borderRadius: 2, 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    Image will replace this field
                  </Typography>
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} 
                  />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  minRows={6}
                  maxRows={15}
                  value={natureOfSpecimen}
                  onChange={(e) => setNatureOfSpecimen(e.target.value)}
                  placeholder="Enter nature of specimen..."
                  disabled={formData.image_placement === 'nature_of_specimen'}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      alignItems: 'flex-start',
                    }
                  }}
                />
              )}
            </Box>

            {/* Gross Pathology */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Gross Pathology
                </Typography>
                {formData.image_placement !== 'gross_pathology' && (
                  <IconButton
                    size="small"
                    onClick={() => handleExpandField('gross_pathology')}
                    color="primary"
                    title="Expand field"
                  >
                    <Fullscreen />
                  </IconButton>
                )}
              </Box>
              {formData.image_placement === 'gross_pathology' && formData.image ? (
                <Box sx={{ 
                  border: '2px solid', 
                  borderColor: 'primary.main', 
                  borderRadius: 2, 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    Image will replace this field
                  </Typography>
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} 
                  />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  minRows={6}
                  maxRows={15}
                  value={grossPathology}
                  onChange={(e) => setGrossPathology(e.target.value)}
                  placeholder="Enter gross pathology..."
                  disabled={formData.image_placement === 'gross_pathology'}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      alignItems: 'flex-start',
                    }
                  }}
                />
              )}
            </Box>

            {/* Microscopic examination */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Microscopic examination
                </Typography>
                {formData.image_placement !== 'microscopic_examination' && (
                  <IconButton
                    size="small"
                    onClick={() => handleExpandField('microscopic_examination')}
                    color="primary"
                    title="Expand field"
                  >
                    <Fullscreen />
                  </IconButton>
                )}
              </Box>
              {formData.image_placement === 'microscopic_examination' && formData.image ? (
                <Box sx={{ 
                  border: '2px solid', 
                  borderColor: 'primary.main', 
                  borderRadius: 2, 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    Image will replace this field
                  </Typography>
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} 
                  />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  minRows={6}
                  maxRows={15}
                  value={microscopicExamination}
                  onChange={(e) => setMicroscopicExamination(e.target.value)}
                  placeholder="Enter microscopic examination..."
                  disabled={formData.image_placement === 'microscopic_examination'}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      alignItems: 'flex-start',
                    }
                  }}
                />
              )}
            </Box>

            {/* Conclusion */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Conclusion
                </Typography>
                {formData.image_placement !== 'conclusion' && (
                  <IconButton
                    size="small"
                    onClick={() => handleExpandField('conclusion')}
                    color="primary"
                    title="Expand field"
                  >
                    <Fullscreen />
                  </IconButton>
                )}
              </Box>
              {formData.image_placement === 'conclusion' && formData.image ? (
                <Box sx={{ 
                  border: '2px solid', 
                  borderColor: 'primary.main', 
                  borderRadius: 2, 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    Image will replace this field
                  </Typography>
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} 
                  />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  minRows={6}
                  maxRows={15}
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  placeholder="Enter conclusion..."
                  disabled={formData.image_placement === 'conclusion'}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      alignItems: 'flex-start',
                    }
                  }}
                />
              )}
            </Box>

            {/* Recommendations */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Recommendations
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleExpandField('recommendations')}
                  color="primary"
                  title="Expand field"
                >
                  <Fullscreen />
                </IconButton>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={6}
                minRows={6}
                maxRows={15}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Enter recommendations..."
                sx={{ 
                  '& .MuiInputBase-root': {
                    alignItems: 'flex-start',
                  }
                }}
              />
            </Box>
          </Box>

          {/* Image Upload Section */}
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Image Upload
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Image Placement</InputLabel>
              <Select
                value={formData.image_placement}
                onChange={(e) => handleInputChange('image_placement', e.target.value)}
                label="Image Placement"
              >
                <MenuItem value="end_of_report">End of Report (Standalone)</MenuItem>
                <MenuItem value="clinical_data">Replace Clinical data</MenuItem>
                <MenuItem value="nature_of_specimen">Replace Nature of specimen</MenuItem>
                <MenuItem value="gross_pathology">Replace Gross Pathology</MenuItem>
                <MenuItem value="microscopic_examination">Replace Microscopic examination</MenuItem>
                <MenuItem value="conclusion">Replace Conclusion</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose where to place the image. It can replace one of the pathology detail fields or appear at the end of the report.
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              border: '2px dashed', 
              borderColor: 'grey.300', 
              borderRadius: 2, 
              p: 2, 
              textAlign: 'center',
              bgcolor: 'grey.50',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              }
            }}>
              <CloudUpload sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
              <Typography variant="subtitle1" gutterBottom>
                Upload Pathology Image
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Max 5MB
              </Typography>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  size="small"
                  sx={{ mb: 1 }}
                >
                  Choose Image
                </Button>
              </label>
              
              {formData.image && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Selected: ${formData.image.name}`}
                    color="primary"
                    onDelete={() => setFormData(prev => ({ ...prev, image: null }))}
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Size: {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>


          {/* Templates Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
              Templates
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={8} md={8}>
                <FormControl fullWidth>
                  <InputLabel>Load Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    label="Load Template"
                  >
                    <MenuItem value="">
                      <em>Select a template...</em>
                    </MenuItem>
                    {Array.isArray(templates) && templates.length > 0 ? templates.map((template) => (
                      <MenuItem key={template.id} value={template.id.toString()}>
                        {template.name || `Template ${template.id}`}
                      </MenuItem>
                    )) : null}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <Button
                  variant="outlined"
                  onClick={handleSaveAsTemplate}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  Save as Template
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Status and Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`Status: ${formData.test_status.charAt(0).toUpperCase() + formData.test_status.slice(1)}`}
                color={formData.test_status === 'completed' ? 'success' : 'warning'}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ 
                bgcolor: 'error.main', 
                color: 'white',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Record Now'}
            </Button>
              {/* Hide "Record and Print" button for doctors */}
              {user?.role !== 'doctor' && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleRecordAndPrint}
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Record and Print'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Similar Cases Panel */}
      {visitId && visit && (
        <SimilarCasesPanel
          currentVisitId={Number(visitId)}
          reportData={{
            clinical_data: formData.clinical_data,
            microscopic_examination: formData.microscopic_examination,
            conclusion: formData.conclusion,
            recommendations: formData.recommendations,
            nature_of_specimen: formData.nature_of_specimen,
            gross_pathology: formData.gross_pathology,
          }}
          onCompare={(compareVisitId) => {
            setComparisonVisitId(compareVisitId);
            setComparisonModalOpen(true);
          }}
        />
      )}
      
      {/* Template Save Modal */}
      <TemplateSaveModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSave={handleTemplateSave}
        loading={savingTemplate}
      />

      {/* Copy Pathology Data Confirmation Modal */}
      <Dialog open={copyModalOpen} onClose={() => setCopyModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContentCopy color="primary" />
            Copy Pathology Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {sourcePatientData && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Source Patient:</strong> {sourcePatientData.patient.name} (Lab No: {sourcePatientData.patient.lab})
                </Typography>
                <Typography variant="body2">
                  <strong>Target Patient:</strong> {formData.patient_name} (Lab No: {formData.lab_no})
                </Typography>
              </Alert>
              
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pathology Details to Copy:
              </Typography>
              
              <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                {sourcePatientData.pathologyData.clinical_data && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">Clinical Data:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {sourcePatientData.pathologyData.clinical_data}
                    </Typography>
                  </Box>
                )}
                
                {sourcePatientData.pathologyData.nature_of_specimen && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">Nature of Specimen:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {sourcePatientData.pathologyData.nature_of_specimen}
                    </Typography>
                  </Box>
                )}
                
                {sourcePatientData.pathologyData.gross_pathology && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">Gross Pathology:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {sourcePatientData.pathologyData.gross_pathology}
                    </Typography>
                  </Box>
                )}
                
                {sourcePatientData.pathologyData.microscopic_examination && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">Microscopic Examination:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {sourcePatientData.pathologyData.microscopic_examination}
                    </Typography>
                  </Box>
                )}
                
                {sourcePatientData.pathologyData.conclusion && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">Conclusion:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {sourcePatientData.pathologyData.conclusion}
                    </Typography>
                  </Box>
                )}
                
                {sourcePatientData.pathologyData.recommendations && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">Recommendations:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {sourcePatientData.pathologyData.recommendations}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> This will overwrite the current pathology details for the target patient. 
                  You can modify the copied details after copying if needed.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyModalOpen(false)}>Cancel</Button>
          <Button onClick={copyPathologyData} variant="contained" color="primary">
            Copy Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Comparison Modal */}
      {comparisonVisitId && visitId && (
        <ReportComparison
          open={comparisonModalOpen}
          onClose={() => {
            setComparisonModalOpen(false);
            setComparisonVisitId(null);
          }}
          visitId1={Number(visitId)}
          visitId2={comparisonVisitId}
        />
      )}

      {/* Expanded Field Dialog */}
      <Dialog
        open={expandedField !== null}
        onClose={handleCloseExpandedField}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            height: '90vh',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {expandedField === 'clinical_data' && 'Clinical Data'}
              {expandedField === 'nature_of_specimen' && 'Nature of Specimen'}
              {expandedField === 'gross_pathology' && 'Gross Pathology'}
              {expandedField === 'microscopic_examination' && 'Microscopic Examination'}
              {expandedField === 'conclusion' && 'Conclusion'}
              {expandedField === 'recommendations' && 'Recommendations'}
            </Typography>
            <IconButton onClick={handleCloseExpandedField} size="small" title="Minimize">
              <FullscreenExit />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <TextField
            fullWidth
            multiline
            value={expandedValue}
            onChange={(e) => setExpandedValue(e.target.value)}
            placeholder={
              expandedField === 'clinical_data' ? 'Enter clinical data...' :
              expandedField === 'nature_of_specimen' ? 'Enter nature of specimen...' :
              expandedField === 'gross_pathology' ? 'Enter gross pathology...' :
              expandedField === 'microscopic_examination' ? 'Enter microscopic examination...' :
              expandedField === 'conclusion' ? 'Enter conclusion...' :
              'Enter recommendations...'
            }
            autoFocus
            sx={{ 
              flex: 1,
              '& .MuiInputBase-root': {
                height: '100%',
                alignItems: 'flex-start',
              },
              '& .MuiInputBase-input': {
                height: '100% !important',
                overflow: 'auto !important',
              }
            }}
            inputProps={{
              style: {
                height: '100%',
                overflow: 'auto',
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExpandedField} variant="outlined" startIcon={<FullscreenExit />}>
            Minimize
          </Button>
          <Button onClick={handleCloseExpandedField} variant="contained" color="primary">
            Save & Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PathologyRecordForm;

