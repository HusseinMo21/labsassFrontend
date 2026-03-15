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
  Pagination,
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
  cash_collected: number;
  other_payments_collected: number;
  payment_breakdown: Record<string, number>;
  total_expenses?: number;
  expenses_breakdown?: Record<string, Array<{id: number; description: string; amount: number; payment_method?: string}>>;
  expenses_list?: Array<{id: number; description: string; amount: number; category?: string; payment_method?: string; expense_date?: string}>;
  final_cash_in_bucket?: number;
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
    cash_collected: number;
    other_payments_collected: number;
    payment_breakdown: Record<string, number>;
    total_expenses?: number;
    expense_breakdown?: Record<string, Array<{id: number; description: string; amount: number; payment_method?: string}>>;
    expenses_list?: Array<{id: number; description: string; amount: number; category?: string; payment_method?: string; expense_date?: string}>;
    notes?: string;
  };
  patients: Array<{
    patient_name: string;
    lab_number: string;
    total_amount: number;
    paid_amount: number;
    cash_paid?: number;
    other_paid?: number;
    other_payment_method?: string;
    remaining_amount: number;
    type: string;
    doctor: string;
    organization?: string;
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
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [shiftsByDate, setShiftsByDate] = useState<Shift[]>([]);
  const [loadingShiftsByDate, setLoadingShiftsByDate] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  });

  useEffect(() => {
    fetchCurrentShift();
    fetchShiftHistory(1, 10);
  }, []);

  // Update current time every second for the timer (more accurate)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for real-time display

    return () => clearInterval(timer);
  }, []);

  // Calculate elapsed time for current shift
  const calculateElapsedTime = (openedAt: string): string => {
    if (!openedAt) return '0h 0m';
    
    const opened = new Date(openedAt);
    const now = currentTime;
    const diffMs = now.getTime() - opened.getTime();
    
    if (diffMs < 0) return '0h 0m'; // Handle negative time
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 1) {
      return '0h 0m';
    }
    
    const hours = diffHours;
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const fetchCurrentShift = async () => {
    try {
      const response = await axios.get('/api/shifts/current');
      if (response.data.success) {
        setCurrentShift(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch current shift:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied: You need staff or admin role to access shift management');
      } else {
        toast.error('Failed to fetch current shift: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const fetchShiftHistory = async (page: number = pagination.page, perPage: number = pagination.perPage) => {
    try {
      const response = await axios.get('/api/shifts/history', {
        params: {
          page,
          per_page: perPage,
        },
      });
      if (response.data.success) {
        setShiftHistory(response.data.data);
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.current_page,
            perPage: response.data.pagination.per_page,
            total: response.data.pagination.total,
            lastPage: response.data.pagination.last_page,
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch shift history:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied: You need staff or admin role to access shift history');
      } else {
        toast.error('Failed to fetch shift history: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const fetchShiftsByDate = async (date: string) => {
    if (!date) {
      setShiftsByDate([]);
      return;
    }

    setLoadingShiftsByDate(true);
    try {
      const response = await axios.get('/api/shifts/by-date', {
        params: { date }
      });
      if (response.data.success) {
        setShiftsByDate(response.data.data);
        if (response.data.data.length === 0) {
          toast.info('No shifts found for the selected date');
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch shifts by date:', error);
      toast.error('Failed to fetch shifts: ' + (error.response?.data?.message || error.message));
      setShiftsByDate([]);
    } finally {
      setLoadingShiftsByDate(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchShiftsByDate(date);
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
        fetchShiftHistory(1, pagination.perPage);
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
        fetchShiftHistory(1, pagination.perPage);
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

  const handleViewCurrentShiftDetails = async () => {
    if (!currentShift) return;
    
    try {
      const response = await axios.get(`/api/shifts/${currentShift.id}/report`);
      if (response.data.success) {
        const reportData = response.data.data;
        setShiftReport(reportData);
        setSelectedShift(currentShift);
        setReportDialog(true);
      }
    } catch (error: any) {
      console.error('Failed to fetch shift details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch shift details');
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
          const openedAt = new Date(reportData.shift_info.opened_at).toLocaleString();
          const closedAt = reportData.shift_info.closed_at 
            ? new Date(reportData.shift_info.closed_at).toLocaleString() 
            : 'Shift Still Open';
          
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
                .header p { color: #888; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .status-open { color: #4caf50; font-weight: bold; }
                .status-closed { color: #666; font-weight: bold; }
                .cash-amount { color: #4caf50; font-weight: bold; }
                .other-amount { color: #2196f3; font-weight: bold; }
                .total-amount { color: #1976d2; font-weight: bold; }
                .payment-methods { margin: 20px 0; }
                .payment-method { display: inline-block; margin: 5px; padding: 5px 10px; border: 1px solid #ddd; border-radius: 3px; }
                .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                @media print {
                  body { margin: 0; }
                  .header { page-break-after: avoid; }
                  table { page-break-inside: auto; }
                  tr { page-break-inside: avoid; page-break-after: auto; }
                  thead { display: table-header-group; }
                  tfoot { display: table-footer-group; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Shift Report</h1>
                <h2>${reportData.shift_info.staff_name} - ${reportData.shift_info.shift_type} Shift</h2>
                <p>${openedAt}${reportData.shift_info.closed_at ? ` - ${closedAt}` : ''}</p>
              </div>

              <!-- Shift Summary Table - Matching History Table Format -->
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Patients</th>
                    <th>Visits</th>
                    <th>Payments</th>
                    <th>Cash</th>
                    <th>Other</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${openedAt}</td>
                    <td>${reportData.shift_info.shift_type || 'Unknown'}</td>
                    <td>${reportData.shift_info.duration || 'Unknown'}</td>
                    <td>${reportData.shift_info.patients_served || 0}</td>
                    <td>${reportData.shift_info.visits_processed || 0}</td>
                    <td>${reportData.shift_info.payments_processed || 0}</td>
                    <td class="cash-amount">EGP ${(parseFloat(reportData.shift_info.cash_collected) || 0).toFixed(2)}</td>
                    <td class="other-amount">EGP ${(parseFloat(reportData.shift_info.other_payments_collected) || 0).toFixed(2)}</td>
                    <td class="total-amount">EGP ${(parseFloat(reportData.shift_info.total_collected) || 0).toFixed(2)}</td>
                    <td class="${reportData.shift_info.closed_at ? 'status-closed' : 'status-open'}">
                      ${reportData.shift_info.closed_at ? 'CLOSED' : 'OPEN'}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Payment Breakdown -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #333;">Payment Breakdown</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                  <div style="text-align: center; padding: 15px; background-color: #fff; border-radius: 5px; border: 1px solid #ddd;">
                    <div style="font-size: 24px; font-weight: bold; color: #1976d2;">
                      EGP ${(parseFloat(reportData.shift_info.total_collected) || 0).toFixed(2)}
                    </div>
                    <div style="color: #666; margin-top: 5px;">Total Collected</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background-color: #fff; border-radius: 5px; border: 1px solid #ddd;">
                    <div style="font-size: 24px; font-weight: bold; color: #4caf50;">
                      EGP ${(parseFloat(reportData.shift_info.cash_collected) || 0).toFixed(2)}
                    </div>
                    <div style="color: #666; margin-top: 5px;">Cash Collected</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background-color: #fff; border-radius: 5px; border: 1px solid #ddd;">
                    <div style="font-size: 24px; font-weight: bold; color: #f44336;">
                      EGP ${(parseFloat(reportData.shift_info.total_expenses) || 0).toFixed(2)}
                    </div>
                    <div style="color: #666; margin-top: 5px;">Expenses</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background-color: #fff; border-radius: 5px; border: 1px solid #ddd;">
                    <div style="font-size: 24px; font-weight: bold; color: #1976d2;">
                      EGP ${((parseFloat(reportData.shift_info.cash_collected) || 0) - (parseFloat(reportData.shift_info.total_expenses) || 0)).toFixed(2)}
                    </div>
                    <div style="color: #666; margin-top: 5px;">Final Cash in Bucket</div>
                  </div>
                </div>
                ${reportData.shift_info.other_payments_collected && parseFloat(reportData.shift_info.other_payments_collected) > 0 ? `
                <div style="margin-top: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #333;">Other Payments</h4>
                  <div style="color: #666;">EGP ${(parseFloat(reportData.shift_info.other_payments_collected) || 0).toFixed(2)}</div>
                </div>
                ` : ''}
              </div>

              <!-- Expenses Breakdown -->
              ${reportData.shift_info.expenses_list && reportData.shift_info.expenses_list.length > 0 ? `
              <div style="margin: 30px 0;">
                <h3 style="color: #333;">Expenses Breakdown</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reportData.shift_info.expenses_list.map((expense: any) => `
                      <tr>
                        <td>${expense.description || 'N/A'}</td>
                        <td style="color: #f44336; font-weight: bold;">- EGP ${(parseFloat(expense.amount) || 0).toFixed(2)}</td>
                        <td>${expense.category || 'General'}</td>
                      </tr>
                    `).join('')}
                    <tr style="background-color: #f5f5f5; font-weight: bold;">
                      <td>Total Expenses</td>
                      <td style="color: #f44336;">- EGP ${(parseFloat(reportData.shift_info.total_expenses) || 0).toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              ` : ''}

              <!-- Cash Summary -->
              <div style="margin: 30px 0; padding: 20px; background-color: #e3f2fd; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #333;">Cash Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                  <div style="text-align: center; padding: 15px; background-color: #fff; border-radius: 5px;">
                    <div style="font-size: 20px; font-weight: bold; color: #4caf50;">
                      EGP ${(parseFloat(reportData.shift_info.cash_collected) || 0).toFixed(2)}
                    </div>
                    <div style="color: #666; margin-top: 5px;">Cash Collected</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background-color: #fff; border-radius: 5px;">
                    <div style="font-size: 20px; font-weight: bold; color: #f44336;">
                      - EGP ${(parseFloat(reportData.shift_info.total_expenses) || 0).toFixed(2)}
                    </div>
                    <div style="color: #666; margin-top: 5px;">Expenses</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background-color: #fff; border-radius: 5px;">
                    <div style="font-size: 20px; font-weight: bold; color: #1976d2;">
                      EGP ${((parseFloat(reportData.shift_info.cash_collected) || 0) - (parseFloat(reportData.shift_info.total_expenses) || 0)).toFixed(2)}
                    </div>
                    <div style="color: #666; margin-top: 5px;">Final Cash in Bucket</div>
                  </div>
                </div>
              </div>

              ${reportData.shift_info.payment_breakdown && Object.keys(reportData.shift_info.payment_breakdown).length > 0 ? `
              <div class="payment-methods">
                <h3>Payment Methods Breakdown</h3>
                  ${Object.entries(reportData.shift_info.payment_breakdown).map(([method, amount]) => `
                  <span class="payment-method"><strong>${method}:</strong> EGP ${(parseFloat(amount as string) || 0).toFixed(2)}</span>
                  `).join('')}
              </div>
              ` : ''}

              ${reportData.patients && reportData.patients.length > 0 ? `
              <h3>Patient Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Lab Number</th>
                    <th>Total</th>
                    <th>Total Paid</th>
                    <th>Cash</th>
                    <th>Other Payment</th>
                    <th>Remaining</th>
                    <th>Type</th>
                    <th>Doctor</th>
                    <th>Organization</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.patients.map((patient: any) => `
                    <tr>
                      <td>${patient.patient_name || 'Unknown'}</td>
                      <td>${patient.lab_number || 'N/A'}</td>
                      <td>EGP ${(parseFloat(patient.total_amount) || 0).toFixed(2)}</td>
                      <td>EGP ${(parseFloat(patient.paid_amount) || 0).toFixed(2)}</td>
                      <td>EGP ${(parseFloat(patient.cash_paid) || 0).toFixed(2)}</td>
                      <td>EGP ${(parseFloat(patient.other_paid) || 0).toFixed(2)} ${patient.other_payment_method ? `(${patient.other_payment_method})` : ''}</td>
                      <td>EGP ${(parseFloat(patient.remaining_amount) || 0).toFixed(2)}</td>
                      <td>${patient.type || 'N/A'}</td>
                      <td>${patient.doctor || patient.sender || 'N/A'}</td>
                      <td>${patient.organization || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ` : '<p style="text-align: center; color: #666; margin-top: 20px;">No patients found for this shift</p>'}

              <div class="footer">
                <p>Report generated on ${new Date().toLocaleString()}</p>
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
              
              {/* Payment Breakdown */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Payment Breakdown
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="h6" color="success.dark">
                        {formatCurrency(currentShift.cash_collected || 0)}
                      </Typography>
                      <Typography variant="caption" color="success.dark">
                        Cash Collected
                      </Typography>
                    </Box>
                  </Grid>
                  {currentShift.expenses_list && currentShift.expenses_list.length > 0 && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                        <Typography variant="h6" color="error.dark">
                          {formatCurrency(currentShift.total_expenses || 0)}
                        </Typography>
                        <Typography variant="caption" color="error.dark">
                          Expenses
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                      <Typography variant="h6" color="warning.dark">
                        {formatCurrency(currentShift.final_cash_in_bucket ?? (currentShift.cash_collected || 0))}
                      </Typography>
                      <Typography variant="caption" color="warning.dark">
                        Final Cash in Bucket
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="h6" color="info.dark">
                        {formatCurrency(currentShift.other_payments_collected || 0)}
                      </Typography>
                      <Typography variant="caption" color="info.dark">
                        Other Payments
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Expenses Breakdown */}
                {currentShift.expenses_list && currentShift.expenses_list.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Expenses Breakdown
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Category</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentShift.expenses_list.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{expense.description}</TableCell>
                              <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                - {formatCurrency(expense.amount)}
                              </TableCell>
                              <TableCell>{expense.category || 'General'}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: 'error.light' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Total Expenses</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
                              - {formatCurrency(currentShift.total_expenses || 0)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                
                {/* Cash Summary */}
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Cash Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="success.dark" gutterBottom>
                          Cash Collected
                        </Typography>
                        <Typography variant="h5" color="success.dark" fontWeight="bold">
                          {formatCurrency(currentShift.cash_collected || 0)}
                        </Typography>
                      </Box>
                    </Grid>
                    {currentShift.expenses_list && currentShift.expenses_list.length > 0 && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                            <Typography variant="body2" color="error.dark" gutterBottom>
                              Expenses
                            </Typography>
                            <Typography variant="h5" color="error.dark" fontWeight="bold">
                              - {formatCurrency(currentShift.total_expenses || 0)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                            <Typography variant="body2" color="warning.dark" gutterBottom>
                              Final Cash in Bucket
                            </Typography>
                            <Typography variant="h5" color="warning.dark" fontWeight="bold">
                              {formatCurrency(currentShift.final_cash_in_bucket ?? (currentShift.cash_collected || 0))}
                            </Typography>
                          </Box>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
                
                {/* Detailed Payment Methods */}
                {currentShift.payment_breakdown && Object.keys(currentShift.payment_breakdown).length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Payment Methods Used:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(currentShift.payment_breakdown).map(([method, amount]) => (
                        <Chip
                          key={method}
                          label={`${method}: ${formatCurrency(amount)}`}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  {(currentShift.status === 'open' || !currentShift.closed_at) && (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<Print />}
                        onClick={() => handleViewCurrentShiftDetails()}
                      >
                        View/Print Shift Details
                      </Button>
                      
                      {/* Timer Display */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 1,
                          bgcolor: 'primary.light',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'primary.main',
                        }}
                      >
                        <Schedule sx={{ color: 'primary.dark' }} />
                        <Typography variant="h6" sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
                          {currentShift.opened_at ? calculateElapsedTime(currentShift.opened_at) : '0h 0m'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'primary.dark' }}>
                          Worked
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Stop />}
                        onClick={() => setCloseShiftDialog(true)}
                      >
                        End Shift
                      </Button>
                    </>
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

      {/* Shifts by Date */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            View Shifts by Date
          </Typography>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Select Date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ minWidth: 200 }}
            />
            {selectedDate && (
              <Typography variant="body2" color="text.secondary">
                {new Date(selectedDate).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}
              </Typography>
            )}
          </Box>

          {loadingShiftsByDate ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedDate && shiftsByDate.length > 0 ? (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                Found {shiftsByDate.length} shift(s) on this date
              </Typography>
              {shiftsByDate.map((shift) => {
                const openedAt = new Date(shift.opened_at);
                const shiftPeriod = openedAt.getHours() < 12 ? 'AM' : 'PM';
                
                return (
                  <Card key={shift.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {shift.shift_type} Shift - {shiftPeriod}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Opened: {openedAt.toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                          {shift.closed_at && (
                            <Typography variant="body2" color="text.secondary">
                              Closed: {new Date(shift.closed_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Duration: {shift.duration}
                          </Typography>
                        </Box>
                        <Chip
                          label={shift.status.toUpperCase()}
                          color={shift.status === 'open' ? 'success' : 'default'}
                          sx={{ mb: 1 }}
                        />
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Patients</Typography>
                          <Typography variant="body1" fontWeight="bold">{shift.patients_served || 0}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Visits</Typography>
                          <Typography variant="body1" fontWeight="bold">{shift.visits_processed || 0}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Cash Collected</Typography>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            {formatCurrency(shift.cash_collected || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Expenses</Typography>
                          <Typography variant="body1" fontWeight="bold" color="error.main">
                            {formatCurrency(shift.total_expenses || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Final Cash in Bucket</Typography>
                          <Typography variant="body1" fontWeight="bold" color="primary.main">
                            {formatCurrency(shift.final_cash_in_bucket ?? (shift.cash_collected || 0))}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">Total Collected</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatCurrency(shift.total_collected || 0)}
                          </Typography>
                        </Grid>
                      </Grid>

                      {shift.expenses_list && shift.expenses_list.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Expenses:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {shift.expenses_list.map((expense) => (
                              <Chip
                                key={expense.id}
                                label={`${expense.description}: ${formatCurrency(expense.amount)}`}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<Print />}
                          onClick={() => handlePrintReport(shift)}
                          size="small"
                        >
                          Print Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={async () => {
                            try {
                              const response = await axios.get(`/api/shifts/${shift.id}/report`);
                              if (response.data.success) {
                                setShiftReport(response.data.data);
                                setSelectedShift(shift);
                                setReportDialog(true);
                              }
                            } catch (error: any) {
                              toast.error('Failed to load shift report: ' + (error.response?.data?.message || error.message));
                            }
                          }}
                          size="small"
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : selectedDate ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No shifts found for the selected date
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Please select a date to view shifts
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Shift History */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Shift History
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {pagination.total > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Showing {((pagination.page - 1) * pagination.perPage) + 1} - {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} closed shift(s)
                </Typography>
              )}
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Per Page</InputLabel>
                <Select
                  value={pagination.perPage}
                  label="Per Page"
                  onChange={(e) => {
                    const newPerPage = Number(e.target.value);
                    setPagination({ ...pagination, perPage: newPerPage, page: 1 });
                    fetchShiftHistory(1, newPerPage);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
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
                  <TableCell>Cash</TableCell>
                  <TableCell>Other</TableCell>
                  <TableCell>Total</TableCell>
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
                    <TableCell>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        {formatCurrency(shift.cash_collected || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="info.main" fontWeight="bold">
                        {formatCurrency(shift.other_payments_collected || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {formatCurrency(shift.total_collected || 0)}
                      </Typography>
                    </TableCell>
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
                    <TableCell colSpan={11} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No shift history found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination Controls */}
          {pagination.total > 0 && pagination.lastPage > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
              <Pagination
                count={pagination.lastPage}
                page={pagination.page}
                onChange={(_event, value) => {
                  setPagination({ ...pagination, page: value });
                  fetchShiftHistory(value, pagination.perPage);
                }}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
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
              {/* Header Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Staff: {shiftReport.shift_info.staff_name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {shiftReport.shift_info.opened_at ? formatTime(shiftReport.shift_info.opened_at) : 'Unknown'}
                  {shiftReport.shift_info.closed_at && ` - ${formatTime(shiftReport.shift_info.closed_at)}`}
                </Typography>
                {!shiftReport.shift_info.closed_at && (
                  <Chip label="OPEN" color="success" size="small" sx={{ mt: 1 }} />
                )}
              </Box>

              {/* Shift Summary Table - Matching History Table Format */}
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Duration</strong></TableCell>
                      <TableCell><strong>Patients</strong></TableCell>
                      <TableCell><strong>Visits</strong></TableCell>
                      <TableCell><strong>Payments</strong></TableCell>
                      <TableCell><strong>Cash</strong></TableCell>
                      <TableCell><strong>Other</strong></TableCell>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{shiftReport.shift_info.opened_at ? formatTime(shiftReport.shift_info.opened_at) : 'Unknown'}</TableCell>
                      <TableCell>{shiftReport.shift_info.shift_type || 'Unknown'}</TableCell>
                      <TableCell>{shiftReport.shift_info.duration || 'Unknown'}</TableCell>
                      <TableCell>{shiftReport.shift_info.patients_served || 0}</TableCell>
                      <TableCell>{shiftReport.shift_info.visits_processed || 0}</TableCell>
                      <TableCell>{shiftReport.shift_info.payments_processed || 0}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          {formatCurrency(shiftReport.shift_info.cash_collected || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="info.main" fontWeight="bold">
                          {formatCurrency(shiftReport.shift_info.other_payments_collected || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                          {formatCurrency(shiftReport.shift_info.total_collected || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={shiftReport.shift_info.closed_at ? 'CLOSED' : 'OPEN'} 
                          color={shiftReport.shift_info.closed_at ? 'default' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Payment Methods Breakdown */}
              {shiftReport.shift_info.payment_breakdown && Object.keys(shiftReport.shift_info.payment_breakdown).length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>Payment Methods Breakdown</Typography>
                  <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(shiftReport.shift_info.payment_breakdown).map(([method, amount]) => (
                      <Chip
                        key={method}
                        label={`${method}: ${formatCurrency(amount)}`}
                        variant="outlined"
                        size="medium"
                      />
                    ))}
                  </Box>
                </>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              {/* Patient Details Table */}
              <Typography variant="h6" gutterBottom>Patient Details</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Lab Number</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Total Paid</TableCell>
                      <TableCell>Cash</TableCell>
                      <TableCell>Other Payment</TableCell>
                      <TableCell>Remaining</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Organization</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shiftReport.patients && shiftReport.patients.length > 0 ? shiftReport.patients.map((patient, index) => (
                      <TableRow key={index}>
                        <TableCell>{patient.patient_name || 'Unknown'}</TableCell>
                        <TableCell>{patient.lab_number || 'Unknown'}</TableCell>
                        <TableCell>{formatCurrency(patient.total_amount || 0)}</TableCell>
                        <TableCell>{formatCurrency(patient.paid_amount || 0)}</TableCell>
                        <TableCell>{formatCurrency(patient.cash_paid || 0)}</TableCell>
                        <TableCell>
                          {patient.other_paid && patient.other_paid > 0 
                            ? `${formatCurrency(patient.other_paid)} (${patient.other_payment_method || 'Other'})`
                            : formatCurrency(0)
                          }
                        </TableCell>
                        <TableCell>{formatCurrency(patient.remaining_amount || 0)}</TableCell>
                        <TableCell>{patient.type || 'Unknown'}</TableCell>
                        <TableCell>{patient.doctor || 'Unknown'}</TableCell>
                        <TableCell>{patient.organization || ''}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={10} align="center">
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
              onClick={() => {
                handlePrintReport(selectedShift);
                setReportDialog(false);
              }} 
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

