import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  CloudUpload,
  Person,
  CalendarToday,
  Science,
  Description,
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
  patient: {
    id: number;
    name: string;
    phone: string;
    gender: string;
    birth_date: string;
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

const ReportForm: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const [testFormData, setTestFormData] = useState({
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
      
      // Populate form with existing data
      setTestFormData({
        // Patient Information
        patient_name: visitData.patient?.name || '',
        referred_by: visitData.referred_doctor || '',
        lab_no: visitData.visit_number || '',
        date: visitData.visit_date || '',
        age: visitData.patient?.age || '',
        sex: visitData.patient?.gender || 'Male',
        receiving_date: visitData.visit_date || '',
        discharge_date: '',
        
        // Pathology Details
        clinical_data: visitData.clinical_data || '',
        nature_of_specimen: visitData.specimen_information || '',
        gross_pathology: visitData.gross_examination || '',
        microscopic_examination: visitData.microscopic_description || '',
        conclusion: visitData.diagnosis || '',
        recommendations: visitData.recommendations || visitData.notes || '',
        
        // Document Type
        type_of_analysis: 'Pathology',
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
      // Handle different response formats
      const templatesData = response.data?.data || response.data || [];
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]); // Set empty array on error
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setTestFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId && Array.isArray(templates)) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        setTestFormData(prev => ({
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTestFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visit) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('clinical_data', testFormData.clinical_data);
      formData.append('specimen_information', (testFormData as any).specimen_information);
      formData.append('gross_examination', (testFormData as any).gross_examination);
      formData.append('microscopic_description', (testFormData as any).microscopic_description);
      formData.append('diagnosis', (testFormData as any).diagnosis);
      formData.append('recommendations', testFormData.recommendations);
      formData.append('referred_doctor', (testFormData as any).referred_doctor);
      formData.append('test_status', testFormData.test_status);
      
      if (testFormData.image) {
        formData.append('image', testFormData.image);
      }

      const headers: any = {
        'Content-Type': 'multipart/form-data',
      };

      await axios.put(`/api/visits/${visit.id}`, formData, { headers });
      
      toast.success('Test report updated successfully' + (testFormData.image ? ' with image' : ''));
      navigate('/erp/reports'); // Navigate back to reports page
    } catch (error) {
      console.error('Test report update error:', error);
      toast.error('Failed to update test report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Visit not found</Alert>
        <Button onClick={() => navigate('/erp/reports')} startIcon={<ArrowBack />}>
          Back to Reports
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/erp/reports')}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" sx={{ textDecoration: 'underline', color: 'primary.main' }}>
            Pathology Record +
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" sx={{ bgcolor: 'warning.main', color: 'white' }}>
              Search Section
            </Button>
          </Box>
        </Box>
      </Box>

        {/* Note: Grid warnings are expected in MUI v7 - the component works correctly */}
        <Grid container spacing={3}>
          {/* Patient Information Card */}
          <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6">Patient Information</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1" fontWeight="bold">{visit.patient?.name || 'Unknown Patient'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{visit.patient?.phone || 'N/A'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Gender</Typography>
                <Typography variant="body1">{visit.patient?.gender || 'N/A'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Birth Date</Typography>
                <Typography variant="body1">{visit.patient?.birth_date || 'N/A'}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarToday color="primary" />
                <Typography variant="h6">Visit Details</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Visit Date</Typography>
                <Typography variant="body1">{visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'N/A'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Visit Number</Typography>
                <Typography variant="body1" fontWeight="bold">{visit.visit_number || 'N/A'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Test Status</Typography>
                <Chip 
                  label={visit.test_status || 'pending'} 
                  color={visit.test_status === 'completed' ? 'success' : visit.test_status === 'pending' ? 'warning' : 'default'}
                  size="small"
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Science color="primary" />
                <Typography variant="h6">Tests</Typography>
              </Box>
              
              {visit.visit_tests?.map((test) => (
                <Box key={test.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">{test.lab_test?.name || 'Unknown Test'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Code: {test.lab_test?.code || 'N/A'} | Status: {test.status || 'pending'}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

          {/* Report Form Card */}
          <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Description color="primary" />
                <Typography variant="h6">Test Report Form</Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                {/* Template Selection */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Select Template</InputLabel>
                      <Select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        label="Select Template"
                      >
                        <MenuItem value="">No Template</MenuItem>
                        {Array.isArray(templates) && templates.map((template) => (
                          <MenuItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Clinical Data */}
                <TextField
                  fullWidth
                  label="Clinical Data"
                  multiline
                  rows={3}
                  value={testFormData.clinical_data}
                  onChange={(e) => handleInputChange('clinical_data', e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Specimen Information */}
                <TextField
                  fullWidth
                  label="Specimen Information"
                  multiline
                  rows={2}
                  value={(testFormData as any).specimen_information}
                  onChange={(e) => handleInputChange('specimen_information', e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Gross Examination */}
                <TextField
                  fullWidth
                  label="Gross Examination"
                  multiline
                  rows={3}
                  value={(testFormData as any).gross_examination}
                  onChange={(e) => handleInputChange('gross_examination', e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Microscopic Description */}
                <TextField
                  fullWidth
                  label="Microscopic Description"
                  multiline
                  rows={3}
                  value={(testFormData as any).microscopic_description}
                  onChange={(e) => handleInputChange('microscopic_description', e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Diagnosis */}
                <TextField
                  fullWidth
                  label="Diagnosis"
                  multiline
                  rows={2}
                  value={(testFormData as any).diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Recommendations */}
                <TextField
                  fullWidth
                  label="Recommendations"
                  multiline
                  rows={2}
                  value={testFormData.recommendations}
                  onChange={(e) => handleInputChange('recommendations', e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Referred Doctor */}
                <TextField
                  fullWidth
                  label="Referred Doctor"
                  value={(testFormData as any).referred_doctor}
                  onChange={(e) => handleInputChange('referred_doctor', e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Test Status */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Test Status</InputLabel>
                  <Select
                    value={testFormData.test_status}
                    onChange={(e) => handleInputChange('test_status', e.target.value)}
                    label="Test Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="under_review">Under Review</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>

                {/* Image Upload */}
                <Paper sx={{ p: 2, mb: 3, border: '2px dashed', borderColor: 'grey.300' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CloudUpload color="primary" />
                    <Box>
                      <Typography variant="body1">Upload Lab Result Image</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testFormData.image ? testFormData.image.name : 'No file selected'}
                      </Typography>
                    </Box>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button variant="outlined" component="span">
                        Choose File
                      </Button>
                    </label>
                  </Box>
                </Paper>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/erp/reports')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Test Report'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportForm;

