import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';

interface TemplateSaveModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (templateName: string) => void;
  loading?: boolean;
}

const TemplateSaveModal: React.FC<TemplateSaveModalProps> = ({
  open,
  onClose,
  onSave,
  loading = false,
}) => {
  const [templateName, setTemplateName] = useState('');

  const handleSave = () => {
    if (templateName.trim()) {
      onSave(templateName.trim());
      setTemplateName('');
    }
  };

  const handleClose = () => {
    setTemplateName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Save as Template
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter a name for this template..."
            variant="outlined"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!templateName.trim() || loading}
          sx={{ bgcolor: 'primary.main' }}
        >
          {loading ? 'Saving...' : 'Save Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSaveModal;

