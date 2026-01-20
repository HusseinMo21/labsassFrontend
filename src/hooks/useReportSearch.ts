import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Export types and interfaces
export interface SearchField {
  key: string;
  label: string;
  dbField: string;
}

export const searchFields: SearchField[] = [
  { key: 'clinical_data', label: 'Clinical Data', dbField: 'clinical' },
  { key: 'nature_of_specimen', label: 'Nature of Specimen', dbField: 'nature' },
  { key: 'gross_pathology', label: 'Gross Pathology', dbField: 'gross' },
  { key: 'microscopic_examination', label: 'Microscopic Examination', dbField: 'micro' },
  { key: 'conclusion', label: 'Conclusion', dbField: 'conc' },
  { key: 'recommendations', label: 'Recommendations', dbField: 'reco' },
];

export interface SearchResult {
  id: number;
  patient_id: number;
  patient_name: string;
  lab_no: string;
  report_date: string;
  visit_id?: number | null;
  clinical?: string;
  nature?: string;
  gross?: string;
  micro?: string;
  conc?: string;
  reco?: string;
  matched_fields: string[];
}

export interface SearchResponse {
  data: SearchResult[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export function useReportSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const search = async (page: number = 1, excludeVisitId?: number, perPage: number = 15) => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to search in');
      return;
    }

    try {
      setLoading(true);
      setCurrentPage(page);

      const params: any = {
        search_term: searchTerm.trim(),
        fields: selectedFields.join(','),
        page: page,
        per_page: perPage,
      };

      if (excludeVisitId) {
        params.exclude_visit_id = excludeVisitId;
      }

      const response = await axios.get<SearchResponse>('/api/reports/search', { params });

      setResults(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalResults(response.data.total || 0);
      setHasSearched(true);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || 'Failed to search reports');
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSearchTerm('');
    setSelectedFields([]);
    setResults([]);
    setHasSearched(false);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalResults(0);
  };

  return {
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
  };
}

