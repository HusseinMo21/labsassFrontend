import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  TextField,
} from '@mui/material';
import {
  Print,
  Today,
  Refresh,
} from '@mui/icons-material';
import axios from '../../config/axios';
import { toast } from 'react-toastify';

interface TodayClient {
  id: number;
  visit_number: string;
  patient: {
    id: number;
    name: string;
    age?: string;
    gender?: string;
    phone?: string;
    doctor_id?: string;
    organization_id?: string;
    organization?: string;
  };
  referred_doctor?: string;
  labRequest?: {
    id: number;
    full_lab_no: string;
  };
  total_amount?: number;
  final_amount?: number;
  upfront_payment?: number;
  remaining_balance?: number;
  billing_status?: string;
  delivery_date?: string;
  expected_delivery_date?: string;
  metadata?: any;
}

const TodayClients: React.FC = () => {
  const [clients, setClients] = useState<TodayClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Initialize with today's date
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchTodayClients();
  }, [selectedDate]);

  const fetchTodayClients = async () => {
    try {
      setLoading(true);
      const deliveryDate = selectedDate; // Use selected date instead of today
      
      console.log('Fetching clients for delivery date:', deliveryDate);
      
      // First try with backend filter
      let response;
      try {
        response = await axios.get('/api/visits', {
          params: {
            delivery_date: deliveryDate,
            per_page: 1000,
          },
        });
      } catch (filterError) {
        console.warn('Backend filter failed, fetching all visits:', filterError);
        // Fallback: fetch all visits if backend filter fails
        response = await axios.get('/api/visits', {
          params: {
            per_page: 1000,
          },
        });
      }

      let allVisits = response.data.data || [];
      console.log('Fetched visits from backend:', allVisits.length);
      
      // Frontend filtering to catch all cases
      const todayClients = allVisits.filter((visit: any) => {
        let deliveryDate = null;
        let deliveryDateSource = '';
        
        console.log('Processing visit:', visit.id, {
          delivery_date: visit.delivery_date,
          expected_delivery_date: visit.expected_delivery_date,
          patient_delivery_date: visit.patient?.delivery_date,
          patient_full: visit.patient,
          metadata: visit.metadata
        });
        
        // PRIORITY 1: Use delivery_date from API response (already extracted by backend)
        if (visit.delivery_date) {
          deliveryDate = visit.delivery_date;
          deliveryDateSource = 'visit.delivery_date';
        }
        
        // PRIORITY 2: Check patient.delivery_date (this is where it's stored from patient registration)
        if (!deliveryDate && visit.patient?.delivery_date) {
          deliveryDate = visit.patient.delivery_date;
          deliveryDateSource = 'patient.delivery_date';
        }
        
        // PRIORITY 3: Try to get delivery date from metadata
        if (!deliveryDate && visit.metadata) {
          try {
            const metadata = typeof visit.metadata === 'string' 
              ? JSON.parse(visit.metadata) 
              : visit.metadata;
            
            if (metadata?.patient_data?.delivery_date) {
              deliveryDate = metadata.patient_data.delivery_date;
              deliveryDateSource = 'metadata.patient_data.delivery_date';
            } else if (metadata?.delivery_date) {
              deliveryDate = metadata.delivery_date;
              deliveryDateSource = 'metadata.delivery_date';
            }
          } catch (e) {
            console.warn('Error parsing metadata:', e, visit.metadata);
          }
        }
        
        // PRIORITY 4: Try expected_delivery_date from visit
        if (!deliveryDate && visit.expected_delivery_date) {
          deliveryDate = visit.expected_delivery_date;
          deliveryDateSource = 'expected_delivery_date';
        }
        
        console.log(`Visit ${visit.id} - Found delivery date:`, deliveryDate, 'from:', deliveryDateSource);
        
        // Normalize date format for comparison
        if (deliveryDate) {
          try {
            // Handle different date formats
            let normalizedDate: string = '';
            
            if (typeof deliveryDate === 'string') {
              // If it's already in YYYY-MM-DD format
              if (/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
                normalizedDate = deliveryDate;
              } else {
                // Try parsing as Date
                const dateObj = new Date(deliveryDate);
                if (!isNaN(dateObj.getTime())) {
                  normalizedDate = dateObj.toISOString().split('T')[0];
                } else {
                  // Try extracting YYYY-MM-DD from string
                  const match = deliveryDate.match(/(\d{4}-\d{2}-\d{2})/);
                  normalizedDate = match ? match[1] : '';
                }
              }
            } else if (deliveryDate instanceof Date) {
              // If it's a Date object
              normalizedDate = deliveryDate.toISOString().split('T')[0];
            } else {
              // Try to convert to string and parse
              const dateObj = new Date(deliveryDate);
              normalizedDate = !isNaN(dateObj.getTime()) 
                ? dateObj.toISOString().split('T')[0] 
                : '';
            }
            
            console.log(`Visit ${visit.id} - Normalized date:`, normalizedDate, 'vs selected date:', deliveryDate, 'match:', normalizedDate === deliveryDate);
            
            return normalizedDate === deliveryDate;
          } catch (e) {
            console.warn('Error parsing delivery date:', deliveryDate, e);
            return false;
          }
        }
        
        console.log(`Visit ${visit.id} - No delivery date found`);
        return false;
      });

      console.log('Filtered today clients:', todayClients.length);
      if (todayClients.length > 0) {
        console.log('Sample client:', todayClients[0]);
      } else if (allVisits.length > 0) {
        console.log('Sample visit (not matched):', allVisits[0]);
      }
      setClients(todayClients);
    } catch (error) {
      console.error('Failed to fetch today clients:', error);
      toast.error('Failed to load today clients');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalLeft = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    clients.forEach((client) => {
      const finalAmount = parseFloat(String(client.final_amount || client.total_amount || 0)) || 0;
      const paid = parseFloat(String(client.upfront_payment || 0)) || 0;
      const left = parseFloat(String(client.remaining_balance || (finalAmount - paid))) || 0;

      totalAmount += finalAmount;
      totalPaid += paid;
      totalLeft += left;

      if (left <= 0) {
        paidCount++;
      } else {
        unpaidCount++;
      }
    });

    return { totalAmount, totalPaid, totalLeft, paidCount, unpaidCount };
  };

  const handleResetToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  const handlePrint = async () => {
    if (clients.length === 0) {
      toast.info('No clients to print');
      return;
    }

    setPrinting(true);
    try {
      const { totalAmount, totalPaid, totalLeft, paidCount, unpaidCount } = calculateTotals();
      const formattedDate = new Date(selectedDate).toLocaleDateString('ar-EG');

      const tableRows = clients.map((client) => {
        const finalAmount = Number(client.final_amount || client.total_amount || 0) || 0;
        const paid = Number(client.upfront_payment || 0) || 0;
        const left = Number(client.remaining_balance || (finalAmount - paid)) || 0;
        const labNo = client.labRequest?.full_lab_no || client.visit_number || 'N/A';
        
        // Get doctor name from patient.doctor_id, visit.referred_doctor, or metadata
        const doctorName = client.patient?.doctor_id 
          || client.referred_doctor 
          || (client.metadata && typeof client.metadata === 'object' && client.metadata.patient_data?.doctor)
          || (client.metadata && typeof client.metadata === 'object' && client.metadata.patient_data?.sender)
          || 'N/A';
        
        // Get organization from patient.organization_id, patient.organization, or metadata
        const organizationName = client.patient?.organization_id 
          || client.patient?.organization
          || (client.metadata && typeof client.metadata === 'object' && client.metadata.patient_data?.organization)
          || 'N/A';
        
        return `
          <tr>
            <td>${client.patient.name || 'N/A'}</td>
            <td>${labNo}</td>
            <td>${doctorName}</td>
            <td>${client.patient.age || 'N/A'}</td>
            <td>${organizationName}</td>
            <td>${finalAmount.toFixed(2)}</td>
            <td>${paid.toFixed(2)}</td>
            <td>${left.toFixed(2)}</td>
            <td>${left <= 0 ? 'Paid' : 'Unpaid'}</td>
          </tr>
        `;
      }).join('');

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Today Clients Report</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .summary {
              margin: 15px 0;
              padding: 10px;
              background-color: #f5f5f5;
              border-radius: 5px;
            }
            .summary-row {
              display: flex;
              justify-content: space-around;
              margin: 5px 0;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-weight: bold;
              font-size: 12px;
              color: #666;
            }
            .summary-value {
              font-size: 16px;
              font-weight: bold;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              position: sticky;
              top: 0;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Clients Delivery Report</h1>
            <div style="margin: 10px 0; font-size: 14px; color: #333;">
              <strong>Delivery Date:</strong> ${formattedDate}
            </div>
            <div style="margin: 10px 0; font-size: 14px; color: #333;">
              <strong>Total Clients:</strong> ${clients.length}
            </div>
          </div>
          <div class="summary">
            <div class="summary-row">
              <div class="summary-item">
                <div class="summary-label">Total Amount</div>
                <div class="summary-value">${Number(totalAmount || 0).toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Paid</div>
                <div class="summary-value" style="color: #4caf50;">${Number(totalPaid || 0).toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Left</div>
                <div class="summary-value" style="color: #f57c00;">${Number(totalLeft || 0).toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Paid Clients</div>
                <div class="summary-value" style="color: #4caf50;">${paidCount}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Unpaid Clients</div>
                <div class="summary-value" style="color: #f57c00;">${unpaidCount}</div>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Lab Number</th>
                <th>Doctor</th>
                <th>Age</th>
                <th>Organization</th>
                <th>Total Amount</th>
                <th>Paid</th>
                <th>Left</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Generated on ${new Date().toLocaleString('ar-EG')}
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error: any) {
      console.error('Error printing clients:', error);
      toast.error('Failed to print clients');
    } finally {
      setPrinting(false);
    }
  };

  const { totalAmount, totalPaid, totalLeft, paidCount, unpaidCount } = calculateTotals();
  
  // Ensure all totals are numbers
  const safeTotalAmount = Number(totalAmount) || 0;
  const safeTotalPaid = Number(totalPaid) || 0;
  const safeTotalLeft = Number(totalLeft) || 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Today sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Clients Delivery
          </Typography>
          <Chip 
            label={`${clients.length} Clients`} 
            color="primary" 
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleResetToToday}
            size="small"
          >
            Today
          </Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrint}
            disabled={printing || clients.length === 0}
            sx={{ px: 3 }}
          >
            {printing ? <CircularProgress size={24} color="inherit" /> : 'Print'}
          </Button>
        </Box>
      </Box>

      {/* Date Picker */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          label="Select Delivery Date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ minWidth: 200 }}
        />
        <Typography variant="body2" color="text.secondary">
          Showing clients scheduled for delivery on: <strong>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Clients
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {clients.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {safeTotalAmount.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Paid
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                {safeTotalPaid.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Left
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                {safeTotalLeft.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Paid / Unpaid
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                <span style={{ color: '#4caf50' }}>{paidCount}</span> / <span style={{ color: '#f57c00' }}>{unpaidCount}</span>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {clients.length === 0 ? (
        <Alert severity="info">
          No clients scheduled for delivery on {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Lab Number</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Doctor</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Age</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Organization</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Total Amount</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Paid</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Left</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => {
                const finalAmount = parseFloat(String(client.final_amount || client.total_amount || 0)) || 0;
                const paid = parseFloat(String(client.upfront_payment || 0)) || 0;
                const left = parseFloat(String(client.remaining_balance || (finalAmount - paid))) || 0;
                const labNo = client.labRequest?.full_lab_no || client.visit_number || 'N/A';
                const isPaid = left <= 0;

                // Get doctor name from patient.doctor_id, visit.referred_doctor, or metadata
                const doctorName = client.patient?.doctor_id 
                  || client.referred_doctor 
                  || (client.metadata && typeof client.metadata === 'object' && client.metadata.patient_data?.doctor)
                  || (client.metadata && typeof client.metadata === 'object' && client.metadata.patient_data?.sender)
                  || 'N/A';
                
                // Get organization from patient.organization_id, patient.organization, or metadata
                const organizationName = client.patient?.organization_id 
                  || client.patient?.organization
                  || (client.metadata && typeof client.metadata === 'object' && client.metadata.patient_data?.organization)
                  || 'N/A';

                return (
                  <TableRow key={client.id} hover>
                    <TableCell sx={{ color: 'text.primary' }}>{client.patient.name || 'N/A'}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{labNo}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{doctorName}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{client.patient.age || 'N/A'}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{organizationName}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>{finalAmount.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {paid.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                      {left.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      <Chip
                        label={isPaid ? 'Paid' : 'Unpaid'}
                        color={isPaid ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default TodayClients;

