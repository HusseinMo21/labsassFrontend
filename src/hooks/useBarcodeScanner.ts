import { useState, useCallback } from 'react';
import axios from 'axios';

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

interface UseBarcodeScannerReturn {
  scanBarcode: (barcode: string) => Promise<BarcodeData>;
  isScanning: boolean;
  lastResult: BarcodeData | null;
  error: string | null;
  clearError: () => void;
}

export const useBarcodeScanner = (): UseBarcodeScannerReturn => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<BarcodeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanBarcode = useCallback(async (barcode: string): Promise<BarcodeData> => {
    if (!barcode.trim()) {
      const errorData = {
        success: false,
        barcode: '',
        error: 'Barcode cannot be empty',
      };
      setError('Barcode cannot be empty');
      setLastResult(errorData);
      return errorData;
    }

    setIsScanning(true);
    setError(null);

    try {
      const response = await axios.post('/api/barcode/scan', {
        barcode: barcode.trim(),
      });

      const data: BarcodeData = response.data;
      setLastResult(data);

      if (!data.success) {
        setError(data.error || 'Invalid barcode');
      }

      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to scan barcode';
      const errorData = {
        success: false,
        barcode: barcode.trim(),
        error: errorMessage,
      };
      
      setError(errorMessage);
      setLastResult(errorData);
      return errorData;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    scanBarcode,
    isScanning,
    lastResult,
    error,
    clearError,
  };
};

export default useBarcodeScanner;
















