import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  Edit,
  Download,
  Print,
  PictureAsPdf,
  Settings,
  RestartAlt,
  FitScreen,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from '../../config/axios';

interface Visit {
  id: number;
  visit_number: string;
  visit_date: string;
  patient: {
    id: number;
    name: string;
    age: string;
    gender: string;
    lab?: string;
  };
  labRequest?: {
    id: number;
    full_lab_no: string;
  };
}

const PatientDocuments: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: 'with-header' | 'without-header';
    content: string;
    filename: string;
  } | null>(null);
  const [documentLoading, setDocumentLoading] = useState<{[key: string]: boolean}>({});
  
  // Report settings state
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [documentReloading, setDocumentReloading] = useState(false);
  const [settings, setSettings] = useState({
    top_margin: 60,
    bottom_margin: 120,
    left_margin: 40,
    right_margin: 40,
    content_padding: 10,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isDefaultSettings, setIsDefaultSettings] = useState(true);

  useEffect(() => {
    if (visitId) {
      fetchVisitData();
      fetchReportSettings();
    }
  }, [visitId]);
  
  const fetchReportSettings = async () => {
    if (!visitId) return;
    
    try {
      const response = await axios.get(`/api/visits/${visitId}/report-settings`);
      setSettings(response.data.settings);
      setIsDefaultSettings(response.data.is_default);
    } catch (error) {
      console.error('Failed to fetch report settings:', error);
      // Use defaults on error
      setSettings({
        top_margin: 60,
        bottom_margin: 120,
        left_margin: 40,
        right_margin: 40,
        content_padding: 10,
      });
      setIsDefaultSettings(true);
    }
  };
  
  const handleSaveSettings = async () => {
    if (!visitId) return;
    
    try {
      setSettingsLoading(true);
      await axios.post(`/api/visits/${visitId}/report-settings`, settings);
      setIsDefaultSettings(false);
      toast.success('Settings saved successfully');
      // Reload document with new settings
      if (selectedDocument) {
        try {
          setDocumentReloading(true);
          const endpoint = `/api/visits/${visitId}/report/pdf/${selectedDocument.type}`;
          const response = await axios.get(endpoint);
          const documentData = response.data;
          
          setSelectedDocument({
            ...selectedDocument,
            content: documentData.content,
          });
        } catch (error: any) {
          console.error('Failed to reload document:', error);
          toast.error('Failed to update preview');
        } finally {
          setDocumentReloading(false);
        }
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };
  
  const handleApplyDefaults = async () => {
    if (!visitId) return;
    
    try {
      setSettingsLoading(true);
      const response = await axios.post(`/api/visits/${visitId}/report-settings/defaults`);
      const newSettings = {
        top_margin: response.data.settings.top_margin,
        bottom_margin: response.data.settings.bottom_margin,
        left_margin: response.data.settings.left_margin,
        right_margin: response.data.settings.right_margin,
        content_padding: response.data.settings.content_padding,
      };
      setSettings(newSettings);
      setIsDefaultSettings(true);
      toast.success('Default margins applied');
      // Reload document with new settings
      if (selectedDocument) {
        await handleLiveUpdate(newSettings);
      }
    } catch (error: any) {
      console.error('Failed to apply defaults:', error);
      toast.error(error.response?.data?.message || 'Failed to apply defaults');
    } finally {
      setSettingsLoading(false);
    }
  };
  
  const handleFitToOnePage = async () => {
    if (!visitId) return;
    
    try {
      setSettingsLoading(true);
      const response = await axios.post(`/api/visits/${visitId}/report-settings/fit-to-one-page`);
      const newSettings = {
        top_margin: response.data.settings.top_margin,
        bottom_margin: response.data.settings.bottom_margin,
        left_margin: response.data.settings.left_margin,
        right_margin: response.data.settings.right_margin,
        content_padding: response.data.settings.content_padding,
      };
      setSettings(newSettings);
      setIsDefaultSettings(false);
      toast.success('Margins adjusted to fit on one page');
      // Reload document with new settings
      if (selectedDocument) {
        await handleLiveUpdate(newSettings);
      }
    } catch (error: any) {
      console.error('Failed to fit to one page:', error);
      toast.error(error.response?.data?.message || 'Failed to adjust margins');
    } finally {
      setSettingsLoading(false);
    }
  };
  
  // Live update PDF when settings change (debounced)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdatingRef = useRef(false);
  const lastContentHashRef = useRef<string>('');
  
  const handleLiveUpdate = async (newSettings: typeof settings) => {
    if (!visitId || !selectedDocument) return;
    
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    // Prevent multiple simultaneous updates
    if (isUpdatingRef.current) {
      return;
    }
    
    // Save settings first (non-blocking)
    axios.post(`/api/visits/${visitId}/report-settings`, newSettings)
      .then(() => {
        setIsDefaultSettings(false);
      })
      .catch((error) => {
        console.error('Failed to save settings:', error);
      });
    
    // Debounce PDF regeneration (wait 800ms after last change)
    updateTimeoutRef.current = setTimeout(async () => {
      if (isUpdatingRef.current) {
        return; // Already updating
      }
      
      try {
        isUpdatingRef.current = true;
        setDocumentReloading(true);
        
        const endpoint = `/api/visits/${visitId}/report/pdf/${selectedDocument.type}`;
        const response = await axios.get(endpoint);
        const documentData = response.data;
        
        // Calculate content hash to avoid unnecessary updates
        const contentHash = documentData.content.substring(0, 50) + documentData.content.length;
        
        // Only update if content actually changed
        if (contentHash !== lastContentHashRef.current) {
          lastContentHashRef.current = contentHash;
          
          // Only update if document is still selected
          if (selectedDocument) {
            setSelectedDocument({
              ...selectedDocument,
              content: documentData.content,
            });
          }
        }
      } catch (error: any) {
        console.error('Failed to reload document:', error);
        toast.error('Failed to update preview');
      } finally {
        setDocumentReloading(false);
        isUpdatingRef.current = false;
        updateTimeoutRef.current = null;
      }
    }, 800);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset content hash when document changes
  useEffect(() => {
    if (selectedDocument) {
      lastContentHashRef.current = selectedDocument.content.substring(0, 50) + selectedDocument.content.length;
    }
  }, [selectedDocument?.type]);

  const fetchVisitData = async () => {
    try {
      const response = await axios.get(`/api/visits/${visitId}`);
      setVisit(response.data);
    } catch (error) {
      console.error('Failed to fetch visit data:', error);
      toast.error('Failed to load visit data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (type: 'with-header' | 'without-header') => {
    const loadingKey = `${type}`;
    
    try {
      setDocumentLoading(prev => ({ ...prev, [loadingKey]: true }));
      
      // Fetch settings first
      await fetchReportSettings();
      
      const endpoint = `/api/visits/${visitId}/report/pdf/${type}`;
      console.log(`📄 Loading document: ${endpoint}`);
      
      const response = await axios.get(endpoint);
      const documentData = response.data;
      
      setSelectedDocument({
        type,
        content: documentData.content,
        filename: documentData.filename,
      });
      setViewDialogOpen(true);
      
      // Auto-show settings panel for "with-header" type
      if (type === 'with-header') {
        setShowSettingsPanel(true);
      }
      
      console.log(`✅ Document loaded successfully: ${documentData.filename}`);
      
    } catch (error: any) {
      console.error('Error loading document:', error);
      
      let errorMessage = 'Failed to load document';
      if (error.code === 'ECONNABORTED') {
        errorMessage = `Document generation timed out. ${type === 'with-header' ? 'Documents with headers' : 'Documents'} can take up to 2 minutes to generate. Please try again.`;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error during document generation. Please try again in a moment.';
      }
      
      toast.error(errorMessage);
    } finally {
      setDocumentLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleDownloadDocument = async (type: 'with-header' | 'without-header') => {
    try {
      const endpoint = `/api/visits/${visitId}/report/pdf/${type}`;
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
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = documentData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handlePrintDocument = async (type: 'with-header' | 'without-header') => {
    try {
      const endpoint = `/api/visits/${visitId}/report/pdf/${type}`;
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
      console.error('Error printing document:', error);
      toast.error('Failed to print document');
    }
  };

  const handleEditDocument = () => {
    navigate(`/reports/${visitId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!visit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Visit not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title="Go Back">
          <IconButton onClick={() => {
            // Navigate back to the specific report page for this visit
            navigate(`/reports/${visitId}`);
          }} sx={{ bgcolor: 'white' }}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
            Patient Documents
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {visit.patient.name} - Lab No: {visit.labRequest?.full_lab_no || visit.patient.lab || visit.visit_number}
          </Typography>
        </Box>
      </Box>

      {/* Patient Info Card */}
      <Card sx={{ mb: 3, bgcolor: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Patient Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Name</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {visit.patient.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Age</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {visit.patient.age}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Gender</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {visit.patient.gender}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Lab No</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {visit.labRequest?.full_lab_no || visit.patient.lab || visit.visit_number}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <Grid container spacing={3}>
        {/* Document with Header */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'white' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PictureAsPdf sx={{ color: '#d32f2f', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Document with Header
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                Pathology report with background image and professional header design.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={documentLoading['with-header'] ? <CircularProgress size={20} color="inherit" /> : <Visibility />}
                  onClick={() => handleViewDocument('with-header')}
                  disabled={documentLoading['with-header']}
                  sx={{ bgcolor: '#1976d2' }}
                >
                  {documentLoading['with-header'] ? 'Loading...' : 'View Document'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownloadDocument('with-header')}
                  sx={{ borderColor: '#1976d2', color: '#1976d2' }}
                >
                  Download PDF
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => handlePrintDocument('with-header')}
                  sx={{ borderColor: '#1976d2', color: '#1976d2' }}
                >
                  Print Document
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Document without Header */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'white' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PictureAsPdf sx={{ color: '#d32f2f', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Document without Header
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                Clean pathology report without background image, optimized for printing.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={documentLoading['without-header'] ? <CircularProgress size={20} color="inherit" /> : <Visibility />}
                  onClick={() => handleViewDocument('without-header')}
                  disabled={documentLoading['without-header']}
                  sx={{ bgcolor: '#1976d2' }}
                >
                  {documentLoading['without-header'] ? 'Loading...' : 'View Document'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownloadDocument('without-header')}
                  sx={{ borderColor: '#1976d2', color: '#1976d2' }}
                >
                  Download PDF
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => handlePrintDocument('without-header')}
                  sx={{ borderColor: '#1976d2', color: '#1976d2' }}
                >
                  Print Document
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Document Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={handleEditDocument}
          size="large"
          sx={{ 
            bgcolor: '#d32f2f', 
            color: 'white',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          Edit Document
        </Button>
      </Box>
      
      {/* View Document Dialog with Inline Settings */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: '98%',
            maxWidth: '1600px',
            height: '98vh',
            maxHeight: '98vh',
            m: 1,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5
        }}>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            {selectedDocument && `Pathology Report ${selectedDocument.type === 'with-header' ? 'with Header' : 'without Header'}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              startIcon={<Settings />}
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              sx={{ 
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': { border: '1px solid rgba(255,255,255,0.5)' }
              }}
              size="small"
            >
              {showSettingsPanel ? 'Hide' : 'Show'} Settings
            </Button>
            <Button
              onClick={() => setViewDialogOpen(false)}
              sx={{ color: 'white', minWidth: 'auto', px: 1 }}
            >
              ✕
            </Button>
          </Box>
        </DialogTitle>
        <Box sx={{ display: 'flex', height: 'calc(98vh - 100px)', overflow: 'hidden' }}>
          {/* PDF Preview */}
          <Box sx={{ 
            flex: showSettingsPanel ? '1 1 70%' : '1 1 100%',
            transition: 'flex 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', position: 'relative' }}>
              {documentReloading && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  zIndex: 1000
                }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Regenerating PDF...</Typography>
                </Box>
              )}
              {selectedDocument && (
                <iframe
                  key={`pdf-${selectedDocument.type}-${selectedDocument.content.length}`} // Stable key based on type and content length
                  src={`data:application/pdf;base64,${selectedDocument.content}`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title="Document Preview"
                />
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
              <Button 
                onClick={() => setViewDialogOpen(false)}
                variant="outlined"
              >
                Close
              </Button>
              {selectedDocument && (
                <>
                  <Button
                    startIcon={<Download />}
                    onClick={() => {
                      // Convert base64 to binary
                      const binaryString = atob(selectedDocument.content);
                      const bytes = new Uint8Array(binaryString.length);
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                      }
                      
                      const blob = new Blob([bytes], { type: 'application/pdf' });
                      const blobUrl = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      link.download = selectedDocument.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(blobUrl);
                      toast.success('Document downloaded successfully');
                    }}
                    variant="outlined"
                    color="primary"
                  >
                    Download
                  </Button>
                  <Button
                    startIcon={<Print />}
                    onClick={() => {
                      // Convert base64 to binary
                      const binaryString = atob(selectedDocument.content);
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
                    }}
                    variant="outlined"
                    color="primary"
                  >
                    Print
                  </Button>
                </>
              )}
            </DialogActions>
          </Box>
          
          {/* Settings Panel */}
          {showSettingsPanel && (
            <Box sx={{
              width: '400px',
              borderLeft: '2px solid #e0e0e0',
              backgroundColor: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: '#1976d2', 
                color: 'white',
                borderBottom: '2px solid #1565c0'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Adjust Margins & Padding
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Changes apply instantly. Values: 5-40px
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
                {isDefaultSettings && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Using default settings
                  </Alert>
                )}
                
                <Stack spacing={3}>
                  {/* Top Margin */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Top Margin
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {settings.top_margin}px
                      </Typography>
                    </Box>
                    <Slider
                      value={settings.top_margin}
                      onChange={(_, value) => {
                        const newSettings = {...settings, top_margin: value as number};
                        setSettings(newSettings);
                        handleLiveUpdate(newSettings);
                      }}
                      min={5}
                      max={40}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  
                  {/* Bottom Margin */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Bottom Margin
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {settings.bottom_margin}px
                      </Typography>
                    </Box>
                    <Slider
                      value={settings.bottom_margin}
                      onChange={(_, value) => {
                        const newSettings = {...settings, bottom_margin: value as number};
                        setSettings(newSettings);
                        handleLiveUpdate(newSettings);
                      }}
                      min={5}
                      max={40}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  
                  {/* Left Margin */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Left Margin
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {settings.left_margin}px
                      </Typography>
                    </Box>
                    <Slider
                      value={settings.left_margin}
                      onChange={(_, value) => {
                        const newSettings = {...settings, left_margin: value as number};
                        setSettings(newSettings);
                        handleLiveUpdate(newSettings);
                      }}
                      min={5}
                      max={40}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  
                  {/* Right Margin */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Right Margin
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {settings.right_margin}px
                      </Typography>
                    </Box>
                    <Slider
                      value={settings.right_margin}
                      onChange={(_, value) => {
                        const newSettings = {...settings, right_margin: value as number};
                        setSettings(newSettings);
                        handleLiveUpdate(newSettings);
                      }}
                      min={5}
                      max={40}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  
                  {/* Content Padding */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Content Padding
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {settings.content_padding}px
                      </Typography>
                    </Box>
                    <Slider
                      value={settings.content_padding}
                      onChange={(_, value) => {
                        const newSettings = {...settings, content_padding: value as number};
                        setSettings(newSettings);
                        handleLiveUpdate(newSettings);
                      }}
                      min={5}
                      max={40}
                      step={1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Stack>
              </Box>
              
              <Box sx={{ p: 2, borderTop: '2px solid #e0e0e0', backgroundColor: 'white' }}>
                <Stack spacing={1}>
                  <Button
                    startIcon={<RestartAlt />}
                    onClick={handleApplyDefaults}
                    disabled={settingsLoading || documentReloading}
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    size="small"
                  >
                    Apply Defaults
                  </Button>
                  <Button
                    startIcon={<FitScreen />}
                    onClick={handleFitToOnePage}
                    disabled={settingsLoading || documentReloading}
                    variant="outlined"
                    color="primary"
                    fullWidth
                    size="small"
                  >
                    Fit to One Page
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    variant="contained"
                    color="primary"
                    disabled={settingsLoading || documentReloading}
                    fullWidth
                    size="small"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Stack>
              </Box>
            </Box>
          )}
        </Box>
      </Dialog>
      
    </Box>
  );
};

export default PatientDocuments;

