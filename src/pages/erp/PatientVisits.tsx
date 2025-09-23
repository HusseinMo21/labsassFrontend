import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  ExpandMore,
  Science,
  CheckCircle,
  Schedule,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

interface PatientVisit {
  id: number;
  visit_id: string;
  visit_date: string;
  visit_time: string;
  referred_doctor?: string;
  clinical_data?: string;
  microscopic_description?: string;
  diagnosis?: string;
  recommendations?: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  upfront_payment: number;
  remaining_balance: number;
  payment_status: string;
  visit_tests: Array<{
    id: number;
    test_name: string;
    test_category: string;
    price: number;
    status: string;
    result_value?: string;
    result_status?: string;
  }>;
}

const PatientVisits: React.FC = () => {
  const { } = useAuth();
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatientVisits();
  }, []);

  const fetchPatientVisits = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/patient/my-visits');
      setVisits(response.data.visits || []);
    } catch (err: any) {
      console.error('Error fetching patient visits:', err);
      setError('Failed to load your visits');
      toast.error('Failed to load your visits');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending', icon: <Schedule /> },
      in_progress: { color: 'info', label: 'In Progress', icon: <Schedule /> },
      completed: { color: 'success', label: 'Completed', icon: <CheckCircle /> },
      cancelled: { color: 'error', label: 'Cancelled', icon: <Cancel /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status, icon: <Schedule /> };
    return <Chip label={config.label} color={config.color as any} size="small" icon={config.icon} />;
  };

  const getPaymentStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending Payment' },
      partial: { color: 'info', label: 'Partial Payment' },
      paid: { color: 'success', label: 'Paid in Full' },
      overdue: { color: 'error', label: 'Overdue' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color as any} size="small" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CalendarToday sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1">
            My Visits
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View your visit history and test details
          </Typography>
        </Box>
      </Box>

      {visits.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Visits Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any visits yet. Visit our lab to get started with your tests.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Your Visit History ({visits.length} visits)
            </Typography>
            {visits.map((visit) => (
              <Accordion key={visit.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div">
                        Visit #{visit.visit_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(visit.visit_date).toLocaleDateString()} at {visit.visit_time}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                      {getStatusChip(visit.status)}
                      {getPaymentStatusChip(visit.payment_status)}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Visit Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Visit Date"
                            secondary={new Date(visit.visit_date).toLocaleDateString()}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Visit Time"
                            secondary={visit.visit_time}
                          />
                        </ListItem>
                        {visit.referred_doctor && (
                          <ListItem>
                            <ListItemText
                              primary="Referred Doctor"
                              secondary={visit.referred_doctor}
                            />
                          </ListItem>
                        )}
                        <ListItem>
                          <ListItemText
                            primary="Status"
                            secondary={visit.status}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Payment Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Total Amount"
                            secondary={formatCurrency(visit.total_amount)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Discount"
                            secondary={formatCurrency(visit.discount_amount)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Final Amount"
                            secondary={formatCurrency(visit.final_amount)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Paid Amount"
                            secondary={formatCurrency(visit.upfront_payment)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Remaining Balance"
                            secondary={formatCurrency(visit.remaining_balance)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Payment Status"
                            secondary={visit.payment_status}
                          />
                        </ListItem>
                      </List>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Tests Ordered ({visit.visit_tests.length})
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Test Name</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell>Price</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Result</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {visit.visit_tests.map((test) => (
                              <TableRow key={test.id}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Science sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                                    {test.test_name}
                                  </Box>
                                </TableCell>
                                <TableCell>{test.test_category}</TableCell>
                                <TableCell>{formatCurrency(test.price)}</TableCell>
                                <TableCell>{getStatusChip(test.status)}</TableCell>
                                <TableCell>
                                  {test.result_value ? (
                                    <Typography variant="body2" fontWeight="medium">
                                      {test.result_value}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      Pending
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>

                    {(visit.clinical_data || visit.microscopic_description || visit.diagnosis || visit.recommendations) && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Clinical Information
                        </Typography>
                        {visit.clinical_data && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Clinical Data:
                            </Typography>
                            <Typography variant="body2" sx={{ pl: 2 }}>
                              {visit.clinical_data}
                            </Typography>
                          </Box>
                        )}
                        {visit.microscopic_description && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Microscopic Description:
                            </Typography>
                            <Typography variant="body2" sx={{ pl: 2 }}>
                              {visit.microscopic_description}
                            </Typography>
                          </Box>
                        )}
                        {visit.diagnosis && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Diagnosis:
                            </Typography>
                            <Typography variant="body2" sx={{ pl: 2, fontWeight: 'bold', color: 'error.main' }}>
                              {visit.diagnosis}
                            </Typography>
                          </Box>
                        )}
                        {visit.recommendations && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Recommendations:
                            </Typography>
                            <Typography variant="body2" sx={{ pl: 2 }}>
                              {visit.recommendations}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PatientVisits;


