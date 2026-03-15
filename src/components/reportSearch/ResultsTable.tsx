import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  Stack,
} from '@mui/material';
import {
  Person,
  Assignment,
  CalendarToday,
  Visibility,
  OpenInNew,
  CompareArrows,
} from '@mui/icons-material';
import type { SearchResult } from '../../hooks/useReportSearch';
import { searchFields } from '../../hooks/useReportSearch';

interface ResultsTableProps {
  results: SearchResult[];
  searchTerm: string;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewReport: (visitId: number, inNewTab?: boolean) => void;
  onCompare?: (visitId: number) => void;
  compact?: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  searchTerm,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onViewReport,
  onCompare,
  compact = false,
}) => {
  const highlightText = (text: string, searchTerm: string) => {
    if (!text || !searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '2px 0' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No results found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size={compact ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Lab No</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Matched Fields</TableCell>
              <TableCell>Preview</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="primary" fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {result.patient_name || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment color="secondary" fontSize="small" />
                    <Typography variant="body2">{result.lab_no || 'N/A'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday color="action" fontSize="small" />
                    <Typography variant="body2">
                      {result.report_date
                        ? new Date(result.report_date).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {result.matched_fields?.map((field, idx) => {
                      const fieldLabel = searchFields.find((f) => f.key === field)?.label || field;
                      return (
                        <Chip
                          key={idx}
                          label={fieldLabel}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    {result.matched_fields?.map((field) => {
                      const fieldData = result[field as keyof SearchResult] as string;
                      if (!fieldData) return null;
                      return (
                        <Typography
                          key={field}
                          variant="caption"
                          sx={{
                            display: 'block',
                            mb: 0.5,
                            fontStyle: 'italic',
                            color: 'text.secondary',
                          }}
                        >
                          <strong>
                            {searchFields.find((f) => f.key === field)?.label || field}:
                          </strong>{' '}
                          {highlightText(truncateText(fieldData, 120), searchTerm)}
                        </Typography>
                      );
                    })}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    {result.visit_id ? (
                      <>
                        <Tooltip title="View in New Tab">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onViewReport(result.visit_id!, true)}
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Here">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => onViewReport(result.visit_id!, false)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {onCompare && (
                          <Tooltip title="Compare">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => onCompare(result.visit_id!)}
                            >
                              <CompareArrows fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Stack spacing={2}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_event, page) => onPageChange(page)}
              color="primary"
              size={compact ? 'small' : 'medium'}
              showFirstButton
              showLastButton
            />
            <Typography variant="body2" color="text.secondary" align="center">
              Page {currentPage} of {totalPages}
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

