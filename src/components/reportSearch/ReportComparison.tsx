import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Tooltip,
  ToggleButton,
} from '@mui/material';
import { Close, SwapHoriz, OpenInNew, Link, LinkOff } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface ReportData {
  patient_name?: string;
  lab_no?: string;
  date?: string;
  clinical_data?: string;
  microscopic_examination?: string;
  conclusion?: string;
  recommendations?: string;
  nature_of_specimen?: string;
  gross_pathology?: string;
}

interface ReportComparisonProps {
  open: boolean;
  onClose: () => void;
  visitId1: number;
  visitId2: number;
}

export const ReportComparison: React.FC<ReportComparisonProps> = ({
  open,
  onClose,
  visitId1,
  visitId2,
}) => {
  const navigate = useNavigate();
  const [report1, setReport1] = useState<ReportData | null>(null);
  const [report2, setReport2] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [syncScroll, setSyncScroll] = useState(false);
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (open && visitId1 && visitId2) {
      fetchReports();
    }
  }, [open, visitId1, visitId2]);

  // Sync scroll effect
  useEffect(() => {
    if (!syncScroll || !scrollRef1.current || !scrollRef2.current) return;

    const container1 = scrollRef1.current;
    const container2 = scrollRef2.current;

    const handleScroll1 = () => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      const scrollPercent = container1.scrollTop / (container1.scrollHeight - container1.clientHeight);
      container2.scrollTop = scrollPercent * (container2.scrollHeight - container2.clientHeight);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    };

    const handleScroll2 = () => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      const scrollPercent = container2.scrollTop / (container2.scrollHeight - container2.clientHeight);
      container1.scrollTop = scrollPercent * (container1.scrollHeight - container1.clientHeight);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    };

    container1.addEventListener('scroll', handleScroll1);
    container2.addEventListener('scroll', handleScroll2);

    return () => {
      container1.removeEventListener('scroll', handleScroll1);
      container2.removeEventListener('scroll', handleScroll2);
    };
  }, [syncScroll]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [response1, response2] = await Promise.all([
        axios.get(`/api/visits/${swapped ? visitId2 : visitId1}`),
        axios.get(`/api/visits/${swapped ? visitId1 : visitId2}`),
      ]);

      const visit1 = response1.data;
      const visit2 = response2.data;

      // Try to fetch reports directly if labRequest exists
      const fetchReportData = async (visit: any) => {
        // First try to get from visit.labRequest.reports if available
        if (visit.labRequest?.reports && Array.isArray(visit.labRequest.reports) && visit.labRequest.reports.length > 0) {
          const latestReport = visit.labRequest.reports.sort((a: any, b: any) => b.id - a.id)[0];
          if (latestReport.content) {
            try {
              return typeof latestReport.content === 'string' 
                ? JSON.parse(latestReport.content) 
                : latestReport.content;
            } catch (e) {
              console.warn('Failed to parse report content from visit:', e);
            }
          }
        }
        
        // If not found, try to fetch from API
        if (visit.labRequest?.id) {
          try {
            const reportResponse = await axios.get(`/api/lab-requests/${visit.labRequest.id}/reports`);
            if (reportResponse.data?.data && Array.isArray(reportResponse.data.data) && reportResponse.data.data.length > 0) {
              const latestReport = reportResponse.data.data.sort((a: any, b: any) => b.id - a.id)[0];
              if (latestReport.content) {
                try {
                  return typeof latestReport.content === 'string' 
                    ? JSON.parse(latestReport.content) 
                    : latestReport.content;
                } catch (e) {
                  console.warn('Failed to parse report content from API:', e);
                }
              }
            }
          } catch (e) {
            console.warn('Failed to fetch reports from API:', e);
          }
        }
        
        // Also try to fetch reports directly using lab_request_id from visit
        if (visit.lab_request_id) {
          try {
            const directReportResponse = await axios.get(`/api/reports?lab_request_id=${visit.lab_request_id}`);
            if (directReportResponse.data && Array.isArray(directReportResponse.data) && directReportResponse.data.length > 0) {
              // Get the latest completed report, or fall back to the latest report
              let report = directReportResponse.data
                .filter((r: any) => r.status === 'completed')
                .sort((a: any, b: any) => b.id - a.id)[0];
              
              if (!report) {
                // Fall back to the latest report if no completed report found
                report = directReportResponse.data.sort((a: any, b: any) => b.id - a.id)[0];
              }
              
              if (report && report.content) {
                try {
                  return typeof report.content === 'string' 
                    ? JSON.parse(report.content) 
                    : report.content;
                } catch (e) {
                  console.warn('Failed to parse report content from direct API:', e);
                }
              }
            }
          } catch (e) {
            // This endpoint might not exist, that's okay
            console.warn('Direct reports endpoint not available:', e);
          }
        }
        
        return {};
      };

      const reportData1 = await fetchReportData(visit1);
      const reportData2 = await fetchReportData(visit2);

      // Extract report data from visits
      const extractReportData = (visit: any, preloadedReportData: any = {}): ReportData => {
        console.log('Extracting report data from visit:', {
          visitId: visit.id,
          hasLabRequest: !!visit.labRequest,
          hasReports: !!(visit.labRequest?.reports && visit.labRequest.reports.length > 0),
          visitKeys: Object.keys(visit),
          clinical_data: visit.clinical_data,
          microscopic_description: visit.microscopic_description,
          diagnosis: visit.diagnosis,
          recommendations: visit.recommendations,
          specimen_information: visit.specimen_information,
          gross_examination: visit.gross_examination,
          preloadedReportDataKeys: Object.keys(preloadedReportData),
        });
        // Use preloaded report data first, then try to get from visit.labRequest.reports
        let reportData: any = preloadedReportData || {};
        
        // Try to get from labRequest.reports if available and not already loaded
        if (Object.keys(reportData).length === 0 && visit.labRequest?.reports && Array.isArray(visit.labRequest.reports) && visit.labRequest.reports.length > 0) {
          const latestReport = visit.labRequest.reports.sort((a: any, b: any) => b.id - a.id)[0];
          if (latestReport.content) {
            try {
              reportData = typeof latestReport.content === 'string' 
                ? JSON.parse(latestReport.content) 
                : latestReport.content;
            } catch (e) {
              console.warn('Failed to parse report content:', e);
            }
          }
        }

        // Helper function to get value from multiple sources
        const getValue = (reportKey: string, visitKey: string, altKey?: string): string => {
          // Try report content first
          if (reportData[reportKey] && reportData[reportKey] !== null && String(reportData[reportKey]).trim() !== '') {
            return String(reportData[reportKey]);
          }
          // Try visit data directly
          if (visit[visitKey] && visit[visitKey] !== null && String(visit[visitKey]).trim() !== '') {
            return String(visit[visitKey]);
          }
          // Try alternative key if provided
          if (altKey && visit[altKey] && visit[altKey] !== null && String(visit[altKey]).trim() !== '') {
            return String(visit[altKey]);
          }
          // Try legacy keys in reportData
          if (reportKey === 'microscopic_examination') {
            if (reportData.microscopic_description && reportData.microscopic_description !== null && String(reportData.microscopic_description).trim() !== '') {
              return String(reportData.microscopic_description);
            }
          }
          if (reportKey === 'conclusion') {
            if (reportData.diagnosis && reportData.diagnosis !== null && String(reportData.diagnosis).trim() !== '') {
              return String(reportData.diagnosis);
            }
          }
          if (reportKey === 'gross_pathology') {
            if (reportData.gross_examination && reportData.gross_examination !== null && String(reportData.gross_examination).trim() !== '') {
              return String(reportData.gross_examination);
            }
          }
          if (reportKey === 'nature_of_specimen') {
            if (reportData.specimen_information && reportData.specimen_information !== null && String(reportData.specimen_information).trim() !== '') {
              return String(reportData.specimen_information);
            }
          }
          // Try legacy keys in visit
          if (reportKey === 'microscopic_examination' && visit.microscopic_description && visit.microscopic_description !== null && String(visit.microscopic_description).trim() !== '') {
            return String(visit.microscopic_description);
          }
          if (reportKey === 'conclusion' && visit.diagnosis && visit.diagnosis !== null && String(visit.diagnosis).trim() !== '') {
            return String(visit.diagnosis);
          }
          if (reportKey === 'gross_pathology' && visit.gross_examination && visit.gross_examination !== null && String(visit.gross_examination).trim() !== '') {
            return String(visit.gross_examination);
          }
          if (reportKey === 'nature_of_specimen' && visit.specimen_information && visit.specimen_information !== null && String(visit.specimen_information).trim() !== '') {
            return String(visit.specimen_information);
          }
          return 'N/A';
        };

        const result = {
          patient_name: visit.patient?.name || visit.patient_name || 'N/A',
          lab_no: visit.labRequest?.full_lab_no || visit.lab_number || visit.labRequest?.lab_no || 'N/A',
          date: visit.visit_date || 'N/A',
          clinical_data: getValue('clinical_data', 'clinical_data'),
          microscopic_examination: getValue('microscopic_examination', 'microscopic_description'),
          conclusion: getValue('conclusion', 'diagnosis'),
          recommendations: getValue('recommendations', 'recommendations'),
          nature_of_specimen: getValue('nature_of_specimen', 'nature_of_specimen', 'specimen_information'),
          gross_pathology: getValue('gross_pathology', 'gross_examination', 'gross_pathology'),
        };

        console.log('Extracted report data:', result);
        return result;
      };

      setReport1(extractReportData(visit1, reportData1));
      setReport2(extractReportData(visit2, reportData2));
    } catch (error) {
      console.error('Failed to fetch reports for comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setSwapped(!swapped);
    // Re-fetch with swapped IDs
    fetchReports();
  };

  const handleOpenReport = (visitId: number, inNewTab: boolean = true) => {
    if (inNewTab) {
      window.open(`/reports/${visitId}`, '_blank');
    } else {
      navigate(`/reports/${visitId}`);
      onClose();
    }
  };

  const renderField = (label: string, value: string | undefined) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
        {label}:
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: 'grey.50',
          whiteSpace: 'pre-wrap',
        }}
      >
        <Typography variant="body2">{value || 'N/A'}</Typography>
      </Paper>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Compare Reports
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={syncScroll ? 'Disable Sync Scroll' : 'Enable Sync Scroll'}>
              <ToggleButton
                value="sync"
                selected={syncScroll}
                onChange={() => setSyncScroll(!syncScroll)}
                size="small"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {syncScroll ? <Link fontSize="small" /> : <LinkOff fontSize="small" />}
              </ToggleButton>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SwapHoriz />}
              onClick={handleSwap}
            >
              Swap
            </Button>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : report1 && report2 ? (
          <Box>
            {/* Header Info */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Report 1
                  </Typography>
                  <Typography variant="body2">
                    <strong>Patient:</strong> {report1.patient_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Lab No:</strong> {report1.lab_no}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {report1.date}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNew />}
                      onClick={() => handleOpenReport(swapped ? visitId2 : visitId1, true)}
                    >
                      Open in New Tab
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'secondary.50' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Report 2
                  </Typography>
                  <Typography variant="body2">
                    <strong>Patient:</strong> {report2.patient_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Lab No:</strong> {report2.lab_no}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {report2.date}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNew />}
                      onClick={() => handleOpenReport(swapped ? visitId1 : visitId2, true)}
                    >
                      Open in New Tab
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Comparison Fields */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box
                  ref={scrollRef1}
                  sx={{
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#555',
                    },
                  }}
                >
                  {renderField('Clinical Data', report1.clinical_data)}
                  {renderField('Nature of Specimen', report1.nature_of_specimen)}
                  {renderField('Gross Pathology', report1.gross_pathology)}
                  {renderField('Microscopic Examination', report1.microscopic_examination)}
                  {renderField('Conclusion', report1.conclusion)}
                  {renderField('Recommendations', report1.recommendations)}
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  ref={scrollRef2}
                  sx={{
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#555',
                    },
                  }}
                >
                  {renderField('Clinical Data', report2.clinical_data)}
                  {renderField('Nature of Specimen', report2.nature_of_specimen)}
                  {renderField('Gross Pathology', report2.gross_pathology)}
                  {renderField('Microscopic Examination', report2.microscopic_examination)}
                  {renderField('Conclusion', report2.conclusion)}
                  {renderField('Recommendations', report2.recommendations)}
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Typography>Failed to load reports for comparison</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

