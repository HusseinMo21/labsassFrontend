import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';

interface SearchFormProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
  showHint?: boolean;
  hintText?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onClear,
  loading,
  showHint = false,
  hintText,
}) => {
  return (
    <Box>
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onClear}>
          Clear
        </Button>
        <Button
          variant="contained"
          startIcon={<Search />}
          onClick={onSearch}
          disabled={loading || !searchTerm.trim()}
        >
          Search
        </Button>
      </Box>
    </Box>
  );
};
