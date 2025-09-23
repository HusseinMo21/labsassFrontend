import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  Edit,
  Download,
  Print,
  PictureAsPdf,
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

  useEffect(() => {
    if (visitId) {
      fetchVisitData();
    }
  }, [visitId]);

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
      
      const content = atob(documentData.content);
      const blob = new Blob([content], { type: 'application/pdf' });
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
      
      const content = atob(documentData.content);
      const blob = new Blob([content], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
        toast.success('PDF opened in a new tab. Please use the browser\'s print function.');
      } else {
        toast.error('Popup blocked. Please allow popups for this site to print the document.');
      }
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
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
          <IconButton onClick={() => navigate('/reports')} sx={{ bgcolor: 'white' }}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
            Patient Documents
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {visit.patient.name} - Lab No: {visit.labRequest?.full_lab_no || visit.visit_number}
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
                {visit.labRequest?.full_lab_no || visit.visit_number}
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
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
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
      
      {/* View Document Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            {selectedDocument && `Pathology Report ${selectedDocument.type === 'with-header' ? 'with Header' : 'without Header'}`}
          </Typography>
          <Button
            onClick={() => setViewDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            ✕
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedDocument && (
            <iframe
              src={`data:application/pdf;base64,${selectedDocument.content}`}
              width="100%"
              height="600px"
              style={{ border: 'none' }}
              title="Document Preview"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
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
                  const content = atob(selectedDocument.content);
                  const blob = new Blob([content], { type: 'application/pdf' });
                  const blobUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = selectedDocument.filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(blobUrl);
                }}
                variant="outlined"
                color="primary"
              >
                Download
              </Button>
              <Button
                startIcon={<Print />}
                onClick={() => {
                  const content = atob(selectedDocument.content);
                  const blob = new Blob([content], { type: 'application/pdf' });
                  const blobUrl = URL.createObjectURL(blob);
                  const printWindow = window.open(blobUrl, '_blank');
                  if (printWindow) {
                    printWindow.onload = () => {
                      printWindow.print();
                    };
                  }
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                }}
                variant="outlined"
                color="primary"
              >
                Print
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDocuments;

