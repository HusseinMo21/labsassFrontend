import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Visibility,
  Print,
  Schedule,
  People,
  AttachMoney,
  Receipt,
  AccessTime,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Shift {
  id: number;
  shift_type: string;
  opened_at: string;
  closed_at?: string;
  duration: string;
  status: 'open' | 'closed';
  patients_served: number;
  visits_processed: number;
  payments_processed: number;
  total_collected: number;
  notes?: string;
}

interface ShiftReport {
  shift_info: {
    id: number;
    staff_name: string;
    shift_type: string;
    opened_at: string;
    closed_at: string;
    duration: string;
    patients_served: number;
    visits_processed: number;
    payments_processed: number;
    total_collected: number;
    notes?: string;
  };
  patients: Array<{
    patient_name: string;
    lab_number: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    type: string;
    sender: string;
    visit_date: string;
  }>;
}

const ShiftManagement: React.FC = () => {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [shiftHistory, setShiftHistory] = useState<Shift[]>([]);
  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [shiftReport, setShiftReport] = useState<ShiftReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [shiftType, setShiftType] = useState('AM');
  const [closeNotes, setCloseNotes] = useState('');

  useEffect(() => {
    fetchCurrentShift();
    fetchShiftHistory();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const response = await axios.get('/api/shifts/current');
      if (response.data.success) {
        setCurrentShift(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch current shift:', error);
    }
  };

  const fetchShiftHistory = async () => {
    try {
      const response = await axios.get('/api/shifts/history');
      if (response.data.success) {
        setShiftHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch shift history:', error);
    }
  };

  const handleOpenShift = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/shifts/open', {
        shift_type: shiftType,
      });
      
      if (response.data.success) {
        toast.success('Shift opened successfully!');
        setOpenShiftDialog(false);
        fetchCurrentShift();
        fetchShiftHistory();
      }
    } catch (error: any) {
      console.error('Failed to open shift:', error);
      toast.error(error.response?.data?.message || 'Failed to open shift');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/shifts/close', {
        notes: closeNotes,
      });
      
      if (response.data.success) {
        toast.success('Shift closed successfully!');
        setCloseShiftDialog(false);
        setCloseNotes('');
        fetchCurrentShift();
        fetchShiftHistory();
      }
    } catch (error: any) {
      console.error('Failed to close shift:', error);
      toast.error(error.response?.data?.message || 'Failed to close shift');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (shift: Shift) => {
    try {
      const response = await axios.get(`/api/shifts/${shift.id}/report`);
      if (response.data.success) {
        setShiftReport(response.data.data);
        setSelectedShift(shift);
        setReportDialog(true);
      }
    } catch (error: any) {
      console.error('Failed to fetch shift report:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch shift report');
    }
  };

  const handlePrintReport = async (shift: Shift) => {
    try {
      const response = await axios.get(`/api/shifts/${shift.id}/report`);
      if (response.data.success) {
        const reportData = response.data.data;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Shift Report - ${reportData.shift_info.staff_name} ${reportData.shift_info.shift_type}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #333; margin: 0; }
                .header h2 { color: #666; margin: 5px 0; }
                .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .summary h3 { margin-top: 0; color: #333; }
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
                .summary-item { background: white; padding: 10px; border-radius: 3px; }
                .summary-label { font-weight: bold; color: #666; }
                .summary-value { font-size: 18px; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Shift Close Report</h1>
                <h2>${reportData.shift_info.staff_name} - ${reportData.shift_info.shift_type} Shift</h2>
                <p>Date: ${new Date(reportData.shift_info.opened_at).toLocaleDateString()}</p>
              </div>

              <div class="summary">
                <h3>Shift Summary</h3>
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-label">Shift Duration</div>
                    <div class="summary-value">${reportData.shift_info.duration}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Patients Served</div>
                    <div class="summary-value">${reportData.shift_info.patients_served}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Visits Processed</div>
                    <div class="summary-value">${reportData.shift_info.visits_processed}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Payments Processed</div>
                    <div class="summary-value">${reportData.shift_info.payments_processed}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Total Collected</div>
                    <div class="summary-value">EGP ${(parseFloat(reportData.shift_info.total_collected) || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Lab Number</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Type</th>
                    <th>Sender</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.patients.map(patient => `
                    <tr>
                      <td>${patient.patient_name}</td>
                      <td>${patient.lab_number}</td>
                      <td>EGP ${(parseFloat(patient.total_amount) || 0).toFixed(2)}</td>
                      <td>EGP ${(parseFloat(patient.paid_amount) || 0).toFixed(2)}</td>
                      <td>EGP ${(parseFloat(patient.remaining_amount) || 0).toFixed(2)}</td>
                      <td>${patient.type}</td>
                      <td>${patient.sender}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="footer">
                <p>Report generated on ${new Date().toLocaleString()}</p>
                <p>Shift opened: ${new Date(reportData.shift_info.opened_at).toLocaleString()}</p>
                <p>Shift closed: ${new Date(reportData.shift_info.closed_at).toLocaleString()}</p>
              </div>
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error: any) {
      console.error('Failed to print shift report:', error);
      toast.error(error.response?.data?.message || 'Failed to print shift report');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: any) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `EGP ${numAmount.toFixed(2)}`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Shift Management
      </Typography>

      {/* Current Shift Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Shift Status
          </Typography>
          
          {currentShift ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip 
                    label={currentShift.status?.toUpperCase() || 'UNKNOWN'} 
                    color={currentShift.status === 'open' ? 'success' : 'default'}
                    icon={<Schedule />}
                  />
                  <Typography variant="h6">
                    {currentShift.shift_type || 'Unknown'} Shift
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Started: {currentShift.opened_at ? formatTime(currentShift.opened_at) : 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duration: {currentShift.duration || 'Unknown'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <People color="primary" />
                      <Typography variant="h6">{currentShift.patients_served || 0}</Typography>
                      <Typography variant="caption">Patients</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Receipt color="primary" />
                      <Typography variant="h6">{currentShift.visits_processed || 0}</Typography>
                      <Typography variant="caption">Visits</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <AttachMoney color="primary" />
                      <Typography variant="h6">{currentShift.payments_processed || 0}</Typography>
                      <Typography variant="caption">Payments</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(currentShift.total_collected || 0)}
                      </Typography>
                      <Typography variant="caption">Collected</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {(currentShift.status === 'open' || !currentShift.closed_at) && (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Stop />}
                      onClick={() => setCloseShiftDialog(true)}
                    >
                      End Shift
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Active Shift
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Start your shift to begin tracking your work
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => setOpenShiftDialog(true)}
                sx={{ mt: 2 }}
              >
                Start Shift
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Shift History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Shift History
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Patients</TableCell>
                  <TableCell>Visits</TableCell>
                  <TableCell>Payments</TableCell>
                  <TableCell>Collected</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shiftHistory && shiftHistory.length > 0 ? shiftHistory.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.opened_at ? formatTime(shift.opened_at) : 'Unknown'}</TableCell>
                    <TableCell>{shift.shift_type || 'Unknown'}</TableCell>
                    <TableCell>{shift.duration || 'Unknown'}</TableCell>
                    <TableCell>{shift.patients_served || 0}</TableCell>
                    <TableCell>{shift.visits_processed || 0}</TableCell>
                    <TableCell>{shift.payments_processed || 0}</TableCell>
                    <TableCell>{formatCurrency(shift.total_collected || 0)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={shift.status?.toUpperCase() || 'UNKNOWN'} 
                        color={shift.status === 'open' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Report">
                          <IconButton
                            size="small"
                            onClick={() => handleViewReport(shift)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {shift.status === 'closed' && (
                          <Tooltip title="Print Report">
                            <IconButton
                              size="small"
                              onClick={() => handlePrintReport(shift)}
                            >
                              <Print />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No shift history found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Open Shift Dialog */}
      <Dialog open={openShiftDialog} onClose={() => setOpenShiftDialog(false)}>
        <DialogTitle>Start New Shift</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Shift Type</InputLabel>
            <Select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              label="Shift Type"
            >
              <MenuItem value="AM">AM Shift</MenuItem>
              <MenuItem value="PM">PM Shift</MenuItem>
              <MenuItem value="Night">Night Shift</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShiftDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleOpenShift} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            Start Shift
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={closeShiftDialog} onClose={() => setCloseShiftDialog(false)}>
        <DialogTitle>End Current Shift</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will close your current shift and generate a final report.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={closeNotes}
            onChange={(e) => setCloseNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseShiftDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCloseShift} 
            variant="contained" 
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Stop />}
          >
            End Shift
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shift Report Dialog */}
      <Dialog 
        open={reportDialog} 
        onClose={() => setReportDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Shift Report - {selectedShift?.shift_type} Shift
        </DialogTitle>
        <DialogContent>
          {shiftReport && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Shift Summary</Typography>
                  <Typography variant="body2">Staff: {shiftReport.shift_info.staff_name || 'Unknown'}</Typography>
                  <Typography variant="body2">Type: {shiftReport.shift_info.shift_type || 'Unknown'}</Typography>
                  <Typography variant="body2">Duration: {shiftReport.shift_info.duration || 'Unknown'}</Typography>
                  <Typography variant="body2">Opened: {shiftReport.shift_info.opened_at ? formatTime(shiftReport.shift_info.opened_at) : 'Unknown'}</Typography>
                  <Typography variant="body2">Closed: {shiftReport.shift_info.closed_at ? formatTime(shiftReport.shift_info.closed_at) : 'Unknown'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Statistics</Typography>
                  <Typography variant="body2">Patients Served: {shiftReport.shift_info.patients_served || 0}</Typography>
                  <Typography variant="body2">Visits Processed: {shiftReport.shift_info.visits_processed || 0}</Typography>
                  <Typography variant="body2">Payments Processed: {shiftReport.shift_info.payments_processed || 0}</Typography>
                  <Typography variant="body2">Total Collected: {formatCurrency(shiftReport.shift_info.total_collected || 0)}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Patient Details</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Lab Number</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Paid</TableCell>
                      <TableCell>Remaining</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Sender</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shiftReport.patients && shiftReport.patients.length > 0 ? shiftReport.patients.map((patient, index) => (
                      <TableRow key={index}>
                        <TableCell>{patient.patient_name || 'Unknown'}</TableCell>
                        <TableCell>{patient.lab_number || 'Unknown'}</TableCell>
                        <TableCell>{formatCurrency(patient.total_amount || 0)}</TableCell>
                        <TableCell>{formatCurrency(patient.paid_amount || 0)}</TableCell>
                        <TableCell>{formatCurrency(patient.remaining_amount || 0)}</TableCell>
                        <TableCell>{patient.type || 'Unknown'}</TableCell>
                        <TableCell>{patient.sender || 'Unknown'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No patients found for this shift
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Close</Button>
          {selectedShift && (
            <Button 
              onClick={() => handlePrintReport(selectedShift)} 
              variant="contained"
              startIcon={<Print />}
            >
              Print Report
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftManagement;
