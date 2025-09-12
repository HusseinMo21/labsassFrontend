import React, { useState, useEffect } from 'react';
import { Alert, Collapse, IconButton } from '@mui/material';
import { Close, Info } from '@mui/icons-material';

const DevNotice: React.FC = () => {
  const [show, setShow] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    // Check if backend is available
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
          method: 'GET',
          mode: 'cors',
        });
        setBackendAvailable(response.ok);
      } catch (error) {
        setBackendAvailable(false);
      }
    };

    checkBackend();
    
    // Show notice if backend is not available
    if (!backendAvailable) {
      setShow(true);
    }
  }, [backendAvailable]);

  if (backendAvailable) return null;

  return (
    <Collapse in={show}>
      <Alert
        severity="info"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setShow(false)}
          >
            <Close fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 2 }}
      >
        <strong>Development Mode:</strong> Backend server not detected. 
        To use the ERP system, please start the Laravel backend server on port 8000.
        <br />
        <small>Run: <code>cd backend && php artisan serve</code></small>
      </Alert>
    </Collapse>
  );
};

export default DevNotice;








