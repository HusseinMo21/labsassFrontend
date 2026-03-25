import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import { ExpandMore, Search } from '@mui/icons-material';
import { useReportSearch } from '../../hooks/useReportSearch';
import { SearchForm } from './SearchForm';
import { ResultsTable } from './ResultsTable';
import { useNavigate } from 'react-router-dom';

interface ReportData {
  clinical_data?: string;
  microscopic_examination?: string;
  conclusion?: string;
  recommendations?: string;
  nature_of_specimen?: string;
  gross_pathology?: string;
}

interface SimilarCasesPanelProps {
  currentVisitId: number;
  reportData: ReportData;
  onCompare?: (visitId: number) => void;
}

// Extract keywords from report data (first 8-15 words from Conclusion + Microscopic)
export function extractKeywords(reportData: ReportData): string {
  const conclusion = reportData.conclusion || '';
  const microscopic = reportData.microscopic_examination || '';
  
  // Combine and extract words
  const combined = `${conclusion} ${microscopic}`.trim();
  if (!combined) return '';
  
  // Split into words, filter out very short words and common words
  const words = combined
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !['the', 'and', 'or', 'but', 'for', 'with', 'from'].includes(w.toLowerCase()));
  
  // Take first 8-15 words
  const keywords = words.slice(0, 15).join(' ');
  return keywords;
}

export const SimilarCasesPanel: React.FC<SimilarCasesPanelProps> = ({
  currentVisitId: _currentVisitId,
  reportData,
  onCompare,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    currentPage,
    totalPages,
    totalResults,
    hasSearched,
    search,
    reset,
  } = useReportSearch();

  useEffect(() => {
    if (!initialized && reportData) {
      const keywords = extractKeywords(reportData);
      if (keywords) {
        setSearchTerm(keywords);
      }
      setInitialized(true);
    }
  }, [reportData, initialized, setSearchTerm]);

  const handleSearch = () => {
    // Don't exclude current visit - show all results including current one
    search(1, undefined, 5); // Default 5 results per page
  };

  const handleClear = () => {
    reset();
    const keywords = extractKeywords(reportData);
    if (keywords) {
      setSearchTerm(keywords);
    }
  };

  const handleViewReport = (visitId: number, inNewTab: boolean = true) => {
    if (inNewTab) {
      window.open(`/reports/${visitId}`, '_blank');
    } else {
      navigate(`/reports/${visitId}`);
    }
  };

  const handlePageChange = (page: number) => {
    // Don't exclude current visit - show all results including current one
    search(page, undefined, 5);
  };

  const hintText = "Suggested from this report. You can edit before searching.";

  return (
    <Card sx={{ mt: 3 }}>
      <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpanded(isExpanded)}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Search Similar Cases
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <CardContent sx={{ p: 0 }}>
            <SearchForm
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onSearch={handleSearch}
              onClear={handleClear}
              loading={loading}
              showHint={true}
              hintText={hintText}
            />

            {hasSearched && results.length === 0 && !loading && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No similar cases found. Try adjusting your search term.
              </Alert>
            )}

            {results.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Similar Cases
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {totalResults} result{totalResults !== 1 ? 's' : ''} found
                  </Typography>
                </Box>
                <ResultsTable
                  results={results}
                  searchTerm={searchTerm}
                  loading={loading}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  onViewReport={handleViewReport}
                  onCompare={onCompare}
                  compact={true}
                />
              </Box>
            )}
          </CardContent>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

