import React from 'react';
import {
  Box,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Grid,
  Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { searchFields } from '../../hooks/useReportSearch';

interface SearchFormProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedFields: string[];
  onFieldToggle: (fieldKey: string) => void;
  onSelectAll: () => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
  showHint?: boolean;
  hintText?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedFields,
  onFieldToggle,
  onSelectAll,
  onSearch,
  onClear,
  loading,
  showHint = false,
  hintText,
}) => {
  return (
    <Box>
      {/* Search Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Search Term"
          placeholder="Enter search term (e.g., test, cancer, etc.)"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
          sx={{ mb: showHint ? 1 : 2 }}
        />
        {showHint && hintText && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {hintText}
          </Typography>
        )}
      </Box>

      {/* Field Selection */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Select Fields to Search In:
          </Typography>
          <Button size="small" variant="outlined" onClick={onSelectAll}>
            {selectedFields.length === searchFields.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
        <FormGroup>
          <Grid container spacing={2}>
            {searchFields.map((field) => (
              <Grid item xs={12} sm={6} md={4} key={field.key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedFields.includes(field.key)}
                      onChange={() => onFieldToggle(field.key)}
                    />
                  }
                  label={field.label}
                />
              </Grid>
            ))}
          </Grid>
        </FormGroup>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onClear}>
          Clear
        </Button>
        <Button
          variant="contained"
          startIcon={<Search />}
          onClick={onSearch}
          disabled={loading || !searchTerm.trim() || selectedFields.length === 0}
        >
          Search
        </Button>
      </Box>
    </Box>
  );
};

