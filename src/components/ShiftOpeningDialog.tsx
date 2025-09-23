import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Schedule,
  PlayArrow,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ShiftOpeningDialogProps {
  open: boolean;
  onClose: () => void;
  onShiftOpened: () => void;
}

const ShiftOpeningDialog: React.FC<ShiftOpeningDialogProps> = ({
  open,
  onClose,
  onShiftOpened,
}) => {
  const [shiftType, setShiftType] = useState('AM');
  const [loading, setLoading] = useState(false);

  const handleOpenShift = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/shifts/open', {
        shift_type: shiftType,
      });
      
      if (response.data.success) {
        toast.success('Shift opened successfully!');
        onShiftOpened();
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to open shift:', error);
      toast.error(error.response?.data?.message || 'Failed to open shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Schedule color="primary" />
          <Typography variant="h6">Start Your Shift</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Welcome! Please select your shift type to begin tracking your work.
        </Alert>
        
        <FormControl fullWidth>
          <InputLabel>Shift Type</InputLabel>
          <Select
            value={shiftType}
            onChange={(e) => setShiftType(e.target.value)}
            label="Shift Type"
          >
            <MenuItem value="AM">AM Shift (Morning)</MenuItem>
            <MenuItem value="PM">PM Shift (Afternoon)</MenuItem>
            <MenuItem value="Night">Night Shift</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Once you start your shift, all your work (patient visits, payments, etc.) will be automatically tracked.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleOpenShift} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
          fullWidth
          size="large"
        >
          {loading ? 'Starting Shift...' : 'Start Shift'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftOpeningDialog;

