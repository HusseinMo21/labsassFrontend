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
import { useReportSearch, searchFields } from '../../hooks/useReportSearch';
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

// Get pre-selected fields based on report data
export function getPreSelectedFields(reportData: ReportData): string[] {
  const fields: string[] = [];
  
  if (reportData.clinical_data && reportData.clinical_data.trim()) {
    fields.push('clinical_data');
  }
  if (reportData.microscopic_examination && reportData.microscopic_examination.trim()) {
    fields.push('microscopic_examination');
  }
  if (reportData.conclusion && reportData.conclusion.trim()) {
    fields.push('conclusion');
  }
  if (reportData.recommendations && reportData.recommendations.trim()) {
    fields.push('recommendations');
  }
  if (reportData.nature_of_specimen && reportData.nature_of_specimen.trim()) {
    fields.push('nature_of_specimen');
  }
  if (reportData.gross_pathology && reportData.gross_pathology.trim()) {
    fields.push('gross_pathology');
  }
  
  return fields;
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
    selectedFields,
    setSelectedFields,
    results,
    loading,
    currentPage,
    totalPages,
    totalResults,
    hasSearched,
    search,
    reset,
  } = useReportSearch();

  // Auto-populate on mount if report data is available
  useEffect(() => {
    if (!initialized && reportData) {
      const keywords = extractKeywords(reportData);
      const preSelectedFields = getPreSelectedFields(reportData);
      
      if (keywords) {
        setSearchTerm(keywords);
      }
      if (preSelectedFields.length > 0) {
        setSelectedFields(preSelectedFields);
      }
      setInitialized(true);
    }
  }, [reportData, initialized, setSearchTerm, setSelectedFields]);

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((f) => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedFields.length === searchFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(searchFields.map((f) => f.key));
    }
  };

  const handleSearch = () => {
    // Don't exclude current visit - show all results including current one
    search(1, undefined, 5); // Default 5 results per page
  };

  const handleClear = () => {
    reset();
    // Re-populate with keywords after reset
    const keywords = extractKeywords(reportData);
    const preSelectedFields = getPreSelectedFields(reportData);
    if (keywords) {
      setSearchTerm(keywords);
    }
    if (preSelectedFields.length > 0) {
      setSelectedFields(preSelectedFields);
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
              selectedFields={selectedFields}
              onFieldToggle={handleFieldToggle}
              onSelectAll={handleSelectAll}
              onSearch={handleSearch}
              onClear={handleClear}
              loading={loading}
              showHint={true}
              hintText={hintText}
            />

            {hasSearched && results.length === 0 && !loading && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No similar cases found. Try adjusting your search term or selecting different fields.
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

