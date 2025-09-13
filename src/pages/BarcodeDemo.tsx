import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Stack,
} from '@mui/material';
import {
  QrCodeScanner,
  Person,
  Science,
  Assignment,
  CheckCircle,
  Error,
  Receipt,
  Description,
  History,
  Refresh,
  Print,
  Visibility,
  Edit,
  Delete,
  ExpandMore,
  Add,
  Search,
  Clear,
  Download,
  Share,
  LocalHospital,
  Biotech,
  Assessment,
  Payment,
  Schedule,
  AttachMoney,
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BarcodeScanner from '../components/BarcodeScanner';
import BarcodeInput from '../components/BarcodeInput';

interface BarcodeData {
  success: boolean;
  barcode: string;
  parsed?: {
    lab_no: string;
    sample_id: string;
  };
  sample?: any;
  lab_request?: any;
  patient?: any;
  visit?: any;
  error?: string;
}

interface ScanHistoryItem extends BarcodeData {
  timestamp: Date;
  scanType: 'sample' | 'receipt' | 'lab_request' | 'unknown';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scan-tabpanel-${index}`}
      aria-labelledby={`scan-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BarcodeDemo: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [scanResult, setScanResult] = useState<BarcodeData | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScanHistoryItem | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Modal states for quick actions
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [labRequestModalOpen, setLabRequestModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [selectedLabRequest, setSelectedLabRequest] = useState<any>(null);

  // Load scan history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('barcodeScanHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setScanHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Error loading scan history:', error);
      }
    }
  }, []);

  // Save scan history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('barcodeScanHistory', JSON.stringify(scanHistory));
  }, [scanHistory]);

  const determineScanType = (barcode: string): ScanHistoryItem['scanType'] => {
    if (barcode.includes('-S')) return 'sample';
    if (barcode.startsWith('RCP')) return 'receipt';
    if (barcode.match(/^\d{4}-\d+$/)) return 'lab_request';
    return 'unknown';
  };

  const handleBarcodeScan = (data: BarcodeData) => {
    setScanResult(data);
    setError(null);
    
    // Add to scan history
    const historyItem: ScanHistoryItem = {
      ...data,
      timestamp: new Date(),
      scanType: determineScanType(data.barcode)
    };
    
    setScanHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Keep last 50 scans
  };

  const handleBarcodeError = (errorMessage: string) => {
    setError(errorMessage);
    setScanResult(null);
  };

  const handleBarcodeInput = async (barcode: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/barcode/scan', {
        barcode: barcode.trim(),
      });
      
      const data: BarcodeData = response.data;
      handleBarcodeScan(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to scan barcode';
      handleBarcodeError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearScanResult = () => {
    setScanResult(null);
    setError(null);
  };

  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('barcodeScanHistory');
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'success' : 'error';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle /> : <Error />;
  };

  const getScanTypeIcon = (scanType: ScanHistoryItem['scanType']) => {
    switch (scanType) {
      case 'sample': return <Science />;
      case 'receipt': return <Receipt />;
      case 'lab_request': return <Assignment />;
      default: return <QrCodeScanner />;
    }
  };

  const getScanTypeColor = (scanType: ScanHistoryItem['scanType']) => {
    switch (scanType) {
      case 'sample': return 'primary';
      case 'receipt': return 'success';
      case 'lab_request': return 'info';
      default: return 'default';
    }
  };

  const handleQuickAction = (action: string, data: BarcodeData) => {
    switch (action) {
      case 'view_patient':
        if (data.patient) {
          setSelectedPatient(data.patient);
          setPatientModalOpen(true);
        }
        break;
      case 'view_visit':
        if (data.visit) {
          setSelectedVisit(data.visit);
          setVisitModalOpen(true);
        }
        break;
      case 'view_lab_request':
        if (data.lab_request) {
          setSelectedLabRequest(data.lab_request);
          setLabRequestModalOpen(true);
        }
        break;
      case 'print_receipt':
        if (data.visit) {
          setSelectedVisit(data.visit);
          setReceiptModalOpen(true);
        }
        break;
      case 'view_report':
        if (data.visit) {
          setSelectedVisit(data.visit);
          setVisitModalOpen(true);
        }
        break;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderScanResult = () => {
    if (!scanResult) {
      return (
        <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
          <QrCodeScanner sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            Ready to Scan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan any barcode to see detailed information
          </Typography>
        </Alert>
      );
    }

    if (!scanResult.success) {
      return (
        <Alert severity="error" sx={{ textAlign: 'center', py: 4 }}>
          <Error sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Scan Failed
          </Typography>
          <Typography variant="body2">
            {scanResult.error || 'Invalid barcode format'}
          </Typography>
        </Alert>
      );
    }

    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CheckCircle color="success" sx={{ fontSize: 32, mr: 2 }} />
          <Box>
            <Typography variant="h5" gutterBottom>
              Scan Successful
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Barcode: <strong>{scanResult.barcode}</strong>
            </Typography>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {scanResult.patient && (
              <Button
                variant="outlined"
                startIcon={<Person />}
                onClick={() => handleQuickAction('view_patient', scanResult)}
              >
                View Patient
              </Button>
            )}
            {scanResult.visit && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  onClick={() => handleQuickAction('view_visit', scanResult)}
                >
                  View Visit
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => handleQuickAction('print_receipt', scanResult)}
                >
                  Print Receipt
                </Button>
              </>
            )}
            {scanResult.lab_request && (
              <Button
                variant="outlined"
                startIcon={<Biotech />}
                onClick={() => handleQuickAction('view_lab_request', scanResult)}
              >
                View Lab Request
              </Button>
            )}
          </Stack>
        </Box>

        {/* Detailed Information */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Detailed Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Patient Information */}
              {scanResult.patient && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1 }} />
                        Patient Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell>{scanResult.patient.name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Phone</strong></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Phone sx={{ fontSize: 16, mr: 1 }} />
                                {scanResult.patient.phone}
                              </Box>
                            </TableCell>
                          </TableRow>
                          {scanResult.patient.email && (
                            <TableRow>
                              <TableCell><strong>Email</strong></TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Email sx={{ fontSize: 16, mr: 1 }} />
                                  {scanResult.patient.email}
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                          {scanResult.patient.address && (
                            <TableRow>
                              <TableCell><strong>Address</strong></TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocationOn sx={{ fontSize: 16, mr: 1 }} />
                                  {scanResult.patient.address}
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Sample Information */}
              {scanResult.sample && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Science sx={{ mr: 1 }} />
                        Sample Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell>{scanResult.sample.tsample}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Code</strong></TableCell>
                            <TableCell>{scanResult.sample.nsample}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Barcode</strong></TableCell>
                            <TableCell>
                              <Chip label={scanResult.sample.barcode} size="small" />
                            </TableCell>
                          </TableRow>
                          {scanResult.sample.notes && (
                            <TableRow>
                              <TableCell><strong>Notes</strong></TableCell>
                              <TableCell>{scanResult.sample.notes}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Visit Information */}
              {scanResult.visit && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Assignment sx={{ mr: 1 }} />
                        Visit Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Visit Number</strong></TableCell>
                            <TableCell>{scanResult.visit.visit_number}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell>{formatDate(scanResult.visit.visit_date)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell>
                              <Chip 
                                label={scanResult.visit.status} 
                                color={scanResult.visit.status === 'completed' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Total Amount</strong></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AttachMoney sx={{ fontSize: 16, mr: 1 }} />
                                {formatCurrency(parseFloat(scanResult.visit.total_amount))}
                              </Box>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Lab Request Information */}
              {scanResult.lab_request && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Biotech sx={{ mr: 1 }} />
                        Lab Request Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Lab Number</strong></TableCell>
                            <TableCell>
                              <Chip label={scanResult.lab_request.lab_no} color="primary" size="small" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell>
                              <Chip 
                                label={scanResult.lab_request.status} 
                                color={scanResult.lab_request.status === 'completed' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Created</strong></TableCell>
                            <TableCell>{formatDate(scanResult.lab_request.created_at)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  const renderScanHistory = () => {
    if (scanHistory.length === 0) {
      return (
        <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
          <History sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            No Scan History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your recent scans will appear here
          </Typography>
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Recent Scans ({scanHistory.length})
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Clear />}
            onClick={clearHistory}
            color="error"
          >
            Clear History
          </Button>
        </Box>

        <List>
          {scanHistory.map((scan, index) => (
            <ListItem 
              key={index} 
              divider={index < scanHistory.length - 1}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
              onClick={() => {
                setSelectedHistoryItem(scan);
                setHistoryDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <Badge
                  badgeContent={getScanTypeIcon(scan.scanType)}
                  color={getScanTypeColor(scan.scanType)}
                >
                  {getStatusIcon(scan.success)}
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {scan.barcode}
                    </Typography>
                    <Chip 
                      label={scan.scanType} 
                      size="small" 
                      color={getScanTypeColor(scan.scanType)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {scan.success 
                        ? `${scan.parsed?.lab_no || 'Lab Request'} - ${scan.patient?.name || 'Unknown Patient'}`
                        : scan.error
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(scan.timestamp.toISOString())}
                    </Typography>
                  </Box>
                }
              />
              <IconButton size="small">
                <Visibility />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QrCodeScanner sx={{ fontSize: 48, mr: 2 }} />
          Barcode Scanner Hub
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Comprehensive barcode scanning for all lab operations
        </Typography>
      </Box>

      {/* Main Scanner */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <QrCodeScanner sx={{ mr: 1 }} />
          Scanner
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onError={handleBarcodeError}
              placeholder="Scan barcode or enter manually..."
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <BarcodeInput
              onBarcodeScanned={handleBarcodeInput}
              placeholder="Enter barcode manually..."
              fullWidth
            />
          </Grid>
        </Grid>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab 
            label="Scan Results" 
            icon={<CheckCircle />}
            iconPosition="start"
          />
          <Tab 
            label="Scan History" 
            icon={<History />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          {renderScanResult()}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {renderScanHistory()}
        </TabPanel>
      </Paper>

      {/* Sample Barcodes for Testing */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sample Barcodes for Testing
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click on any barcode below to test the scanning functionality:
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label="2025-13-S1 (Creatinine)" 
            onClick={() => handleBarcodeInput('2025-13-S1')}
            clickable
            color="primary"
            variant="outlined"
            icon={<Science />}
          />
          <Chip 
            label="2025-13-S2 (Glucose)" 
            onClick={() => handleBarcodeInput('2025-13-S2')}
            clickable
            color="primary"
            variant="outlined"
            icon={<Science />}
          />
          <Chip 
            label="2025-12-S1 (CBC)" 
            onClick={() => handleBarcodeInput('2025-12-S1')}
            clickable
            color="primary"
            variant="outlined"
            icon={<Science />}
          />
          <Chip 
            label="2025-12-S2 (HbA1c)" 
            onClick={() => handleBarcodeInput('2025-12-S2')}
            clickable
            color="primary"
            variant="outlined"
            icon={<Science />}
          />
          <Chip 
            label="invalid-barcode" 
            onClick={() => handleBarcodeInput('invalid-barcode')}
            clickable
            color="error"
            variant="outlined"
            icon={<Error />}
          />
        </Box>
      </Paper>

      {/* History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Scan Details
        </DialogTitle>
        <DialogContent>
          {selectedHistoryItem && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Barcode: {selectedHistoryItem.barcode}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Scanned: {formatDate(selectedHistoryItem.timestamp.toISOString())}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type: {selectedHistoryItem.scanType}
              </Typography>
              
              {selectedHistoryItem.success ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Scan was successful
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {selectedHistoryItem.error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Details Modal */}
      <Dialog 
        open={patientModalOpen} 
        onClose={() => setPatientModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Person sx={{ mr: 1 }} />
          Patient Details
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Personal Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell>{selectedPatient.name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Gender</strong></TableCell>
                            <TableCell>{selectedPatient.gender}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Birth Date</strong></TableCell>
                            <TableCell>{formatDate(selectedPatient.birth_date)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Phone</strong></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Phone sx={{ fontSize: 16, mr: 1 }} />
                                {selectedPatient.phone}
                              </Box>
                            </TableCell>
                          </TableRow>
                          {selectedPatient.email && (
                            <TableRow>
                              <TableCell><strong>Email</strong></TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Email sx={{ fontSize: 16, mr: 1 }} />
                                  {selectedPatient.email}
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Contact Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          {selectedPatient.address && (
                            <TableRow>
                              <TableCell><strong>Address</strong></TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocationOn sx={{ fontSize: 16, mr: 1 }} />
                                  {selectedPatient.address}
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                          {selectedPatient.emergency_contact && (
                            <TableRow>
                              <TableCell><strong>Emergency Contact</strong></TableCell>
                              <TableCell>{selectedPatient.emergency_contact}</TableCell>
                            </TableRow>
                          )}
                          {selectedPatient.emergency_phone && (
                            <TableRow>
                              <TableCell><strong>Emergency Phone</strong></TableCell>
                              <TableCell>{selectedPatient.emergency_phone}</TableCell>
                            </TableRow>
                          )}
                          {selectedPatient.whatsapp_number && (
                            <TableRow>
                              <TableCell><strong>WhatsApp</strong></TableCell>
                              <TableCell>{selectedPatient.whatsapp_number}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedPatient.medical_history && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Medical History
                        </Typography>
                        <Typography variant="body2">
                          {selectedPatient.medical_history}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientModalOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setPatientModalOpen(false);
              navigate('/patients');
            }}
          >
            View in Patients Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visit Details Modal */}
      <Dialog 
        open={visitModalOpen} 
        onClose={() => setVisitModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1 }} />
          Visit Details
        </DialogTitle>
        <DialogContent>
          {selectedVisit && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Visit Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Visit Number</strong></TableCell>
                            <TableCell>{selectedVisit.visit_number}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell>{formatDate(selectedVisit.visit_date)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Time</strong></TableCell>
                            <TableCell>{selectedVisit.visit_time}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell>
                              <Chip 
                                label={selectedVisit.status} 
                                color={selectedVisit.status === 'completed' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Check-in By</strong></TableCell>
                            <TableCell>{selectedVisit.check_in_by}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Financial Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Total Amount</strong></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AttachMoney sx={{ fontSize: 16, mr: 1 }} />
                                {formatCurrency(parseFloat(selectedVisit.total_amount))}
                              </Box>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Discount</strong></TableCell>
                            <TableCell>{formatCurrency(parseFloat(selectedVisit.discount_amount || 0))}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Final Amount</strong></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AttachMoney sx={{ fontSize: 16, mr: 1 }} />
                                {formatCurrency(parseFloat(selectedVisit.final_amount))}
                              </Box>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Upfront Payment</strong></TableCell>
                            <TableCell>{formatCurrency(parseFloat(selectedVisit.upfront_payment))}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Remaining Balance</strong></TableCell>
                            <TableCell>{formatCurrency(parseFloat(selectedVisit.remaining_balance))}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Payment Method</strong></TableCell>
                            <TableCell>
                              <Chip label={selectedVisit.payment_method} size="small" />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedVisit.remarks && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Remarks
                        </Typography>
                        <Typography variant="body2">
                          {selectedVisit.remarks}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisitModalOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setVisitModalOpen(false);
              navigate('/visits');
            }}
          >
            View in Visits Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog 
        open={receiptModalOpen} 
        onClose={() => setReceiptModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Receipt sx={{ mr: 1 }} />
          Print Receipt
        </DialogTitle>
        <DialogContent>
          {selectedVisit && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Receipt for Visit: {selectedVisit.visit_number}
              </Alert>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Receipt Ready for Printing
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Click "Print Receipt" to open the receipt in a new window for printing
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Print />}
                  onClick={() => {
                    window.open(`/api/check-in/visits/${selectedVisit.id}/receipt`, '_blank');
                  }}
                  size="large"
                >
                  Print Receipt
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lab Request Modal */}
      <Dialog 
        open={labRequestModalOpen} 
        onClose={() => setLabRequestModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Biotech sx={{ mr: 1 }} />
          Lab Request Details
        </DialogTitle>
        <DialogContent>
          {selectedLabRequest && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Request Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Lab Number</strong></TableCell>
                            <TableCell>
                              <Chip label={selectedLabRequest.lab_no} color="primary" size="small" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell>
                              <Chip 
                                label={selectedLabRequest.status} 
                                color={selectedLabRequest.status === 'completed' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Created</strong></TableCell>
                            <TableCell>{formatDate(selectedLabRequest.created_at)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Updated</strong></TableCell>
                            <TableCell>{formatDate(selectedLabRequest.updated_at)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Barcode Information
                      </Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Barcode URL</strong></TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                onClick={() => window.open(selectedLabRequest.barcode_url, '_blank')}
                              >
                                View Barcode
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>QR Code URL</strong></TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                onClick={() => window.open(selectedLabRequest.qr_code_url, '_blank')}
                              >
                                View QR Code
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedLabRequest.metadata && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Metadata
                        </Typography>
                        <Typography variant="body2">
                          {JSON.stringify(selectedLabRequest.metadata, null, 2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLabRequestModalOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setLabRequestModalOpen(false);
              navigate('/lab-requests');
            }}
          >
            View in Lab Requests Page
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BarcodeDemo;