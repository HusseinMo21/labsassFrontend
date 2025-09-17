import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  QrCodeScanner,
  Clear,
} from '@mui/icons-material';

interface BarcodeInputProps {
  onBarcodeScanned: (barcode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  showIcon?: boolean;
}

const BarcodeInput: React.FC<BarcodeInputProps> = ({
  onBarcodeScanned,
  placeholder = "Scan barcode...",
  disabled = false,
  autoFocus = true,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  showIcon = true,
}) => {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle barcode input
  const handleBarcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setBarcode(value);

    // Clear previous timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // If barcode looks complete (contains dash), process it after a short delay
    if (value.includes('-') && value.length > 3) {
      scanTimeoutRef.current = setTimeout(() => {
        onBarcodeScanned(value.trim());
        setBarcode(''); // Clear after processing
      }, 500); // 500ms delay to allow for complete barcode entry
    }
  };

  // Handle Enter key
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && barcode.trim()) {
      onBarcodeScanned(barcode.trim());
      setBarcode('');
    }
  };

  // Clear the input
  const handleClear = () => {
    setBarcode('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        ref={inputRef}
        value={barcode}
        onChange={handleBarcodeChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        variant={variant}
        InputProps={{
          startAdornment: showIcon ? (
            <QrCodeScanner sx={{ mr: 1, color: 'text.secondary' }} />
          ) : undefined,
          endAdornment: barcode ? (
            <Tooltip title="Clear">
              <IconButton size="small" onClick={handleClear}>
                <Clear />
              </IconButton>
            </Tooltip>
          ) : undefined,
        }}
      />
    </Box>
  );
};

export default BarcodeInput;





