import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TemplateSaveModal from '../../components/TemplateSaveModal';
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
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
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

const PathologyRecordForm: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [formData, setFormData] = useState({
    // Patient Information
    patient_name: '',
    referred_by: '',
    lab_no: '',
    date: '',
    age: '',
    sex: 'Male',
    receiving_date: '',
    discharge_date: '',
    
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
      
      // Load report data if available
      let reportData = {};
      if (visitData.labRequest && visitData.labRequest.reports && visitData.labRequest.reports.length > 0) {
        const report = visitData.labRequest.reports[0];
        try {
          reportData = JSON.parse(report.content || '{}');
        } catch (e) {
          console.warn('Failed to parse report content:', e);
        }
      }
      
      // Populate form with existing data
      setFormData({
        // Patient Information
        patient_name: visitData.patient?.name || '',
        referred_by: (reportData as any).referred_by || visitData.patient?.doctor_id || '',
        lab_no: visitData.lab_number || visitData.labRequest?.full_lab_no || '',
        date: visitData.visit_date ? visitData.visit_date.split('T')[0] : '',
        age: visitData.patient?.age || '',
        sex: visitData.patient?.gender ? visitData.patient.gender.charAt(0).toUpperCase() + visitData.patient.gender.slice(1).toLowerCase() : 'Male',
        receiving_date: visitData.visit_date ? visitData.visit_date.split('T')[0] : '',
        discharge_date: '',
        
        // Pathology Details
        clinical_data: (reportData as any).clinical_data || '',
        nature_of_specimen: (reportData as any).nature_of_specimen || '',
        gross_pathology: (reportData as any).gross_pathology || '',
        microscopic_examination: (reportData as any).microscopic_examination || '',
        conclusion: (reportData as any).conclusion || '',
        recommendations: (reportData as any).recommendations || '',
        
        // Document Type
        type_of_analysis: (reportData as any).type_of_analysis || 'Pathology',
        test_status: visitData.test_status || 'pending',
        image: null,
      });
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

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId && Array.isArray(templates)) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        setFormData(prev => ({
          ...prev,
          clinical_data: template.clinical_data || prev.clinical_data,
          nature_of_specimen: template.specimen_information || prev.nature_of_specimen,
          gross_pathology: template.gross_examination || prev.gross_pathology,
          microscopic_examination: template.microscopic_description || prev.microscopic_examination,
          conclusion: template.diagnosis || prev.conclusion,
          recommendations: template.recommendations || prev.recommendations,
          referred_by: template.referred_doctor || prev.referred_by,
        }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image' && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add image if selected
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await axios.post(`/api/visits/${visitId}/report`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Report saved successfully!');
      navigate('/reports');
    } catch (error) {
      console.error('Failed to save report:', error);
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
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
        <Button onClick={() => navigate('/reports')} sx={{ mt: 2 }}>
          Back to Reports
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/reports')}>
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
            <TextField
              fullWidth
              label="Name of Patient"
              name="patient_name"
              value={formData.patient_name}
              onChange={(e) => handleInputChange('patient_name', e.target.value)}
              required
              placeholder="Name of Patient*"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Referred by"
              name="referred_by"
              value={formData.referred_by}
              onChange={(e) => handleInputChange('referred_by', e.target.value)}
              required
              placeholder="Referred by : *"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Lab No"
              name="lab_no"
              value={formData.lab_no}
              onChange={(e) => handleInputChange('lab_no', e.target.value)}
              required
              placeholder="Lab No : *"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="mm/dd/yyyy"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Age"
              name="age"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              required
              placeholder="Age: *"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
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
            <TextField
              fullWidth
              label="Receiving date"
              name="receiving_date"
              type="date"
              value={formData.receiving_date}
              onChange={(e) => handleInputChange('receiving_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="mm/dd/yyyy"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Discharge date"
              name="discharge_date"
              type="date"
              value={formData.discharge_date}
              onChange={(e) => handleInputChange('discharge_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="mm/dd/yyyy"
              sx={{ mb: 2 }}
            />
          </Box>

          {/* Pathology Details */}
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Pathology Details
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Clinical data *"
              name="clinical_data"
              value={formData.clinical_data}
              onChange={(e) => handleInputChange('clinical_data', e.target.value)}
              required
              placeholder="Clinical data: *"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Nature of specimen *"
              name="nature_of_specimen"
              value={formData.nature_of_specimen}
              onChange={(e) => handleInputChange('nature_of_specimen', e.target.value)}
              required
              placeholder="Nature of specimen: *"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Gross Pathology"
              name="gross_pathology"
              value={formData.gross_pathology}
              onChange={(e) => handleInputChange('gross_pathology', e.target.value)}
              placeholder="Gross Pathology"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Microscopic examination"
              name="microscopic_examination"
              value={formData.microscopic_examination}
              onChange={(e) => handleInputChange('microscopic_examination', e.target.value)}
              placeholder="Microscopic examination"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Conclusion"
              name="conclusion"
              value={formData.conclusion}
              onChange={(e) => handleInputChange('conclusion', e.target.value)}
              placeholder="Conclusion"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Recommendations"
              name="recommendations"
              value={formData.recommendations}
              onChange={(e) => handleInputChange('recommendations', e.target.value)}
              placeholder="Recommendations"
              sx={{ mb: 3 }}
            />
          </Box>

          {/* Image Upload Section */}
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Image Upload
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              border: '2px dashed', 
              borderColor: 'grey.300', 
              borderRadius: 2, 
              p: 3, 
              textAlign: 'center',
              bgcolor: 'grey.50',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              }
            }}>
              <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Pathology Image
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload an image related to the pathology report (Max 5MB)
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
                  sx={{ mb: 2 }}
                >
                  Choose Image
                </Button>
              </label>
              
              {formData.image && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`Selected: ${formData.image.name}`}
                    color="primary"
                    onDelete={() => setFormData(prev => ({ ...prev, image: null }))}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Size: {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Type of Analysis */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
              Type of analysis (the Title Of the Report Document)
            </Typography>
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
          </Box>

          {/* Templates Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
              Templates
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
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
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id.toString()}>
                      {template.name || `Template ${template.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                onClick={handleSaveAsTemplate}
                sx={{ minWidth: 150 }}
              >
                Save as Template
              </Button>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
          </Box>
        </Box>
      </Paper>
      
      {/* Template Save Modal */}
      <TemplateSaveModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSave={handleTemplateSave}
        loading={savingTemplate}
      />
    </Box>
  );
};

export default PathologyRecordForm;

