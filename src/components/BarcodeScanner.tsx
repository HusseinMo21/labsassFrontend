import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  QrCodeScanner,
  Clear,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import axios from 'axios';

interface BarcodeScannerProps {
  onScan: (data: any) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  showIcon?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
}

interface BarcodeData {
  success: boolean;
  barcode: string;
  parsed?: {
    lab_no: string;
    sample_id: string;
  };
  sample?: any;
  lab_request?: any;
  patient?: any;
  visit?: any;
  error?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  placeholder = "Scan barcode or enter manually...",
  disabled = false,
  autoFocus = true,
  showIcon = true,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
}) => {
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<BarcodeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle barcode input (from scanner or manual entry)
  const handleBarcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setBarcode(value);
    setError(null);
    setScanResult(null);

    // Clear previous timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // If barcode looks complete (contains dash), process it after a short delay
    if (value.includes('-') && value.length > 3) {
      scanTimeoutRef.current = setTimeout(() => {
        processBarcode(value);
      }, 500); // 500ms delay to allow for complete barcode entry
    }
  };

  // Process the scanned barcode
  const processBarcode = async (barcodeValue: string) => {
    if (!barcodeValue.trim()) return;

    setIsScanning(true);
    setError(null);

    try {
      const response = await axios.post('/api/barcode/scan', {
        barcode: barcodeValue.trim(),
      });

      const data: BarcodeData = response.data;
      setScanResult(data);

      if (data.success) {
        onScan(data);
      } else {
        const errorMessage = data.error || 'Invalid barcode';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to scan barcode';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Handle manual scan trigger
  const handleScanClick = () => {
    if (barcode.trim()) {
      processBarcode(barcode);
    }
  };

  // Clear the input
  const handleClear = () => {
    setBarcode('');
    setError(null);
    setScanResult(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle Enter key
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && barcode.trim()) {
      processBarcode(barcode);
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

  const getStatusIcon = () => {
    if (isScanning) {
      return <CircularProgress size={20} />;
    }
    if (scanResult?.success) {
      return <CheckCircle color="success" />;
    }
    if (error) {
      return <Error color="error" />;
    }
    return null;
  };

  const getStatusColor = () => {
    if (scanResult?.success) return 'success';
    if (error) return 'error';
    return 'primary';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          ref={inputRef}
          value={barcode}
          onChange={handleBarcodeChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isScanning}
          fullWidth={fullWidth}
          size={size}
          variant={variant}
          color={getStatusColor() as any}
          InputProps={{
            startAdornment: showIcon ? (
              <QrCodeScanner sx={{ mr: 1, color: 'text.secondary' }} />
            ) : undefined,
            endAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getStatusIcon()}
                {barcode && (
                  <Tooltip title="Clear">
                    <IconButton
                      size="small"
                      onClick={handleClear}
                      disabled={isScanning}
                    >
                      <Clear />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ),
          }}
        />
      </Box>

      {/* Success Message */}
      {scanResult?.success && (
        <Alert severity="success" sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Barcode scanned successfully!</strong>
          </Typography>
          <Typography variant="caption" display="block">
            Lab No: {scanResult.parsed?.lab_no} | Sample: {scanResult.parsed?.sample_id}
          </Typography>
          {scanResult.patient && (
            <Typography variant="caption" display="block">
              Patient: {scanResult.patient.name}
            </Typography>
          )}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Scan Error:</strong> {error}
          </Typography>
        </Alert>
      )}

    </Box>
  );
};

export default BarcodeScanner;





